-- Painel de admin: quem está nesta tabela pode gerenciar chaves e ver vendas pelo site (admin.html)
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
insert into public.admins (email) values ('carlosgabriel8058@gmail.com'), ('allison751@outlook.com');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select (auth.jwt() ->> 'email') is not null
     and exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email'));
$$;

create or replace function public.exigir_admin()
returns void
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
end;
$$;

-- Números do topo do painel
create or replace function public.admin_resumo()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  perform public.exigir_admin();
  return jsonb_build_object(
    'ativas', (select count(*) from public.licencas where not revoked and (expires_at is null or expires_at > now())),
    'vencendo', (select count(*) from public.licencas where not revoked and expires_at > now() and expires_at <= now() + interval '7 days'),
    'vencidas', (select count(*) from public.licencas where not revoked and expires_at <= now()),
    'pcs', (select count(*) from public.ativacoes),
    'vendas_mes', (select count(*) from public.pagamentos where created_at >= date_trunc('month', now())),
    'receita_mes', (select coalesce(sum(valor), 0) from public.pagamentos where created_at >= date_trunc('month', now())),
    'receita_total', (select coalesce(sum(valor), 0) from public.pagamentos)
  );
end;
$$;

-- Lista de chaves com os PCs (busca por chave, e-mail ou observação)
create or replace function public.admin_licencas(p_busca text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  q text := nullif(trim(coalesce(p_busca, '')), '');
begin
  perform public.exigir_admin();
  return coalesce((
    select jsonb_agg(x order by x->>'ordem' desc)
    from (
      select jsonb_build_object(
        'key', l.key, 'plan', l.plan, 'email', l.email, 'note', l.note,
        'max_machines', l.max_machines, 'expires_at', l.expires_at, 'revoked', l.revoked, 'created_at', l.created_at,
        'ativa', not l.revoked and (l.expires_at is null or l.expires_at > now()),
        'ordem', l.created_at,
        'pcs', coalesce((select jsonb_agg(jsonb_build_object('machine', a.machine, 'version', a.version, 'first_seen', a.first_seen, 'last_seen', a.last_seen) order by a.last_seen desc)
                         from public.ativacoes a where a.key = l.key), '[]'::jsonb)
      ) x
      from public.licencas l
      where q is null
         or l.key ilike '%' || q || '%'
         or l.email ilike '%' || q || '%'
         or l.note ilike '%' || q || '%'
      order by l.created_at desc
      limit 300
    ) t
  ), '[]'::jsonb);
end;
$$;

-- Últimas vendas aprovadas
create or replace function public.admin_vendas()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  perform public.exigir_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object('mp_payment_id', p.mp_payment_id, 'email', p.email, 'plan', p.plan, 'dias', p.dias,
             'valor', p.valor, 'key', p.key, 'chave_nova', p.chave_nova, 'email_enviado', p.email_enviado, 'created_at', p.created_at)
           order by p.created_at desc)
    from (select * from public.pagamentos order by created_at desc limit 100) p
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_criar_chave(p_plan text, p_email text default null, p_dias int default null, p_pcs int default null, p_note text default null)
returns text
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform public.exigir_admin();
  if p_dias is not null and p_dias < 1 then raise exception 'Dias inválidos'; end if;
  if p_pcs is not null and (p_pcs < 1 or p_pcs > 50) then raise exception 'Número de PCs inválido'; end if;
  return public.nova_chave(p_plan, nullif(lower(trim(p_email)), ''), p_dias, p_pcs,
    coalesce(nullif(trim(p_note), ''), 'admin ' || (auth.jwt() ->> 'email')));
end;
$$;

create or replace function public.admin_renovar(p_key text, p_dias int)
returns timestamptz
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform public.exigir_admin();
  if p_dias is null or p_dias < 1 or p_dias > 3650 then raise exception 'Dias inválidos'; end if;
  return public.renovar_chave(p_key, p_dias);
end;
$$;

-- Bloquear / desbloquear, trocar e-mail, PCs, plano e observação
create or replace function public.admin_editar(p_key text, p_email text, p_max_machines int, p_note text, p_revoked boolean, p_plan text default null)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform public.exigir_admin();
  if p_max_machines is not null and (p_max_machines < 1 or p_max_machines > 50) then raise exception 'Número de PCs inválido'; end if;
  if p_plan is not null and p_plan not in ('semanal','pro','max','vitalicio') then raise exception 'Plano inválido'; end if;
  update public.licencas l
     set email = nullif(lower(trim(p_email)), ''),
         max_machines = coalesce(p_max_machines, l.max_machines),
         note = nullif(trim(p_note), ''),
         revoked = coalesce(p_revoked, l.revoked),
         plan = coalesce(p_plan, l.plan),
         expires_at = case when p_plan = 'vitalicio' then null else l.expires_at end
   where l.key = upper(p_key);
  return found;
end;
$$;

create or replace function public.admin_liberar_pc(p_key text, p_machine text default null)
returns int
language plpgsql
security definer
set search_path to ''
as $$
declare n int;
begin
  perform public.exigir_admin();
  delete from public.ativacoes a where a.key = upper(p_key) and (p_machine is null or a.machine = lower(p_machine));
  get diagnostics n = row_count;
  return n;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['is_admin()','exigir_admin()','admin_resumo()','admin_licencas(text)','admin_vendas()',
    'admin_criar_chave(text,text,int,int,text)','admin_renovar(text,int)','admin_editar(text,text,int,text,boolean,text)','admin_liberar_pc(text,text)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

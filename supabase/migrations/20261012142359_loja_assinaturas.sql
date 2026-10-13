-- Preços oficiais (o checkout só confia nestes valores, nunca no que vem do navegador)
create table public.precos (
  plan text not null,
  periodo text not null check (periodo in ('semanal','mensal','trimestral')),
  dias int not null check (dias > 0),
  valor numeric(10,2) not null check (valor > 0),
  titulo text not null,
  ativo boolean not null default true,
  primary key (plan, periodo)
);
alter table public.precos enable row level security;
insert into public.precos (plan, periodo, dias, valor, titulo) values
  ('semanal','semanal', 7,   9.90, 'Noctis OptPokemon - Semanal (7 dias)'),
  ('pro',    'mensal',  30, 29.90, 'Noctis OptPokemon - Pro (30 dias)'),
  ('pro',    'trimestral', 90, 76.20, 'Noctis OptPokemon - Pro (90 dias)'),
  ('max',    'mensal',  30, 59.90, 'Noctis OptPokemon - Max (30 dias)'),
  ('max',    'trimestral', 90, 152.70, 'Noctis OptPokemon - Max (90 dias)');

-- Pedido criado ao abrir o checkout; o id vai como external_reference no Mercado Pago
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  plan text not null,
  periodo text not null,
  dias int not null,
  valor numeric(10,2) not null,
  status text not null default 'aberto',
  mp_preference_id text,
  created_at timestamptz not null default now()
);
alter table public.pedidos enable row level security;

-- Pagamentos aprovados já processados (garante que o mesmo pagamento não gera duas chaves)
create table public.pagamentos (
  mp_payment_id text primary key,
  pedido_id uuid references public.pedidos(id),
  email text not null,
  plan text not null,
  dias int not null,
  valor numeric(10,2) not null,
  key text references public.licencas(key),
  chave_nova boolean not null default false,
  email_enviado boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.pagamentos enable row level security;

alter table public.licencas add column if not exists aviso_vencimento_em timestamptz;
create index if not exists licencas_email_idx on public.licencas (lower(email));

-- Chamado pelo webhook (service role) quando um pagamento é aprovado.
-- Se o e-mail já tem uma chave (não vitalícia), estende a validade e atualiza o plano; senão cria uma.
create or replace function public.pagamento_aprovado(p_payment_id text, p_pedido uuid)
returns table (key text, expires_at timestamptz, chave_nova boolean, ja_processado boolean)
language plpgsql
set search_path to ''
as $$
declare
  ped public.pedidos;
  pcs int;
  k text;
  nova boolean := false;
  exp timestamptz;
begin
  select * into ped from public.pedidos where id = p_pedido for update;
  if not found then raise exception 'Pedido % não encontrado', p_pedido; end if;

  insert into public.pagamentos (mp_payment_id, pedido_id, email, plan, dias, valor)
  values (p_payment_id, ped.id, lower(ped.email), ped.plan, ped.dias, ped.valor)
  on conflict (mp_payment_id) do nothing;
  if not found then
    return query select pg.key, l.expires_at, pg.chave_nova, true
      from public.pagamentos pg left join public.licencas l on l.key = pg.key
      where pg.mp_payment_id = p_payment_id;
    return;
  end if;

  pcs := case ped.plan when 'semanal' then 1 when 'pro' then 2 when 'max' then 5 else 1 end;

  select l.key into k from public.licencas l
   where lower(l.email) = lower(ped.email) and l.plan <> 'vitalicio'
   order by l.revoked, l.expires_at desc nulls last
   limit 1
   for update;

  if k is null then
    k := public.nova_chave(ped.plan, lower(ped.email), ped.dias, pcs, 'mercadopago ' || p_payment_id);
    nova := true;
    select l.expires_at into exp from public.licencas l where l.key = k;
  else
    update public.licencas l
       set expires_at = greatest(coalesce(l.expires_at, now()), now()) + make_interval(days => ped.dias),
           revoked = false,
           plan = ped.plan,
           max_machines = greatest(pcs, case when l.expires_at > now() then l.max_machines else 1 end),
           aviso_vencimento_em = null
     where l.key = k
     returning l.expires_at into exp;
  end if;

  update public.pagamentos set key = k, chave_nova = nova where mp_payment_id = p_payment_id;
  update public.pedidos set status = 'pago' where id = ped.id;
  return query select k, exp, nova, false;
end;
$$;
revoke all on function public.pagamento_aprovado(text, uuid) from public, anon, authenticated;

-- Painel do assinante: chaves do e-mail logado, com os PCs em uso
create or replace function public.minhas_licencas()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', l.key,
    'plan', l.plan,
    'max_machines', l.max_machines,
    'expires_at', l.expires_at,
    'revoked', l.revoked,
    'ativa', not l.revoked and (l.expires_at is null or l.expires_at > now()),
    'pcs', coalesce((select jsonb_agg(jsonb_build_object('machine', a.machine, 'version', a.version, 'last_seen', a.last_seen) order by a.last_seen desc)
                     from public.ativacoes a where a.key = l.key), '[]'::jsonb)
  ) order by l.revoked, l.expires_at desc nulls first), '[]'::jsonb)
  from public.licencas l
  where (auth.jwt() ->> 'email') is not null
    and lower(l.email) = lower(auth.jwt() ->> 'email');
$$;
revoke all on function public.minhas_licencas() from public, anon;
grant execute on function public.minhas_licencas() to authenticated;

-- Libera um PC da chave do próprio assinante
create or replace function public.liberar_pc(p_key text, p_machine text)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
begin
  delete from public.ativacoes a
   using public.licencas l
   where a.key = l.key and a.key = upper(p_key) and a.machine = lower(p_machine)
     and (auth.jwt() ->> 'email') is not null
     and lower(l.email) = lower(auth.jwt() ->> 'email');
  return found;
end;
$$;
revoke all on function public.liberar_pc(text, text) from public, anon;
grant execute on function public.liberar_pc(text, text) to authenticated;

-- O assinante logado tem plano ativo? (usado pelo download)
create or replace function public.tem_plano_ativo(p_email text)
returns boolean
language sql
stable
set search_path to ''
as $$
  select exists (select 1 from public.licencas l
                  where lower(l.email) = lower(p_email) and not l.revoked
                    and (l.expires_at is null or l.expires_at > now()));
$$;
revoke all on function public.tem_plano_ativo(text) from public, anon, authenticated;

-- Token do agendador de lembretes (gerado aqui, guardado no Vault)
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'lembretes_token', 'Token que o pg_cron envia para a função lembretes');
create or replace function public.lembretes_token_ok(p_token text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select p_token is not null and exists (select 1 from vault.decrypted_secrets where name = 'lembretes_token' and decrypted_secret = p_token);
$$;
revoke all on function public.lembretes_token_ok(text) from public, anon, authenticated;

-- Bucket privado para o instalador do script
insert into storage.buckets (id, name, public) values ('downloads', 'downloads', false)
on conflict (id) do nothing;

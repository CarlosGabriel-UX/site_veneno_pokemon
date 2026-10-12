grant select on public.precos to anon, authenticated;
create policy "precos ativos são públicos" on public.precos for select to anon, authenticated using (ativo);

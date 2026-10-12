create extension if not exists pg_cron;
select cron.schedule(
  'lembretes-vencimento',
  '0 12 * * *', -- todo dia às 9h de Brasília
  $$
  select net.http_post(
    url := 'https://shuyydpwkgoxheilwggf.supabase.co/functions/v1/lembretes',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-lembretes-token', (select decrypted_secret from vault.decrypted_secrets where name = 'lembretes_token')),
    timeout_milliseconds := 30000
  );
  $$
);

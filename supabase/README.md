# Loja: login, pagamento e e-mails

Projeto Supabase: `veneno-licencas` (organização LojaVendas), o mesmo das chaves do script.

## Como funciona
1. Na página do jogo, "Escolher plano" pede o e-mail e chama a função `checkout`. Ela cria o pedido (`pedidos`) com o preço da tabela `precos` e abre o checkout do Mercado Pago.
2. Quando o pagamento é aprovado, o Mercado Pago chama `mercadopago-webhook`. A função confere o pagamento na API do Mercado Pago e roda `pagamento_aprovado()`:
   - se o e-mail ainda não tem chave, cria uma (`nova_chave`);
   - se já tem, soma os dias à validade e atualiza o plano.
   Depois manda a chave por e-mail. O mesmo pagamento nunca gera duas chaves (tabela `pagamentos`).
3. Na `area.html` o cliente entra com e-mail e senha (ou pelo link de acesso no e-mail). "Criar senha" cria a conta (Supabase envia e-mail de confirmação) e "Esqueci minha senha" manda o link que abre o formulário de nova senha; logado, ele também pode trocar a senha pelo painel. O painel mostra as chaves do e-mail (`minhas_licencas()`), os PCs em uso (pode liberar com `liberar_pc()`) e o botão de download.
4. `download` só gera o link (válido por 5 minutos) para quem tem plano ativo. O instalador fica no bucket privado `downloads`; a função entrega o arquivo mais recente.
5. Todo dia às 9h (Brasília) o `pg_cron` chama `lembretes`, que avisa por e-mail quem vence nos próximos 3 dias.

## Preços
Os valores cobrados vêm da tabela `precos` (o site só mostra). Para mudar:
```sql
update public.precos set valor = 34.90 where plan = 'pro' and periodo = 'mensal';
```
Lembre de atualizar também os preços exibidos em `assets/games.js`.

## Configuração que falta (painel do Supabase)
- **Authentication > URL Configuration:** Site URL `https://carlosgabriel-ux.github.io/site_veneno_pokemon/area.html` e o mesmo endereço em Redirect URLs.
- **Authentication > SMTP:** servidor de e-mail próprio (ex.: Resend). Sem isso o Supabase só manda poucos e-mails por hora e apenas para membros da organização.
- **Edge Functions > Secrets:**
  - `MP_ACCESS_TOKEN`: Access Token de produção do Mercado Pago.
  - `MP_WEBHOOK_SECRET`: assinatura secreta do webhook (Mercado Pago > Suas integrações > Webhooks).
  - `RESEND_API_KEY` e `EMAIL_FROM` (ex.: `Noctis <nao-responda@seudominio.com>`): e-mails da chave e dos lembretes.
- **Mercado Pago > Webhooks:** URL `https://shuyydpwkgoxheilwggf.supabase.co/functions/v1/mercadopago-webhook`, evento "Pagamentos".
- **Storage > downloads:** envie o instalador do script.

## Funções
O código está em `functions/` e foi publicado no projeto. `checkout`, `mercadopago-webhook` e `lembretes` não exigem login (o webhook confere o pagamento na API do Mercado Pago; os lembretes exigem o token do Vault). `download` exige o login do assinante.

## Painel de admin (`admin.html`)

Quem está na tabela `admins` (por e-mail) entra em `admin.html` com a mesma conta da Área do assinante e pode ver o resumo, gerar chaves, editar e-mail/plano/PCs/observação, renovar, bloquear, liberar PCs e ver as vendas. Tudo passa pelas funções `admin_*`, que conferem `is_admin()` antes de qualquer coisa. Para adicionar um admin: `insert into public.admins (email) values ('email@exemplo.com');`

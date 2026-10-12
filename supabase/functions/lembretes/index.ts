// Avisa por e-mail quem vence nos próximos 3 dias. Chamada uma vez por dia pelo pg_cron,
// que manda o token guardado no Vault (lembretes_token).
import { botao, dataBR, db, enviarEmail, nomePlano, paragrafo, SITE } from "../_shared/util.ts";

const DIAS = 3;

Deno.serve(async (req) => {
  const { data: valido } = await db.rpc("lembretes_token_ok", { p_token: req.headers.get("x-lembretes-token") ?? "" });
  if (!valido) return new Response("não autorizado", { status: 401 });

  const agora = new Date();
  const limite = new Date(agora.getTime() + DIAS * 864e5);
  const { data: lics, error } = await db.from("licencas")
    .select("key, email, plan, expires_at, aviso_vencimento_em")
    .eq("revoked", false).not("email", "is", null)
    .gt("expires_at", agora.toISOString()).lte("expires_at", limite.toISOString());
  if (error) return new Response("erro", { status: 500 });

  let enviados = 0;
  for (const l of lics ?? []) {
    // Já avisado para este vencimento?
    if (l.aviso_vencimento_em && new Date(l.aviso_vencimento_em) > new Date(new Date(l.expires_at).getTime() - (DIAS + 1) * 864e5)) continue;
    const ok = await enviarEmail(
      l.email,
      "Sua assinatura do Injection vence em breve",
      "Sua assinatura vence em breve",
      paragrafo(`Seu plano <b>${nomePlano(l.plan)}</b> vence em <b>${dataBR(l.expires_at)}</b>.`) +
        paragrafo("Para continuar usando, renove pelo site com este mesmo e-mail. A validade é somada ao que ainda falta, e a chave continua a mesma.") +
        botao("Renovar agora", `${SITE}/jogos/optpokemon.html#planos`),
    );
    if (ok) {
      await db.from("licencas").update({ aviso_vencimento_em: agora.toISOString() }).eq("key", l.key);
      enviados++;
    }
  }
  return new Response(JSON.stringify({ ok: true, enviados }), { headers: { "Content-Type": "application/json" } });
});

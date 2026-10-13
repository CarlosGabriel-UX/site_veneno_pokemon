// Recebe as notificações do Mercado Pago. Confere o pagamento direto na API do Mercado Pago,
// cria ou renova a chave do e-mail do pedido e manda a chave por e-mail.
import { botao, caixaChave, dataBR, db, enviarEmail, nomePlano, paragrafo, SITE } from "../_shared/util.ts";

const ok = (msg = "ok") => new Response(msg, { status: 200 });

async function hmacHex(secret: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let body: Record<string, any> = {};
  try {
    if (req.method === "POST") body = await req.json();
  } catch { /* corpo vazio */ }

  const tipo = String(body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "");
  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (tipo !== "payment" || !/^\d+$/.test(dataId)) return ok("ignorado");

  // Assinatura secreta do webhook (Mercado Pago > Suas integrações > Webhooks)
  const segredo = Deno.env.get("MP_WEBHOOK_SECRET");
  if (segredo) {
    const partes = Object.fromEntries((req.headers.get("x-signature") ?? "").split(",").map((p) => p.trim().split("=")));
    const manifesto = `id:${dataId};request-id:${req.headers.get("x-request-id") ?? ""};ts:${partes.ts ?? ""};`;
    if (!partes.v1 || !iguais(await hmacHex(segredo, manifesto), partes.v1)) {
      console.warn("Assinatura do webhook inválida", dataId);
      return new Response("assinatura inválida", { status: 401 });
    }
  }

  const token = Deno.env.get("MP_ACCESS_TOKEN");
  if (!token) return new Response("pagamento não configurado", { status: 503 });

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    console.error("Não consegui ler o pagamento", dataId, r.status);
    return new Response("erro ao consultar pagamento", { status: 502 });
  }
  const pg = await r.json();
  if (pg.status !== "approved") return ok(`status ${pg.status}`);

  const pedidoId = String(pg.external_reference ?? "");
  const { data: pedido } = await db.from("pedidos").select("id, email, plan, valor").eq("id", pedidoId).maybeSingle();
  if (!pedido) {
    console.warn("Pagamento aprovado sem pedido conhecido", dataId, pedidoId);
    return ok("pedido desconhecido");
  }
  if (pg.currency_id !== "BRL" || Number(pg.transaction_amount) + 0.009 < Number(pedido.valor)) {
    console.error("Valor pago diferente do pedido", dataId, pg.transaction_amount, pedido.valor);
    return ok("valor divergente");
  }

  const { data: res, error } = await db.rpc("pagamento_aprovado", { p_payment_id: dataId, p_pedido: pedido.id });
  if (error || !res?.length) {
    console.error("Erro ao gerar a chave", dataId, error);
    return new Response("erro ao gerar chave", { status: 500 });
  }
  const { key, expires_at, chave_nova } = res[0];

  const { data: reg } = await db.from("pagamentos").select("email_enviado").eq("mp_payment_id", dataId).single();
  if (!reg?.email_enviado) {
    const titulo = chave_nova ? "Sua chave do Noctis chegou" : "Sua assinatura foi renovada";
    const enviado = await enviarEmail(
      pedido.email,
      chave_nova ? "Sua chave do Noctis" : "Assinatura do Noctis renovada",
      titulo,
      paragrafo(`Pagamento confirmado. Plano <b>${nomePlano(pedido.plan)}</b>, válido até <b>${dataBR(expires_at)}</b>.`) +
        paragrafo(chave_nova ? "Esta é a sua chave de ativação:" : "Sua chave continua a mesma:") +
        caixaChave(key) +
        paragrafo("Para baixar o script, entre na Área do assinante com este mesmo e-mail. Você recebe um link de acesso, sem senha.") +
        botao("Abrir a Área do assinante", `${SITE}/area.html`),
    );
    if (enviado) await db.from("pagamentos").update({ email_enviado: true }).eq("mp_payment_id", dataId);
  }
  return ok("processado");
});

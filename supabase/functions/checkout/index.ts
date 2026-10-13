// Cria o pedido e a preferência de pagamento no Mercado Pago.
// POST {plan, periodo, email} -> {ok, url}
import { CORS, db, EMAIL_RE, json, SITE, SUPABASE_URL } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { ok: false, message: "Use POST." });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, message: "Pedido inválido." });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const plan = String(body.plan ?? "").toLowerCase();
  let periodo = String(body.periodo ?? "mensal").toLowerCase();
  if (plan === "semanal") periodo = "semanal";
  if (!EMAIL_RE.test(email) || email.length > 254) return json(400, { ok: false, message: "Confira o e-mail." });

  const { data: preco, error } = await db.from("precos").select("plan, periodo, dias, valor, titulo")
    .eq("plan", plan).eq("periodo", periodo).eq("ativo", true).maybeSingle();
  if (error) return json(500, { ok: false, message: "Erro no servidor. Tente de novo." });
  if (!preco) return json(400, { ok: false, message: "Plano indisponível." });

  const token = Deno.env.get("MP_ACCESS_TOKEN");
  if (!token) return json(503, { ok: false, code: "nao_configurado", message: "O pagamento online ainda não foi ativado." });

  const { data: pedido, error: pedErr } = await db.from("pedidos")
    .insert({ email, plan: preco.plan, periodo: preco.periodo, dias: preco.dias, valor: preco.valor })
    .select("id").single();
  if (pedErr) return json(500, { ok: false, message: "Erro no servidor. Tente de novo." });

  const area = `${SITE}/area.html`;
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": pedido.id,
    },
    body: JSON.stringify({
      items: [{
        id: `${preco.plan}-${preco.periodo}`,
        title: preco.titulo,
        quantity: 1,
        unit_price: Number(preco.valor),
        currency_id: "BRL",
      }],
      payer: { email },
      external_reference: pedido.id,
      notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      back_urls: {
        success: `${area}?pagamento=aprovado`,
        pending: `${area}?pagamento=pendente`,
        failure: `${area}?pagamento=falhou`,
      },
      auto_return: "approved",
      statement_descriptor: "NOCTIS",
      payment_methods: { installments: 1 },
    }),
  });
  if (!r.ok) {
    console.error("Mercado Pago recusou a preferência", r.status, await r.text());
    return json(502, { ok: false, message: "Não foi possível abrir o pagamento. Tente de novo." });
  }
  const pref = await r.json();
  await db.from("pedidos").update({ mp_preference_id: pref.id }).eq("id", pedido.id);
  return json(200, { ok: true, url: pref.init_point });
});

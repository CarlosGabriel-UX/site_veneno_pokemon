// Gera um link temporário do instalador para quem tem plano ativo.
// POST com o token do assinante logado -> {ok, url, nome}
import { CORS, db, json } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { ok: false, message: "Use POST." });

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u, error } = await db.auth.getUser(jwt);
  const email = u?.user?.email;
  if (error || !email) return json(401, { ok: false, message: "Entre de novo na Área do assinante." });

  const { data: ativo } = await db.rpc("tem_plano_ativo", { p_email: email });
  if (!ativo) return json(403, { ok: false, message: "Você não tem um plano ativo. Renove para baixar." });

  let nome = Deno.env.get("DOWNLOAD_FILE") ?? "";
  if (!nome) {
    const { data: arquivos } = await db.storage.from("downloads").list("", { sortBy: { column: "created_at", order: "desc" }, limit: 20 });
    nome = (arquivos ?? []).find((a) => a.id && !a.name.startsWith("."))?.name ?? "";
  }
  if (!nome) return json(404, { ok: false, message: "O instalador ainda não foi publicado. Fale com o suporte." });

  const { data: link, error: e2 } = await db.storage.from("downloads").createSignedUrl(nome, 300, { download: nome });
  if (e2 || !link) return json(500, { ok: false, message: "Não foi possível gerar o download. Tente de novo." });
  return json(200, { ok: true, url: link.signedUrl, nome });
});

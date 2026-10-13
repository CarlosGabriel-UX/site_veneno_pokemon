// Utilidades comuns das funções da loja.
import { createClient } from "npm:@supabase/supabase-js@2";

export const SITE = (Deno.env.get("SITE_URL") ?? "https://carlosgabriel-ux.github.io/site_veneno_pokemon").replace(/\/$/, "");
export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

export const db = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const NOMES: Record<string, string> = { semanal: "Semanal", pro: "Pro", max: "Max", vitalicio: "Vitalício" };
export const nomePlano = (p: string) => NOMES[p] ?? p;

export function dataBR(iso: string | null) {
  if (!iso) return "sem vencimento";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function esc(t: string) {
  return t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

// Envia e-mail pelo Resend. Sem RESEND_API_KEY configurada, não envia e devolve false.
export async function enviarEmail(para: string, assunto: string, titulo: string, corpoHtml: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  if (!apiKey || !from) {
    console.warn("E-mail não enviado: configure RESEND_API_KEY e EMAIL_FROM.");
    return false;
  }
  const html = `<!doctype html><html><body style="margin:0;background:#0b0b0c;font-family:Arial,Helvetica,sans-serif;color:#ececec">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <p style="font-size:22px;font-weight:800;letter-spacing:2px;margin:0 0 24px">NOCTIS<span style="color:#ff2d3f">_</span></p>
    <h1 style="font-size:22px;margin:0 0 16px;color:#fff">${esc(titulo)}</h1>
    ${corpoHtml}
    <p style="margin-top:32px;font-size:12px;color:#7b7b80">Você recebeu este e-mail porque assinou o Noctis com este endereço.</p>
  </div></body></html>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [para], subject: assunto, html }),
  });
  if (!r.ok) console.error("Falha ao enviar e-mail", r.status, await r.text());
  return r.ok;
}

export function caixaChave(chave: string) {
  return `<p style="font-family:Consolas,monospace;font-size:20px;letter-spacing:2px;background:#060608;border:1px dashed #444;border-radius:10px;padding:14px 16px;color:#fff;margin:16px 0">${esc(chave)}</p>`;
}

export function botao(texto: string, href: string) {
  return `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#ff2d3f;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block">${esc(texto)}</a></p>`;
}

export function paragrafo(t: string) {
  return `<p style="font-size:15px;line-height:1.6;color:#c9c9ce;margin:0 0 12px">${t}</p>`;
}
export { esc };

// Edite aqui os links reais de pagamento e contato.
// Cole o link de checkout de cada plano de cada jogo (Mercado Pago, Stripe, Kiwify, Hotmart etc.).
window.INJECTION_CONFIG = {
  checkout: {
    optpokemon: { semanal: "", pro: "", max: "" },
    csgo: {}
  },
  // Usado quando um plano ainda não tem link de checkout.
  fallbackContato: "https://discord.gg/SEU-CONVITE",
  discord: "https://discord.gg/SEU-CONVITE",
  email: "contato@injection.com"
};

// Catálogo de jogos do Injection.
// Para adicionar um jogo: copie um bloco abaixo, mude o "slug" e crie jogos/<slug>.html
// (basta copiar jogos/optpokemon.html e trocar o data-game).
// status: "disponivel" mostra a página completa; "em-breve" mostra o card desativado na vitrine.
window.INJECTION_GAMES = [
  {
    slug: "optpokemon",
    nome: "OptPokemon",
    tag: "OPT",
    status: "disponivel",
    resumo: "Caçada automática, auto-cura, coleta de loot e rotinas prontas.",
    titulo: "Automatize sua rotina no OptPokemon.",
    descricao: "O Injection OptPokemon cuida da caçada, da cura, do loot e das rotinas repetitivas. Configure em minutos e acompanhe tudo pela sua área de assinante.",
    // Slides do topo (imagens em assets/pokemon/)
    slides: [
      { img: "gengar", palavra: "GENGAR", cor: "#7b3fe4", texto: "Pronto para deixar o script caçar por você enquanto descansa e voltar com a mochila cheia?" },
      { img: "mewtwo", palavra: "MEWTWO", cor: "#b06bd6", texto: "Automação estável, perfis prontos e atualização a cada mudança do jogo." },
      { img: "charizard", palavra: "CHARIZARD", cor: "#ff6a2b", texto: "Upe mais rápido com caçada automática, auto-cura e coleta de loot." },
      { img: "lucario", palavra: "LUCARIO", cor: "#3f7fe4", texto: "Configure em minutos e acompanhe tudo pela sua área de assinante." }
    ],
    stats: [["24/7", "rodando"], ["+30", "rotinas prontas"], ["Suporte", "no Discord"]],
    recursos: [
      ["HNT", "Caçada automática", "Define rotas, alvos e prioridades de ataque. O script procura, ataca e volta para a rota sozinho."],
      ["HP+", "Auto-cura e revive", "Gatilhos de HP e status configuráveis para usar poções, revives e trocar de Pokémon na hora certa."],
      ["LOT", "Coleta de loot", "Pega os itens que importam e ignora o resto, com filtros por nome e valor."],
      ["CFG", "Perfis prontos", "Mais de 30 rotinas prontas para começar sem configurar nada do zero."],
      ["ALR", "Alertas", "Aviso quando o personagem morre, a mochila enche ou algo sai do esperado."],
      ["UPD", "Atualizações contínuas", "Acompanhamos as mudanças do jogo e liberamos novas versões para todos os assinantes."]
    ],
    planos: [
      { id: "semanal", nome: "Semanal", desc: "Para testar sem compromisso.", mensal: "9,90", trimestral: "9,90", per: "/semana",
        itens: ["1 conta do jogo", "Rotinas prontas", "Auto-cura e loot", "Suporte via Discord"] },
      { id: "pro", nome: "Pro", desc: "O plano completo para quem joga todo dia.", mensal: "29,90", trimestral: "25,40", per: "/mês", destaque: true,
        itens: ["2 contas do jogo", "Todos os recursos", "Perfis exclusivos", "Alertas de morte e mochila cheia", "Suporte prioritário"] },
      { id: "max", nome: "Max", desc: "Para quem roda várias contas ao mesmo tempo.", mensal: "59,90", trimestral: "50,90", per: "/mês",
        itens: ["5 contas do jogo", "Tudo do plano Pro", "Acesso antecipado a novidades", "Ajuda na configuração"] }
    ],
    faq: [
      ["Funciona em qualquer computador?", "Roda no Windows 10 ou 11. Recomendamos deixar o jogo em janela com a resolução indicada no guia de instalação."],
      ["Posso usar em mais de uma conta?", "Sim. O número de contas depende do plano: 1 no Semanal, 2 no Pro e 5 no Max."],
      ["Existe risco para a minha conta?", "Todo uso de automação em jogos online envolve risco. Leia as regras do OptPokemon e use com responsabilidade. O Injection não é afiliado ao OptPokemon."]
    ],
    aviso: "Não afiliado ao OptPokemon, Nintendo ou The Pokémon Company."
  },
  {
    slug: "csgo",
    nome: "CS:GO",
    tag: "CS",
    status: "em-breve",
    resumo: "Em desenvolvimento. Entre no Discord para ser avisado do lançamento.",
    aviso: "Não afiliado à Valve Corporation."
  }
];

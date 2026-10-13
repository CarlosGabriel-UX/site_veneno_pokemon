// Catálogo de jogos do Noctis.
// Para adicionar um jogo: copie um bloco abaixo, mude o "slug" e crie jogos/<slug>.html
// (basta copiar jogos/optpokemon.html e trocar o data-game).
// status: "disponivel" mostra a página completa; "em-breve" mostra o card desativado na vitrine.
window.NOCTIS_GAMES = [
  {
    slug: "optpokemon",
    nome: "OptPokemon",
    tag: "OPT",
    status: "disponivel",
    resumo: "Caçada automática, auto-cura, coleta de loot e rotinas prontas.",
    titulo: "Automatize sua rotina no OptPokemon.",
    descricao: "O Noctis OptPokemon cuida da caçada, da cura, do loot e das rotinas repetitivas. Configure em minutos e acompanhe tudo pela sua área de assinante.",
    // Cor de destaque da página e do card na vitrine
    cor: "#dfe6ff",
    // Slides do topo (imagens em assets/pokemon/ ou assets/arte/)
    slides: [
      { img: "pokemon/gengar.png", palavra: "GENGAR", cor: "#7b3fe4", texto: "Pronto para deixar o script caçar por você enquanto descansa e voltar com a mochila cheia?" },
      { img: "pokemon/mewtwo.png", palavra: "MEWTWO", cor: "#b06bd6", texto: "Automação estável, perfis prontos e atualização a cada mudança do jogo." },
      { img: "pokemon/charizard.png", palavra: "CHARIZARD", cor: "#ff6a2b", texto: "Upe mais rápido com caçada automática, auto-cura e coleta de loot." },
      { img: "pokemon/lucario.png", palavra: "LUCARIO", cor: "#3f7fe4", texto: "Configure em minutos e acompanhe tudo pela sua área de assinante." }
    ],
    // Status do script (aparece no topo, na vitrine e na área do assinante).
    // estado: "online" | "manutencao" | "offline". Atualize a data a cada versão nova.
    script: { estado: "online", versao: "1.4.2", atualizado: "2026-10-10" },
    // Demonstração: cole o link de um vídeo .mp4 (ou deixe vazio para mostrar a simulação do painel)
    demo: {
      video: "", poster: "",
      // Linhas que aparecem no log da simulação
      log: ["Rota Cinnabar carregada", "Alvo encontrado: Lv 42", "Ataque 1 usado", "Alvo derrotado (+1.240 XP)", "Loot coletado: Rare Candy",
            "HP em 38%: usando Super Potion", "Voltando para a rota", "Alvo encontrado: Lv 45", "Ataque 2 usado", "Alvo derrotado (+1.410 XP)",
            "Loot ignorado: Pokéball", "Mochila em 72%", "Trocando de Pokémon", "Alvo derrotado (+1.300 XP)", "Loot coletado: Nugget"]
    },
    // Changelog: as versões mais recentes primeiro (exemplo, troque pelas reais)
    changelog: [
      ["1.4.2", "2026-10-10", ["Rotas novas para a caçada em Cinnabar", "Correção na troca de Pokémon com HP baixo"]],
      ["1.4.0", "2026-09-28", ["Alertas de mochila cheia no Discord", "Filtro de loot por valor"]],
      ["1.3.5", "2026-09-12", ["Compatível com a atualização do cliente de setembro"]]
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
    // Tabela comparativa: [recurso, Semanal, Pro, Max]. true = incluso, false = não incluso, texto = valor
    comparativo: [
      ["Contas do jogo", "1", "2", "5"],
      ["Caçada automática", true, true, true],
      ["Auto-cura e loot", true, true, true],
      ["Rotinas prontas", true, true, true],
      ["Perfis exclusivos", false, true, true],
      ["Alertas no Discord", false, true, true],
      ["Acesso antecipado", false, false, true],
      ["Ajuda na configuração", false, false, true],
      ["Suporte", "Discord", "Prioritário", "Prioritário"]
    ],
    faq: [
      ["Funciona em qualquer computador?", "Roda no Windows 10 ou 11. Recomendamos deixar o jogo em janela com a resolução indicada no guia de instalação."],
      ["Posso usar em mais de uma conta?", "Sim. O número de contas depende do plano: 1 no Semanal, 2 no Pro e 5 no Max."],
      ["Existe risco para a minha conta?", "Todo uso de automação em jogos online envolve risco. Leia as regras do OptPokemon e use com responsabilidade. O Noctis não é afiliado ao OptPokemon."]
    ],
    aviso: "Não afiliado ao OptPokemon, Nintendo ou The Pokémon Company."
  },
  {
    slug: "csgo",
    nome: "CS:GO",
    tag: "CS",
    status: "em-breve",
    cor: "#ff8a1f",
    resumo: "Em desenvolvimento. Entre no Discord para ser avisado do lançamento.",
    slides: [
      { img: "arte/mira.svg", palavra: "MIRA", cor: "#ff8a1f", texto: "O Noctis CS:GO está em desenvolvimento. Entre no Discord para ser avisado no lançamento." },
      { img: "arte/radar.svg", palavra: "RADAR", cor: "#3fa7e4", texto: "Quer ajudar a decidir os recursos? Vote no nosso Discord." },
      { img: "arte/tatico.svg", palavra: "TÁTICO", cor: "#ff8a1f", texto: "Assinantes do Noctis recebem acesso antecipado aos testes." }
    ],
    script: { estado: "dev", versao: "", atualizado: "" },
    aviso: "Não afiliado à Valve Corporation."
  }
];

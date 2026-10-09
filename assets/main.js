(function () {
  var cfg = window.INJECTION_CONFIG || { checkout: {} };
  var games = window.INJECTION_GAMES || [];
  var gameSlug = document.body.getAttribute("data-game");

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function find(slug) {
    for (var i = 0; i < games.length; i++) if (games[i].slug === slug) return games[i];
    return null;
  }
  function menorPreco(g) {
    if (!g.planos || !g.planos.length) return null;
    var mensais = g.planos.filter(function (p) { return p.per === "/mês"; });
    var lista = mensais.length ? mensais : g.planos;
    return lista.reduce(function (a, b) {
      return parseFloat(a.mensal.replace(",", ".")) <= parseFloat(b.mensal.replace(",", ".")) ? a : b;
    });
  }


  // Palco do topo: slider com Pokémon (estilo pôster de jogo)
  function stage(slides, o) {
    return '<section class="stage" data-stage>' +
      '<div class="stage__band" aria-hidden="true"></div>' +
      slides.map(function (s, i) {
        var img = o.base + "assets/pokemon/" + s.img + ".png";
        return '<div class="stage__slide' + (i === 0 ? " is-active" : "") + '" style="--c:' + esc(s.cor) + '" aria-hidden="' + (i === 0 ? "false" : "true") + '">' +
          '<img class="stage__poke" src="' + img + '" alt="' + esc(s.palavra) + '" />' +
          '<div class="container stage__inner">' +
            '<div class="stage__bubble"><p>' + esc(s.texto) + '</p></div>' +
            '<p class="stage__word" style="background-image:linear-gradient(180deg,rgba(255,255,255,.85),rgba(120,120,120,.6)),url(' + img + ')">' + esc(s.palavra) + '</p>' +
          '</div></div>';
      }).join("") +
      '<div class="container stage__bar">' +
        '<div class="stage__meta"><span class="stage__label">' + esc(o.label) + '</span>' +
          '<div class="stage__platforms"><span>Windows 10/11</span><span>Suporte no Discord</span></div></div>' +
        '<a class="btn btn--primary stage__cta" href="' + esc(o.href) + '">' + esc(o.cta) + '</a>' +
        '<div class="stage__nav"><div class="stage__dots">' + slides.map(function (s, i) { return '<button aria-label="Slide ' + (i + 1) + '"' + (i === 0 ? ' class="is-active"' : '') + '></button>'; }).join("") + '</div>' +
        '<button class="stage__next" type="button">Próximo <span aria-hidden="true">›</span></button></div>' +
      '</div>' +
      '<h1 class="sr-only">' + esc(o.titulo) + '</h1>' +
    '</section>';
  }

  // Vitrine de jogos (página inicial)
  var hubStage = document.getElementById("hub-stage");
  if (hubStage && games[0] && games[0].slides) {
    hubStage.outerHTML = stage(games[0].slides, { base: "", label: "Em destaque: Injection " + games[0].nome, href: "jogos/" + games[0].slug + ".html", cta: "Ver planos", titulo: "Injection: scripts e macros para jogos" });
  }

  var grid = document.getElementById("games-grid");
  if (grid) {
    grid.innerHTML = games.map(function (g) {
      var on = g.status === "disponivel";
      var p = menorPreco(g);
      return '<article class="game' + (on ? "" : " game--soon") + '">' +
        '<div class="game__top"><span class="game__tag">' + esc(g.tag) + '</span>' +
        '<span class="game__status">' + (on ? "disponível" : "em breve") + '</span></div>' +
        '<h3>Injection ' + esc(g.nome) + '</h3>' +
        '<p>' + esc(g.resumo) + '</p>' +
        (on && p ? '<p class="game__price">a partir de <strong>R$ ' + esc(p.mensal) + '</strong>' + esc(p.per) + '</p>' : '') +
        (on ? '<a class="btn btn--primary btn--block" href="jogos/' + esc(g.slug) + '.html">Ver planos</a>'
            : '<a class="btn btn--ghost btn--block" href="#" data-link="discord">Avise-me no Discord</a>') +
        '</article>';
    }).join("") +
    '<article class="game game--suggest"><div class="game__top"><span class="game__tag">+</span></div>' +
    '<h3>Seu jogo aqui</h3><p>Quer um script para outro jogo? Sugira e vote no próximo lançamento.</p>' +
    '<a class="btn btn--ghost btn--block" href="#" data-link="discord">Sugerir no Discord</a></article>';
  }

  // Página de um jogo
  var main = document.getElementById("game");
  if (main && gameSlug) {
    var g = find(gameSlug);
    if (g && g.aviso) { var av = document.getElementById("aviso"); if (av) av.textContent = g.aviso; }
    if (!g || g.status !== "disponivel") {
      var nome = g ? g.nome : "este jogo";
      document.querySelectorAll('.nav__links a[href^="#"]').forEach(function (a) { a.remove(); });
      main.innerHTML = '<section class="auth"><div class="hero__glow" aria-hidden="true"></div><div class="auth__card">' +
        '<p class="auth__prompt">Em desenvolvimento</p>' +
        '<h1>Injection ' + esc(nome) + '</h1>' +
        '<p>Estamos desenvolvendo o script para ' + esc(nome) + '. Entre no Discord para ser avisado assim que lançar.</p>' +
        '<a class="btn btn--primary btn--block" href="#" data-link="discord">Avise-me no Discord</a>' +
        '<p class="auth__alt"><a href="../index.html#jogos">Ver outros jogos</a></p></div></section>';
    } else {
      document.title = "Injection " + g.nome + " | Planos e recursos";
            main.innerHTML =
        (g.slides ? stage(g.slides, { base: "../", label: "Injection " + g.nome, href: "#planos", cta: "Assinar", titulo: "Injection " + g.nome }) : "") +
        '<section class="section section--intro"><div class="container container--narrow intro">' +
          '<span class="eyebrow">Injection ' + esc(g.nome) + '</span><h2>' + esc(g.titulo) + '</h2><p class="lead">' + esc(g.descricao) + '</p>' +
          '<ul class="hero__stats">' + (g.stats || []).map(function (s) { return '<li><strong>' + esc(s[0]) + '</strong><span>' + esc(s[1]) + '</span></li>'; }).join("") + '</ul>' +
        '</div></section>' +

        '<section class="section" id="recursos"><div class="container"><header class="section__head"><span class="eyebrow">Recursos</span>' +
          '<h2>O que o script faz</h2></header><div class="grid grid--3">' +
          (g.recursos || []).map(function (r) { return '<article class="card"><div class="card__icon">' + esc(r[0]) + '</div><h3>' + esc(r[1]) + '</h3><p>' + esc(r[2]) + '</p></article>'; }).join("") +
        '</div></div></section>' +

        '<section class="section section--alt" id="planos"><div class="container"><header class="section__head"><span class="eyebrow">Planos</span>' +
          '<h2>Escolha seu plano</h2><p>Cancele quando quiser. Todos os planos incluem atualizações e suporte.</p></header>' +
          '<div class="billing" role="group" aria-label="Período de cobrança"><button class="billing__opt is-active" data-period="mensal">Mensal</button><button class="billing__opt" data-period="trimestral">Trimestral <em>-15%</em></button></div>' +
          '<div class="grid grid--3 plans">' +
          (g.planos || []).map(function (p) {
            return '<article class="plan' + (p.destaque ? " plan--featured" : "") + '">' +
              (p.destaque ? '<span class="plan__badge">Mais popular</span>' : '') +
              '<h3>' + esc(p.nome) + '</h3><p class="plan__desc">' + esc(p.desc) + '</p>' +
              '<p class="plan__price"><span class="cur">R$</span><span class="val" data-mensal="' + esc(p.mensal) + '" data-trimestral="' + esc(p.trimestral) + '">' + esc(p.mensal) + '</span><span class="per">' + esc(p.per) + '</span></p>' +
              '<ul class="plan__list">' + p.itens.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join("") + '</ul>' +
              '<a class="btn ' + (p.destaque ? "btn--primary" : "btn--ghost") + ' btn--block" href="#" data-checkout="' + esc(p.id) + '">Assinar</a></article>';
          }).join("") +
          '</div><p class="note">Preços de exemplo. O pagamento é feito por um link seguro (Pix ou cartão).</p></div></section>' +

        '<section class="section" id="faq"><div class="container container--narrow"><header class="section__head"><span class="eyebrow">FAQ</span><h2>Perguntas frequentes</h2></header><div class="faq">' +
          (g.faq || []).map(function (f) { return '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>'; }).join("") +
        '</div></div></section>' +

        '<section class="cta"><div class="container cta__inner"><h2>Pronto para injetar?</h2><p>Assine o Injection ' + esc(g.nome) + ' e comece hoje mesmo.</p><a href="#planos" class="btn btn--primary">Escolher plano</a></div></section>';
    }
  }

  // Ano no rodapé
  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Slider do palco
  document.querySelectorAll("[data-stage]").forEach(function (st) {
    var slides = st.querySelectorAll(".stage__slide");
    var dots = st.querySelectorAll(".stage__dots button");
    var cur = 0, timer;
    function go(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === cur); s.setAttribute("aria-hidden", String(i !== cur)); });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === cur); });
      st.style.setProperty("--c", slides[cur].style.getPropertyValue("--c"));
      restart();
    }
    function restart() { clearInterval(timer); if (!reduce && slides.length > 1) timer = setInterval(function () { go(cur + 1); }, 6500); }
    st.querySelector(".stage__next").addEventListener("click", function () { go(cur + 1); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
    go(0);
  });

  // Menu mobile
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Alternar mensal / trimestral
  var opts = document.querySelectorAll(".billing__opt");
  opts.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var period = btn.getAttribute("data-period");
      opts.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      document.querySelectorAll(".plan__price .val").forEach(function (el) {
        var v = el.getAttribute("data-" + period);
        if (v) el.textContent = v;
      });
    });
  });

  // Links de checkout e Discord
  document.querySelectorAll("[data-checkout]").forEach(function (a) {
    var url = ((cfg.checkout || {})[gameSlug] || {})[a.getAttribute("data-checkout")] || cfg.fallbackContato;
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
  });
  document.querySelectorAll('[data-link="discord"]').forEach(function (a) {
    if (cfg.discord) { a.href = cfg.discord; a.target = "_blank"; a.rel = "noopener"; }
  });

  document.querySelectorAll('[data-link="email"]').forEach(function (a) {
    if (cfg.email) { a.href = "mailto:" + cfg.email; a.textContent = cfg.email; }
  });

  // Área do assinante (placeholder, sem back-end)
  var form = document.getElementById("login-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = document.getElementById("login-msg");
      msg.textContent = "A área do assinante ainda está em construção. Fale com o suporte no Discord para receber seu acesso.";
      msg.hidden = false;
    });
  }
})();

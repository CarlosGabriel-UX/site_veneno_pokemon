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

  // Vitrine de jogos (página inicial)
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
        '<p class="auth__prompt">&gt; build em andamento_</p>' +
        '<h1>Injection ' + esc(nome) + '</h1>' +
        '<p>Estamos desenvolvendo o script para ' + esc(nome) + '. Entre no Discord para ser avisado assim que lançar.</p>' +
        '<a class="btn btn--primary btn--block" href="#" data-link="discord">Avise-me no Discord</a>' +
        '<p class="auth__alt"><a href="../index.html#jogos">Ver outros jogos</a></p></div></section>';
    } else {
      document.title = "Injection " + g.nome + " | Planos e recursos";
      var tagMap = { ok: "c-g", run: "c-p", loot: "c-y" };
      main.innerHTML =
        '<section class="hero"><div class="hero__glow" aria-hidden="true"></div><div class="container hero__inner"><div class="hero__text">' +
          '<span class="pill">root@injection:~$ ./inject --game ' + esc(g.slug) + '</span>' +
          '<h1 class="glitch" data-text="Injection ' + esc(g.nome) + '">Injection <span class="grad">' + esc(g.nome) + '</span></h1>' +
          '<p class="hero__sub">' + esc(g.titulo) + '</p>' +
          '<p class="lead">' + esc(g.descricao) + '</p>' +
          '<div class="hero__cta"><a href="#planos" class="btn btn--primary">Ver planos</a><a href="#recursos" class="btn btn--ghost">Recursos</a></div>' +
          '<ul class="hero__stats">' + (g.stats || []).map(function (s) { return '<li><strong>' + esc(s[0]) + '</strong><span>' + esc(s[1]) + '</span></li>'; }).join("") + '</ul>' +
        '</div><div class="hero__card" aria-hidden="true"><div class="term"><div class="term__bar"><i></i><i></i><i></i><span>' + esc(g.slug) + '.log</span></div>' +
          '<pre class="term__body" id="term"><code>' + (g.log || []).map(function (l) { return '<span class="' + (tagMap[l[0]] || "c-g") + '">[' + esc(l[0]) + ']</span> ' + esc(l[1]); }).join("\n") + '</code><span class="caret">█</span></pre>' +
        '</div></div></div></section>' +

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

  // Terminal digitando no hero
  var term = document.getElementById("term");
  if (term && !reduce) {
    var code = term.querySelector("code");
    var lines = code.innerHTML.split("\n");
    code.innerHTML = "";
    var li = 0;
    var typeLine = function () {
      if (li >= lines.length) {
        setTimeout(function () { code.innerHTML = ""; li = 0; typeLine(); }, 4000);
        return;
      }
      var tmp = document.createElement("div");
      tmp.innerHTML = lines[li];
      var tag = tmp.firstElementChild ? tmp.firstElementChild.outerHTML : "";
      var text = tmp.textContent.slice(tmp.firstElementChild ? tmp.firstElementChild.textContent.length : 0);
      var base = code.innerHTML + (li ? "\n" : "") + tag;
      var ci = 0;
      var tick = setInterval(function () {
        ci++;
        var span = document.createElement("span");
        span.textContent = text.slice(0, ci);
        code.innerHTML = base + span.innerHTML;
        if (ci >= text.length) { clearInterval(tick); li++; setTimeout(typeLine, 280); }
      }, 22);
    };
    typeLine();
  }

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

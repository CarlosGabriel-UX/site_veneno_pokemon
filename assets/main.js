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


  // Datas e status do script
  function dias(iso) {
    if (!iso) return null;
    var d = new Date(iso + "T12:00:00");
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 864e5));
  }
  function haQuanto(iso) {
    var n = dias(iso);
    if (n === null) return "";
    return n === 0 ? "hoje" : n === 1 ? "ontem" : "há " + n + " dias";
  }
  function fmtData(iso) { var p = String(iso).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso; }
  function badge(g, curto) {
    var sc = g.script || {};
    var est = sc.estado || (g.status === "disponivel" ? "online" : "dev");
    var txt = { online: "Online", manutencao: "Em manutenção", offline: "Offline", dev: "Em desenvolvimento" }[est] || est;
    var extra = est === "online" && !curto ? (sc.versao ? " · v" + sc.versao : "") + (sc.atualizado ? " · atualizado " + haQuanto(sc.atualizado) : "") : "";
    return '<span class="status status--' + esc(est) + '"><i aria-hidden="true"></i>' + esc(txt + extra) + '</span>';
  }

  // Palco do topo: slider com Pokémon (estilo pôster de jogo)
  function stage(slides, o) {
    return '<section class="stage" data-stage>' +
      '<div class="stage__band" aria-hidden="true"></div>' +
      slides.map(function (s, i) {
        var img = o.base + "assets/" + s.img;
        return '<div class="stage__slide' + (i === 0 ? " is-active" : "") + '" style="--c:' + esc(s.cor) + '" aria-hidden="' + (i === 0 ? "false" : "true") + '">' +
          '<img class="stage__poke" src="' + img + '" alt="' + esc(s.palavra) + '" />' +
          '<div class="container stage__inner">' +
            '<div class="stage__bubble"><p>' + esc(s.texto) + '</p></div>' +
            '<p class="stage__word" style="background-image:linear-gradient(180deg,rgba(255,255,255,.85),rgba(120,120,120,.6)),url(' + img + ')">' + esc(s.palavra) + '</p>' +
          '</div></div>';
      }).join("") +
      '<div class="container stage__bar">' +
        (o.badge || "") + '<div class="stage__meta"><span class="stage__label">' + esc(o.label) + '</span>' +
          '<div class="stage__platforms"><span>Windows 10/11</span><span>Suporte no Discord</span></div></div>' +
        '<a class="btn btn--primary stage__cta" href="' + esc(o.href) + '"' + (o.link ? ' data-link="' + esc(o.link) + '"' : '') + '>' + esc(o.cta) + '</a>' +
        '<div class="stage__nav"><div class="stage__dots">' + slides.map(function (s, i) { return '<button aria-label="Slide ' + (i + 1) + '"' + (i === 0 ? ' class="is-active"' : '') + '></button>'; }).join("") + '</div>' +
        '<button class="stage__next" type="button">Próximo <span aria-hidden="true">›</span></button></div>' +
      '</div>' +
      '<h1 class="sr-only">' + esc(o.titulo) + '</h1>' +
    '</section>';
  }

  // Demonstração: vídeo real ou simulação do painel do script
  function demoHTML(g) {
    var d = g.demo;
    if (!d) return "";
    var corpo = d.video
      ? '<video class="demo__video" src="' + esc(d.video) + '"' + (d.poster ? ' poster="' + esc(d.poster) + '"' : '') + ' controls preload="metadata" playsinline></video>'
      : '<div class="app" data-demo>' +
          '<div class="app__bar"><span></span><span></span><span></span><p>Injection ' + esc(g.nome) + (g.script && g.script.versao ? ' v' + esc(g.script.versao) : '') + '</p>' + badge(g, true) + '</div>' +
          '<div class="app__body">' +
            '<ul class="app__side">' + [["Caçada", 1], ["Auto-cura", 1], ["Loot", 1], ["Alertas", 1], ["Anti-AFK", 0]].map(function (t) {
              return '<li><span>' + t[0] + '</span><b class="tog' + (t[1] ? " is-on" : "") + '"></b></li>'; }).join("") + '</ul>' +
            '<div class="app__main">' +
              '<div class="app__stats"><div><small>Rodando</small><strong data-k="tempo">00:00:00</strong></div><div><small>Derrotados</small><strong data-k="kills">0</strong></div>' +
              '<div><small>XP/hora</small><strong data-k="xp">0</strong></div><div><small>Mochila</small><strong data-k="bag">40%</strong></div></div>' +
              '<ol class="app__log" aria-live="off"></ol>' +
            '</div></div></div>';
    return '<section class="section" id="demo"><div class="container"><header class="section__head"><span class="eyebrow">Demonstração</span>' +
      '<h2>Veja o script rodando</h2>' + (d.video ? '' : '<p>Simulação do painel do Injection ' + esc(g.nome) + '. O vídeo real entra aqui em breve.</p>') + '</header>' +
      '<div class="demo">' + corpo + '</div></div></section>';
  }

  // Status do script e changelog
  function novidadesHTML(g) {
    if (!g.changelog || !g.changelog.length) return "";
    var sc = g.script || {};
    return '<section class="section section--alt" id="novidades"><div class="container"><header class="section__head"><span class="eyebrow">Status e novidades</span>' +
      '<h2>Sempre atualizado</h2></header><div class="news">' +
      '<article class="news__status">' + badge(g, true) +
        '<p class="news__ver">v' + esc(sc.versao || "") + '</p>' +
        '<p>Atualizado ' + esc(haQuanto(sc.atualizado)) + (sc.atualizado ? ' (' + esc(fmtData(sc.atualizado)) + ')' : '') + '.</p>' +
        '<p class="note">Quando o jogo muda, liberamos uma versão nova para todos os assinantes.</p></article>' +
      '<ol class="news__log">' + g.changelog.map(function (c, i) {
        return '<li' + (i === 0 ? ' class="is-new"' : '') + '><div class="news__head"><strong>v' + esc(c[0]) + '</strong><span>' + esc(fmtData(c[1])) + '</span>' + (i === 0 ? '<em>novo</em>' : '') + '</div>' +
          '<ul>' + c[2].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") + '</ul></li>';
      }).join("") + '</ol></div></div></section>';
  }

  // Tabela comparativa de planos
  function compareHTML(g) {
    if (!g.comparativo || !g.planos) return "";
    function cel(v, i) {
      var td = g.planos[i] && g.planos[i].destaque ? '<td class="is-hot">' : '<td>';
      if (v === true) return td + '<span class="yes" aria-label="Incluso">✓</span></td>';
      if (v === false) return td + '<span class="no" aria-label="Não incluso">—</span></td>';
      return td + esc(v) + '</td>';
    }
    return '<div class="compare"><h3>Compare os planos</h3><div class="compare__scroll"><table>' +
      '<thead><tr><th scope="col">Recurso</th>' + g.planos.map(function (p) { return '<th scope="col"' + (p.destaque ? ' class="is-hot"' : '') + '>' + esc(p.nome) + '</th>'; }).join("") + '</tr></thead>' +
      '<tbody>' + g.comparativo.map(function (r) {
        return '<tr><th scope="row">' + esc(r[0]) + '</th>' + r.slice(1).map(cel).join("") + '</tr>';
      }).join("") + '</tbody></table></div></div>';
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
      return '<article class="game' + (on ? "" : " game--soon") + '"' + (g.cor ? ' style="--neon:' + esc(g.cor) + '"' : '') + '>' +
        (g.slides ? '<img class="game__art" src="assets/' + esc(g.slides[0].img) + '" alt="" aria-hidden="true" />' : '') +
        '<div class="game__top"><span class="game__tag">' + esc(g.tag) + '</span>' + badge(g, true) + '</div>' +
        '<h3>Injection ' + esc(g.nome) + '</h3>' +
        '<p>' + esc(g.resumo) + '</p>' +
        (on && p ? '<p class="game__price">a partir de <strong>R$ ' + esc(p.mensal) + '</strong>' + esc(p.per) + '</p>' : '') +
        (on ? '<a class="btn btn--primary btn--block" href="jogos/' + esc(g.slug) + '.html">Ver planos</a>'
            : '<a class="btn btn--ghost btn--block" href="jogos/' + esc(g.slug) + '.html">Ver prévia</a>') +
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
    if (g && g.cor) {
      document.body.style.setProperty("--neon", g.cor);
      var tc = document.querySelector('meta[name="theme-color"]');
      if (tc) tc.setAttribute("content", "#0b0b0c");
    }
    if (!g || g.status !== "disponivel") {
      var nome = g ? g.nome : "este jogo";
      document.querySelectorAll('.nav__links a[href^="#"]').forEach(function (a) { a.remove(); });
      main.innerHTML = (g && g.slides ? stage(g.slides, { base: "../", label: "Injection " + nome + " · em breve", href: "#", link: "discord", cta: "Avise-me", titulo: "Injection " + nome, badge: badge(g) }) : "") +
        '<section class="auth auth--soon"><div class="hero__glow" aria-hidden="true"></div><div class="auth__card">' +
        '<p class="auth__prompt">Em desenvolvimento</p>' +
        '<h1>Injection ' + esc(nome) + '</h1>' +
        '<p>Estamos desenvolvendo o script para ' + esc(nome) + '. Entre no Discord para ser avisado assim que lançar.</p>' +
        '<a class="btn btn--primary btn--block" href="#" data-link="discord">Avise-me no Discord</a>' +
        '<p class="auth__alt"><a href="../index.html#jogos">Ver outros jogos</a></p></div></section>';
    } else {
      document.title = "Injection " + g.nome + " | Planos e recursos";
            main.innerHTML =
        (g.slides ? stage(g.slides, { base: "../", label: "Injection " + g.nome, href: "#planos", cta: "Assinar", titulo: "Injection " + g.nome, badge: badge(g) }) : "") +
        '<section class="section section--intro"><div class="container container--narrow intro">' +
          badge(g) + '<span class="eyebrow">Injection ' + esc(g.nome) + '</span><h2>' + esc(g.titulo) + '</h2><p class="lead">' + esc(g.descricao) + '</p>' +
          '<ul class="hero__stats">' + (g.stats || []).map(function (s) { return '<li><strong>' + esc(s[0]) + '</strong><span>' + esc(s[1]) + '</span></li>'; }).join("") + '</ul>' +
        '</div></section>' +

        demoHTML(g) +
        '<section class="section" id="recursos"><div class="container"><header class="section__head"><span class="eyebrow">Recursos</span>' +
          '<h2>O que o script faz</h2></header><div class="grid grid--3">' +
          (g.recursos || []).map(function (r) { return '<article class="card"><div class="card__icon">' + esc(r[0]) + '</div><h3>' + esc(r[1]) + '</h3><p>' + esc(r[2]) + '</p></article>'; }).join("") +
        '</div></div></section>' +

        novidadesHTML(g) +
        '<section class="pricing" id="planos"' + (g.slides ? ' style="--c:' + esc(g.slides[0].cor) + '"' : '') + '>' +
          (g.slides ? '<img class="pricing__blob" src="../assets/' + esc(g.slides[0].img) + '" alt="" aria-hidden="true" />' : '') +
          '<div class="container">' +
          '<div class="pricing__title" aria-hidden="true"><span class="pricing__word">Planos</span><span class="pricing__brand">Injection ' + esc(g.nome) + '</span></div>' +
          '<h2 class="sr-only">Planos do Injection ' + esc(g.nome) + '</h2>' +
          '<div class="grid grid--3 plans">' +
          (g.planos || []).map(function (p) {
            return '<article class="plan' + (p.destaque ? " plan--featured" : "") + '">' +
              (p.destaque ? '<span class="plan__badge">Mais popular</span>' : '') +
              '<h3>' + esc(p.nome) + '</h3>' +
              '<p class="plan__price"><span class="cur">R$</span><span class="val" data-mensal="' + esc(p.mensal) + '" data-trimestral="' + esc(p.trimestral) + '">' + esc(p.mensal) + '</span><span class="per">' + esc(p.per) + '</span></p>' +
              '<p class="plan__desc">' + esc(p.desc) + '</p>' +
              '<ul class="plan__list">' + p.itens.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join("") + '</ul>' +
              '<a class="btn btn--pill" href="#" data-checkout="' + esc(p.id) + '">Escolher plano</a></article>';
          }).join("") +
          '</div>' +
          '<div class="pricing__foot"><label class="switch"><input type="checkbox" id="billing-toggle" /><span class="switch__track" aria-hidden="true"></span><span>Trimestral <em>-15%</em></span></label>' +
          '<p class="note">Preços de exemplo. Cancele quando quiser. Pagamento por link seguro (Pix ou cartão).</p></div>' +
          compareHTML(g) +
        '</div></section>' +

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

  // Simulação do painel na demonstração
  document.querySelectorAll("[data-demo]").forEach(function (app) {
    var g = find(gameSlug) || {};
    var pool = (g.demo && g.demo.log) || [];
    var log = app.querySelector(".app__log");
    var k = {};
    app.querySelectorAll("[data-k]").forEach(function (el) { k[el.getAttribute("data-k")] = el; });
    var seg = 2 * 3600 + 14 * 60 + 37, kills = 312, bag = 40, i = 0;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function linha() {
      var t = pool[i++ % pool.length];
      if (/derrotado/i.test(t)) kills++;
      if (/Loot coletado/i.test(t)) bag = Math.min(95, bag + 3);
      var li = document.createElement("li");
      li.innerHTML = '<time>' + pad(Math.floor(seg / 3600)) + ":" + pad(Math.floor(seg / 60) % 60) + ":" + pad(seg % 60) + '</time> ' + esc(t);
      log.appendChild(li);
      while (log.children.length > 7) log.removeChild(log.firstChild);
    }
    function tick() {
      seg++;
      k.tempo.textContent = pad(Math.floor(seg / 3600)) + ":" + pad(Math.floor(seg / 60) % 60) + ":" + pad(seg % 60);
      k.kills.textContent = kills;
      k.xp.textContent = Math.round(kills * 1300 / (seg / 3600)).toLocaleString("pt-BR");
      k.bag.textContent = bag + "%";
    }
    seg -= 20;
    for (var n = 0; n < 6; n++) { seg += 3; linha(); }
    tick();
    if (!reduce) { setInterval(tick, 1000); setInterval(linha, 1600); }
  });

  // ===== Animações =====
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Entrada ao rolar (com atraso em cascata dentro de cada grupo)
  var revealSel = ".section__head, .intro, .pricing__title, .game, .card, .steps li, .plan, .faq details, .cta__inner, .pricing__foot, .demo, .news__status, .news__log > li, .compare, .dash__card";
  var revealEls = document.querySelectorAll(revealSel);
  if (!reduce && "IntersectionObserver" in window) {
    revealEls.forEach(function (el) {
      var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(revealSel); }) : [];
      el.style.setProperty("--d", (Math.max(0, sibs.indexOf(el)) * 90) + "ms");
      el.classList.add("reveal");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Parallax do palco seguindo o mouse
  document.querySelectorAll("[data-stage]").forEach(function (st) {
    if (reduce || !finePointer) return;
    st.addEventListener("pointermove", function (e) {
      var r = st.getBoundingClientRect();
      st.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      st.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    st.addEventListener("pointerleave", function () { st.style.setProperty("--mx", 0); st.style.setProperty("--my", 0); });
  });

  // Cards com inclinação 3D e reflexo de luz
  if (!reduce && finePointer) {
    document.querySelectorAll(".plan, .game, .card").forEach(function (el) {
      el.classList.add("tilt");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 8).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 10).toFixed(2) + "deg) translateY(-4px)";
        el.style.setProperty("--px", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--py", (y * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  // Menu fica mais compacto ao rolar
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("nav--scrolled", window.scrollY > 24); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Preço contando ao trocar mensal/trimestral
  function countTo(el, target) {
    var to = parseFloat(target.replace(",", "."));
    var from = parseFloat(el.textContent.replace(",", ".")) || 0;
    if (reduce || from === to) { el.textContent = target; return; }
    var t0 = performance.now(), dur = 450;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
      el.textContent = (from + (to - from) * ease).toFixed(2).replace(".", ",");
      if (k < 1) requestAnimationFrame(step); else el.textContent = target;
    })(t0);
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
  var bt = document.getElementById("billing-toggle");
  if (bt) {
    bt.addEventListener("change", function () {
      var period = bt.checked ? "trimestral" : "mensal";
      document.querySelectorAll(".plan__price .val").forEach(function (el) {
        var v = el.getAttribute("data-" + period);
        if (v) countTo(el, v);
      });
    });
  }

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
      msg.innerHTML = 'O login ainda está em construção. Fale com o suporte no Discord para receber seu acesso. <a href="#painel">Ver prévia do painel</a>';
      msg.hidden = false;
    });
  }

  // Painel do assinante (prévia com dados de exemplo)
  var painel = document.getElementById("painel");
  if (painel) {
    var authMain = document.querySelector("main.auth");
    var g0 = games.filter(function (g) { return g.status === "disponivel"; })[0] || games[0];
    var plano = (g0.planos || []).filter(function (p) { return p.destaque; })[0] || (g0.planos || [])[0] || { nome: "-" };
    var renova = new Date(Date.now() + 23 * 864e5).toISOString().slice(0, 10);
    var chave = "INJ-7F3K-Q9ZX-2M4P";
    var sc = g0.script || {};
    var outros = games.filter(function (g) { return g !== g0; });
    var montar = function () {
      painel.innerHTML =
        '<div class="container">' +
        '<div class="dash__demo" role="note">Prévia com dados de exemplo. O login real entra quando o sistema de assinaturas estiver pronto.</div>' +
        '<header class="dash__head"><div><span class="eyebrow">Área do assinante</span><h1>Olá, assinante</h1></div>' +
          '<a class="btn btn--ghost btn--sm" href="#">Sair</a></header>' +
        '<div class="dash__grid">' +
          '<article class="dash__card dash__card--sub" style="--neon:' + esc(g0.cor || "#ff2d3f") + '">' +
            (g0.slides ? '<img class="dash__art" src="assets/' + esc(g0.slides[0].img) + '" alt="" aria-hidden="true" />' : '') +
            '<small>Assinatura</small><h2>Injection ' + esc(g0.nome) + '</h2>' +
            '<p class="dash__plan">Plano ' + esc(plano.nome) + ' <span class="status status--online"><i aria-hidden="true"></i>Ativa</span></p>' +
            '<dl><div><dt>Renova em</dt><dd>' + esc(fmtData(renova)) + '</dd></div><div><dt>Contas liberadas</dt><dd>0 de ' + esc(((g0.comparativo || [])[0] || [])[2] || "2") + '</dd></div></dl>' +
            '<div class="dash__bar"><span style="width:' + Math.round((30 - 23) / 30 * 100) + '%"></span></div><p class="note">7 de 30 dias usados</p>' +
            '<a class="btn btn--ghost btn--sm" href="jogos/' + esc(g0.slug) + '.html#planos">Mudar de plano</a></article>' +
          '<article class="dash__card"><small>Chave de ativação</small>' +
            '<p class="dash__key" data-key="' + chave + '">INJ-••••-••••-' + chave.slice(-4) + '</p>' +
            '<div class="dash__actions"><button class="btn btn--ghost btn--sm" type="button" data-act="ver">Mostrar</button><button class="btn btn--pill btn--sm" type="button" data-act="copiar">Copiar</button></div>' +
            '<p class="note">Use esta chave na primeira vez que abrir o script. Não compartilhe.</p></article>' +
          '<article class="dash__card"><small>Download</small><h3>Injection ' + esc(g0.nome) + ' v' + esc(sc.versao || "") + '</h3>' + badge(g0) +
            '<p class="note">Windows 10/11 · 64 bits</p><button class="btn btn--primary btn--block" type="button" data-act="baixar">Baixar</button></article>' +
          '<article class="dash__card dash__card--wide"><small>Novidades</small><ol class="news__log news__log--mini">' +
            (g0.changelog || []).slice(0, 2).map(function (c, i) {
              return '<li' + (i === 0 ? ' class="is-new"' : '') + '><div class="news__head"><strong>v' + esc(c[0]) + '</strong><span>' + esc(fmtData(c[1])) + '</span></div><ul>' +
                c[2].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") + '</ul></li>';
            }).join("") + '</ol></article>' +
          '<article class="dash__card"><small>Suporte</small><h3>Precisa de ajuda?</h3><p>Fale com a equipe no Discord. Assinantes Pro e Max têm atendimento prioritário.</p>' +
            '<a class="btn btn--ghost btn--sm" href="#" data-link="discord">Abrir Discord</a></article>' +
          outros.map(function (g) {
            return '<article class="dash__card dash__card--soon" style="--neon:' + esc(g.cor || "#ff2d3f") + '"><small>Outros jogos</small><h3>Injection ' + esc(g.nome) + '</h3>' + badge(g, true) +
              '<a class="btn btn--ghost btn--sm" href="jogos/' + esc(g.slug) + '.html">Ver página</a></article>';
          }).join("") +
        '</div><p class="dash__toast" role="status" hidden></p></div>';
      var toast = painel.querySelector(".dash__toast");
      function aviso(t) { toast.textContent = t; toast.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(function () { toast.hidden = true; }, 3200); }
      painel.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]");
        if (!b) return;
        var key = painel.querySelector(".dash__key");
        if (b.getAttribute("data-act") === "ver") {
          var on = b.textContent === "Mostrar";
          key.textContent = on ? key.getAttribute("data-key") : "INJ-••••-••••-" + chave.slice(-4);
          b.textContent = on ? "Ocultar" : "Mostrar";
        } else if (b.getAttribute("data-act") === "copiar") {
          aviso("Na versão real, a chave é copiada aqui. Esta é só uma prévia.");
        } else if (b.getAttribute("data-act") === "baixar") {
          aviso("O download fica disponível depois do login real.");
        }
      });
      painel.querySelectorAll('[data-link="discord"]').forEach(function (a) {
        if (cfg.discord) { a.href = cfg.discord; a.target = "_blank"; a.rel = "noopener"; }
      });
    };
    var rota = function () {
      var on = location.hash === "#painel";
      if (on && !painel.innerHTML) montar();
      painel.hidden = !on;
      if (authMain) authMain.hidden = on;
      if (on) setTimeout(function () { window.scrollTo(0, 0); }, 0);
    };
    window.addEventListener("hashchange", rota);
    rota();
  }
})();

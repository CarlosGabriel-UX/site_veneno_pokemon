// Área do assinante: login por link no e-mail (Supabase) e painel com chave, plano, PCs e download.
(function () {
  var I = window.INJ || {};
  var cfg = I.cfg || window.INJECTION_CONFIG || {};
  var esc = I.esc;
  var login = document.getElementById("login");
  var painel = document.getElementById("painel");
  var form = document.getElementById("login-form");
  var msg = document.getElementById("login-msg");
  if (!login || !painel || !form) return;

  function aviso(el, html) { el.innerHTML = html; el.hidden = false; }

  // Volta do Mercado Pago
  var pg = new URLSearchParams(location.search).get("pagamento");
  var pgMsg = document.getElementById("pagamento-msg");
  var textosPg = {
    aprovado: "Pagamento aprovado! Sua chave chega no seu e-mail em instantes. Entre abaixo com o mesmo e-mail da compra para ver o painel.",
    pendente: "Pagamento em processamento. Assim que for aprovado, a chave chega no seu e-mail.",
    falhou: "O pagamento não foi aprovado. Você pode tentar de novo pela página do jogo."
  };
  if (pg && textosPg[pg]) { aviso(pgMsg, esc(textosPg[pg])); pgMsg.className = "auth__aviso auth__aviso--" + pg; }

  if (!window.supabase || !cfg.supabaseUrl) {
    form.addEventListener("submit", function (e) { e.preventDefault(); aviso(msg, "Login indisponível no momento. Fale com o suporte no Discord."); });
    return;
  }
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true } });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { aviso(msg, "Confira o e-mail."); form.email.focus(); return; }
    var btn = form.querySelector("button");
    btn.disabled = true; btn.textContent = "Enviando…";
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } }).then(function (r) {
      btn.disabled = false; btn.textContent = "Enviar link de acesso";
      if (r.error) {
        var t = /rate|seconds/i.test(r.error.message) ? "Você pediu muitos links seguidos. Espere um minuto e tente de novo." : "Não foi possível enviar o link. Tente de novo.";
        aviso(msg, esc(t));
        return;
      }
      try { localStorage.setItem("inj_email", email); } catch (e2) { /* sem storage */ }
      aviso(msg, "Pronto! Enviamos um link para <b>" + esc(email) + "</b>. Abra o e-mail e clique no link para entrar. Confira também o spam.");
    });
  });

  // ----- Painel -----
  var NOMES = { semanal: "Semanal", pro: "Pro", max: "Max", vitalicio: "Vitalício" };
  var g0 = (I.games || []).filter(function (g) { return g.status === "disponivel"; })[0] || {};
  var licencas = [];
  var sessao = null;

  function dataBR(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR") : "Sem vencimento"; }
  function diasRest(iso) { return iso ? Math.ceil((new Date(iso) - Date.now()) / 864e5) : null; }
  function mascara(k) { return k.replace(/-[A-Z0-9]{4}-[A-Z0-9]{4}-/, "-••••-••••-"); }

  function statusLic(l) {
    if (l.revoked) return '<span class="status status--offline"><i aria-hidden="true"></i>Cancelada</span>';
    if (!l.ativa) return '<span class="status status--offline"><i aria-hidden="true"></i>Vencida</span>';
    var d = diasRest(l.expires_at);
    if (d !== null && d <= 3) return '<span class="status status--manutencao"><i aria-hidden="true"></i>Vence em ' + d + (d === 1 ? " dia" : " dias") + '</span>';
    return '<span class="status status--online"><i aria-hidden="true"></i>Ativa</span>';
  }

  function cardLicenca(l, i) {
    var d = diasRest(l.expires_at);
    var total = l.plan === "semanal" ? 7 : 30;
    var pct = d === null ? 100 : Math.max(0, Math.min(100, Math.round(d / Math.max(total, d) * 100)));
    var pcs = l.pcs || [];
    return '<article class="dash__card dash__card--sub" style="--neon:' + esc(g0.cor || "#ff2d3f") + '">' +
      (g0.slides ? '<img class="dash__art" src="assets/' + esc(g0.slides[0].img) + '" alt="" aria-hidden="true" />' : '') +
      '<small>Assinatura</small><h2>Injection ' + esc(g0.nome || "") + '</h2>' +
      '<p class="dash__plan">Plano ' + esc(NOMES[l.plan] || l.plan) + ' ' + statusLic(l) + '</p>' +
      '<dl><div><dt>' + (l.ativa ? "Válida até" : "Venceu em") + '</dt><dd>' + esc(dataBR(l.expires_at)) + '</dd></div>' +
        '<div><dt>PCs em uso</dt><dd>' + pcs.length + ' de ' + l.max_machines + '</dd></div></dl>' +
      (l.expires_at && l.ativa ? '<div class="dash__bar"><span style="width:' + pct + '%"></span></div><p class="note">' + (d === 1 ? "Falta 1 dia" : "Faltam " + d + " dias") + '</p>' : '') +
      '<a class="btn btn--ghost btn--sm" href="jogos/' + esc(g0.slug || "optpokemon") + '.html#planos">' + (l.plan === "vitalicio" ? "Ver planos" : "Renovar") + '</a>' +
    '</article>' +
    '<article class="dash__card"><small>Chave de ativação</small>' +
      '<p class="dash__key" data-i="' + i + '">' + esc(mascara(l.key)) + '</p>' +
      '<div class="dash__actions"><button class="btn btn--ghost btn--sm" type="button" data-act="ver" data-i="' + i + '">Mostrar</button>' +
      '<button class="btn btn--pill btn--sm" type="button" data-act="copiar" data-i="' + i + '">Copiar</button></div>' +
      '<p class="note">Cole esta chave no script na primeira vez que abrir. Não compartilhe.</p>' +
      (pcs.length ? '<ul class="dash__pcs">' + pcs.map(function (p) {
        return '<li><span><b>PC ' + esc(p.machine.slice(0, 6).toUpperCase()) + '</b><small>usado ' + esc(I.haQuanto(String(p.last_seen).slice(0, 10)) || "") + (p.version ? " · v" + esc(p.version) : "") + '</small></span>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-act="liberar" data-i="' + i + '" data-m="' + esc(p.machine) + '">Liberar</button></li>';
      }).join("") + '</ul>' : '<p class="note">Nenhum PC ativado ainda.</p>') +
    '</article>';
  }

  function montar() {
    var email = sessao.user.email;
    var ativa = licencas.some(function (l) { return l.ativa; });
    var sc = g0.script || {};
    var corpo;
    if (!licencas.length) {
      corpo = '<article class="dash__card dash__card--wide"><small>Assinatura</small><h3>Nenhuma assinatura neste e-mail</h3>' +
        '<p>Se você comprou com outro e-mail, saia e entre com ele. Se ainda não assinou, escolha um plano.</p>' +
        '<a class="btn btn--primary btn--sm" href="jogos/' + esc(g0.slug || "optpokemon") + '.html#planos">Ver planos</a></article>';
    } else {
      corpo = licencas.map(cardLicenca).join("");
    }
    painel.innerHTML =
      '<div class="container">' +
      '<header class="dash__head"><div><span class="eyebrow">Área do assinante</span><h1>Olá!</h1><p class="note">' + esc(email) + '</p></div>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-act="sair">Sair</button></header>' +
      '<div class="dash__grid">' + corpo +
        '<article class="dash__card"><small>Download</small><h3>Injection ' + esc(g0.nome || "") + (sc.versao ? ' v' + esc(sc.versao) : '') + '</h3>' + (I.badge ? I.badge(g0) : '') +
          '<p class="note">Windows 10/11 · 64 bits</p>' +
          '<button class="btn btn--primary btn--block" type="button" data-act="baixar"' + (ativa ? '' : ' disabled') + '>Baixar</button>' +
          (ativa ? '' : '<p class="note">O download libera com um plano ativo.</p>') + '</article>' +
        '<article class="dash__card dash__card--wide"><small>Novidades</small><ol class="news__log news__log--mini">' +
          (g0.changelog || []).slice(0, 2).map(function (c, i) {
            return '<li' + (i === 0 ? ' class="is-new"' : '') + '><div class="news__head"><strong>v' + esc(c[0]) + '</strong><span>' + esc(I.fmtData(c[1])) + '</span></div><ul>' +
              c[2].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") + '</ul></li>';
          }).join("") + '</ol></article>' +
        '<article class="dash__card"><small>Suporte</small><h3>Precisa de ajuda?</h3><p>Fale com a equipe no Discord. Assinantes Pro e Max têm atendimento prioritário.</p>' +
          '<a class="btn btn--ghost btn--sm" href="' + esc(cfg.discord || "#") + '" target="_blank" rel="noopener">Abrir Discord</a></article>' +
      '</div><p class="dash__toast" role="status" hidden></p></div>';
  }

  function toast(t) {
    var el = painel.querySelector(".dash__toast");
    if (!el) return;
    el.textContent = t; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 3500);
  }

  function carregar() {
    return sb.rpc("minhas_licencas").then(function (r) {
      if (r.error) { painel.innerHTML = '<div class="container"><p class="auth__msg">Não foi possível carregar sua assinatura. Atualize a página.</p></div>'; return; }
      licencas = r.data || [];
      montar();
    });
  }

  function mostrar(s) {
    sessao = s;
    login.hidden = !!s;
    painel.hidden = !s;
    if (s) {
      painel.innerHTML = '<div class="container"><p class="note">Carregando sua assinatura…</p></div>';
      carregar();
      if (location.hash && /access_token|error/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    }
  }

  painel.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    var l = licencas[+b.getAttribute("data-i")];
    if (act === "sair") { sb.auth.signOut(); return; }
    if (act === "ver") {
      var p = painel.querySelector('.dash__key[data-i="' + b.getAttribute("data-i") + '"]');
      var on = b.textContent === "Mostrar";
      p.textContent = on ? l.key : mascara(l.key);
      b.textContent = on ? "Ocultar" : "Mostrar";
    } else if (act === "copiar") {
      (navigator.clipboard ? navigator.clipboard.writeText(l.key) : Promise.reject()).then(
        function () { toast("Chave copiada."); },
        function () { toast("Não deu para copiar. Clique em Mostrar e copie à mão."); });
    } else if (act === "liberar") {
      b.disabled = true;
      sb.rpc("liberar_pc", { p_key: l.key, p_machine: b.getAttribute("data-m") }).then(function (r) {
        if (r.error || !r.data) { b.disabled = false; toast("Não foi possível liberar o PC. Tente de novo."); return; }
        toast("PC liberado. A chave pode ser ativada em outro computador.");
        carregar();
      });
    } else if (act === "baixar") {
      b.disabled = true; b.textContent = "Preparando…";
      fetch(cfg.supabaseUrl + "/functions/v1/download", {
        method: "POST",
        headers: { Authorization: "Bearer " + sessao.access_token, apikey: cfg.supabaseKey }
      }).then(function (r) { return r.json(); }).then(function (res) {
        b.disabled = false; b.textContent = "Baixar";
        if (res.ok && res.url) window.location.href = res.url;
        else toast(res.message || "Não foi possível baixar. Tente de novo.");
      }).catch(function () { b.disabled = false; b.textContent = "Baixar"; toast("Sem conexão com o servidor."); });
    }
  });

  // Link do e-mail com erro (expirado ou já usado)
  if (/error_description=/.test(location.hash)) {
    aviso(msg, "Esse link de acesso expirou ou já foi usado. Peça um novo abaixo.");
    history.replaceState(null, "", location.pathname + location.search);
  }
  try { var salvo = localStorage.getItem("inj_email"); if (salvo) form.email.value = salvo; } catch (e) { /* sem storage */ }

  var iniciado = false;
  sb.auth.onAuthStateChange(function (ev, s) {
    if (ev === "SIGNED_OUT") { iniciado = true; mostrar(null); }
    else if (!iniciado || ((ev === "SIGNED_IN" || ev === "INITIAL_SESSION") && s && (!sessao || sessao.user.id !== s.user.id))) { iniciado = true; mostrar(s); }
    else if (s) sessao = s;
  });
})();

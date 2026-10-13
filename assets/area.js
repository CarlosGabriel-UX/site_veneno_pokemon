// Área do assinante: login com e-mail e senha (ou link no e-mail), redefinição de senha (Supabase)
// e painel com chave, plano, PCs e download.
(function () {
  var I = window.INJ || {};
  var cfg = I.cfg || window.NOCTIS_CONFIG || {};
  var esc = I.esc;
  var login = document.getElementById("login");
  var painel = document.getElementById("painel");
  if (!login || !painel) return;

  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var AQUI = location.origin + location.pathname;
  // Link de "redefinir senha" do e-mail: abre direto o formulário de nova senha
  var recuperando = /type=recovery/.test(location.hash);
  var hashErro = /error_description=/.test(location.hash);

  function aviso(el, html) { el.innerHTML = html; el.hidden = false; }
  function msgDe(form) { return form.querySelector(".auth__msg"); }
  function ocupado(form, sim, texto) {
    var b = form.querySelector("button[type=submit]");
    if (sim) { b.dataset.txt = b.textContent; b.textContent = texto; } else if (b.dataset.txt) b.textContent = b.dataset.txt;
    b.disabled = sim;
  }
  function lembrar(email) { try { localStorage.setItem("inj_email", email); } catch (e) { /* sem storage */ } }

  var modoAtual = "entrar";
  function modo(m) {
    modoAtual = m;
    login.querySelectorAll(".auth__modo").forEach(function (d) { d.hidden = d.getAttribute("data-modo") !== m; });
    login.querySelectorAll(".auth__msg").forEach(function (el) { el.hidden = true; });
    var f = login.querySelector('[data-modo="' + m + '"] input');
    if (f && document.activeElement && document.activeElement.closest && document.activeElement.closest(".auth")) f.focus();
  }

  // Volta do Mercado Pago
  var pg = new URLSearchParams(location.search).get("pagamento");
  var pgMsg = document.getElementById("pagamento-msg");
  var textosPg = {
    aprovado: "Pagamento aprovado! Sua chave chega no seu e-mail em instantes. Entre abaixo com o mesmo e-mail da compra para ver o painel.",
    pendente: "Pagamento em processamento. Assim que for aprovado, a chave chega no seu e-mail.",
    falhou: "O pagamento não foi aprovado. Você pode tentar de novo pela página do jogo."
  };
  if (pg && textosPg[pg]) { aviso(pgMsg, esc(textosPg[pg])); pgMsg.className = "auth__aviso auth__aviso--" + pg; }

  var forms = {};
  ["entrar", "criar", "esqueci", "link", "nova"].forEach(function (k) { forms[k] = document.getElementById("form-" + k); });

  if (!window.supabase || !cfg.supabaseUrl) {
    Object.keys(forms).forEach(function (k) {
      forms[k].addEventListener("submit", function (e) { e.preventDefault(); aviso(msgDe(forms[k]), "Login indisponível no momento. Fale com o suporte no Discord."); });
    });
    return;
  }
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true } });

  function erroTexto(err, padrao) {
    var m = (err && err.message) || "";
    if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos. Se nunca criou senha, use \u201cEsqueci minha senha\u201d para criar uma.";
    if (/email not confirmed/i.test(m)) return "Confirme seu e-mail primeiro: abra o link que enviamos (confira o spam).";
    if (/rate|seconds|too many/i.test(m)) return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
    if (/same.*password|different from the old/i.test(m)) return "A nova senha precisa ser diferente da atual.";
    if (/weak|at least|characters/i.test(m)) return "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.";
    return padrao;
  }
  function pegaEmail(form) {
    var email = form.email.value.trim();
    if (!EMAIL_RE.test(email)) { aviso(msgDe(form), "Confira o e-mail."); form.email.focus(); return null; }
    return email;
  }
  function pegaSenhas(form) {
    var s1 = form.senha.value, s2 = form.senha2.value;
    if (s1.length < 8) { aviso(msgDe(form), "A senha precisa ter pelo menos 8 caracteres."); form.senha.focus(); return null; }
    if (s1 !== s2) { aviso(msgDe(form), "As senhas não são iguais."); form.senha2.focus(); return null; }
    return s1;
  }

  login.addEventListener("click", function (e) {
    var a = e.target.closest("[data-ir]");
    if (!a) return;
    e.preventDefault();
    var m = a.getAttribute("data-ir");
    if (m === "painel") { recuperando = false; mostrar(sessao); return; }
    var de = forms[modoAtual], para = forms[m];
    if (de && para && de.email && para.email && de.email.value && !para.email.value) para.email.value = de.email.value;
    modo(m);
  });

  forms.entrar.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = forms.entrar, email = pegaEmail(f);
    if (!email) return;
    if (!f.senha.value) { aviso(msgDe(f), "Digite sua senha."); f.senha.focus(); return; }
    ocupado(f, true, "Entrando…");
    sb.auth.signInWithPassword({ email: email, password: f.senha.value }).then(function (r) {
      ocupado(f, false);
      if (r.error) { aviso(msgDe(f), esc(erroTexto(r.error, "Não foi possível entrar. Tente de novo."))); return; }
      lembrar(email); f.senha.value = "";
    });
  });

  forms.criar.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = forms.criar, email = pegaEmail(f);
    if (!email) return;
    var senha = pegaSenhas(f);
    if (!senha) return;
    ocupado(f, true, "Criando…");
    sb.auth.signUp({ email: email, password: senha, options: { emailRedirectTo: AQUI } }).then(function (r) {
      ocupado(f, false);
      if (r.error) { aviso(msgDe(f), esc(erroTexto(r.error, "Não foi possível criar o acesso. Tente de novo."))); return; }
      lembrar(email); f.senha.value = f.senha2.value = "";
      if (r.data && r.data.session) return; // confirmação de e-mail desligada: já entrou
      // Supabase não diz se o e-mail já tinha conta (identities vazio): orienta para os dois casos
      var jaExiste = r.data && r.data.user && r.data.user.identities && !r.data.user.identities.length;
      aviso(msgDe(f), jaExiste
        ? "Esse e-mail já tem acesso. Entre com sua senha ou use <a href=\"#\" data-ir=\"esqueci\">Esqueci minha senha</a> para criar uma nova."
        : "Quase lá! Enviamos um e-mail para <b>" + esc(email) + "</b>. Clique no link para confirmar e entrar. Confira também o spam.");
    });
  });

  forms.esqueci.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = forms.esqueci, email = pegaEmail(f);
    if (!email) return;
    ocupado(f, true, "Enviando…");
    sb.auth.resetPasswordForEmail(email, { redirectTo: AQUI }).then(function (r) {
      ocupado(f, false);
      if (r.error) { aviso(msgDe(f), esc(erroTexto(r.error, "Não foi possível enviar o link. Tente de novo."))); return; }
      lembrar(email);
      aviso(msgDe(f), "Se existir um acesso com <b>" + esc(email) + "</b>, o link para criar uma senha nova chega em instantes. Confira também o spam.");
    });
  });

  forms.link.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = forms.link, email = pegaEmail(f);
    if (!email) return;
    ocupado(f, true, "Enviando…");
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: AQUI } }).then(function (r) {
      ocupado(f, false);
      if (r.error) { aviso(msgDe(f), esc(erroTexto(r.error, "Não foi possível enviar o link. Tente de novo."))); return; }
      lembrar(email);
      aviso(msgDe(f), "Pronto! Enviamos um link para <b>" + esc(email) + "</b>. Abra o e-mail e clique no link para entrar. Confira também o spam.");
    });
  });

  forms.nova.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = forms.nova, senha = pegaSenhas(f);
    if (!senha) return;
    if (!sessao) { aviso(msgDe(f), "O link expirou. Peça um novo em \u201cEsqueci minha senha\u201d."); return; }
    ocupado(f, true, "Salvando…");
    sb.auth.updateUser({ password: senha }).then(function (r) {
      ocupado(f, false);
      if (r.error) { aviso(msgDe(f), esc(erroTexto(r.error, "Não foi possível salvar a senha. Tente de novo."))); return; }
      f.senha.value = f.senha2.value = "";
      recuperando = false;
      mostrar(sessao).then(function () { toast("Senha salva. Da próxima vez, entre com e-mail e senha."); });
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
    return '<article class="dash__card dash__card--sub" style="--neon:' + esc(g0.cor || "#dfe6ff") + '">' +
      (g0.slides ? '<img class="dash__art" src="assets/' + esc(g0.slides[0].img) + '" alt="" aria-hidden="true" />' : '') +
      '<small>Assinatura</small><h2>Noctis ' + esc(g0.nome || "") + '</h2>' +
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
        '<div class="dash__actions"><button class="btn btn--ghost btn--sm" type="button" data-act="senha">Alterar senha</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-act="sair">Sair</button></div></header>' +
      '<div class="dash__grid">' + corpo +
        '<article class="dash__card"><small>Download</small><h3>Noctis ' + esc(g0.nome || "") + (sc.versao ? ' v' + esc(sc.versao) : '') + '</h3>' + (I.badge ? I.badge(g0) : '') +
          '<p class="note">Windows 10/11 · 64 bits</p>' +
          '<button class="btn btn--primary btn--block" type="button" data-act="baixar"' + (ativa ? '' : ' disabled') + '>Baixar</button>' +
          (ativa ? '' : '<p class="note">O download libera com um plano ativo.</p>') + '</article>' +
        '<article class="dash__card dash__card--guia"><small>Como funciona</small><h3>Guia do painel</h3>' + guia(GUIA_ASSINANTE) + '</article>' +
      '</div><p class="dash__toast" role="status" hidden></p></div>';
  }

  // Guia do painel: o que cada parte faz
  var GUIA_ASSINANTE = [
    ["Assinatura", "Mostra seu plano, se ele está ativo e até quando vale. A barra conta os dias que faltam. \u201cRenovar\u201d leva para os planos; ao pagar de novo com o mesmo e-mail, os dias são somados à mesma chave."],
    ["Chave de ativação", "\u201cMostrar\u201d revela a chave completa e \u201cCopiar\u201d copia para colar no script na primeira vez que abrir. A chave é pessoal: cada plano aceita um número limitado de PCs."],
    ["PCs em uso", "Lista os computadores que já ativaram sua chave. Trocou de PC ou chegou no limite? Clique em \u201cLiberar\u201d no PC antigo e ative no novo."],
    ["Download", "Baixa a versão mais recente do script. O botão só funciona com um plano ativo e o link vale por poucos minutos."],
    ["Alterar senha", "Troca a senha que você usa para entrar. Esqueceu a senha? Na tela de login use \u201cEsqueci minha senha\u201d."],
    ["Sair", "Encerra o acesso neste navegador. Use sempre em computadores que não são seus."]
  ];
  function guia(itens) {
    return '<dl class="dash__guia">' + itens.map(function (i) { return '<div><dt>' + esc(i[0]) + '</dt><dd>' + esc(i[1]) + '</dd></div>'; }).join("") + '</dl>';
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
      // Admins ganham um atalho para o painel de admin
      sb.rpc("is_admin").then(function (a) {
        var box = painel.querySelector(".dash__head .dash__actions");
        if (a.data === true && box && !box.querySelector(".js-admin")) box.insertAdjacentHTML("afterbegin", '<a class="btn btn--primary btn--sm js-admin" href="admin.html">Painel de admin</a>');
      });
    });
  }

  function mostrar(s) {
    sessao = s;
    if (location.hash && /access_token|error/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    if (s && recuperando) { login.hidden = false; painel.hidden = true; modo("nova"); window.scrollTo(0, 0); return; }
    login.hidden = !!s;
    painel.hidden = !s;
    if (!s) { if (modoAtual === "nova") modo("entrar"); return; }
    painel.innerHTML = '<div class="container"><p class="note">Carregando sua assinatura…</p></div>';
    return carregar();
  }

  painel.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    var l = licencas[+b.getAttribute("data-i")];
    if (act === "sair") { sb.auth.signOut(); return; }
    if (act === "senha") { recuperando = true; mostrar(sessao); return; }
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
  if (hashErro) {
    modo(/type=recovery/.test(location.hash) ? "esqueci" : "entrar");
    aviso(msgDe(forms[modoAtual]), "Esse link expirou ou já foi usado. Peça um novo.");
    history.replaceState(null, "", location.pathname + location.search);
  }
  try {
    var salvo = localStorage.getItem("inj_email");
    if (salvo) ["entrar", "criar", "esqueci", "link"].forEach(function (k) { forms[k].email.value = salvo; });
  } catch (e) { /* sem storage */ }

  var iniciado = false;
  sb.auth.onAuthStateChange(function (ev, s) {
    if (ev === "PASSWORD_RECOVERY") { recuperando = true; iniciado = true; mostrar(s); }
    else if (ev === "SIGNED_OUT") { iniciado = true; mostrar(null); }
    else if (!iniciado || ((ev === "SIGNED_IN" || ev === "INITIAL_SESSION") && s && (!sessao || sessao.user.id !== s.user.id))) { iniciado = true; mostrar(s); }
    else if (s) sessao = s;
  });
})();

// Painel de admin: resumo, gerar chave, lista de chaves (editar, renovar, bloquear, liberar PCs) e vendas.
// Tudo passa por funções admin_* do Supabase, que conferem se o e-mail logado está na tabela admins.
(function () {
  var I = window.INJ || {};
  var cfg = I.cfg || window.NOCTIS_CONFIG || {};
  var esc = I.esc || function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); };
  var login = document.getElementById("login");
  var painel = document.getElementById("painel");
  var fLogin = document.getElementById("form-admin");
  var fNova = document.getElementById("form-nova");
  var dlg = document.getElementById("dlg-chave");
  var fEd = document.getElementById("form-editar");
  if (!login || !painel || !window.supabase || !cfg.supabaseUrl) return;

  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: false } });
  var NOMES = { semanal: "Semanal", pro: "Pro", max: "Max", vitalicio: "Vitalício" };
  var sessao = null, licencas = [], filtro = "todas", atual = null;

  function aviso(el, html) { el.innerHTML = html; el.hidden = false; }
  function dataBR(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—"; }
  function dataHora(iso) { return iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"; }
  function reais(v) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function dias(iso) { return iso ? Math.ceil((new Date(iso) - Date.now()) / 864e5) : null; }
  function erro(r) { var m = r && r.error && r.error.message || ""; return /restrito/i.test(m) ? "Sua conta não é admin." : (m || "Algo deu errado. Tente de novo."); }
  function toast(t) {
    var el = painel.querySelector(".dash__toast");
    el.textContent = t; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 3500);
  }
  function copiar(t) {
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      function () { toast("Copiado: " + t); }, function () { toast("Não deu para copiar."); });
  }

  function estado(l) {
    if (l.revoked) return "bloqueada";
    if (!l.ativa) return "vencida";
    var d = dias(l.expires_at);
    return d !== null && d <= 7 ? "vencendo" : "ativa";
  }
  function selo(l) {
    var e = estado(l), d = dias(l.expires_at);
    var t = { ativa: "Ativa", vencendo: "Vence em " + d + (d === 1 ? " dia" : " dias"), vencida: "Vencida", bloqueada: "Bloqueada" }[e];
    var c = { ativa: "online", vencendo: "manutencao", vencida: "offline", bloqueada: "offline" }[e];
    return '<span class="status status--' + c + '"><i aria-hidden="true"></i>' + esc(t) + '</span>';
  }

  // ----- Login -----
  fLogin.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = fLogin.querySelector(".auth__msg"), b = fLogin.querySelector("button");
    b.disabled = true; b.textContent = "Entrando…";
    sb.auth.signInWithPassword({ email: fLogin.email.value.trim(), password: fLogin.senha.value }).then(function (r) {
      b.disabled = false; b.textContent = "Entrar";
      if (r.error) aviso(msg, /invalid/i.test(r.error.message) ? "E-mail ou senha incorretos." : esc(r.error.message));
      else fLogin.senha.value = "";
    });
  });

  function mostrar(s) {
    sessao = s;
    if (!s) { login.hidden = false; painel.hidden = true; return; }
    sb.rpc("is_admin").then(function (r) {
      if (r.error || !r.data) {
        login.hidden = false; painel.hidden = true;
        aviso(fLogin.querySelector(".auth__msg"), "A conta <b>" + esc(s.user.email) + "</b> não é admin. <a href=\"#\" data-sair>Sair e entrar com outra</a>.");
        return;
      }
      login.hidden = true; painel.hidden = false;
      painel.querySelector(".adm__quem").textContent = s.user.email;
      carregarTudo();
    });
  }
  login.addEventListener("click", function (e) { if (e.target.closest("[data-sair]")) { e.preventDefault(); sb.auth.signOut(); } });

  // ----- Dados -----
  function carregarTudo() { carregarResumo(); carregarLista(); carregarVendas(); }

  function carregarResumo() {
    sb.rpc("admin_resumo").then(function (r) {
      var el = document.getElementById("resumo");
      if (r.error) { el.innerHTML = '<p class="auth__msg">' + esc(erro(r)) + '</p>'; return; }
      var d = r.data;
      var itens = [["Chaves ativas", d.ativas], ["Vencem em 7 dias", d.vencendo], ["Vencidas", d.vencidas], ["PCs conectados", d.pcs],
        ["Vendas no mês", d.vendas_mes], ["Receita no mês", reais(d.receita_mes)], ["Receita total", reais(d.receita_total)]];
      el.innerHTML = itens.map(function (i) { return '<div class="adm__stat"><span>' + esc(i[0]) + '</span><strong>' + esc(i[1]) + '</strong></div>'; }).join("");
    });
  }

  var buscaT;
  function carregarLista() {
    var q = document.getElementById("busca").value.trim();
    return sb.rpc("admin_licencas", { p_busca: q || null }).then(function (r) {
      if (r.error) { document.getElementById("chaves").innerHTML = '<p class="auth__msg">' + esc(erro(r)) + '</p>'; return; }
      licencas = r.data || [];
      desenharLista();
    });
  }

  function desenharLista() {
    var lista = licencas.filter(function (l) {
      var e = estado(l);
      return filtro === "todas" || (filtro === "ativas" && (e === "ativa" || e === "vencendo")) ||
        (filtro === "vencendo" && e === "vencendo") || (filtro === "vencidas" && e === "vencida") || (filtro === "bloqueadas" && e === "bloqueada");
    });
    document.getElementById("lista-titulo").textContent = lista.length + (lista.length === 1 ? " chave" : " chaves");
    var el = document.getElementById("chaves");
    if (!lista.length) { el.innerHTML = '<p class="note">Nenhuma chave encontrada.</p>'; return; }
    el.innerHTML = '<table><thead><tr><th>Chave</th><th>Cliente</th><th>Plano</th><th>Validade</th><th>PCs</th><th></th></tr></thead><tbody>' +
      lista.map(function (l) {
        var i = licencas.indexOf(l);
        return '<tr' + (l.revoked ? ' class="is-off"' : '') + '>' +
          '<td data-l="Chave"><button type="button" class="adm__key" data-act="copiar" data-i="' + i + '" title="Copiar">' + esc(l.key) + '</button></td>' +
          '<td data-l="Cliente">' + (l.email ? esc(l.email) : '<span class="adm__mut">sem e-mail</span>') + (l.note ? '<small>' + esc(l.note) + '</small>' : '') + '</td>' +
          '<td data-l="Plano">' + esc(NOMES[l.plan] || l.plan) + '<small>' + selo(l) + '</small></td>' +
          '<td data-l="Validade">' + (l.expires_at ? esc(dataBR(l.expires_at)) : 'Sem vencimento') + '</td>' +
          '<td data-l="PCs">' + l.pcs.length + ' / ' + l.max_machines + '</td>' +
          '<td><button type="button" class="btn btn--ghost btn--sm" data-act="editar" data-i="' + i + '">Gerenciar</button></td></tr>';
      }).join("") + '</tbody></table>';
  }

  function carregarVendas() {
    sb.rpc("admin_vendas").then(function (r) {
      var el = document.getElementById("vendas");
      if (r.error) { el.innerHTML = '<p class="auth__msg">' + esc(erro(r)) + '</p>'; return; }
      var v = r.data || [];
      if (!v.length) { el.innerHTML = '<p class="note">Nenhuma venda ainda. Elas aparecem aqui assim que o Mercado Pago aprovar um pagamento.</p>'; return; }
      el.innerHTML = '<table><thead><tr><th>Data</th><th>Cliente</th><th>Plano</th><th>Valor</th><th>Chave</th><th>E-mail</th></tr></thead><tbody>' +
        v.map(function (p) {
          return '<tr><td data-l="Data">' + esc(dataHora(p.created_at)) + '</td><td data-l="Cliente">' + esc(p.email) + '</td>' +
            '<td data-l="Plano">' + esc(NOMES[p.plan] || p.plan) + ' · ' + p.dias + ' dias</td><td data-l="Valor">' + esc(reais(p.valor)) + '</td>' +
            '<td data-l="Chave">' + (p.key ? '<button type="button" class="adm__key" data-copiar="' + esc(p.key) + '">' + esc(p.key) + '</button>' + (p.chave_nova ? '<small>nova</small>' : '<small>renovação</small>') : '—') + '</td>' +
            '<td data-l="E-mail">' + (p.email_enviado ? 'Enviado' : '<span class="adm__mut">Não enviado</span>') + '</td></tr>';
        }).join("") + '</tbody></table>';
    });
  }

  // ----- Gerar chave -----
  fNova.addEventListener("submit", function (e) {
    e.preventDefault();
    var b = fNova.querySelector("button[type=submit]"), out = painel.querySelector(".adm__gerada");
    var email = fNova.email.value.trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { aviso(out, '<p class="auth__msg">Confira o e-mail.</p>'); return; }
    b.disabled = true; b.textContent = "Gerando…";
    sb.rpc("admin_criar_chave", {
      p_plan: fNova.plan.value, p_email: email || null,
      p_dias: fNova.dias.value ? +fNova.dias.value : null, p_pcs: fNova.pcs.value ? +fNova.pcs.value : null,
      p_note: fNova.note.value.trim() || null
    }).then(function (r) {
      b.disabled = false; b.textContent = "Gerar chave";
      if (r.error) { aviso(out, '<p class="auth__msg">' + esc(erro(r)) + '</p>'); return; }
      aviso(out, '<p class="note">Chave criada' + (email ? ' para ' + esc(email) : '') + ':</p><button type="button" class="dash__key adm__key" data-copiar="' + esc(r.data) + '">' + esc(r.data) + '</button><p class="note">Clique para copiar.</p>');
      fNova.email.value = fNova.dias.value = fNova.pcs.value = fNova.note.value = "";
      carregarResumo(); carregarLista();
    });
  });

  // ----- Editar / renovar / bloquear / liberar PCs -----
  function abrir(l) {
    atual = l;
    dlg.querySelector(".adm__dlgkey").textContent = l.key;
    fEd.plan.value = l.plan; fEd.pcs.value = l.max_machines; fEd.email.value = l.email || ""; fEd.note.value = l.note || ""; fEd.dias.value = "";
    fEd.querySelectorAll("[data-dias]").forEach(function (x) { x.classList.remove("is-on"); });
    fEd.querySelector("[data-acao=bloquear]").textContent = l.revoked ? "Desbloquear" : "Bloquear";
    fEd.querySelector(".checkout__msg").hidden = true;
    var pcs = l.pcs || [];
    fEd.querySelector(".adm__pcsdlg").innerHTML = '<span>PCs conectados (' + pcs.length + ')</span>' + (pcs.length
      ? '<ul class="dash__pcs">' + pcs.map(function (p) {
          return '<li><span><b>PC ' + esc(p.machine.slice(0, 8).toUpperCase()) + '</b><small>visto ' + esc(dataHora(p.last_seen)) + (p.version ? ' · v' + esc(p.version) : '') + '</small></span>' +
            '<button type="button" class="btn btn--ghost btn--sm" data-liberar="' + esc(p.machine) + '">Liberar</button></li>';
        }).join("") + '</ul>'
      : '<p class="note">Nenhum PC ativado.</p>');
    dlg.showModal();
  }
  function msgDlg(t) { aviso(fEd.querySelector(".checkout__msg"), esc(t)); }
  function depois(t) { toast(t); carregarResumo(); return carregarLista().then(function () {
    var n = licencas.filter(function (x) { return x.key === atual.key; })[0];
    if (n && dlg.open) abrir(n);
  }); }

  fEd.addEventListener("click", function (e) {
    var d = e.target.closest("[data-dias]");
    if (d) {
      var on = !d.classList.contains("is-on");
      fEd.querySelectorAll("[data-dias]").forEach(function (x) { x.classList.remove("is-on"); });
      if (on) d.classList.add("is-on");
      fEd.dias.value = on ? d.getAttribute("data-dias") : "";
      return;
    }
    if (e.target.closest("[data-acao=bloquear]")) {
      var bloquear = !atual.revoked;
      if (bloquear && !confirm("Bloquear a chave " + atual.key + "? O script para de funcionar para esse cliente.")) return;
      sb.rpc("admin_editar", { p_key: atual.key, p_email: atual.email, p_max_machines: atual.max_machines, p_note: atual.note, p_revoked: bloquear, p_plan: null })
        .then(function (r) { if (r.error) msgDlg(erro(r)); else depois(bloquear ? "Chave bloqueada." : "Chave desbloqueada."); });
      return;
    }
    var lib = e.target.closest("[data-liberar]");
    if (lib) {
      lib.disabled = true;
      sb.rpc("admin_liberar_pc", { p_key: atual.key, p_machine: lib.getAttribute("data-liberar") }).then(function (r) {
        if (r.error) { lib.disabled = false; msgDlg(/could not find|does not exist/i.test(r.error.message) ? "Liberar PC ainda não está ativo no servidor." : erro(r)); return; }
        depois("PC liberado.");
      });
    }
  });
  fEd.dias.addEventListener("input", function () { fEd.querySelectorAll("[data-dias]").forEach(function (x) { x.classList.remove("is-on"); }); });

  fEd.addEventListener("submit", function (e) {
    if (e.submitter && e.submitter.value === "fechar") return;
    e.preventDefault();
    var email = fEd.email.value.trim(), pcs = +fEd.pcs.value, nd = fEd.dias.value ? +fEd.dias.value : 0;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msgDlg("Confira o e-mail."); return; }
    if (!(pcs >= 1 && pcs <= 50)) { msgDlg("PCs precisa ser entre 1 e 50."); return; }
    if (fEd.dias.value && !(nd >= 1 && nd <= 3650)) { msgDlg("Dias precisa ser entre 1 e 3650."); return; }
    if (!atual.expires_at && fEd.plan.value !== "vitalicio" && !nd) { msgDlg("Essa chave não tem vencimento. Escolha quantos dias ela vai ter."); return; }
    var b = fEd.querySelector("[value=salvar]"); b.disabled = true;
    sb.rpc("admin_editar", { p_key: atual.key, p_email: email || null, p_max_machines: pcs, p_note: fEd.note.value.trim() || null, p_revoked: null,
      p_plan: fEd.plan.value !== atual.plan ? fEd.plan.value : null })
      .then(function (r) {
        if (r.error || !nd || fEd.plan.value === "vitalicio") return r;
        return sb.rpc("admin_renovar", { p_key: atual.key, p_dias: nd });
      })
      .then(function (r) {
        b.disabled = false;
        if (r.error) { msgDlg(erro(r)); return; }
        dlg.close();
        depois(nd && fEd.plan.value !== "vitalicio" ? "Salvo e renovado por mais " + nd + " dias." : "Alterações salvas.");
      });
  });

  // ----- Ações gerais -----
  painel.addEventListener("click", function (e) {
    var c = e.target.closest("[data-copiar]");
    if (c) { copiar(c.getAttribute("data-copiar")); return; }
    var b = e.target.closest("[data-act]");
    if (b) {
      var act = b.getAttribute("data-act"), l = licencas[+b.getAttribute("data-i")];
      if (act === "sair") sb.auth.signOut();
      else if (act === "atualizar") { carregarTudo(); toast("Atualizado."); }
      else if (act === "copiar") copiar(l.key);
      else if (act === "editar") abrir(l);
      return;
    }
    var f = e.target.closest("[data-filtro]");
    if (f) {
      filtro = f.getAttribute("data-filtro");
      painel.querySelectorAll("[data-filtro]").forEach(function (x) { x.classList.toggle("is-on", x === f); });
      desenharLista();
    }
  });
  document.getElementById("busca").addEventListener("input", function () { clearTimeout(buscaT); buscaT = setTimeout(carregarLista, 300); });

  var iniciado = false;
  sb.auth.onAuthStateChange(function (ev, s) {
    if (ev === "SIGNED_OUT") { iniciado = true; mostrar(null); }
    else if (!iniciado || (ev === "SIGNED_IN" && s && (!sessao || sessao.user.id !== s.user.id))) { iniciado = true; mostrar(s); }
    else if (s) sessao = s;
  });
})();

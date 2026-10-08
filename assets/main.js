(function () {
  var cfg = window.VENENO_CONFIG || { checkout: {} };

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
    var url = (cfg.checkout || {})[a.getAttribute("data-checkout")] || cfg.fallbackContato;
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
  });
  document.querySelectorAll('[data-link="discord"]').forEach(function (a) {
    if (cfg.discord) { a.href = cfg.discord; a.target = "_blank"; a.rel = "noopener"; }
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

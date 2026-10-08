(function () {
  var cfg = window.VENENO_CONFIG || { checkout: {} };

  // Ano no rodapé
  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

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

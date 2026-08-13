(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var COPY = window.SITE_COPY;
  var STORAGE_KEY = "mint-agent-locale-v1";

  function detectLocale() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) { /* storage unavailable */ }
    var nav = (navigator.language || "zh").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  var locale = detectLocale();

  function applyLocale(next) {
    locale = next;
    var dict = COPY[locale];
    document.documentElement.lang = locale;
    document.title = dict._meta_title;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (dict[key] !== undefined) nodes[i].innerHTML = dict[key];
    }
    var phNodes = document.querySelectorAll("[data-i18n-placeholder]");
    for (var j = 0; j < phNodes.length; j++) {
      var phKey = phNodes[j].getAttribute("data-i18n-placeholder");
      if (dict[phKey] !== undefined) phNodes[j].setAttribute("placeholder", dict[phKey]);
    }
    var btn = document.getElementById("langToggle");
    if (btn) btn.textContent = dict._lang_btn;
    var inviteMsg = document.getElementById("inviteMsg");
    if (inviteMsg) inviteMsg.textContent = "";
    try { window.localStorage.setItem(STORAGE_KEY, locale); } catch (e) { /* ignore */ }
  }

  document.getElementById("langToggle").addEventListener("click", function () {
    applyLocale(locale === "zh" ? "en" : "zh");
  });

  applyLocale(locale);

  /* invitation code form (validation backend not wired up yet) */
  var inviteForm = document.getElementById("inviteForm");
  if (inviteForm) {
    inviteForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = document.getElementById("inviteInput");
      var msg = document.getElementById("inviteMsg");
      var dict = COPY[locale];
      var code = input.value.trim();
      if (!code) {
        msg.textContent = dict.invite_empty;
        input.focus();
        return;
      }
      // TODO: hook up invitation-code verification here (API call, redirect, etc.)
      msg.textContent = dict.invite_pending;
    });
  }

  /* nav shadow on scroll */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 8) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* lightbox */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  document.addEventListener("click", function (ev) {
    var target = ev.target.closest("[data-lightbox]");
    if (target) {
      lightboxImg.src = target.getAttribute("data-lightbox");
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  });
  lightbox.addEventListener("click", function () {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
    document.body.style.overflow = "";
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && lightbox.classList.contains("open")) {
      lightbox.classList.remove("open");
      lightboxImg.src = "";
      document.body.style.overflow = "";
    }
  });

  /* scroll reveal */
  var revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealNodes.forEach(function (n) { io.observe(n); });
  } else {
    revealNodes.forEach(function (n) { n.classList.add("visible"); });
  }
})();

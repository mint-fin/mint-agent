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

  /* invitation code redemption (server-side accounts; nothing secret lives here) */
  var APP_BASE = "https://promptly-oklahoma-depth-modifications.trycloudflare.com";
  /* Stable entry: the GitHub Pages launcher forwards to the current backend. */
  var WORKSPACE_URL = "https://mint-fin.github.io/app/?view=workspace";

  var inviteForm = document.getElementById("inviteForm");
  if (inviteForm) {
    var inviteBusy = false;
    var goLink = document.getElementById("irGo");
    var loginLink = document.getElementById("inviteLoginLink");
    if (goLink) goLink.href = WORKSPACE_URL;
    if (loginLink) loginLink.href = WORKSPACE_URL;

    inviteForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (inviteBusy) return;
      var input = document.getElementById("inviteInput");
      var msg = document.getElementById("inviteMsg");
      var submit = document.getElementById("inviteSubmit");
      var result = document.getElementById("inviteResult");
      var dict = COPY[locale];
      var code = input.value.trim();
      msg.classList.remove("is-error");
      if (!code) {
        msg.textContent = dict.invite_empty;
        input.focus();
        return;
      }
      inviteBusy = true;
      submit.disabled = true;
      msg.textContent = dict.invite_checking;

      fetch(APP_BASE + "/api/auth/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code }),
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () { return {}; })
            .then(function (payload) { return { status: response.status, payload: payload }; });
        })
        .then(function (outcome) {
          var d = COPY[locale];
          if (outcome.status === 200 && outcome.payload && outcome.payload.username) {
            msg.textContent = "";
            document.getElementById("irUser").textContent = outcome.payload.username;
            document.getElementById("irPass").textContent = outcome.payload.password;
            result.hidden = false;
            inviteForm.hidden = true;
            return;
          }
          msg.classList.add("is-error");
          if (outcome.status === 429) msg.textContent = d.invite_ratelimited;
          else if (outcome.status === 400 || outcome.status === 404) msg.textContent = d.invite_invalid;
          else msg.textContent = d.invite_network;
        })
        .catch(function () {
          msg.classList.add("is-error");
          msg.textContent = COPY[locale].invite_network;
        })
        .then(function () {
          inviteBusy = false;
          submit.disabled = false;
        });
    });

    document.querySelectorAll(".ir-copy").forEach(function (button) {
      button.addEventListener("click", function () {
        var target = document.getElementById(button.getAttribute("data-copy-target"));
        if (!target) return;
        var text = target.textContent || "";
        var restore = function () {
          window.setTimeout(function () {
            button.textContent = COPY[locale].invite_copy;
          }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            button.textContent = COPY[locale].invite_copied;
            restore();
          });
        } else {
          var range = document.createRange();
          range.selectNodeContents(target);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          document.execCommand("copy");
          selection.removeAllRanges();
          button.textContent = COPY[locale].invite_copied;
          restore();
        }
      });
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

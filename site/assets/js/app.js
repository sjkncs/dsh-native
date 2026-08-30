/* dsh-native 展示站脚本：主题/语言切换、双语渲染、滚动揭示、Hero 视差。
   相对路径，任意 basePath 可用；设计基准见仓库根 DESIGN.md。 */
(function () {
  "use strict";

  var THEME_KEY = "dsh-native-theme";
  var LANG_KEY = "dsh-native-lang";
  var data = null;
  var lang = "zh";

  function read(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function save(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
      /* 隐私模式下忽略 */
    }
  }

  /* ── 主题 ─────────────────────────────────────────── */
  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function bindThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next =
        document.documentElement.getAttribute("data-theme") === "light"
          ? "dark"
          : "light";
      applyTheme(next);
      save(THEME_KEY, next);
    });
  }

  /* ── 双语 ─────────────────────────────────────────── */
  function t(key) {
    if (!data || !data.i18n) return key;
    var d = data.i18n[lang] || data.i18n.zh;
    return d[key] != null ? d[key] : key;
  }

  function L(node) {
    if (node == null) return "";
    if (typeof node === "string") return node;
    return node[lang] != null ? node[lang] : node.zh || "";
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderKpis() {
    var root = document.getElementById("kpi-grid");
    if (!root) return;
    root.innerHTML = "";
    data.kpis.forEach(function (k) {
      var card = el("div", "kpi");
      card.appendChild(el("div", "num grad-text", k.num));
      card.appendChild(el("div", "lbl", L(k.label)));
      root.appendChild(card);
    });
  }

  function renderStack() {
    var body = document.getElementById("stack-body");
    if (!body) return;
    body.innerHTML = "";
    var originKey = {
      official: "origin_official",
      vendored: "origin_vendored",
      community: "origin_community",
    };
    var originClass = { official: "badge-accent", vendored: "badge-ok", community: "" };
    data.stack.forEach(function (p) {
      var tr = document.createElement("tr");
      var name = el("td");
      name.appendChild(el("code", null, p.name));
      tr.appendChild(name);
      tr.appendChild(el("td", null, p.version));
      var origin = el("td");
      origin.appendChild(el("span", "badge " + (originClass[p.origin] || ""), t(originKey[p.origin])));
      tr.appendChild(origin);
      tr.appendChild(el("td", null, L(p.role)));
      body.appendChild(tr);
    });
  }

  function renderPresets() {
    var root = document.getElementById("presets-grid");
    if (!root) return;
    root.innerHTML = "";
    data.presets.forEach(function (p) {
      var card = el("div", "card");
      card.appendChild(el("h3", null, p.name));
      card.appendChild(el("p", "small muted", L(p.tagline)));
      var ul = el("ul", "roadmap");
      ul.style.marginTop = "12px";
      p.points.forEach(function (pt) {
        var li = el("li");
        li.appendChild(el("span", "dot"));
        li.appendChild(document.createTextNode(L(pt)));
        ul.appendChild(li);
      });
      card.appendChild(ul);
      root.appendChild(card);
    });
  }

  function renderResearch() {
    var mods = document.getElementById("research-modules");
    if (mods) {
      mods.innerHTML = "";
      data.research.modules.forEach(function (m) {
        mods.appendChild(el("span", "status-pill", L(m)));
      });
    }
    var cards = document.getElementById("research-cards");
    if (cards) {
      cards.innerHTML = "";
      data.research.cards.forEach(function (c) {
        cards.appendChild(el("span", "badge badge-accent", L(c)));
      });
    }
  }

  function renderRedlines() {
    var root = document.getElementById("redlines");
    if (!root) return;
    root.innerHTML = "";
    data.redlines.forEach(function (r) {
      var li = el("li");
      var dot = el("span", "dot");
      dot.style.background = "var(--ds-danger)";
      dot.style.boxShadow =
        "0 0 0 4px color-mix(in srgb, var(--ds-danger) 18%, transparent)";
      li.appendChild(dot);
      li.appendChild(document.createTextNode(L(r)));
      root.appendChild(li);
    });
  }

  function renderRoadmap() {
    var root = document.getElementById("roadmap-list");
    if (!root) return;
    root.innerHTML = "";
    data.roadmap.forEach(function (item) {
      var li = el("li", item.done ? "done" : "");
      li.appendChild(el("span", "dot"));
      li.appendChild(document.createTextNode(L(item.label)));
      root.appendChild(li);
    });
  }

  function applyLang() {
    if (!data) return; /* snapshot 未加载时保持静态文案，加载后 boot 会用已存语言偏好重跑 */
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title =
      lang === "zh"
        ? "dsh-native · DeepSeek Harness 正式版（全栈）"
        : "dsh-native · DeepSeek Harness GA (Full Stack)";

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    }

    var stage = document.getElementById("badge-stage");
    if (stage) stage.textContent = L(data.meta.stage);
    var tagline = document.getElementById("footer-tagline");
    if (tagline) tagline.textContent = L(data.meta.tagline);

    var langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.textContent = t("lang_btn");
      langBtn.setAttribute("aria-label", t("lang_aria"));
    }
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.setAttribute("aria-label", t("theme_aria"));

    renderKpis();
    renderStack();
    renderPresets();
    renderResearch();
    renderRedlines();
    renderRoadmap();
  }

  function bindLangToggle() {
    var btn = document.getElementById("lang-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      lang = lang === "zh" ? "en" : "zh";
      save(LANG_KEY, lang);
      applyLang();
    });
  }

  /* ── 滚动揭示（一次触发；滚动位置检测，兼容无 IO 回调的环境）── */
  function initReveal() {
    var pending = Array.prototype.slice.call(
      document.querySelectorAll(".reveal")
    );
    if (!pending.length) return;
    var lastRun = 0;

    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var trigger = vh * 0.92;
      for (var i = pending.length - 1; i >= 0; i--) {
        var rect = pending[i].getBoundingClientRect();
        if (rect.top <= trigger && rect.bottom >= 0) {
          pending[i].classList.add("in");
          pending.splice(i, 1);
        }
      }
      if (!pending.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }

    function onScroll() {
      var now = Date.now();
      if (now - lastRun < 48) return;
      lastRun = now;
      check();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    check();
  }

  /* ── Hero 视差（系数 0.15，尊重减少动态偏好）──────── */
  function initParallax() {
    var media = document.querySelector(".hero-media");
    if (!media) return;
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      if (mq.matches || window.innerWidth <= 920) {
        media.style.transform = "";
        return;
      }
      var y = Math.min(window.scrollY, window.innerHeight) * 0.15;
      media.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    if (mq.addEventListener) mq.addEventListener("change", update);
    update();
  }

  /* ── 启动 ─────────────────────────────────────────── */
  function boot() {
    applyTheme(read(THEME_KEY) === "light" ? "light" : "dark");
    lang = read(LANG_KEY) === "en" ? "en" : "zh";
    bindThemeToggle();
    bindLangToggle();

    fetch("data/snapshot.json")
      .then(function (r) {
        if (!r.ok) throw new Error("snapshot " + r.status);
        return r.json();
      })
      .then(function (d) {
        data = d;
        applyLang();
        var note = document.getElementById("data-note");
        if (note) note.textContent = t("kpi_note");
      })
      .catch(function (err) {
        var note = document.getElementById("data-note");
        if (note) {
          note.textContent =
            "数据加载失败 / Failed to load data: " + err.message;
        }
      });

    initReveal();
    initParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

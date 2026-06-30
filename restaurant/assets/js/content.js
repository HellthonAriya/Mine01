/* ===========================================================================
   رستوران دمسا · بارگذارِ محتوا (قالب ۲)
   محتوا را از api/content (یا content.json) می‌گیرد، تمِ هوشمند را اعمال
   می‌کند، متنِ بخش‌ها را می‌نشاند و دادهٔ منو را روی پیش‌فرض‌ها سوار می‌کند.
   =========================================================================== */
(function () {
  "use strict";
  const DEFAULTS = window.DAMSA || {};
  const T = window.DamsaTheme;
  const DEFAULT_THEME = { primary: "#9E2B25", secondary: "#C99A3B" };

  async function fetchContent() {
    for (const url of ["api/content", "content.json"]) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
        clearTimeout(to);
        if (res.ok) { const j = await res.json(); if (j && typeof j === "object") return j; }
      } catch (_) {}
    }
    return null;
  }

  function applyTheme(theme) { if (T) try { T.applyTheme(document, theme || {}); } catch (_) {} }

  const DEFAULT_TEXT = {}; const EDITABLE = [];
  function addEditable(key, type, def, attr) {
    if (EDITABLE.some((e) => e.key === key && e.type === type)) return;
    EDITABLE.push({ key, type, group: key.split(".")[0], def, attr });
  }
  function captureDefaults() {
    document.querySelectorAll("[data-edit]").forEach((el) => {
      const k = el.getAttribute("data-edit"); if (!k) return;
      if (!(k in DEFAULT_TEXT)) DEFAULT_TEXT[k] = el.textContent.trim();
      addEditable(k, "text", DEFAULT_TEXT[k]);
    });
    document.querySelectorAll("[data-edit-html]").forEach((el) => {
      const k = el.getAttribute("data-edit-html"); if (!k) return;
      if (!("html:" + k in DEFAULT_TEXT)) DEFAULT_TEXT["html:" + k] = el.innerHTML.trim();
      addEditable(k, "html", DEFAULT_TEXT["html:" + k]);
    });
    document.querySelectorAll("[data-edit-attr]").forEach((el) => {
      const [k, attr] = el.getAttribute("data-edit-attr").split("|"); if (!k) return;
      if (!("attr:" + k in DEFAULT_TEXT)) DEFAULT_TEXT["attr:" + k] = el.getAttribute(attr) || "";
      addEditable(k, "attr", DEFAULT_TEXT["attr:" + k], attr);
    });
    window.__DAMSA_DEFAULT_TEXT__ = DEFAULT_TEXT;
    window.__DAMSA_EDITABLE__ = EDITABLE;
  }

  function applyText(text) {
    const t = text || {};
    document.querySelectorAll("[data-edit]").forEach((el) => {
      const k = el.getAttribute("data-edit");
      const v = (k in t && t[k] != null && t[k] !== "") ? t[k] : DEFAULT_TEXT[k];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-edit-html]").forEach((el) => {
      const k = el.getAttribute("data-edit-html");
      const v = (k in t && t[k] != null && t[k] !== "") ? t[k] : DEFAULT_TEXT["html:" + k];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-edit-attr]").forEach((el) => {
      const [k, attr] = el.getAttribute("data-edit-attr").split("|");
      const v = (k in t && t[k] != null && t[k] !== "") ? t[k] : DEFAULT_TEXT["attr:" + k];
      if (k && attr && v != null) el.setAttribute(attr, v);
    });
  }

  function mergeData(content) {
    const d = (content && content.data) || {};
    const m = Object.assign({}, DEFAULTS);
    if (Array.isArray(d.courses) && d.courses.length) m.COURSES = d.courses;
    if (Array.isArray(d.dishes) && d.dishes.length) m.DISHES = d.dishes;
    if (Array.isArray(d.testimonials) && d.testimonials.length) m.TESTIMONIALS = d.testimonials;
    if (d.tagLabels && typeof d.tagLabels === "object") m.TAG_LABELS = Object.assign({}, DEFAULTS.TAG_LABELS, d.tagLabels);
    if (d.art && typeof d.art === "object") m.ART = Object.assign({}, DEFAULTS.ART, d.art);
    return m;
  }

  function listenPreview() {
    window.addEventListener("message", (e) => {
      const d = e.data; if (!d || d.type !== "damsa:preview") return;
      const c = d.content || {};
      applyTheme(Object.assign({}, DEFAULT_THEME, c.theme || {}));
      applyText(c.text || {});
    });
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: "damsa:previewReady" }, "*"); } catch (_) {}
  }

  function fireReady() { window.__DAMSA_READY__ = true; document.dispatchEvent(new Event("damsa:ready")); }

  async function boot() {
    captureDefaults();
    listenPreview();
    const content = await fetchContent();
    if (content) {
      window.DAMSA = mergeData(content);
      window.DAMSA_CONTENT = content;
      applyText(content.text);
    } else {
      window.DAMSA = Object.assign({}, DEFAULTS);
    }
    const theme = Object.assign({}, DEFAULT_THEME, (content && content.theme) || {});
    delete theme.mode;
    applyTheme(theme);
    fireReady();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  setTimeout(() => { if (!window.__DAMSA_READY__) { window.DAMSA = window.DAMSA || DEFAULTS; fireReady(); } }, 3500);
})();

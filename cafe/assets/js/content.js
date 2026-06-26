/* ===========================================================================
   دمسا · بارگذارِ محتوا (Content Loader)
   محتوا را از بک‌اند (/api/content) یا فایلِ ایستا (content.json) می‌گیرد،
   روی پیش‌فرض‌ها (menu-data.js) سوار می‌کند، تمِ هوشمند را اعمال می‌کند،
   متنِ بخش‌ها را می‌نشاند و سپس به app.js اجازهٔ شروع می‌دهد.
   اگر بک‌اند نبود، سایت با پیش‌فرض‌ها کاملاً کار می‌کند.
   =========================================================================== */
(function () {
  "use strict";

  const DEFAULTS = window.DAMSA || {};
  const T = window.DamsaTheme;

  /* محتوای خام را برمی‌گرداند (یا null) */
  async function fetchContent() {
    const sources = ["api/content", "content.json"];
    for (const url of sources) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
        clearTimeout(to);
        if (res.ok) {
          const json = await res.json();
          if (json && typeof json === "object") return json;
        }
      } catch (_) { /* منبعِ بعدی */ }
    }
    return null;
  }

  /* تمِ هوشمند: پالت از روی رنگ‌های پایه ساخته و تزریق می‌شود */
  function applyTheme(theme) {
    if (!T) return;
    try { T.applyTheme(document, theme || {}); } catch (_) {}
  }

  /* متنِ پیش‌فرض (از خودِ HTML) را یک‌بار نگه می‌داریم تا پیش‌نمایش بتواند به آن برگردد */
  const DEFAULT_TEXT = {};
  const EDITABLE = [];
  function addEditable(key, type, def, attr) {
    if (EDITABLE.some((e) => e.key === key && e.type === type)) return;
    EDITABLE.push({ key, type, group: key.split(".")[0], def, attr });
  }
  function captureDefaults() {
    document.querySelectorAll("[data-edit]").forEach((el) => {
      const k = el.getAttribute("data-edit"); if (!k) return;
      const v = el.textContent.trim();
      if (!(k in DEFAULT_TEXT)) DEFAULT_TEXT[k] = v;
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

  /* متنِ بخش‌ها: هر [data-edit] از روی کلیدش پر می‌شود؛ نبودِ کلید → پیش‌فرض */
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

  /* دادهٔ ساختاری روی پیش‌فرض‌ها سوار می‌شود */
  function mergeData(content) {
    const d = content && content.data ? content.data : {};
    const merged = Object.assign({}, DEFAULTS);
    if (Array.isArray(d.categories) && d.categories.length) merged.CATEGORIES = d.categories;
    if (Array.isArray(d.menu) && d.menu.length) merged.MENU = d.menu;
    if (Array.isArray(d.reviews) && d.reviews.length) merged.REVIEWS = d.reviews;
    if (Array.isArray(d.events) && d.events.length) merged.EVENTS = d.events;
    if (Array.isArray(d.tiers) && d.tiers.length) merged.TIERS = d.tiers;
    if (d.tagLabels && typeof d.tagLabels === "object") merged.TAG_LABELS = Object.assign({}, DEFAULTS.TAG_LABELS, d.tagLabels);
    if (d.art && typeof d.art === "object") merged.ART = Object.assign({}, DEFAULTS.ART, d.art);
    return merged;
  }

  function fireReady() {
    window.__DAMSA_READY__ = true;
    document.dispatchEvent(new Event("damsa:ready"));
  }

  // رنگ‌های پایهٔ پیش‌فرض (هم‌خوان با :root در styles.css)
  const DEFAULT_THEME = { primary: "#E0922B", secondary: "#2F8F86" };

  /* پیش‌نمایشِ زنده: پنلِ ادمین از طریقِ postMessage محتوای پیش‌نویس را می‌فرستد */
  function listenPreview() {
    window.addEventListener("message", (e) => {
      const d = e.data;
      if (!d || d.type !== "damsa:preview") return;
      const c = d.content || {};
      applyTheme(Object.assign({}, DEFAULT_THEME, c.theme || {}));
      applyText(c.text || {});
    });
    // به والد اعلام کن که آماده‌ای
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: "damsa:previewReady" }, "*"); } catch (_) {}
  }

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
    // تمِ هوشمند همیشه فعال است؛ مقادیرِ ادمین روی پیش‌فرض سوار می‌شوند
    const theme = Object.assign({}, DEFAULT_THEME, (content && content.theme) || {});
    // mode را به مهندسِ تم نمی‌دهیم تا سوییچِ روشن/تاریکِ کاربر دست‌نخورده بماند
    delete theme.mode;
    applyTheme(theme);
    fireReady();
  }

  // اگر DOM آماده است شروع کن، وگرنه صبر کن
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // شیرِ امنیتی: اگر چیزی گیر کرد، حداکثر بعد از ۳.۵ ثانیه سایت را آزاد کن
  setTimeout(() => { if (!window.__DAMSA_READY__) { window.DAMSA = window.DAMSA || DEFAULTS; fireReady(); } }, 3500);
})();

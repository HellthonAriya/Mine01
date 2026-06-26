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
    const sources = ["/api/content", "content.json"];
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

  /* متنِ بخش‌ها: هر عنصرِ [data-edit] از روی کلیدش پر می‌شود */
  function applyText(text) {
    if (!text) return;
    document.querySelectorAll("[data-edit]").forEach((el) => {
      const k = el.getAttribute("data-edit");
      if (k && Object.prototype.hasOwnProperty.call(text, k) && text[k] != null) {
        el.textContent = text[k];
      }
    });
    document.querySelectorAll("[data-edit-html]").forEach((el) => {
      const k = el.getAttribute("data-edit-html");
      if (k && Object.prototype.hasOwnProperty.call(text, k) && text[k] != null) {
        el.innerHTML = text[k];
      }
    });
    // پیوندها (تلفن/سوشال): [data-edit-attr="key|attr"]
    document.querySelectorAll("[data-edit-attr]").forEach((el) => {
      const spec = el.getAttribute("data-edit-attr");
      const [k, attr] = spec.split("|");
      if (k && attr && text[k] != null) el.setAttribute(attr, text[k]);
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

  async function boot() {
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

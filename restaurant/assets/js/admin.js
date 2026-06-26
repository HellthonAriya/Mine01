/* ===========================================================================
   کافهٔ دمسا · پنلِ مدیریت
   ورود با رمز، ویرایشِ تمِ هوشمند + رنگِ پیشرفته، متن‌ها، منو، دسته‌ها،
   نظرات، رویدادها، باشگاه و تماس؛ پیش‌نمایشِ زنده و ذخیره روی بک‌اند.
   =========================================================================== */
(function () {
  "use strict";
  const T = window.DamsaTheme;
  const D = window.DAMSA || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const el = (tag, attrs, html) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "value") n.value = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toast = (msg, kind) => {
    const t = el("div", { class: "toast " + (kind || "") }, esc(msg));
    $("#toastWrap").appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  const DEFAULT_THEME = { primary: "#9E2B25", secondary: "#C99A3B", mode: "dark" };
  let token = sessionStorage.getItem("damsa-admin-token") || "";
  let content = null;       // پیش‌نویسِ فعلی
  let editable = [];        // فهرستِ متن‌های قابلِ ویرایش (از iframe)
  let previewReady = false;

  /* =========================================================================
     ورود
     ========================================================================= */
  async function doLogin(pw) {
    const res = await fetch("api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (!res.ok) throw new Error("login");
    const j = await res.json();
    token = j.token;
    sessionStorage.setItem("damsa-admin-token", token);
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#loginErr"); err.hidden = true;
    $("#loginBtn").disabled = true;
    try { await doLogin($("#pw").value); await start(); }
    catch (_) { err.textContent = "رمز نادرست است."; err.hidden = false; }
    finally { $("#loginBtn").disabled = false; }
  });

  $("#logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("damsa-admin-token");
    location.reload();
  });

  /* =========================================================================
     بارگذاری محتوا و راه‌اندازی
     ========================================================================= */
  function skeleton(c) {
    c = c || {};
    c.theme = Object.assign({}, DEFAULT_THEME, c.theme || {});
    c.theme.overrides = c.theme.overrides || { dark: {}, light: {} };
    c.theme.overrides.dark = c.theme.overrides.dark || {};
    c.theme.overrides.light = c.theme.overrides.light || {};
    c.text = c.text || {};
    c.data = c.data || {};
    c.data.dishes = c.data.dishes || clone(D.DISHES || []);
    c.data.courses = c.data.courses || clone(D.COURSES || []);
    c.data.testimonials = c.data.testimonials || clone(D.TESTIMONIALS || []);
    return c;
  }
  const clone = (x) => JSON.parse(JSON.stringify(x));

  async function loadContent() {
    try {
      const res = await fetch("api/content", { cache: "no-store" });
      const j = res.ok ? await res.json() : {};
      return skeleton(j);
    } catch (_) { return skeleton({}); }
  }

  async function start() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    content = await loadContent();
    buildTabs();
    buildAllPanels();
    pushPreview();
  }

  /* =========================================================================
     پیش‌نمایشِ زنده
     ========================================================================= */
  const iframe = $("#preview");
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "damsa:previewReady") {
      previewReady = true;
      try { editable = iframe.contentWindow.__DAMSA_EDITABLE__ || []; } catch (_) { editable = []; }
      buildTextPanel();
      pushPreview();
    }
  });
  let pvTimer = null;
  function pushPreview() {
    if (!previewReady) return;
    clearTimeout(pvTimer);
    pvTimer = setTimeout(() => {
      try { iframe.contentWindow.postMessage({ type: "damsa:preview", content: content }, "*"); } catch (_) {}
    }, 90);
  }
  $("#reloadPreview").addEventListener("click", () => { previewReady = false; iframe.src = "./?preview=1&t=" + Date.now(); });
  $$(".apreview__modes [data-vw]").forEach((b) => b.addEventListener("click", () => {
    $$(".apreview__modes [data-vw]").forEach((x) => x.classList.remove("is-on"));
    b.classList.add("is-on");
    iframe.style.width = b.dataset.vw;
  }));

  /* =========================================================================
     تب‌ها
     ========================================================================= */
  const TABS = [
    { id: "theme", icon: "🎨", label: "تم و رنگ" },
    { id: "brand", icon: "✦", label: "برند" },
    { id: "text", icon: "✎", label: "متن‌ها" },
    { id: "dishes", icon: "🍽", label: "غذاها" },
    { id: "courses", icon: "▦", label: "دوره‌ها" },
    { id: "testi", icon: "★", label: "نظرات" },
  ];
  function buildTabs() {
    const wrap = $("#atabs"); wrap.innerHTML = "";
    TABS.forEach((t, i) => {
      const b = el("button", { "data-tab": t.id }, `<i>${t.icon}</i>${t.label}`);
      if (i === 0) b.classList.add("is-on");
      b.addEventListener("click", () => {
        $$("#atabs button").forEach((x) => x.classList.remove("is-on"));
        b.classList.add("is-on");
        $$(".panel").forEach((p) => p.classList.toggle("is-on", p.id === "panel-" + t.id));
      });
      wrap.appendChild(b);
    });
  }

  function buildAllPanels() {
    const root = $("#aeditor"); root.innerHTML = "";
    root.appendChild(themePanel());
    root.appendChild(brandPanel());
    root.appendChild(el("section", { class: "panel", id: "panel-text" }, "<h2>متنِ بخش‌ها</h2><p class='panel__lead'>در حالِ بارگذاری از پیش‌نمایش…</p>"));
    root.appendChild(dishesPanel());
    root.appendChild(coursesPanel());
    root.appendChild(testiPanel());
    $("#panel-theme").classList.add("is-on");
  }

  /* =========================================================================
     انتخابگرِ رنگِ پیشرفته (HSV)
     ========================================================================= */
  const cp = { h: 33, s: 80, v: 88, onChange: null, target: null };
  const cpEl = $("#cpick"), cpSv = $("#cpSv"), cpSvThumb = $("#cpSvThumb"),
    cpHue = $("#cpHue"), cpHueThumb = $("#cpHueThumb"), cpHex = $("#cpHex"), cpSwatch = $("#cpSwatch");

  function hsvToHex(h, s, v) {
    s /= 100; v /= 100;
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r, g, b;
    if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c]; else[r, g, b] = [c, 0, x];
    const f = (n) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
    return "#" + f(r) + f(g) + f(b);
  }
  function hexToHsv(hex) {
    const hsl = T.hexToHsl(hex); // استفاده از موتورِ تم برای hue/تبدیل
    const { r, g, b } = T.hexToRgb(hex);
    const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
    const v = max, s = max === 0 ? 0 : (max - min) / max;
    return { h: hsl.h, s: s * 100, v: v * 100 };
  }
  function cpRender() {
    const hex = hsvToHex(cp.h, cp.s, cp.v);
    cpSv.style.setProperty("--h", cp.h);
    cpSvThumb.style.left = cp.s + "%";
    cpSvThumb.style.top = (100 - cp.v) + "%";
    cpHueThumb.style.left = (cp.h / 360 * 100) + "%";
    cpSwatch.style.background = hex;
    if (document.activeElement !== cpHex) cpHex.value = hex.toUpperCase();
    if (cp.onChange) cp.onChange(hex);
  }
  function openPicker(anchor, hex, onChange) {
    const v = hexToHsv(hex || "#E0922B");
    cp.h = v.h; cp.s = v.s; cp.v = v.v; cp.onChange = onChange; cp.target = anchor;
    cpEl.hidden = false;
    const r = anchor.getBoundingClientRect();
    let top = r.bottom + 8, left = r.left;
    const pw = 264, ph = 280;
    if (left + pw > innerWidth - 8) left = innerWidth - pw - 8;
    if (top + ph > innerHeight - 8) top = Math.max(8, r.top - ph - 8);
    cpEl.style.top = top + "px"; cpEl.style.left = Math.max(8, left) + "px";
    cpRender();
  }
  function closePicker() { cpEl.hidden = true; cp.onChange = null; }

  function dragSv(e) {
    const r = cpSv.getBoundingClientRect();
    const x = clamp((e.clientX - r.left) / r.width, 0, 1);
    const y = clamp((e.clientY - r.top) / r.height, 0, 1);
    cp.s = x * 100; cp.v = (1 - y) * 100; cpRender();
  }
  function dragHue(e) {
    const r = cpHue.getBoundingClientRect();
    cp.h = clamp((e.clientX - r.left) / r.width, 0, 1) * 360; cpRender();
  }
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  function pointerDrag(target, handler) {
    target.addEventListener("pointerdown", (e) => {
      e.preventDefault(); target.setPointerCapture(e.pointerId); handler(e);
      const mv = (ev) => handler(ev);
      const up = () => { target.removeEventListener("pointermove", mv); target.removeEventListener("pointerup", up); };
      target.addEventListener("pointermove", mv); target.addEventListener("pointerup", up);
    });
  }
  pointerDrag(cpSv, dragSv); pointerDrag(cpHue, dragHue);
  cpHex.addEventListener("input", () => {
    let h = cpHex.value.trim(); if (!h.startsWith("#")) h = "#" + h;
    if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(h)) { const v = hexToHsv(h); cp.h = v.h; cp.s = v.s; cp.v = v.v; cpRender(); }
  });
  $("#cpDone").addEventListener("click", closePicker);
  // پریست‌ها
  (function () {
    const presets = ["#E0922B", "#C0392B", "#8E44AD", "#2980B9", "#16A085", "#27AE60", "#D35400", "#2F8F86", "#E84393", "#F1C40F", "#1ABC9C", "#34495E"];
    const wrap = $("#cpPresets");
    presets.forEach((p) => { const i = el("i"); i.style.background = p; i.addEventListener("click", () => { const v = hexToHsv(p); cp.h = v.h; cp.s = v.s; cp.v = v.v; cpRender(); }); wrap.appendChild(i); });
  })();
  document.addEventListener("pointerdown", (e) => {
    if (!cpEl.hidden && !cpEl.contains(e.target) && e.target !== cp.target && !(cp.target && cp.target.contains(e.target))) closePicker();
  });

  /* یک ردیفِ رنگ با سواچ + هگز که با کلیک، انتخابگر باز می‌کند */
  function colorRow(title, sub, getHex, setHex) {
    const row = el("div", { class: "colorrow" });
    const sw = el("span", { class: "colorrow__sw" });
    const meta = el("div", { class: "colorrow__meta" }, `<b>${esc(title)}</b><span>${esc(sub || "")}</span>`);
    const hexIn = el("input", { class: "colorrow__hex", type: "text", maxlength: "7" });
    const sync = () => { const h = getHex(); sw.style.background = h; hexIn.value = h.toUpperCase(); };
    sw.addEventListener("click", () => openPicker(sw, getHex(), (h) => { setHex(h); sw.style.background = h; hexIn.value = h.toUpperCase(); pushPreview(); }));
    hexIn.addEventListener("input", () => {
      let h = hexIn.value.trim(); if (!h.startsWith("#")) h = "#" + h;
      if (/^#([0-9a-f]{6})$/i.test(h)) { setHex(h); sw.style.background = h; pushPreview(); }
    });
    sync();
    row.append(sw, meta, hexIn);
    row._sync = sync;
    return row;
  }

  /* =========================================================================
     پنلِ تم و رنگ
     ========================================================================= */
  function themePanel() {
    const p = el("section", { class: "panel", id: "panel-theme" });
    p.appendChild(el("div", null, "<h2>تم و رنگِ هوشمند</h2><p class='panel__lead'>فقط دو رنگِ پایه را انتخاب کن؛ کلِ پالتِ سایت (پس‌زمینه، متن، خط‌ها، حالتِ روشن) خودکار و هماهنگ ساخته می‌شود.</p>"));

    // حالت
    const mode = el("div", { class: "modeToggle" });
    ["dark", "light"].forEach((m) => {
      const b = el("button", { "data-m": m }, m === "dark" ? "تاریک 🌙" : "روشن ☀");
      if (content.theme.mode === m) b.classList.add("is-on");
      b.addEventListener("click", () => {
        content.theme.mode = m;
        $$(".modeToggle button").forEach((x) => x.classList.toggle("is-on", x === b));
        pushPreview(); refreshAdvanced();
      });
      mode.appendChild(b);
    });
    const modeCard = el("div", { class: "card" }, "<h3>حالتِ پیش‌فرضِ سایت</h3>");
    modeCard.appendChild(mode);
    p.appendChild(modeCard);

    // رنگ‌های پایه
    const seedCard = el("div", { class: "card" }, "<h3>رنگ‌های پایه</h3>");
    const grid = el("div", { class: "seed-grid" });
    const mkSeed = (key, title, sub) => {
      const box = el("div", { class: "seed" });
      const sw = el("div", { class: "seed__sw" });
      sw.style.background = content.theme[key];
      box.append(sw, el("b", null, title), el("span", null, sub));
      sw.addEventListener("click", () => openPicker(sw, content.theme[key], (h) => {
        content.theme[key] = h; sw.style.background = h; pushPreview(); refreshAdvanced();
      }));
      return box;
    };
    grid.append(
      mkSeed("primary", "رنگِ اصلی", "طلایی/شتاب — دکمه‌ها، عنوان‌ها"),
      mkSeed("secondary", "رنگِ دوم", "فیروزه‌ای — تأکیدها، برچسب‌ها"),
    );
    seedCard.appendChild(grid);
    const reset = el("button", { class: "btn btn--ghost btn--sm" }, "بازگردانی به رنگ‌های اولیه");
    reset.addEventListener("click", () => {
      content.theme.primary = DEFAULT_THEME.primary; content.theme.secondary = DEFAULT_THEME.secondary;
      content.theme.overrides = { dark: {}, light: {} };
      buildAllPanels(); $("#panel-theme").classList.add("is-on");
      $$("#atabs button")[0].classList.add("is-on");
      pushPreview(); toast("به پالتِ اولیه برگشت");
    });
    seedCard.appendChild(reset);
    p.appendChild(seedCard);

    // پیشرفته: بازنویسیِ تک‌تکِ توکن‌ها
    const adv = el("div", { class: "card", id: "advCard" });
    adv.innerHTML = "<h3>تنظیمِ پیشرفته (هر رنگ جداگانه)</h3>";
    adv.appendChild(el("p", { class: "panel__lead" }, "این رنگ‌ها به‌صورتِ خودکار از رنگ‌های پایه ساخته شده‌اند. اگر بخواهی می‌توانی هرکدام را دستی تغییر دهی."));
    adv.appendChild(el("div", { id: "advList" }));
    p.appendChild(adv);
    setTimeout(refreshAdvanced, 0);
    return p;
  }

  // توکن‌های قابلِ بازنویسیِ پیشرفته
  const ADV_TOKENS = [
    ["--accent", "رنگِ شتاب (دکمه/عنوان)"],
    ["--accent-2", "رنگِ دوم"],
    ["--bronze", "برنز (ملایم)"],
    ["--bg", "پس‌زمینهٔ اصلی"],
    ["--bg-elev", "پس‌زمینهٔ کارت‌ها"],
    ["--text", "رنگِ متن"],
    ["--text-dim", "متنِ کم‌رنگ"],
  ];
  function refreshAdvanced() {
    const list = $("#advList"); if (!list) return;
    list.innerHTML = "";
    const mode = content.theme.mode === "light" ? "light" : "dark";
    const pal = T.buildPalette(content.theme);
    const ov = content.theme.overrides[mode];
    ADV_TOKENS.forEach(([tok, label]) => {
      const cur = () => ov[tok] || pal[mode][tok] || "#000000";
      const row = colorRow(label, tok + " · " + (content.theme.mode === "light" ? "روشن" : "تاریک"),
        cur, (h) => { ov[tok] = h; });
      // دکمهٔ پاک‌کردنِ بازنویسی
      const rm = el("button", { class: "btn btn--ghost btn--sm", title: "بازگشت به خودکار" }, "↺");
      rm.style.flex = "none";
      rm.addEventListener("click", () => { delete ov[tok]; refreshAdvanced(); pushPreview(); });
      row.appendChild(rm);
      list.appendChild(row);
    });
  }

  /* =========================================================================
     پنلِ برند
     ========================================================================= */
  function brandPanel() {
    const p = el("section", { class: "panel", id: "panel-brand" });
    p.appendChild(el("div", null, "<h2>برند</h2><p class='panel__lead'>نام و نشانهٔ کافه (در نوار بالا، فوتر و لودر استفاده می‌شود).</p>"));
    const card = el("div", { class: "card" });
    card.appendChild(textField("نامِ کافه", "brand.word", "text"));
    card.appendChild(textField("حرفِ نشانه (لوگو)", "brand.mark", "text"));
    p.appendChild(card);
    return p;
  }

  /* فیلدِ متنی که روی content.text[key] می‌نشیند */
  function textField(label, key, type) {
    const lab = el("label", { class: "lab" });
    lab.appendChild(el("span", null, esc(label)));
    const cur = content.text[key] != null ? content.text[key] : "";
    let inp;
    if (type === "area") { inp = el("textarea"); inp.value = cur; }
    else { inp = el("input", { type: "text" }); inp.value = cur; }
    inp.placeholder = defText(key) || "";
    inp.addEventListener("input", () => {
      if (inp.value.trim() === "") delete content.text[key];
      else content.text[key] = inp.value;
      pushPreview();
    });
    lab.appendChild(inp);
    return lab;
  }
  function defText(key) {
    const e = editable.find((x) => x.key === key);
    return e ? e.def : "";
  }

  /* =========================================================================
     پنلِ متن‌ها (خودکار از روی iframe)
     ========================================================================= */
  const GROUP_LABELS = {
    brand: "برند", nav: "منوی ناوبری", home: "خانه (سرصفحه)", menu: "منو",
    reserve: "رزرو میز", story: "داستان", contact: "تماس و مسیر", footer: "فوتر", social: "شبکه‌های اجتماعی",
  };
  function buildTextPanel() {
    const p = $("#panel-text"); if (!p) return;
    p.innerHTML = "<h2>متنِ بخش‌ها</h2><p class='panel__lead'>هر متن را تغییر بده؛ پیش‌نمایش بلافاصله به‌روز می‌شود. خالی‌گذاشتن یعنی همان متنِ پیش‌فرض.</p>";
    if (!editable.length) { p.appendChild(el("p", { class: "panel__lead" }, "فهرستِ متن‌ها در دسترس نیست (پیش‌نمایش بارگذاری نشد).")); return; }
    const groups = {};
    editable.forEach((e) => { (groups[e.group] = groups[e.group] || []).push(e); });
    Object.keys(groups).forEach((g) => {
      if (g === "brand") return; // در تبِ برند هست
      const card = el("div", { class: "card" });
      card.appendChild(el("h3", null, esc(GROUP_LABELS[g] || g)));
      groups[g].forEach((e) => {
        const long = (e.def || "").length > 42 || e.type === "html";
        const label = labelFor(e);
        card.appendChild(textField(label, e.key, long ? "area" : "text"));
      });
      p.appendChild(card);
    });
  }
  function labelFor(e) {
    const map = {
      "hero.title": "عنوانِ اصلی (می‌توانی <br> و <em> بگذاری)",
      "hero.sub": "زیرعنوان", "hero.eyebrow": "برچسبِ بالا", "hero.cta1": "دکمهٔ اول", "hero.cta2": "دکمهٔ دوم",
      "hero.ratingNum": "امتیاز", "hero.ratingCount": "تعدادِ نظر", "hero.hours": "ساعتِ کاری", "hero.badge": "برچسبِ صبحانه",
      "about.kicker": "تیترِ کوچک", "about.h2": "عنوان", "about.body": "متن", "contact.address": "نشانی",
      "contact.phone": "تلفن", "contact.hours": "ساعت", "social.instagram": "لینکِ اینستاگرام",
      "social.whatsapp": "لینکِ واتساپ", "social.tel": "لینکِ تماس (tel:)",
    };
    return map[e.key] || e.key;
  }

  /* =========================================================================
     ویرایشگرِ عمومیِ لیست (منو/دسته/نظرات/رویداد/باشگاه)
     ========================================================================= */
  function listPanel(id, title, lead, arrKey, fields, titleFn, swFn, blank) {
    const p = el("section", { class: "panel", id: "panel-" + id });
    p.appendChild(el("div", null, `<h2>${esc(title)}</h2><p class='panel__lead'>${esc(lead)}</p>`));
    const listWrap = el("div", { id: id + "List" });
    p.appendChild(listWrap);
    const addBtn = el("button", { class: "btn btn--primary btn--sm" }, "+ افزودنِ مورد");
    addBtn.addEventListener("click", () => {
      content.data[arrKey].push(clone(blank()));
      renderList(); pushPreviewReload();
    });
    p.appendChild(el("div", { class: "addbar" })).appendChild(addBtn);

    function renderList() {
      listWrap.innerHTML = "";
      content.data[arrKey].forEach((item, idx) => {
        const it = el("div", { class: "item" });
        const head = el("div", { class: "item__head" });
        const sw = el("span", { class: "item__sw" });
        if (swFn) sw.style.background = swFn(item); else sw.style.display = "none";
        const ttl = el("div", { class: "item__title" }, titleFn(item));
        const caret = el("span", { class: "item__caret" }, "▾");
        head.append(sw, ttl, caret);
        head.addEventListener("click", (e) => { if (e.target.closest("[data-del]")) return; it.classList.toggle("is-open"); });
        const body = el("div", { class: "item__body" });
        const grid = el("div", { class: "grid2" });
        fields.forEach((f) => grid.appendChild(fieldFor(item, f, () => { ttl.innerHTML = titleFn(item); if (swFn) sw.style.background = swFn(item); })));
        body.appendChild(grid);
        const del = el("button", { class: "btn btn--danger btn--sm", "data-del": "1" }, "حذفِ این مورد");
        del.addEventListener("click", () => { content.data[arrKey].splice(idx, 1); renderList(); pushPreviewReload(); });
        body.appendChild(el("div", { class: "addbar" })).appendChild(del);
        it.append(head, body);
        listWrap.appendChild(it);
      });
    }
    p._render = renderList;
    setTimeout(renderList, 0);
    return p;
  }

  function fieldFor(item, f, onChange) {
    const lab = el("label", { class: "lab" + (f.full ? " " : "") });
    if (f.full) lab.style.gridColumn = "1 / -1";
    lab.appendChild(el("span", null, esc(f.label)));
    let inp;
    if (f.type === "area") { inp = el("textarea"); inp.value = item[f.k] != null ? item[f.k] : ""; }
    else if (f.type === "select") {
      inp = el("select");
      f.opts().forEach((o) => { const op = el("option", { value: o.v }, esc(o.t)); inp.appendChild(op); });
      inp.value = item[f.k];
    } else if (f.type === "tags") {
      const box = el("div", { class: "tagpick" });
      const labels = (window.DAMSA.TAG_LABELS) || {};
      Object.keys(labels).forEach((tk) => {
        const id = "tag_" + Math.random().toString(36).slice(2);
        const cb = el("input", { type: "checkbox", id });
        cb.checked = Array.isArray(item.tags) && item.tags.includes(tk);
        cb.addEventListener("change", () => {
          item.tags = item.tags || [];
          if (cb.checked) { if (!item.tags.includes(tk)) item.tags.push(tk); }
          else item.tags = item.tags.filter((x) => x !== tk);
          onChange(); pushPreviewReload();
        });
        const l = el("label", { for: id }); l.append(cb, document.createTextNode(" " + labels[tk].fa));
        box.appendChild(l);
      });
      lab.appendChild(box); return lab;
    } else if (f.type === "image") {
      const box = el("div", { class: "imgfield" });
      const prev = el("div", { class: "imgfield__preview" });
      const setPrev = () => { prev.innerHTML = item[f.k] ? `<img src="${esc(item[f.k])}" alt="">` : "<span>بدونِ عکس — تصویرسازیِ پیش‌فرض نمایش داده می‌شود</span>"; };
      setPrev();
      const fileLab = el("label", { class: "btn btn--ghost btn--sm" }, "آپلودِ عکس");
      const file = el("input", { type: "file", accept: "image/*" }); file.hidden = true; fileLab.appendChild(file);
      const clear = el("button", { class: "btn btn--ghost btn--sm", type: "button" }, "حذفِ عکس");
      const status = el("span", { class: "imgfield__status" });
      const urlIn = el("input", { type: "text", placeholder: "یا آدرسِ URL عکس را بچسبان" }); urlIn.value = item[f.k] || "";
      file.addEventListener("change", async () => {
        if (!file.files[0]) return;
        status.textContent = "در حالِ آپلود…";
        try { const u = await uploadImage(file.files[0]); item[f.k] = u; urlIn.value = u; setPrev(); status.textContent = "آپلود شد ✓"; onChange(); pushPreviewReload(); }
        catch (_) { status.textContent = "خطا در آپلود"; toast("آپلودِ عکس ناموفق بود", "err"); }
        file.value = "";
      });
      urlIn.addEventListener("input", () => { const v = urlIn.value.trim(); if (v) item[f.k] = v; else delete item[f.k]; setPrev(); onChange(); pushPreviewReload(); });
      clear.addEventListener("click", () => { delete item[f.k]; urlIn.value = ""; setPrev(); status.textContent = ""; onChange(); pushPreviewReload(); });
      const btns = el("div", { class: "imgfield__btns" }); btns.append(fileLab, clear, status);
      box.append(prev, btns, urlIn);
      lab.appendChild(box); return lab;
    } else { inp = el("input", { type: f.type === "number" ? "number" : "text" }); inp.value = item[f.k] != null ? item[f.k] : ""; }
    inp.addEventListener("input", () => {
      item[f.k] = f.type === "number" ? (parseFloat(inp.value) || 0) : inp.value;
      onChange(); pushPreviewReload();
    });
    if (f.type === "select") inp.addEventListener("change", () => { item[f.k] = inp.value; onChange(); pushPreviewReload(); });
    lab.appendChild(inp);
    return lab;
  }

  // پیش‌نمایشِ داده‌ها (منو و…) فقط با بازخوانی دیده می‌شود؛ با تأخیر iframe را تازه می‌کنیم
  let reloadTimer = null;
  function pushPreviewReload() {
    pushPreview();
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => { /* بازخوانیِ خودکارِ سبک پس از مکث */ }, 1200);
  }

  const courseOpts = () => (content.data.courses || []).map((c) => ({ v: c.id, t: c.fa }));
  const artOpts = () => Object.keys(window.DAMSA.ART || {}).map((k) => ({ v: k, t: k }));

  function dishesPanel() {
    return listPanel("dishes", "غذاها", "غذاهای منو را اضافه، ویرایش یا حذف کن. هر غذا می‌تواند عکس داشته باشد. تغییرات پس از «ذخیره» روی سایت دیده می‌شود.", "dishes",
      [
        { k: "image", label: "عکسِ غذا", type: "image", full: true },
        { k: "name", label: "نام", full: true },
        { k: "en", label: "نامِ انگلیسی" },
        { k: "price", label: "قیمت (تومان)", type: "number" },
        { k: "course", label: "دوره", type: "select", opts: courseOpts },
        { k: "art", label: "طرحِ رنگ", type: "select", opts: artOpts },
        { k: "desc", label: "توضیح", type: "area", full: true },
        { k: "kcal", label: "کالری", type: "number" },
        { k: "illus", label: "نامِ تصویر (plate/steak/…)", },
        { k: "tags", label: "برچسب‌ها", type: "tags", full: true },
      ],
      (it) => esc(it.name || "بدون‌نام") + ` <small>${fmtPrice(it.price)} تومان</small>`,
      (it) => artBG(it.art),
      () => ({ id: "x" + Date.now().toString(36), course: (content.data.courses[0] || {}).id || "main", name: "غذای جدید", en: "", price: 200000, desc: "", kcal: 0, art: "ember", illus: "plate", tags: [] }));
  }
  function coursesPanel() {
    return listPanel("courses", "دوره‌ها", "دوره‌های منو (پیش‌غذا، غذای اصلی، …). id باید یکتا و انگلیسی باشد.", "courses",
      [
        { k: "id", label: "شناسه (انگلیسی، یکتا)" },
        { k: "fa", label: "نامِ فارسی" },
        { k: "en", label: "نامِ انگلیسی" },
      ],
      (it) => esc(it.fa || it.id), null,
      () => ({ id: "c" + Date.now().toString(36), fa: "دورهٔ جدید", en: "New" }));
  }
  function testiPanel() {
    return listPanel("testi", "نظرات", "نظرِ مهمان‌ها در بخشِ داستان.", "testimonials",
      [
        { k: "name", label: "نام" },
        { k: "role", label: "نقش/توضیح (مثلاً مهمانِ ثابت)" },
        { k: "rating", label: "امتیاز (۱ تا ۵)", type: "number" },
        { k: "text", label: "متنِ نظر", type: "area", full: true },
      ],
      (it) => esc(it.name || "بدون‌نام"), null,
      () => ({ name: "مهمانِ جدید", role: "", rating: 5, text: "" }));
  }

  /* آپلودِ عکس: در مرورگر کوچک می‌شود (حداکثر ۱۲۸۰px) بعد به سرور می‌رود */
  function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
  async function uploadImage(file) {
    const dataURL = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    const img = await loadImg(dataURL);
    const max = 1280; let w = img.width, h = img.height;
    if (w > max || h > max) { const s = Math.min(max / w, max / h); w = Math.round(w * s); h = Math.round(h * s); }
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    cv.getContext("2d").drawImage(img, 0, 0, w, h);
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise((res) => cv.toBlob(res, type, 0.85));
    const r = await fetch("api/upload", { method: "POST", headers: { "Content-Type": blob.type, "Authorization": "Bearer " + token }, body: blob });
    if (!r.ok) throw new Error("upload");
    return (await r.json()).url;
  }

  const fmtPrice = (n) => (Number(n) || 0).toLocaleString("fa-IR");
  function artBG(key) { const a = (window.DAMSA.ART || {})[key] || ["#2A1C12", "#0E0906"]; return `linear-gradient(150deg,${a[0]},${a[1]})`; }

  /* =========================================================================
     ذخیره
     ========================================================================= */
  async function save() {
    const st = $("#saveStatus"); st.textContent = "در حالِ ذخیره…"; st.className = "abar__status busy";
    try {
      const res = await fetch("api/content", {
        method: "PUT", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify(content),
      });
      if (res.status === 401) { st.textContent = ""; toast("نشستِ شما منقضی شد؛ دوباره وارد شو", "err"); setTimeout(() => location.reload(), 1200); return; }
      if (!res.ok) throw new Error("save");
      st.textContent = "ذخیره شد ✓"; st.className = "abar__status ok";
      toast("تغییرات منتشر شد ✓", "ok");
      previewReady = false; iframe.src = "./?preview=1&t=" + Date.now();
      setTimeout(() => { st.textContent = ""; st.className = "abar__status"; }, 2500);
    } catch (_) { st.textContent = ""; toast("ذخیره ناموفق بود", "err"); }
  }
  $("#saveBtn").addEventListener("click", save);
  addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } });

  /* اگر توکن داریم، مستقیم وارد شو */
  if (token) { start().catch(() => { sessionStorage.removeItem("damsa-admin-token"); }); }
})();

/* ===========================================================================
   رستوران دمسا · app.js (قالب ۲)
   روترِ صحنه‌به‌صحنه (منو‌محور)، رندرِ منو، مودالِ غذا، شمارنده‌ها،
   مارکی، نظرات و فرمِ رزرو — با حرکت‌های روان.
   =========================================================================== */
(function () {
  "use strict";
  function start() {
    const D = window.DAMSA || {};
    const { TOMAN, COURSES = [], TAG_LABELS = {}, ART = {}, DISHES = [], TESTIMONIALS = [] } = D;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const fmt = (n) => (TOMAN ? TOMAN(n) : n);
    const esc = (s) => String(s == null ? "" : s).replace(/"/g, "&quot;");
    const artBG = (k) => { const a = ART[k] || ["#3A1414", "#120707"]; return `linear-gradient(150deg,${a[0]},${a[1]})`; };
    const hasImg = (m) => m && typeof m.image === "string" && m.image.trim() !== "";
    const dtag = (k) => { const t = TAG_LABELS[k]; return t ? `<span class="dtag dtag--${t.tone}">${t.fa}</span>` : ""; };
    const toast = (msg) => { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; $("#toastWrap").appendChild(t); setTimeout(() => t.remove(), 2800); };

    /* لودر */
    setTimeout(() => { const b = $("#boot"); if (b) b.classList.add("is-done"); }, 350);

    /* تم */
    const root = document.documentElement;
    const saved = localStorage.getItem("damsa-rest-theme");
    if (saved) root.setAttribute("data-theme", saved);
    $("#themeToggle").addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next); localStorage.setItem("damsa-rest-theme", next);
    });

    /* ----------------------------- روترِ صحنه ----------------------------- */
    const scenes = $$(".scene");
    const validIds = scenes.map((s) => s.id.replace("scene-", ""));
    const sheet = $("#msheet");
    const closeSheet = () => { sheet.classList.remove("is-open"); sheet.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked"); };
    function go(id) {
      if (!validIds.includes(id)) id = "home";
      scenes.forEach((s) => s.classList.toggle("is-active", s.id === "scene-" + id));
      $$("[data-scene]").forEach((a) => a.classList.toggle("is-active", a.dataset.scene === id));
      const sc = $("#scene-" + id); if (sc) sc.scrollTop = 0;
      if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
      if (id === "home") runCounters();
      if (id === "menu") replayDishes();
      closeSheet();
    }
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-scene]"); if (!a) return;
      e.preventDefault(); go(a.dataset.scene);
    });
    addEventListener("hashchange", () => go(location.hash.replace("#", "")));

    /* منوی موبایل */
    $("#burger").addEventListener("click", () => { sheet.classList.add("is-open"); sheet.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked"); });
    $("#msheetClose").addEventListener("click", closeSheet);

    /* ----------------------------- شمارنده‌ها ----------------------------- */
    function runCounters() {
      $$("[data-count-to]").forEach((el) => {
        const to = parseFloat(el.dataset.countTo); const dec = parseInt(el.dataset.decimal || "0", 10);
        if (reduce) { el.textContent = fmt(dec ? to.toFixed(dec) : to); return; }
        const dur = 1100, t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = to * e;
          el.textContent = fmt(dec ? v.toFixed(dec) : Math.round(v));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }

    /* ----------------------------- مارکی ----------------------------- */
    const words = DISHES.filter((d) => (d.tags || []).some((t) => t === "chef" || t === "signature")).map((d) => d.name);
    const base = (words.length ? words : ["آشپزیِ خلاق", "موادِ فصلی", "گریلِ زغالی"]).concat(["رزروِ آنلاین", "فضای دنج"]);
    const seg = base.map((w) => `${w} <i>✦</i>`).join(" ");
    $("#marquee").innerHTML = `<span>${seg}</span><span>${seg}</span>`;

    /* ----------------------------- منو ----------------------------- */
    let activeCourse = COURSES[0] ? COURSES[0].id : "";

    /* ---------- چرخِ انتخابِ دسته (دیسکِ سی‌دیِ چرخان) ---------- */
    const wheel = $("#wheel"), disc = $("#wheelDisc");
    const N = COURSES.length, SEG = N ? 360 / N : 0;
    const rad = (d) => d * Math.PI / 180;
    const CCOLORS = ["#C0392B", "#C99A3B", "#3F9B6D", "#2F8F86", "#9B59B6", "#E67E22", "#1ABC9C"];
    const cc = (i) => CCOLORS[i % CCOLORS.length];
    let rot = 0, selIdx = 0, dragging = false, hover = false, moved = false;
    // سکتورهای خیلی کم‌رنگ روی خودِ دیسک (هم‌تراز با برچسب‌ها)
    if (N) {
      const stops = COURSES.map((c, i) => `color-mix(in srgb, ${cc(i)} 17%, transparent) ${i * SEG}deg ${(i + 1) * SEG}deg`).join(",");
      disc.style.setProperty("--sectors", `conic-gradient(from -90deg, ${stops})`);
    }
    disc.innerHTML = COURSES.map((c, i) =>
      `<button class="wheel__item" data-idx="${i}" data-course="${c.id}" type="button" style="--cc:${cc(i)}"><span>${c.fa}</span></button>`).join("");
    const items = $$(".wheel__item", disc);
    function itemAngle(i) { return -90 + i * SEG + SEG / 2; } // مرکزِ سکتور
    function layoutWheel() {
      const D = disc.offsetWidth || 1; const c = D / 2; const Rr = D * 0.3;
      items.forEach((el, i) => {
        const a = itemAngle(i);
        el.style.left = (c + Rr * Math.cos(rad(a))) + "px";
        el.style.top = (c + Rr * Math.sin(rad(a))) + "px";
        el.style.transform = `translate(-50%,-50%) rotate(${a - 90}deg)`; // شعاعی: بالا به مرکز
      });
    }
    function drawWheel() { disc.style.transform = `rotate(${rot}deg)`; }
    function selectCourse(i) {
      if (!N) return; i = ((i % N) + N) % N; selIdx = i;
      items.forEach((el, k) => el.classList.toggle("is-on", k === i));
      const c = COURSES[i];
      const fa = $("#wheelFa"); fa.textContent = c.fa; fa.style.color = cc(i);
      $("#wheelEn").textContent = c.en || "";
      if (activeCourse !== c.id) {
        activeCourse = c.id; const w = $("#dishList"); w.classList.add("is-switching");
        setTimeout(() => { menuScene.scrollTop = 0; renderDishes(); w.classList.remove("is-switching"); }, 200);
      }
    }
    disc.addEventListener("click", (e) => { if (moved) return; const b = e.target.closest(".wheel__item"); if (b) selectCourse(+b.dataset.idx); });
    /* چرخشِ نرمِ خودکار + درگِ دستی (بدونِ pointer-capture تا کلیک کار کند) */
    let lastA = 0;
    const angAt = (ev) => { const r = disc.getBoundingClientRect(); return Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
    wheel.addEventListener("pointerenter", () => hover = true);
    wheel.addEventListener("pointerleave", () => hover = false);
    wheel.addEventListener("pointerdown", (e) => { dragging = true; moved = false; lastA = angAt(e); });
    addEventListener("pointermove", (e) => { if (!dragging) return; const a = angAt(e); let d = a - lastA; if (d > 180) d -= 360; if (d < -180) d += 360; if (Math.abs(d) > 1.2) moved = true; rot += d; lastA = a; drawWheel(); });
    addEventListener("pointerup", () => { dragging = false; setTimeout(() => { moved = false; }, 40); });
    addEventListener("resize", () => { layoutWheel(); drawWheel(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layoutWheel(); drawWheel(); });
    function spin() { if (!dragging && !hover && !reduce) { rot += 0.06; drawWheel(); } requestAnimationFrame(spin); }
    requestAnimationFrame(spin);
    const dishRow = (d, i) => `
      <article class="dcard" data-dish="${d.id}" style="transition-delay:${((i % 6) * 0.06).toFixed(2)}s">
        <div class="dcard__media ${hasImg(d) ? "has-img" : ""}" style="background:${artBG(d.art)}">
          ${hasImg(d) ? `<img src="${esc(d.image)}" alt="${esc(d.name)}" loading="lazy" decoding="async">` : `<svg class="dcard__illus" viewBox="0 0 120 120"><use href="#illus-${d.illus || "plate"}"></use></svg>`}
          <span class="dcard__price">${fmt(d.price)} <small>تومان</small></span>
          ${(d.tags || []).slice(0, 2).map(dtag).join("")}
          <span class="dcard__view"><svg class="ic"><use href="#i-arrow"></use></svg></span>
        </div>
        <div class="dcard__body">
          <div class="dcard__top"><h3 class="dcard__name">${d.name}</h3>${d.kcal ? `<span class="dcard__kcal"><svg class="ic"><use href="#i-flame"></use></svg>${fmt(d.kcal)}</span>` : ""}</div>
          <div class="dcard__en">${d.en || ""}</div>
          <p class="dcard__desc">${d.desc || ""}</p>
        </div>
      </article>`;

    const menuScene = $("#scene-menu");
    let io = null;
    function observeDishes() {
      if (io) io.disconnect();
      if (reduce) { $$(".dcard").forEach((el) => el.classList.add("is-in")); return; }
      io = new IntersectionObserver((ents) => {
        ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
      }, { root: menuScene, threshold: 0.18 });
      $$(".dcard").forEach((el) => io.observe(el));
    }
    function renderDishes() {
      const list = DISHES.filter((d) => d.course === activeCourse);
      const wrap = $("#dishList");
      wrap.innerHTML = list.length ? list.map(dishRow).join("") : `<p class="scene__lead" style="text-align:center;padding:40px">آیتمی در این دسته نیست.</p>`;
      observeDishes();
    }
    function replayDishes() { menuScene.scrollTop = 0; renderDishes(); layoutWheel(); drawWheel(); }
    renderDishes();
    layoutWheel(); selectCourse(0);

    /* مودالِ غذا */
    const modal = $("#dishModal"), panel = $("#dishPanel");
    const byId = Object.fromEntries(DISHES.map((d) => [d.id, d]));
    const openDish = (id) => {
      const d = byId[id]; if (!d) return;
      panel.innerHTML = `
        <div class="dm__media ${hasImg(d) ? "has-img" : ""}" style="background:${artBG(d.art)}">
          ${hasImg(d) ? `<img src="${esc(d.image)}" alt="${esc(d.name)}">` : `<svg class="illus" viewBox="0 0 120 120"><use href="#illus-${d.illus || "plate"}"></use></svg>`}
          <button class="dm__close" data-close aria-label="بستن"><svg class="ic"><use href="#i-close"></use></svg></button>
        </div>
        <div class="dm__body">
          <div class="dm__head"><div><div class="dm__name">${d.name}</div><div class="dm__en">${d.en || ""}</div></div><div class="dm__price">${fmt(d.price)}</div></div>
          <p class="dm__desc">${d.desc || ""}</p>
          <div class="dm__facts">
            ${d.kcal ? `<span class="dm__fact"><svg class="ic"><use href="#i-flame"></use></svg>${fmt(d.kcal)} کالری</span>` : ""}
            ${(d.tags || []).map(dtag).join("")}
          </div>
        </div>`;
      modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked");
    };
    const closeDish = () => { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked"); };
    document.addEventListener("click", (e) => {
      const d = e.target.closest("[data-dish]"); if (d) return openDish(d.dataset.dish);
      if (e.target.closest("[data-close]") || e.target.classList.contains("dmodal__scrim")) closeDish();
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDish(); closeSheet(); } });

    /* ----------------------------- نظرات ----------------------------- */
    const track = $("#testiTrack");
    track.innerHTML = TESTIMONIALS.map((t) => `
      <article class="tcard">
        <div class="tcard__stars">${"<svg class='ic'><use href='#i-star'></use></svg>".repeat(t.rating || 5)}</div>
        <p class="tcard__text">«${t.text}»</p>
        <div class="tcard__who"><b>${t.name}</b> — <span>${t.role || ""}</span></div>
      </article>`).join("");
    let ti = 0;
    if (TESTIMONIALS.length > 1) setInterval(() => {
      ti = (ti + 1) % TESTIMONIALS.length;
      track.style.transform = `translateX(${ti * 100}%)`; // RTL: مثبت به‌سمتِ بعدی
    }, 4500);

    /* راه‌اندازیِ اولیه از روی هش */
    go((location.hash || "#home").replace("#", ""));
    runCounters();
  }

  if (window.__DAMSA_READY__) start();
  else document.addEventListener("damsa:ready", start, { once: true });
})();

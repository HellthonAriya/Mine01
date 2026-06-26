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
    $("#courseTabs").innerHTML = COURSES.map((c, i) =>
      `<button class="course ${i === 0 ? "is-on" : ""}" data-course="${c.id}" role="tab">${c.fa}</button>`).join("");
    const dishRow = (d, i) => `
      <article class="dish" data-dish="${d.id}" style="animation-delay:${(i * 0.05).toFixed(2)}s">
        <div class="dish__thumb ${hasImg(d) ? "has-img" : ""}" style="background:${artBG(d.art)}">
          ${hasImg(d) ? `<img src="${esc(d.image)}" alt="${esc(d.name)}" loading="lazy" decoding="async">` : `<svg viewBox="0 0 120 120"><use href="#illus-${d.illus || "plate"}"></use></svg>`}
        </div>
        <div class="dish__main">
          <div class="dish__top"><span class="dish__name">${d.name}</span><span class="dish__leader"></span><span class="dish__price">${fmt(d.price)}</span></div>
          <div class="dish__desc">${d.desc || ""}</div>
          <div class="dish__tags">${(d.tags || []).map(dtag).join("")}</div>
        </div>
        <span class="dish__go"><svg class="ic"><use href="#i-arrow"></use></svg></span>
      </article>`;
    function renderDishes() {
      const list = DISHES.filter((d) => d.course === activeCourse);
      $("#dishList").innerHTML = list.length ? list.map(dishRow).join("") : `<p class="scene__lead" style="text-align:center">آیتمی در این دسته نیست.</p>`;
    }
    function replayDishes() { renderDishes(); } // رندرِ مجدد → انیمیشنِ ورود دوباره پخش می‌شود
    $("#courseTabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-course]"); if (!b) return;
      activeCourse = b.dataset.course;
      $$("#courseTabs .course").forEach((c) => c.classList.toggle("is-on", c.dataset.course === activeCourse));
      renderDishes();
    });
    renderDishes();

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
          <div class="dm__foot"><button class="btn btn--gold" data-scene="reserve">برای چشیدن، میز رزرو کن</button></div>
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

    /* فرمِ رزرو */
    $("#reserveForm").addEventListener("submit", (e) => {
      e.preventDefault(); toast("درخواستِ رزرو ثبت شد! به‌زودی تماس می‌گیریم ✓"); e.target.reset();
    });

    /* راه‌اندازیِ اولیه از روی هش */
    go((location.hash || "#home").replace("#", ""));
    runCounters();
  }

  if (window.__DAMSA_READY__) start();
  else document.addEventListener("damsa:ready", start, { once: true });
})();

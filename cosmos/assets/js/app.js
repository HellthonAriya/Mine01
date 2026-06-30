/* ===========================================================================
   ایستگاهِ فضاییِ دمسا · app.js (قالب ۳ — کیهان)
   موتورِ سفرِ سه‌بعدی: استارفیلدِ کانواس، سیاره‌های چرخان، چیدمانِ مداریِ
   هولوکارت‌ها، عمقِ اسکرول، پارالاکسِ اشاره‌گر، مودالِ آیتم، کاروسلِ نظرات،
   شمارنده‌ها — همه با transform/opacity و سازگار با prefers-reduced-motion.
   =========================================================================== */
(function () {
  "use strict";
  function start() {
    const D = window.DAMSA || {};
    const { TOMAN, PLANETS = [], TAG_LABELS = {}, DISHES = [], TESTIMONIALS = [] } = D;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
    const fmt = (n) => (TOMAN ? TOMAN(n) : n);
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    let desktop = matchMedia("(min-width:901px)").matches;
    const toast = (msg) => { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; const w = $("#toastWrap"); if (!w) return; w.appendChild(t); setTimeout(() => t.remove(), 2600); };

    const glyph = (g) => `<svg class="ic"><use href="#g-${esc(g || "orbit")}"/></svg>`;
    const dtag = (k) => { const t = TAG_LABELS[k]; return t ? `<span class="dtag dtag--${t.tone}">${esc(t.fa)}</span>` : ""; };
    const dishesOf = (pid) => DISHES.filter((d) => d.planet === pid);

    /* ===================================================================
       ۱) ساختِ سیستمِ سیاره‌ها
       =================================================================== */
    const systems = $("#systems");
    const spritePlanets = [];                 // سیاره‌هایی که مدلِ سه‌بعدی (sprite-sheet) دارند
    PLANETS.forEach((p, idx) => {
      const ds = dishesOf(p.id);
      const surf1 = p.surf1 || (p.surface && p.surface[0]) || "#444";
      const surf2 = p.surf2 || (p.surface && p.surface[1]) || "#111";
      const sp = p.sprite && p.sprite.src ? p.sprite : null;   // {src, frames}
      const frames = sp ? Math.max(2, parseInt(sp.frames, 10) || 48) : 0;
      const sec = document.createElement("section");
      sec.className = "bay bay--system";
      sec.id = "sys-" + p.id;
      sec.dataset.planet = p.id;
      sec.style.cssText = `--accent:${p.accent};--accent2:${p.accent2};--surf1:${surf1};--surf2:${surf2};--dot:${p.accent}`;
      sec.innerHTML = `
        <div class="system">
          <div class="system__view">
            <div class="system__scene">
              <div class="planet${sp ? " planet--sprite" : ""}" aria-hidden="true"${sp ? ` style="--frames:${frames}"` : ""}>
                <span class="planet__halo"></span>
                <span class="planet__body"${sp ? ` data-sprite="${esc(sp.src)}"` : ""}></span>
                ${p.ring ? '<span class="planet__ring"></span>' : ""}
                <span class="planet__moon"></span>
              </div>
              <div class="hudcard">
                <span class="hudcard__code">${esc(p.code || "KP-0" + (idx + 1))} · ${esc(p.en || "")}</span>
                <h2 class="hudcard__name">${esc(p.fa)}</h2>
                <p class="hudcard__tag">${esc(p.tagline || "")}</p>
                <span class="hudcard__count">${ds.length} ماهواره در مدار</span>
              </div>
              <div class="orbits">
                ${ds.map((d, i) => `
                  <article class="holo" data-dish="${esc(d.id)}" tabindex="0" role="button" style="--i:${i}" aria-label="${esc(d.name)}">
                    <span class="holo__glow"></span>
                    <button class="holo__add" data-add="${esc(d.id)}" type="button" aria-label="افزودن «${esc(d.name)}» به یادداشت"><svg class="ic"><use href="#i-plus"/></svg></button>
                    ${d.img
                      ? `<div class="holo__media"><img src="${esc(d.img)}" alt="${esc(d.name)}" loading="lazy" decoding="async"></div>`
                      : `<div class="holo__icon">${glyph(d.glyph || p.glyph)}</div>`}
                    <h3 class="holo__name">${esc(d.name)}</h3>
                    ${d.en ? `<p class="holo__en">${esc(d.en)}</p>` : ""}
                    <p class="holo__desc">${esc(d.desc || "")}</p>
                    <div class="holo__tags">${(d.tags || []).map(dtag).join("")}</div>
                    <div class="holo__foot">
                      <span class="holo__kcal">${d.kcal ? esc(d.kcal) + " کیلوکالری" : ""}</span>
                      <span class="holo__price">${fmt(d.price)}<small>تومان</small></span>
                    </div>
                  </article>`).join("")}
              </div>
            </div>
            <div class="orbnav" aria-hidden="true">
              <button class="orbnav__btn orbnav__btn--prev" type="button" data-orbnav="-1" aria-label="آیتمِ قبلی"><svg class="ic"><use href="#i-chevron"/></svg></button>
              <button class="orbnav__btn orbnav__btn--next" type="button" data-orbnav="1" aria-label="آیتمِ بعدی"><svg class="ic"><use href="#i-chevron"/></svg></button>
            </div>
          </div>
        </div>`;
      systems.appendChild(sec);
      if (sp) spritePlanets.push({ el: $(".planet", sec), body: $(".planet__body", sec), frames, src: sp.src, cur: -1, loaded: false });
    });

    /* ===================================================================
       ۲) ناوبری: HUD nav + نقطه‌های کناری
       =================================================================== */
    const navWrap = $("#hudNav"), dotsWrap = $("#dots");
    const sectionsForNav = [{ id: "launchpad", fa: "پرتاب", glyph: "rocket", dot: "#7C5CFF" }]
      .concat(PLANETS.map((p) => ({ id: "sys-" + p.id, fa: p.fa, glyph: p.glyph, dot: p.accent })))
      .concat([{ id: "dock", fa: "ایستگاه", glyph: "pin", dot: "#28E0C8" }]);
    sectionsForNav.forEach((s) => {
      const a = document.createElement("a");
      a.href = "#" + s.id;
      a.dataset.target = s.id;
      a.style.cssText = `--dot:${s.dot}`;
      a.innerHTML = `<svg class="ic"><use href="#${s.glyph === "rocket" || s.glyph === "pin" ? "i-" : "g-"}${s.glyph}"/></svg><span>${esc(s.fa)}</span>`;
      navWrap.appendChild(a);

      const b = document.createElement("button");
      b.type = "button"; b.dataset.target = s.id; b.style.cssText = `--dot:${s.dot}`;
      b.innerHTML = `<span class="dot"></span><span class="dot-label">${esc(s.fa)}</span>`;
      b.addEventListener("click", () => scrollToId(s.id));
      dotsWrap.appendChild(b);
    });
    function scrollToId(id) {
      const t = document.getElementById(id);
      if (!t) return;
      const base = t.getBoundingClientRect().top + scrollY;
      // برای صحنه‌های سیاره: به‌جای ابتدای صحنه (که سیاره هنوز از دور نامرئی است)،
      // به لحظه‌ای پیمایش کن که سیاره و آیتم‌هایش در نمایان‌ترین حالت‌اند (raw ≈ 0.5).
      let top = base;
      if (t.classList.contains("bay--system") && !reduce) {
        // ابتدای ناحیهٔ توقف: raw ≈ 0.20 → سیاره کاملاً واضح، همه‌چیز ساکن
        top = base + t.offsetHeight * 0.20;
      }
      scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
    function closeNav() {
      hud.classList.remove("is-navopen");
      if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    }
    navWrap.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-target]"); if (!a) return;
      e.preventDefault(); scrollToId(a.dataset.target); closeNav();
    });

    /* هر لینکِ داخلیِ #... (دکمهٔ «شروع سفر»، فلشِ اسکرول، لوگو) هم به‌جای پرشِ خام،
       به لحظهٔ نمایانِ همان بخش پیمایش کند (نه ابتدای صحنه که سیاره هنوز دیده نمی‌شود). */
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.closest("#hudNav")) return;
      const id = a.getAttribute("href").slice(1);
      if (id && document.getElementById(id)) { e.preventDefault(); scrollToId(id); }
    });

    /* منوی کشویی سیاره‌ها در موبایل (تا همهٔ کتگوری‌ها در دسترس باشند) */
    const menuBtn = $("#hudMenu");
    if (menuBtn) {
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = hud.classList.toggle("is-navopen");
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.addEventListener("click", (e) => {
        if (hud.classList.contains("is-navopen") && !e.target.closest("#hud")) closeNav();
      });
      addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
    }

    /* پیمایشِ عرضیِ آیتم‌ها با دکمه (موبایل) — بر اساسِ موقعیتِ دیداریِ واقعیِ کارت‌ها
       روی صفحه کار می‌کند (نه ترتیبِ DOM)، تا در چیدمانِ RTL هم چپ/راست درست باشد.
       vdir = -1 یعنی «کارتِ سمتِ چپ» ، vdir = +1 یعنی «کارتِ سمتِ راست». */
    function orbStep(orbits, vdir) {
      const cards = $$(".holo", orbits); if (!cards.length) return;
      const mid = orbits.getBoundingClientRect().left + orbits.clientWidth / 2;
      const cx = cards.map((c) => { const r = c.getBoundingClientRect(); return r.left + r.width / 2; });
      // کارتِ فعلیِ وسط
      let cur = 0, best = Infinity;
      cx.forEach((x, i) => { const d = Math.abs(x - mid); if (d < best) { best = d; cur = i; } });
      // نزدیک‌ترین کارت در جهتِ دیداریِ خواسته‌شده
      let target = -1, gapBest = Infinity;
      cx.forEach((x, i) => {
        const gap = (x - cx[cur]) * vdir;            // > 0 یعنی در جهتِ درخواستی
        if (gap > 6 && gap < gapBest) { gapBest = gap; target = i; }
      });
      if (target < 0) return;
      cards[target].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "center" });
    }
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-orbnav]"); if (!btn) return;
      const orbits = $(".orbits", btn.closest(".system__view"));
      if (orbits) orbStep(orbits, parseInt(btn.dataset.orbnav, 10));
    });

    /* ===================================================================
       ۳) استارفیلدِ کانواس — سبک: فقط ستاره‌های نقطه‌ایِ سوسوزن (بدونِ خط‌های warp)
       تعدادِ کم، توقف هنگام مخفی‌بودنِ تب و کاهشِ نرخِ فریم برای سبکیِ بیشتر.
       =================================================================== */
    (function starfield() {
      const cv = $("#starfield"); if (!cv) return;
      const ctx = cv.getContext("2d", { alpha: true });
      const DPR = Math.min(devicePixelRatio || 1, 1.5);   // سقفِ پایین‌ترِ DPR = پرکردنِ کمترِ پیکسل
      let W = 0, H = 0, stars = [];
      function resize() {
        W = cv.width = Math.floor(innerWidth * DPR);
        H = cv.height = Math.floor(innerHeight * DPR);
        cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px";
        const n = innerWidth < 680 ? 42 : 80;             // تعدادِ بسیار کمتر از قبل (۹۰/۱۷۰)
        stars = Array.from({ length: n }, () => {
          const depth = Math.random();                    // 0 دور … 1 نزدیک
          return {
            x: Math.random(), y: Math.random(), depth,
            r: (0.5 + depth * 1.4) * DPR,
            tw: Math.random() * Math.PI * 2,
            tws: 0.5 + Math.random() * 1.2,
            glow: depth > 0.86,                           // فقط معدودی ستاره هاله دارند
            hue: Math.random() < 0.16 ? (Math.random() < 0.5 ? "#bcd0ff" : "#ffd9a8") : "#ffffff",
          };
        });
      }
      resize(); addEventListener("resize", resize, { passive: true });

      let t = 0, raf = 0, last = 0;
      const FRAME_MS = 1000 / 30;                          // ۳۰fps کافی است (سوسوی نرم)
      function frame(now) {
        raf = requestAnimationFrame(frame);
        if (now - last < FRAME_MS) return;                 // throttle به ~۳۰fps
        last = now;
        t += 0.05;
        ctx.clearRect(0, 0, W, H);
        const sx = camX * 22 * DPR, sy = camY * 22 * DPR, scr = scrollProg * 120 * DPR;
        for (const s of stars) {
          const px = ((s.x * W + sx * (0.3 + s.depth)) % W + W) % W;
          const py = ((s.y * H + sy * (0.3 + s.depth) + scr * (0.2 + s.depth)) % H + H) % H;
          const a = 0.4 + 0.4 * (0.5 + 0.5 * Math.sin(t * s.tws + s.tw)) * (0.5 + s.depth);
          ctx.globalAlpha = a; ctx.fillStyle = s.hue;
          ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI * 2); ctx.fill();
          if (s.glow) { ctx.globalAlpha = a * 0.35; ctx.beginPath(); ctx.arc(px, py, s.r * 2.6, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
      }
      function play() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
      function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      if (reduce) { frame(performance.now()); }            // یک‌بار رسم، بدونِ انیمیشن
      else {
        play();
        document.addEventListener("visibilitychange", () => (document.hidden ? stop() : play()));
      }
    })();

    /* ===================================================================
       ۴) چیدمانِ مداریِ هولوکارت‌ها (دسکتاپ و موبایل)
       =================================================================== */
    function layoutOrbits() {
      desktop = matchMedia("(min-width:901px)").matches;
      // آیتم‌ها در همهٔ عرض‌ها اسلایدرِ افقیِ چپ/راست‌اند (CSS می‌چیند)؛ اینجا فقط
      // موقعیت‌های مطلقِ قدیمیِ بادبزن (اگر مانده باشند) پاک می‌شوند.
      $$(".holo").forEach((h) => { h.style.left = h.style.top = ""; h.style.removeProperty("--z"); });
    }

    /* تعاملِ کارت: کجیِ سه‌بعدی بر اساسِ اشاره‌گر */
    $$(".holo").forEach((h) => {
      if (!reduce) h.addEventListener("pointermove", (e) => {
        if (!desktop) return;
        const r = h.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        h.style.setProperty("--ry", (nx * 12).toFixed(2) + "deg");
        h.style.setProperty("--rx", (-ny * 12).toFixed(2) + "deg");
      });
      h.addEventListener("pointerleave", () => { h.style.setProperty("--rx", "0deg"); h.style.setProperty("--ry", "0deg"); });
      const open = () => openModal(h.dataset.dish);
      h.addEventListener("click", (e) => {
        const add = e.target.closest(".holo__add");
        if (add) { e.stopPropagation(); addToList(add.dataset.add); return; }
        open();
      });
      h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });

    /* نمایانیِ مدارها هنگامِ ورود به صحنه */
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) $(".orbits", en.target).classList.add("is-in"); });
    }, { threshold: 0.15 });
    $$(".bay--system").forEach((s) => io.observe(s));

    /* ===================================================================
       ۵) موتورِ اسکرول: عمقِ صحنه، نوارِ پیشرفت، حالتِ فعال
       =================================================================== */
    const hud = $("#hud"), warpFill = $("#warpFill");
    const navLinks = $$("#hudNav a"), dotBtns = $$("#dots button");
    const allBays = () => $$(".bay, #launchpad, #dock");
    let scrollProg = 0, camX = 0, camY = 0, tcamX = 0, tcamY = 0;
    const systemSecs = $$(".bay--system");
    const root = document.documentElement;
    const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

    function onScroll() {
      const y = scrollY, vh = innerHeight;
      const docH = document.documentElement.scrollHeight - vh;
      scrollProg = docH > 0 ? clamp(y / docH, 0, 1) : 0;
      warpFill.style.width = (scrollProg * 100).toFixed(2) + "%";
      hud.classList.toggle("is-stuck", y > 40);

      // چرخشِ سطحِ سیاره‌ها با اسکرول (حسِ چرخشِ کره)
      root.style.setProperty("--spin", (reduce ? 0 : y * 0.6).toFixed(1));

      // سفرِ عمقی: هر سیاره از دور می‌آید، از کنارِ بیننده رد می‌شود و محو می‌شود
      systemSecs.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (reduce) {
          sec.style.cssText += ";--p:1;--pz:0px;--pvis:1;--hud:1;--orb:1;--cz:0px;--rotY:0deg;--rotX:0deg;--pscale:1";
          return;
        }
        // raw روی کلِ ارتفاعِ بخش نگاشت می‌شود (نه offsetHeight - vh) تا «دنبالهٔ خالیِ»
        // ۱۰۰vh بعد از پروازِ سیاره حذف شود؛ سیاره تا لحظهٔ خروجِ صحنه نمایان می‌ماند و
        // سیارهٔ بعدی بلافاصله می‌آید (فاصلهٔ خالیِ بینِ سیاره‌ها به‌حداقل می‌رسد).
        const total = sec.offsetHeight;
        if (total > 60) {
          // صحنهٔ چسبان → پروازِ عمقی (هم دسکتاپ هم موبایل)
          const raw = clamp(-rect.top / total, 0, 1);
          sec.style.setProperty("--p", raw.toFixed(3));

          // ناحیهٔ توقف (dwell): raw بین D_START و D_END همهٔ متغیرهای انیمیشن
          // (zoom/rotY/cz) قفل می‌شوند تا محتوا بی‌حرکت بماند؛ فقط sprite سیاره
          // با اسکرول می‌چرخد (چون به scrollY مطلق وابسته است، نه raw).
          const D_S = 0.20, D_E = 0.65;
          const anim = raw < D_S ? raw / D_S * 0.5
                     : raw > D_E ? 0.5 + (raw - D_E) / (1 - D_E) * 0.5
                     : 0.5;

          sec.style.setProperty("--pz",   (-560 + anim * 900).toFixed(0) + "px");
          sec.style.setProperty("--cz",   ((anim - 0.5) * 180).toFixed(0) + "px");
          sec.style.setProperty("--rotY", ((anim - 0.5) * 26).toFixed(1) + "deg");
          sec.style.setProperty("--rotX", "0deg");
          sec.style.setProperty("--pscale", "1");

          // opacity: raw مستقیم — پنجرهٔ دید عریض است تا فاصلهٔ خالی بین سیاره‌ها کم باشد
          sec.style.setProperty("--pvis", (ss(0.02, 0.10, raw) * (1 - ss(0.84, 0.97, raw))).toFixed(3));
          sec.style.setProperty("--hud",  (ss(0.04, 0.14, raw) * (1 - ss(0.80, 0.95, raw))).toFixed(3));
          sec.style.setProperty("--orb",  (ss(0.06, 0.18, raw) * (1 - ss(0.82, 0.97, raw))).toFixed(3));
        } else {
          // صحنهٔ کوتاه (نادر): حالتِ خنثی
          sec.style.cssText += ";--p:.5;--pz:0px;--pvis:1;--hud:1;--orb:1;--cz:0px;--rotY:0deg;--rotX:0deg;--pscale:1";
        }
      });

      // فعال‌سازیِ ناوبری بر اساسِ نزدیک‌ترین صحنه به مرکز
      let bestId = "launchpad", bestD = Infinity;
      allBays().forEach((b) => {
        const r = b.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - vh / 2);
        if (d < bestD) { bestD = d; bestId = b.id; }
      });
      navLinks.forEach((a) => a.classList.toggle("is-on", a.dataset.target === bestId));
      dotBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.target === bestId));
      const dotCol = (sectionsForNav.find((s) => s.id === bestId) || {}).dot;
      if (dotCol) document.documentElement.style.setProperty("--dot", dotCol);
    }
    addEventListener("scroll", onScroll, { passive: true });

    /* پارالاکسِ دوربین با اشاره‌گر (فقط دسکتاپ، نرم با rAF) */
    if (!reduce) {
      addEventListener("pointermove", (e) => {
        if (!desktop) return;
        tcamX = (e.clientX / innerWidth - 0.5) * 2;
        tcamY = (e.clientY / innerHeight - 0.5) * 2;
      }, { passive: true });
      const nebA = $(".cosmos__neb--a"), nebB = $(".cosmos__neb--b"), grid = $(".cosmos__grid");
      (function cam() {
        camX += (tcamX - camX) * 0.06; camY += (tcamY - camY) * 0.06;
        const scenes = $$(".system__scene");
        scenes.forEach((s) => { s.style.setProperty("--mx", camX.toFixed(3)); s.style.setProperty("--my", camY.toFixed(3)); });
        if (nebA) nebA.style.transform = `translate3d(${camX * -22}px,${camY * -16}px,0)`;
        if (nebB) nebB.style.transform = `translate3d(${camX * 18}px,${camY * 14}px,0)`;
        if (grid) grid.style.transform = `translate3d(${camX * -10}px,${camY * -8}px,0)`;
        requestAnimationFrame(cam);
      })();
    }

    /* چرخشِ مدلِ سه‌بعدیِ سیاره (sprite-sheet): فقط با اسکرول جلو/عقب می‌رود؛
       هیچ چرخشِ خودکارِ زمانی‌ای ندارد. اسکرول به پایین → فریم‌ها جلو، اسکرول به
       بالا → فریم‌ها عقب. فقط وقتی سیاره‌ای واقعاً مدل دارد فعال می‌شود. */
    if (spritePlanets.length) {
      // بارگذاریِ تنبل: تصویرِ نوارِ فریم‌ها فقط وقتی سیارهٔ مربوطه به دید نزدیک می‌شود
      // دانلود/دیکُد می‌شود (نه همهٔ سیاره‌ها در ابتدا) تا صفحه سبک بماند.
      const loadSprite = (sp) => {
        if (sp.loaded) return;
        sp.loaded = true;
        sp.body.style.backgroundImage = `url('${sp.src}')`;
      };
      if ("IntersectionObserver" in window) {
        const spIO = new IntersectionObserver((ents) => {
          ents.forEach((en) => {
            if (en.isIntersecting) {
              const sp = spritePlanets.find((s) => s.el.closest(".bay--system") === en.target);
              if (sp) { loadSprite(sp); spIO.unobserve(en.target); }
            }
          });
        }, { rootMargin: "400px 0px" });   // کمی زودتر از ورود، تا بدونِ تأخیر آماده باشد
        spritePlanets.forEach((sp) => spIO.observe(sp.el.closest(".bay--system")));
      } else {
        spritePlanets.forEach(loadSprite);  // فالبک: مرورگرِ قدیمی → همه را بارگذاری کن
      }

      if (!reduce) {
        const updateSprites = () => {
          const turn = ((scrollY * 0.0012) % 1 + 1) % 1;  // 0..1 دور — فقط تابعِ موقعیتِ اسکرول
          spritePlanets.forEach((sp) => {
            if (!sp.loaded) return;
            const idx = Math.round(turn * sp.frames) % sp.frames;
            if (sp.cur !== idx) { sp.cur = idx; sp.el.style.setProperty("--frame", idx); }
          });
        };
        addEventListener("scroll", updateSprites, { passive: true });
        updateSprites();
      }
    }

    /* ===================================================================
       ۶) مودالِ آیتم (transmission)
       =================================================================== */
    const modal = $("#modal");
    let currentDish = null;
    function openModal(id) {
      const d = DISHES.find((x) => x.id === id); if (!d) return;
      currentDish = id;
      const p = PLANETS.find((x) => x.id === d.planet) || {};
      $("#modal .modal__panel").style.cssText = `--accent:${p.accent || "#7C5CFF"};--accent2:${p.accent2 || "#28E0C8"}`;
      // عکسِ محصول اگر باشد، جای نشانِ آیکنی نمایش داده می‌شود
      const mMedia = $("#modalMedia"), mImg = $("#modalImg"), mBadge = $("#modalBadge");
      if (d.img && mMedia && mImg) {
        mImg.src = d.img; mImg.alt = d.name || "";
        mMedia.hidden = false; mBadge.hidden = true;
      } else {
        if (mMedia) mMedia.hidden = true;
        mBadge.hidden = false; mBadge.innerHTML = glyph(d.glyph || p.glyph);
      }
      $("#modalCode").textContent = (p.code || "") + " · " + (p.fa || "");
      $("#modalName").textContent = d.name;
      $("#modalEn").textContent = d.en || "";
      $("#modalDesc").textContent = d.desc || "";
      $("#modalTags").innerHTML = (d.tags || []).map(dtag).join("");
      $("#modalKcal").textContent = d.kcal ? d.kcal + " کیلوکالری" : "";
      $("#modalPrice").innerHTML = fmt(d.price) + "<small>تومان</small>";
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add("is-open"));
      document.body.style.overflow = "hidden";
    }
    function closeModal() {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(() => { modal.hidden = true; }, 350);
    }
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
    $("#modalAdd").addEventListener("click", () => { if (currentDish) { addToList(currentDish); closeModal(); } });

    /* ===================================================================
       ۶ب) یادداشتِ سفر (لیستِ محلی — نه سفارش، نه پرداخت)
       =================================================================== */
    const byId = {}; DISHES.forEach((d) => { byId[d.id] = d; });
    const planetOf = (d) => PLANETS.find((p) => p.id === d.planet) || {};
    const LIST_KEY = "damsa-cosmos-list";
    let list = [];
    try { list = JSON.parse(localStorage.getItem(LIST_KEY) || "[]").filter((x) => byId[x.id]); } catch (_) { list = []; }
    const saveList = () => { try { localStorage.setItem(LIST_KEY, JSON.stringify(list)); } catch (_) {} };
    const listCount = () => list.reduce((s, x) => s + x.qty, 0);
    const listTotal = () => list.reduce((s, x) => s + (byId[x.id].price * x.qty), 0);

    const drawer = $("#drawer"), drawerBody = $("#drawerBody"), drawerFoot = $("#drawerFoot");
    function renderBadges() {
      const n = listCount();
      $$("[data-count]").forEach((b) => { b.textContent = n.toLocaleString("fa-IR"); b.hidden = n === 0; });
    }
    function renderDrawer() {
      if (!list.length) {
        drawerBody.innerHTML = `<div class="drawer__empty"><svg class="ic"><use href="#i-note"/></svg><p>یادداشتت خالی است.<br>از هر سیاره، آیتمی که دوست داری را اضافه کن تا یادت بماند.</p></div>`;
        drawerFoot.hidden = true; return;
      }
      drawerBody.innerHTML = list.map((x) => {
        const m = byId[x.id], p = planetOf(m);
        return `<div class="litem">
          <div class="litem__thumb" style="background:radial-gradient(circle at 32% 30%,${p.accent2 || "#fff"},${p.surf1 || "#3a2a7a"} 60%,${p.surf2 || "#120a2a"})">${glyph(m.glyph || p.glyph)}</div>
          <div class="litem__main">
            <div class="litem__name">${esc(m.name)}</div>
            <div class="litem__price">${fmt(m.price)} تومان</div>
            <div class="litem__qty">
              <button data-dec="${esc(m.id)}" aria-label="کمتر"><svg class="ic"><use href="#i-minus"/></svg></button>
              <b>${x.qty.toLocaleString("fa-IR")}</b>
              <button data-inc="${esc(m.id)}" aria-label="بیشتر"><svg class="ic"><use href="#i-plus"/></svg></button>
            </div>
          </div>
          <button class="litem__rm" data-rm="${esc(m.id)}" aria-label="حذف"><svg class="ic"><use href="#i-x"/></svg></button>
        </div>`;
      }).join("");
      $("#drawerTotal").textContent = fmt(listTotal()) + " تومان";
      drawerFoot.hidden = false;
    }
    const refreshList = () => { saveList(); renderBadges(); renderDrawer(); };
    function addToList(id, qty = 1) {
      if (!byId[id]) return;
      const row = list.find((x) => x.id === id);
      if (row) row.qty = Math.min(20, row.qty + qty); else list.push({ id, qty });
      refreshList();
      toast(`«${byId[id].name}» به یادداشت اضافه شد`);
    }
    const setQty = (id, d) => { const row = list.find((x) => x.id === id); if (!row) return; row.qty += d; if (row.qty < 1) list = list.filter((x) => x.id !== id); refreshList(); };
    const removeFromList = (id) => { list = list.filter((x) => x.id !== id); refreshList(); };
    const openDrawer = () => { renderDrawer(); drawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; };
    const closeDrawer = () => { drawer.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; };
    document.addEventListener("click", (e) => { if (e.target.closest("[data-open-list]")) { e.preventDefault(); openDrawer(); } });
    drawer.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-list]") || e.target.classList.contains("drawer__scrim")) return closeDrawer();
      const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]"), rm = e.target.closest("[data-rm]");
      if (inc) return setQty(inc.dataset.inc, +1);
      if (dec) return setQty(dec.dataset.dec, -1);
      if (rm) return removeFromList(rm.dataset.rm);
    });
    $("#clearList").addEventListener("click", () => { if (!list.length) return; list = []; refreshList(); toast("یادداشت خالی شد"); });
    $("#copyList").addEventListener("click", async () => {
      if (!list.length) return;
      const lines = list.map((x) => `• ${byId[x.id].name} ×${x.qty.toLocaleString("fa-IR")}`);
      const brand = ($("[data-edit='brand.word']") || {}).textContent || "دمسا";
      const text = `🚀 یادداشتِ سفرِ من از ${brand}\n${lines.join("\n")}\n— جمعِ تقریبی: ${fmt(listTotal())} تومان`;
      try { await navigator.clipboard.writeText(text); toast("یادداشت کپی شد ✓"); }
      catch (_) { toast("کپی نشد؛ دستی انتخاب کن"); }
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.getAttribute("aria-hidden") === "false") closeDrawer(); });
    renderBadges();

    /* ===================================================================
       ۷) کاروسلِ نظرات
       =================================================================== */
    (function testi() {
      const track = $("#testiTrack"), dotsT = $("#testiDots");
      if (!track || !TESTIMONIALS.length) return;
      track.innerHTML = TESTIMONIALS.map((t) => `
        <article class="tcard">
          <div class="tcard__stars">${"<svg class='ic'><use href='#i-star'/></svg>".repeat(t.rating || 5)}</div>
          <p class="tcard__text">«${esc(t.text)}»</p>
          <div class="tcard__who"><b>${esc(t.name)}</b><span>${esc(t.role || "")}</span></div>
        </article>`).join("");
      dotsT.innerHTML = TESTIMONIALS.map((_, i) => `<button type="button" aria-label="نظر ${i + 1}"></button>`).join("");
      const dbtns = $$("button", dotsT);
      let ti = 0, timer = null;
      const go = (i) => {
        ti = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
        track.style.transform = `translateX(${ti * 100}%)`;
        dbtns.forEach((b, k) => b.classList.toggle("is-on", k === ti));
      };
      dbtns.forEach((b, i) => b.addEventListener("click", () => { go(i); restart(); }));
      function restart() { if (timer) clearInterval(timer); if (!reduce && TESTIMONIALS.length > 1) timer = setInterval(() => go(ti + 1), 5000); }
      go(0); restart();
    })();

    /* ===================================================================
       ۸) شمارنده‌های هیرو
       =================================================================== */
    function runCounters() {
      $$("[data-count-to]").forEach((el) => {
        const to = parseFloat(el.dataset.countTo) || 0;
        const dec = parseInt(el.dataset.decimal || "0", 10);
        if (reduce) { el.textContent = to.toLocaleString("fa-IR", { minimumFractionDigits: dec }); return; }
        const dur = 1400; const t0 = performance.now();
        const tick = (now) => {
          const k = clamp((now - t0) / dur, 0, 1);
          const e = 1 - Math.pow(1 - k, 3);
          el.textContent = (to * e).toLocaleString("fa-IR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }

    /* ===================================================================
       ۹) راه‌اندازی
       =================================================================== */
    function ready() {
      layoutOrbits();
      onScroll();
      runCounters();
      const launch = $("#launch");
      if (launch) { launch.classList.add("is-done"); setTimeout(() => launch.remove(), 800); }
    }
    // پس از نشست‌کردنِ فونت/چیدمان، مدارها را بچین
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutOrbits);
    requestAnimationFrame(ready);
    setTimeout(layoutOrbits, 400);

    let rT = null;
    addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => { layoutOrbits(); onScroll(); }, 160); }, { passive: true });
  }

  if (window.__DAMSA_READY__) start();
  else document.addEventListener("damsa:ready", start, { once: true });
})();

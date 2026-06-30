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
    PLANETS.forEach((p, idx) => {
      const ds = dishesOf(p.id);
      const surf1 = p.surf1 || (p.surface && p.surface[0]) || "#444";
      const surf2 = p.surf2 || (p.surface && p.surface[1]) || "#111";
      const sec = document.createElement("section");
      sec.className = "bay bay--system";
      sec.id = "sys-" + p.id;
      sec.dataset.planet = p.id;
      sec.style.cssText = `--accent:${p.accent};--accent2:${p.accent2};--surf1:${surf1};--surf2:${surf2};--dot:${p.accent}`;
      sec.innerHTML = `
        <div class="system">
          <div class="system__view">
            <div class="system__scene">
              <div class="planet" aria-hidden="true">
                <span class="planet__halo"></span>
                <span class="planet__body"></span>
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
                    <div class="holo__icon">${glyph(d.glyph || p.glyph)}</div>
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
          </div>
        </div>`;
      systems.appendChild(sec);
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
      if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    navWrap.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-target]"); if (!a) return;
      e.preventDefault(); scrollToId(a.dataset.target);
    });

    /* ===================================================================
       ۳) استارفیلدِ کانواس (سه لایهٔ عمق + پارالاکس)
       =================================================================== */
    (function starfield() {
      const cv = $("#starfield"); if (!cv) return;
      const ctx = cv.getContext("2d", { alpha: true });
      const DPR = Math.min(devicePixelRatio || 1, 2);
      let W = 0, H = 0, stars = [];
      function resize() {
        W = cv.width = Math.floor(innerWidth * DPR);
        H = cv.height = Math.floor(innerHeight * DPR);
        cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px";
        const n = innerWidth < 680 ? 90 : 170;
        stars = Array.from({ length: n }, () => {
          const depth = Math.random();                 // 0 دور … 1 نزدیک
          return {
            x: Math.random(), y: Math.random(), depth,
            r: (0.5 + depth * 1.7) * DPR,
            tw: Math.random() * Math.PI * 2,
            tws: 0.6 + Math.random() * 1.6,
            hue: Math.random() < 0.18 ? (Math.random() < 0.5 ? "#bcd0ff" : "#ffd9a8") : "#ffffff",
          };
        });
      }
      resize(); addEventListener("resize", resize, { passive: true });
      let t = 0;
      function frame() {
        t += 0.016;
        warpV *= 0.9;                                   // فروکشِ نرمِ شتابِ warp
        ctx.clearRect(0, 0, W, H);
        const sx = camX * 26 * DPR, sy = camY * 26 * DPR, scr = scrollProg * 140 * DPR;
        const warping = warpV > 0.06;
        ctx.lineCap = "round";
        for (const s of stars) {
          const px = ((s.x * W + sx * (0.3 + s.depth)) % W + W) % W;
          const py = ((s.y * H + sy * (0.3 + s.depth) + scr * (0.2 + s.depth)) % H + H) % H;
          const a = reduce ? 0.7 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * s.tws + s.tw)) * (0.4 + s.depth);
          if (warping) {                                // استریکِ سرعت (warp) هنگامِ اسکرول
            const len = warpV * (8 + s.depth * 52) * DPR;
            ctx.globalAlpha = Math.min(1, a * 1.1);
            ctx.strokeStyle = s.hue; ctx.lineWidth = s.r * 1.3;
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - warpDir * len); ctx.stroke();
          } else {
            ctx.globalAlpha = a; ctx.fillStyle = s.hue;
            ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI * 2); ctx.fill();
            if (s.depth > 0.8) {                        // درخششِ ستاره‌های نزدیک
              ctx.globalAlpha = a * 0.4;
              ctx.beginPath(); ctx.arc(px, py, s.r * 3, 0, Math.PI * 2); ctx.fill();
            }
          }
        }
        ctx.globalAlpha = 1;
        if (!reduce) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })();

    /* ===================================================================
       ۴) چیدمانِ مداریِ هولوکارت‌ها (دسکتاپ و موبایل)
       =================================================================== */
    function layoutOrbits() {
      desktop = matchMedia("(min-width:901px)").matches;
      $$(".bay--system").forEach((sec) => {
        const scene = $(".system__scene", sec);
        const planet = $(".planet", sec);
        const holos = $$(".holo", sec);
        if (reduce) { holos.forEach((h) => { h.style.left = h.style.top = ""; h.style.removeProperty("--z"); }); return; }
        const cx = planet.offsetLeft + planet.offsetWidth / 2;
        const cy = planet.offsetTop;                    // مرکزِ دیداری (top:50% + translateY(-50%))
        const sceneW = scene.offsetWidth, sceneH = scene.offsetHeight;
        const n = holos.length;
        const narrow = sceneW < 760;
        if (narrow) {
          // موبایل: کارت‌ها نوارِ افقیِ قابلِ سوایپ در پایینِ صحنه‌اند (CSS می‌چیند)
          holos.forEach((h) => { h.style.left = h.style.top = ""; h.style.removeProperty("--z"); });
          return;
        }
        // دسکتاپ: بادبزنِ کارت‌ها در نیمهٔ راستِ سیاره؛ ربعِ راستِ صفحه برای HUD
        const R = clamp(planet.offsetWidth * 0.58 + 20, 150, 270);
        const maxLeft = sceneW * 0.60;
        holos.forEach((h, i) => {
          const w = h.offsetWidth, hh = h.offsetHeight;
          const a = (n === 1 ? 0 : (-1 + (2 * i) / (n - 1)) * 0.9) * (Math.PI / 2.6);
          const dx = Math.cos(a) * R * 0.72 + 24;
          const dy = Math.sin(a) * R * 0.92;
          const z = (i % 2 === 0 ? 140 : -40);
          let left = clamp(cx + dx - w / 2, 12, Math.max(12, maxLeft - w / 2));
          let top = clamp(cy + dy - hh / 2, 104, sceneH - hh - 24);
          h.style.left = left + "px"; h.style.top = top + "px";
          h.style.setProperty("--z", z + "px");
        });
      });
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
    let warpV = 0, warpDir = 1, lastScrollY = scrollY;        // سرعتِ اسکرول برای استریکِ warp
    const systemSecs = $$(".bay--system");
    const root = document.documentElement;
    const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

    function onScroll() {
      const y = scrollY, vh = innerHeight;
      const docH = document.documentElement.scrollHeight - vh;
      scrollProg = docH > 0 ? clamp(y / docH, 0, 1) : 0;
      warpFill.style.width = (scrollProg * 100).toFixed(2) + "%";
      hud.classList.toggle("is-stuck", y > 40);

      // سرعتِ اسکرول → شتابِ warp
      const dv = y - lastScrollY; lastScrollY = y;
      if (!reduce) { if (dv) warpDir = Math.sign(dv); warpV = Math.max(warpV, Math.min(2.6, Math.abs(dv) / 42)); }

      // چرخشِ سطحِ سیاره‌ها با اسکرول (حسِ چرخشِ کره)
      root.style.setProperty("--spin", (reduce ? 0 : y * 0.6).toFixed(1));

      // سفرِ عمقی: هر سیاره از دور می‌آید، از کنارِ بیننده رد می‌شود و محو می‌شود
      systemSecs.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (reduce) {
          sec.style.cssText += ";--p:1;--pz:0px;--pvis:1;--hud:1;--orb:1;--cz:0px;--rotY:0deg;--rotX:0deg;--pscale:1";
          return;
        }
        const total = sec.offsetHeight - vh;
        if (total > 60) {
          // صحنهٔ چسبان → پروازِ عمقی (هم دسکتاپ هم موبایل)
          const raw = clamp(-rect.top / total, 0, 1);
          sec.style.setProperty("--p", raw.toFixed(3));
          sec.style.setProperty("--pz", (-560 + raw * 900).toFixed(0) + "px");
          sec.style.setProperty("--pvis", (ss(0.03, 0.18, raw) * (1 - ss(0.74, 0.99, raw))).toFixed(3));
          sec.style.setProperty("--hud", (ss(0.14, 0.34, raw) * (1 - ss(0.6, 0.82, raw))).toFixed(3));
          sec.style.setProperty("--orb", (ss(0.16, 0.4, raw) * (1 - ss(0.66, 0.93, raw))).toFixed(3));
          sec.style.setProperty("--cz", ((raw - 0.5) * 180).toFixed(0) + "px");
          sec.style.setProperty("--rotY", ((raw - 0.5) * 26).toFixed(1) + "deg");
          sec.style.setProperty("--rotX", "0deg");
          sec.style.setProperty("--pscale", "1");
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
      $("#modalBadge").innerHTML = glyph(d.glyph || p.glyph);
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

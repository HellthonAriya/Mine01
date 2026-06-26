/* ===========================================================================
   کافهٔ دمسا — app.js
   لایهٔ تعامل: لودر، تم، ناوبری، ذرات، انیمیشن، منو، لیستِ سفارش (یادداشت)،
   نظرات، گالری، رویدادها، باشگاه، توست.
   =========================================================================== */
(function () {
  "use strict";
  const { TOMAN, CATEGORIES, TAG_LABELS, ART, MENU, REVIEWS, EVENTS, TIERS } = window.DAMSA;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const fmt = (n) => TOMAN(n);
  const byId = Object.fromEntries(MENU.map((m) => [m.id, m]));
  const artBG = (key) => {
    const [a, b] = ART[key] || ART.espresso;
    return `linear-gradient(150deg,${a},${b})`;
  };
  const illusUse = (id) => `<svg viewBox="0 0 120 120" class="illus"><use href="#illus-${id}"></use></svg>`;
  // کپی با fallback؛ navigator.clipboard فقط روی HTTPS کار می‌کند، پس برای IP/HTTP از execCommand استفاده می‌کنیم.
  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* می‌رویم سراغ fallback */ }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (_) { return false; }
  };
  const tagHTML = (k) => {
    const t = TAG_LABELS[k]; if (!t) return "";
    return `<span class="tag tag--${t.tone}">${t.fa}</span>`;
  };

  /* ----------------------------- لودر ----------------------------- */
  window.addEventListener("load", () => {
    setTimeout(() => $("#loader").classList.add("is-done"), 650);
  });

  /* ----------------------------- تم ----------------------------- */
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("damsa-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  $("#themeToggle").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("damsa-theme", next);
  });

  /* ----------------------------- ناوبری ----------------------------- */
  const nav = $("#nav");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-stuck", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > 420);
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });

  /* منوی موبایل */
  const mm = $("#mobilemenu");
  const openMM = () => { mm.classList.add("is-open"); mm.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked"); $("#burger").setAttribute("aria-expanded", "true"); };
  const closeMM = () => { mm.classList.remove("is-open"); mm.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked"); $("#burger").setAttribute("aria-expanded", "false"); };
  $("#burger").addEventListener("click", openMM);
  $("#mmClose").addEventListener("click", closeMM);
  $$("#mobilemenu a").forEach((a) => a.addEventListener("click", closeMM));

  /* اسکرول‌اسپای برای ناوبری پایین */
  const navMap = { hero: 0, menu: 1, contact: 2 };
  const spyTargets = ["hero", "menu", "contact"].map((id) => $("#" + id));
  const bottomLinks = $$(".bottomnav a");
  const spy = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (e.isIntersecting) {
        const i = navMap[e.target.id];
        bottomLinks.forEach((l, idx) => l.classList.toggle("is-active", idx === i));
      }
    });
  }, { threshold: 0.4 });
  spyTargets.forEach((t) => t && spy.observe(t));

  /* ----------------------------- ذرات هیرو ----------------------------- */
  if (!reduce) {
    const cv = $("#particles"), ctx = cv.getContext("2d");
    let W, H, dots = [];
    const resize = () => {
      const r = cv.parentElement.getBoundingClientRect();
      W = cv.width = r.width; H = cv.height = r.height;
      dots = Array.from({ length: Math.min(48, Math.floor(W / 26)) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.8 + .5, vy: -(Math.random() * .35 + .12),
        vx: (Math.random() - .5) * .25, a: Math.random() * .5 + .15,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        d.y += d.vy; d.x += d.vx;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7);
        ctx.fillStyle = `rgba(224,146,43,${d.a})`; ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    resize(); draw(); addEventListener("resize", resize);
  }

  /* تیلت فنجان هیرو */
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    const wrap = $("[data-tilt]"), hero = $("#hero");
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      wrap.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
    });
    hero.addEventListener("mouseleave", () => { wrap.style.transform = ""; });
  }

  /* دکمه‌های مغناطیسی */
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    $$("[data-magnetic]").forEach((b) => {
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener("mouseleave", () => { b.style.transform = ""; });
    });
  }

  /* ----------------------------- ریویل (GSAP) ----------------------------- */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    $$("[data-reveal]").forEach((el) => {
      gsap.fromTo(el, { y: 26, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: .8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
    // پارالاکس ملایم نقشِ گره‌چینی هیرو
    gsap.to(".hero__girih", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  } else {
    $$("[data-reveal]").forEach((el) => el.classList.add("reveal-in"));
  }

  /* ----------------------------- کارت محصول ----------------------------- */
  const favs = new Set(JSON.parse(localStorage.getItem("damsa-favs") || "[]"));
  const saveFavs = () => localStorage.setItem("damsa-favs", JSON.stringify([...favs]));

  const cardHTML = (m) => `
    <article class="pcard" data-quick="${m.id}">
      <div class="pcard__media" style="background:${artBG(m.art)}">
        ${illusUse(m.illus)}
        <div class="pcard__tags">${m.tags.map(tagHTML).join("")}</div>
        <button class="fav ${favs.has(m.id) ? "is-on" : ""}" data-fav="${m.id}" aria-label="افزودن به علاقه‌مندی">
          <svg class="ic"><use href="#i-heart"></use></svg>
        </button>
      </div>
      <div class="pcard__body">
        <div class="pcard__head">
          <div><div class="pcard__name">${m.name}</div><div class="pcard__en">${m.en}</div></div>
          <div class="pcard__rating"><svg class="ic"><use href="#i-star"></use></svg>${fmt(m.rating)}</div>
        </div>
        <p class="pcard__desc">${m.desc}</p>
        <div class="pcard__facts">
          <span><svg class="ic"><use href="#i-fire"></use></svg>${fmt(m.cal)} کالری</span>
          <span><svg class="ic"><use href="#i-clock"></use></svg>${fmt(m.time)} دقیقه</span>
        </div>
        <div class="pcard__foot">
          <span class="price">${fmt(m.price)}<small> تومان</small></span>
          <button class="add-btn" data-add="${m.id}"><svg class="ic"><use href="#i-plus"></use></svg>به لیست</button>
        </div>
      </div>
    </article>`;

  /* منوی ویژه: فیلتر + سرچ */
  const featuredItems = MENU.filter((m) => m.tags.some((t) => ["bestseller", "popular", "chef", "new"].includes(t)));
  const fFilters = [
    { id: "all", fa: "همه" },
    { id: "bestseller", fa: "پرفروش" },
    { id: "popular", fa: "پرطرفدار" },
    { id: "chef", fa: "پیشنهاد سرآشپز" },
    { id: "new", fa: "تازه" },
  ];
  let fActive = "all", fQuery = "";
  $("#featuredFilters").innerHTML = fFilters.map((f, i) =>
    `<button class="chip ${i === 0 ? "is-on" : ""}" data-ffilter="${f.id}" role="tab">${f.fa}</button>`).join("");
  const renderFeatured = () => {
    let list = featuredItems;
    if (fActive !== "all") list = list.filter((m) => m.tags.includes(fActive));
    if (fQuery) list = list.filter((m) => (m.name + m.en + m.desc).toLowerCase().includes(fQuery));
    $("#featuredGrid").innerHTML = list.slice(0, 8).map(cardHTML).join("") ||
      `<p class="menu__empty">چیزی پیدا نشد.</p>`;
  };
  $("#featuredFilters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ffilter]"); if (!b) return;
    $$("#featuredFilters .chip").forEach((c) => c.classList.remove("is-on"));
    b.classList.add("is-on"); fActive = b.dataset.ffilter; renderFeatured();
  });
  $("#featuredSearch").addEventListener("input", (e) => { fQuery = e.target.value.trim().toLowerCase(); renderFeatured(); });
  renderFeatured();

  /* منوی کامل: تب + سرچ */
  let mActive = CATEGORIES[0].id, mQuery = "";
  const catIcon = { cup: "illus-latte", shot: "illus-shot", ice: "illus-coldbrew", leaf: "illus-teacup", egg: "illus-plate", cake: "illus-cheesecake", croissant: "illus-croissant", slice: "illus-slice", sandwich: "illus-sandwich", bowl: "illus-bowl", star: "illus-signature", spark: "illus-signature" };
  $("#menuTabs").innerHTML = CATEGORIES.map((c, i) =>
    `<button class="chip ${i === 0 ? "is-on" : ""}" data-cat="${c.id}" role="tab">${c.fa}</button>`).join("");
  const rowHTML = (m) => `
    <article class="mrow" data-quick="${m.id}">
      <div class="mrow__thumb" style="background:${artBG(m.art)}"><svg viewBox="0 0 120 120"><use href="#illus-${m.illus}"></use></svg></div>
      <div class="mrow__main">
        <div class="mrow__top"><span class="mrow__name">${m.name}</span><span class="mrow__price">${fmt(m.price)}</span></div>
        <div class="mrow__desc">${m.desc}</div>
        <div class="mrow__meta">
          <span><svg class="ic"><use href="#i-star"></use></svg>${fmt(m.rating)}</span>
          <span><svg class="ic"><use href="#i-fire"></use></svg>${fmt(m.cal)}</span>
          <span><svg class="ic"><use href="#i-clock"></use></svg>${fmt(m.time)}′</span>
          ${m.tags[0] ? tagHTML(m.tags[0]) : ""}
        </div>
      </div>
      <button class="mrow__add" data-add="${m.id}" aria-label="افزودن به لیست"><svg class="ic"><use href="#i-plus"></use></svg></button>
    </article>`;
  const renderMenu = () => {
    let list = MENU;
    if (mQuery) list = list.filter((m) => (m.name + m.en + m.desc + m.cat).toLowerCase().includes(mQuery));
    else list = list.filter((m) => m.cat === mActive);
    $("#menuList").innerHTML = list.map(rowHTML).join("");
    $("#menuEmpty").hidden = list.length > 0;
    $("#menuTabs").style.opacity = mQuery ? ".4" : "1";
  };
  $("#menuTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    $("#menuSearch").value = ""; mQuery = "";
    $$("#menuTabs .chip").forEach((c) => c.classList.remove("is-on"));
    b.classList.add("is-on"); mActive = b.dataset.cat; renderMenu();
  });
  $("#menuSearch").addEventListener("input", (e) => { mQuery = e.target.value.trim().toLowerCase(); renderMenu(); });
  renderMenu();

  /* علاقه‌مندی + کلیک کارت/ردیف */
  document.addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    if (fav) { const id = fav.dataset.fav; favs.has(id) ? favs.delete(id) : favs.add(id); fav.classList.toggle("is-on"); saveFavs(); return; }
    const add = e.target.closest("[data-add]");
    if (add) { e.preventDefault(); e.stopPropagation(); pulse(add); addToList(add.dataset.add); return; }
    const quick = e.target.closest("[data-quick]");
    if (quick) openProduct(quick.dataset.quick);
  });
  const pulse = (el) => { el.animate([{ transform: "scale(1)" }, { transform: "scale(.86)" }, { transform: "scale(1)" }], { duration: 280, easing: "ease" }); };

  /* ----------------------------- مودال محصول ----------------------------- */
  const modal = $("#productModal"), panel = $("#productPanel");
  let modalItem = null;
  const productHTML = (m) => {
    const allerg = m.allergens.length ? m.allergens : ["—"];
    return `
    <div class="pm__media" style="background:${artBG(m.art)}">
      ${illusUse(m.illus)}
      <button class="pm__close icon-btn" data-close aria-label="بستن"><svg class="ic"><use href="#i-close"></use></svg></button>
      <div class="pcard__tags" style="position:absolute;top:16px;inset-inline-end:16px;left:auto">${m.tags.map(tagHTML).join("")}</div>
    </div>
    <div class="pm__body">
      <div class="pm__head">
        <div><div class="pm__name">${m.name}</div><div class="pm__en">${m.en}</div></div>
        <div class="pm__rating"><svg class="ic"><use href="#i-star"></use></svg>${fmt(m.rating)} <span class="muted">(${fmt(m.reviews)} نظر)</span></div>
      </div>
      <p class="pm__desc">${m.desc}</p>
      <div class="pm__facts">
        <span class="pm__fact"><svg class="ic"><use href="#i-fire"></use></svg>${fmt(m.cal)} کالری</span>
        <span class="pm__fact"><svg class="ic"><use href="#i-clock"></use></svg>${fmt(m.time)} دقیقه</span>
        <span class="pm__fact"><svg class="ic"><use href="#i-leaf"></use></svg>پیشنهاد با: ${m.pairing}</span>
      </div>
      <div class="pm__section"><h4>مواد اولیه</h4><div class="pm__chips">${m.ing.map((i) => `<span>${i}</span>`).join("")}</div></div>
      <div class="pm__section"><h4>حساسیت‌زاها</h4><div class="pm__chips">${allerg.map((a) => `<span>${a}</span>`).join("")}</div></div>
      ${m.addons.length ? `<div class="pm__section"><h4>افزودنی‌های دلخواه</h4><div class="pm__chips">${m.addons.map((a) =>
        `<span>${a.fa}${a.p ? " · +" + fmt(a.p) + " ت" : ""}</span>`).join("")}</div></div>` : ""}
    </div>
    <div class="pm__foot">
      <div class="stepper">
        <button type="button" class="stepper__btn" data-mqty="-1" aria-label="کمتر"><svg class="ic"><use href="#i-minus"></use></svg></button>
        <output id="pmQty">۱</output>
        <button type="button" class="stepper__btn" data-mqty="1" aria-label="بیشتر"><svg class="ic"><use href="#i-plus"></use></svg></button>
      </div>
      <button class="btn btn--primary btn--lg" id="mAdd"><svg class="ic"><use href="#i-cart"></use></svg>افزودن به لیست</button>
    </div>`;
  };
  let pmQty = 1;
  function openProduct(id) {
    modalItem = byId[id];
    pmQty = 1;
    panel.innerHTML = productHTML(modalItem);
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked");
  }
  const closeModal = () => { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked"); };
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]") || e.target.classList.contains("modal__scrim")) return closeModal();
    const q = e.target.closest("[data-mqty]");
    if (q) { pmQty = Math.min(20, Math.max(1, pmQty + (+q.dataset.mqty))); $("#pmQty").textContent = fmt(pmQty); return; }
    if (e.target.closest("#mAdd") && modalItem) { addToList(modalItem.id, pmQty); closeModal(); }
  });

  /* ----------------------------- لیستِ سفارش (یادداشت) ----------------------------- */
  // فقط یک یادداشت روی همین دستگاه است؛ نه خرید، نه پرداخت، نه ارسال.
  const LIST_KEY = "damsa-list";
  let list = [];
  try { list = JSON.parse(localStorage.getItem(LIST_KEY) || "[]").filter((x) => byId[x.id]); } catch { list = []; }
  const saveList = () => localStorage.setItem(LIST_KEY, JSON.stringify(list));
  const listCount = () => list.reduce((s, x) => s + x.qty, 0);
  const listTotal = () => list.reduce((s, x) => s + (byId[x.id].price * x.qty), 0);

  const drawer = $("#drawer"), drawerBody = $("#drawerBody"), drawerFoot = $("#drawerFoot");

  const renderBadges = () => {
    const n = listCount();
    $$("[data-count]").forEach((b) => { b.textContent = fmt(n); b.hidden = n === 0; });
  };

  const renderDrawer = () => {
    if (!list.length) {
      drawerBody.innerHTML = `<div class="drawer__empty">
        <svg viewBox="0 0 24 24"><use href="#i-cart"></use></svg>
        <p>لیستت خالی است.<br>از منو هر چیزی که دوست داری را اضافه کن تا یادت بماند.</p>
      </div>`;
      drawerFoot.hidden = true;
      return;
    }
    drawerBody.innerHTML = list.map((x) => {
      const m = byId[x.id];
      return `<div class="litem" data-row="${m.id}">
        <div class="litem__thumb" style="background:${artBG(m.art)}"><svg viewBox="0 0 120 120"><use href="#illus-${m.illus}"></use></svg></div>
        <div class="litem__main">
          <div class="litem__name">${m.name}</div>
          <div class="litem__price">${fmt(m.price)} تومان</div>
          <div class="litem__qty">
            <button data-dec="${m.id}" aria-label="کمتر"><svg class="ic"><use href="#i-minus"></use></svg></button>
            <b>${fmt(x.qty)}</b>
            <button data-inc="${m.id}" aria-label="بیشتر"><svg class="ic"><use href="#i-plus"></use></svg></button>
          </div>
        </div>
        <button class="litem__rm" data-rm="${m.id}" aria-label="حذف"><svg class="ic"><use href="#i-close"></use></svg></button>
      </div>`;
    }).join("");
    $("#drawerTotal").textContent = `${fmt(listTotal())} تومان`;
    drawerFoot.hidden = false;
  };

  const refreshList = () => { saveList(); renderBadges(); renderDrawer(); };

  function addToList(id, qty = 1) {
    if (!byId[id]) return;
    const row = list.find((x) => x.id === id);
    if (row) row.qty = Math.min(20, row.qty + qty); else list.push({ id, qty });
    refreshList();
    toast(`«${byId[id].name}» به لیست اضافه شد`);
  }
  const setQty = (id, d) => {
    const row = list.find((x) => x.id === id); if (!row) return;
    row.qty += d;
    if (row.qty < 1) list = list.filter((x) => x.id !== id);
    refreshList();
  };
  const removeFromList = (id) => { list = list.filter((x) => x.id !== id); refreshList(); };

  const openDrawer = () => { renderDrawer(); drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked"); };
  const closeDrawer = () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked"); };

  document.addEventListener("click", (e) => { if (e.target.closest("[data-open-list]")) { e.preventDefault(); openDrawer(); } });
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-list]") || e.target.classList.contains("drawer__scrim")) return closeDrawer();
    const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]"), rm = e.target.closest("[data-rm]");
    if (inc) return setQty(inc.dataset.inc, +1);
    if (dec) return setQty(dec.dataset.dec, -1);
    if (rm) return removeFromList(rm.dataset.rm);
  });

  $("#clearList").addEventListener("click", () => { if (!list.length) return; list = []; refreshList(); toast("لیست خالی شد"); });
  $("#copyList").addEventListener("click", async () => {
    if (!list.length) return;
    const lines = list.map((x) => `• ${byId[x.id].name} ×${fmt(x.qty)}`);
    const text = `🧾 لیستِ سفارشِ من از کافهٔ دمسا\n${lines.join("\n")}\n— جمعِ تقریبی: ${fmt(listTotal())} تومان`;
    if (await copyText(text)) { toast("لیست کپی شد ✓"); confetti(); }
    else { toast("کپی نشد؛ دستی انتخاب کن", "error"); }
  });

  renderBadges();

  /* ----------------------------- نظرات ----------------------------- */
  const track = $("#reviewsTrack"), dotsWrap = $("#reviewsDots");
  track.innerHTML = REVIEWS.map((r) => `
    <article class="rcard">
      <div class="rcard__stars">${"<svg class='ic'><use href='#i-star'></use></svg>".repeat(r.rating)}</div>
      <p class="rcard__text">«${r.text}»</p>
      <div class="rcard__foot">
        <div class="rcard__avatar">${r.initials}</div>
        <div class="rcard__who"><b>${r.name} ${r.verified ? "<svg class='ic'><use href='#i-check'></use></svg>" : ""}</b><span>${r.handle} · سفارش: ${r.item}</span></div>
      </div>
    </article>`).join("");
  dotsWrap.innerHTML = REVIEWS.map((_, i) => `<b data-dot="${i}" class="${i === 0 ? "is-on" : ""}"></b>`).join("");
  let rIdx = 0;
  const step = () => { const card = track.querySelector(".rcard"); if (!card) return 0; return card.offsetWidth + 20; };
  const goRev = (i) => {
    rIdx = (i + REVIEWS.length) % REVIEWS.length;
    const sign = getComputedStyle(document.documentElement).direction === "rtl" ? 1 : -1;
    track.style.transform = `translateX(${sign * rIdx * step()}px)`;
    $$("#reviewsDots b").forEach((d, k) => d.classList.toggle("is-on", k === rIdx));
  };
  $("#revNext").addEventListener("click", () => goRev(rIdx + 1));
  $("#revPrev").addEventListener("click", () => goRev(rIdx - 1));
  dotsWrap.addEventListener("click", (e) => { const d = e.target.closest("[data-dot]"); if (d) goRev(+d.dataset.dot); });
  let autoRev = setInterval(() => goRev(rIdx + 1), 5000);
  track.addEventListener("pointerenter", () => clearInterval(autoRev));
  track.addEventListener("pointerleave", () => autoRev = setInterval(() => goRev(rIdx + 1), 5000));
  addEventListener("resize", () => goRev(rIdx));

  /* ----------------------------- گالری ----------------------------- */
  const galleryArt = ["espresso", "milk", "berry", "matcha", "caramel", "cocoa", "citrus", "cream", "teal"];
  const galleryIll = ["latte", "croissant", "bowl", "matcha", "pancake", "tiramisu", "tonic", "brulee", "signature"];
  const galleryCap = ["بار قهوه", "صبحانهٔ تازه", "کاسهٔ سالم", "ماچا لاته", "پنکیک عسل", "تیرامیسو", "اسپرسو تونیک", "کرم‌بروله", "نوشیدنی خاص"];
  const shapes = ["", "gtile--tall", "gtile--wide", "", "gtile--tall", "", "gtile--wide", "", "gtile--tall"];
  $("#masonry").innerHTML = galleryArt.map((a, i) =>
    `<figure class="gtile ${shapes[i]}" data-lb="${i}" style="background:${artBG(a)}">
      <svg viewBox="0 0 120 120"><use href="#illus-${galleryIll[i]}"></use></svg>
      <figcaption class="gtile__cap">${galleryCap[i]}</figcaption>
    </figure>`).join("");
  // لایت‌باکس
  const lb = document.createElement("div");
  lb.className = "lightbox"; lb.innerHTML = `<button class="lightbox__close icon-btn" aria-label="بستن"><svg class="ic"><use href="#i-close"></use></svg></button><div class="lightbox__inner"></div>`;
  document.body.appendChild(lb);
  const lbInner = lb.querySelector(".lightbox__inner");
  $("#masonry").addEventListener("click", (e) => {
    const t = e.target.closest("[data-lb]"); if (!t) return;
    const i = +t.dataset.lb;
    lbInner.style.background = artBG(galleryArt[i]);
    lbInner.innerHTML = `<svg viewBox="0 0 120 120"><use href="#illus-${galleryIll[i]}"></use></svg>`;
    lb.classList.add("is-open"); document.body.classList.add("is-locked");
  });
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest(".lightbox__close")) { lb.classList.remove("is-open"); document.body.classList.remove("is-locked"); } });

  /* ----------------------------- رویدادها + شمارش معکوس ----------------------------- */
  $("#eventsGrid").innerHTML = EVENTS.map((ev) => `
    <article class="ecard">
      <div class="ecard__media" style="background:${artBG(ev.art)}">
        <svg viewBox="0 0 120 120"><use href="#illus-signature"></use></svg>
        <span class="ecard__type">${ev.type}</span>
      </div>
      <div class="ecard__body">
        <h3 class="ecard__title">${ev.title}</h3>
        <p class="ecard__desc">${ev.desc}</p>
        <div class="ecard__meta">
          <span><svg class="ic"><use href="#i-cal"></use></svg>${ev.date}</span>
          <span><svg class="ic"><use href="#i-clock"></use></svg>${ev.time}</span>
          <span><svg class="ic"><use href="#i-spark"></use></svg>${fmt(ev.seats)} صندلی</span>
        </div>
        <div class="ecard__foot">
          <span class="ecard__price">${ev.price ? fmt(ev.price) + " تومان" : "ورود آزاد"}</span>
          <button class="add-btn" data-evbook="${ev.id}"><svg class="ic"><use href="#i-check"></use></svg>رزرو جا</button>
        </div>
      </div>
    </article>`).join("");
  $("#eventsGrid").addEventListener("click", (e) => { if (e.target.closest("[data-evbook]")) toast("جای شما در رویداد رزرو شد 🎵"); });
  // شمارش معکوس تا رویداد اول (۹ روز بعد به‌صورت نمونه)
  const target = Date.now() + 9 * 864e5 + 3 * 36e5;
  const pad = (n) => fmt(n).padStart(2, "۰");
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff %= 864e5;
    const h = Math.floor(diff / 36e5); diff %= 36e5;
    const m = Math.floor(diff / 6e4); diff %= 6e4;
    const s = Math.floor(diff / 1e3);
    $("#cdD").textContent = pad(d); $("#cdH").textContent = pad(h); $("#cdM").textContent = pad(m); $("#cdS").textContent = pad(s);
  };
  tick(); setInterval(tick, 1000);

  /* ----------------------------- باشگاه ----------------------------- */
  $("#tiers").innerHTML = TIERS.map((t) => `
    <div class="tier tier--${t.id}">
      <svg class="tier__girih" viewBox="0 0 100 100"><use href="#girih"></use></svg>
      <div class="tier__lamp"><svg class="ic"><use href="#i-spark"></use></svg></div>
      <h3>${t.fa}</h3>
      <div class="tier__pts">${t.pts} امتیاز</div>
      <p class="tier__perk">${t.perk}</p>
    </div>`).join("");

  /* فرم‌های ساده */
  ["#joinForm", "#newsForm"].forEach((s) => $(s).addEventListener("submit", (e) => { e.preventDefault(); toast("ثبت شد! خوش‌اومدی به دمسا ☕"); e.target.reset(); }));

  /* ----------------------------- توست ----------------------------- */
  function toast(msg, type = "ok") {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<svg class="ic" style="color:${type === "error" ? "#ff6b7a" : ""}"><use href="#${type === "error" ? "i-close" : "i-check"}"></use></svg>${msg}`;
    $("#toasts").appendChild(t);
    setTimeout(() => { t.classList.add("is-out"); setTimeout(() => t.remove(), 400); }, 2600);
  }

  /* کانفتیِ سبک */
  function confetti() {
    if (reduce) return;
    const colors = ["#E0922B", "#B0824E", "#2F8F86", "#F3EAD9"];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement("i");
      Object.assign(c.style, {
        position: "fixed", zIndex: 400, top: "-10px", left: Math.random() * 100 + "vw",
        width: "8px", height: "8px", background: colors[i % 4], borderRadius: Math.random() > .5 ? "50%" : "2px",
        pointerEvents: "none",
      });
      document.body.appendChild(c);
      c.animate([
        { transform: `translateY(0) rotate(0)`, opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ], { duration: 1400 + Math.random() * 1000, easing: "cubic-bezier(.3,.7,.4,1)" }).onfinish = () => c.remove();
    }
  }

  /* بستن با Escape */
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeModal(); closeMM(); closeDrawer();
    lb.classList.remove("is-open"); document.body.classList.remove("is-locked");
  });

  /* اسکرول نرم برای لینک‌های لنگری */
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href"); if (id === "#" || id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }));
})();

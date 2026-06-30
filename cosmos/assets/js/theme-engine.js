/* ===========================================================================
   دمسا · موتورِ تمِ هوشمند (Smart Theme Engine)
   با یک یا دو رنگِ پایه (primary + secondary) کلِ پالتِ سایت ساخته می‌شود.
   این فایل توسطِ خودِ سایت و پنلِ ادمین به‌اشتراک استفاده می‌شود.
   خروجی: مجموعهٔ کاملِ توکن‌های CSS برای حالتِ تاریک و روشن.
   =========================================================================== */
(function (root) {
  "use strict";

  /* ----------------------------- تبدیل‌های رنگ ----------------------------- */
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const round = (n) => Math.round(n * 10) / 10;

  function hexToRgb(hex) {
    let h = String(hex || "").trim().replace(/^#/, "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return { r: 0, g: 0, b: 0 };
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    const f = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
    return "#" + f(r) + f(g) + f(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    const d = max - min;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60; if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
  }

  const hexToHsl = (hex) => { const { r, g, b } = hexToRgb(hex); return rgbToHsl(r, g, b); };
  const hslToHex = (h, s, l) => { const { r, g, b } = hslToRgb(h, s, l); return rgbToHex(r, g, b); };

  /* یک رنگِ HSL با تنظیمِ نسبی، به هگز */
  function tune(hsl, dh, ds, dl) {
    return hslToHex(hsl.h + (dh || 0), clamp(hsl.s + (ds || 0), 0, 100), clamp(hsl.l + (dl || 0), 0, 100));
  }
  /* HSL مطلق به هگز */
  const setHsl = (h, s, l) => hslToHex(h, s, l);

  /* رنگ + آلفا → rgba() */
  function alpha(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${round(a)})`;
  }

  /* رنگِ متنِ خوانا روی یک پس‌زمینه (تیره/روشن) */
  function readableOn(hex) {
    const { r, g, b } = hexToRgb(hex);
    const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return L > 0.55 ? "#1a120a" : "#F3EAD9";
  }

  /* ----------------------------- ساختِ پالت ----------------------------- */
  /* seed = { primary, secondary, mode } ؛ خروجی: { dark:{tokens}, light:{tokens} } */
  function buildPalette(seed) {
    const primary = seed && seed.primary ? seed.primary : "#E0922B";
    const secondary = seed && seed.secondary ? seed.secondary : "#2F8F86";
    const P = hexToHsl(primary);
    const S = hexToHsl(secondary);

    // مشتق‌های شتاب (accent)
    const saffron = primary;
    const saffronSoft = tune(P, 0, +7, +13);          // روشن‌تر و کمی اشباع‌تر
    const bronze = tune(P, -2, -35, -3);              // ملایم/خاکی‌تر
    const firouzeh = secondary;

    /* ---------- حالتِ تاریک ---------- */
    const dBg = setHsl(P.h, 22, 6);
    const dElev = setHsl(P.h, 22, 10);
    const dElev2 = setHsl(P.h, 22, 13);
    const cream = setHsl(P.h + 6, 50, 90);
    const creamDim = setHsl(P.h + 5, 26, 72);
    const dark = {
      "--saffron": saffron,
      "--saffron-soft": saffronSoft,
      "--bronze": bronze,
      "--firouzeh": firouzeh,
      "--espresso": dBg,
      "--roast": dElev,
      "--roast-2": dElev2,
      "--cream": cream,
      "--cream-dim": creamDim,
      "--bg": dBg,
      "--bg-elev": dElev,
      "--bg-elev-2": dElev2,
      "--text": cream,
      "--text-dim": creamDim,
      "--accent": saffron,
      "--accent-2": firouzeh,
      "--line": alpha(bronze, 0.22),
      "--line-soft": alpha(cream, 0.08),
      "--glass": alpha(dElev, 0.55),
      "--on-accent": readableOn(saffron),
      "--on-accent-2": readableOn(firouzeh),
    };

    /* ---------- حالتِ روشن ---------- */
    const lBg = setHsl(P.h + 5, 52, 94);
    const lElev2 = setHsl(P.h + 3, 48, 89);
    const lText = setHsl(P.h, 33, 11);
    const lTextDim = setHsl(P.h + 3, 22, 35);
    const light = {
      "--saffron": tune(P, 0, +2, -6),                // کمی تیره‌تر برای کنتراست روی روشن
      "--saffron-soft": saffronSoft,
      "--bronze": tune(P, -2, -25, -10),
      "--firouzeh": tune(S, 0, 0, -4),
      "--bg": lBg,
      "--bg-elev": "#FFFFFF",
      "--bg-elev-2": lElev2,
      "--text": lText,
      "--text-dim": lTextDim,
      "--accent": tune(P, 0, +2, -8),
      "--accent-2": tune(S, 0, 0, -6),
      "--line": alpha(tune(P, -2, -30, -12), 0.26),
      "--line-soft": alpha(lText, 0.08),
      "--glass": alpha(lBg, 0.7),
      "--shadow": "0 24px 60px -24px rgba(80,55,30,.35)",
      "--shadow-sm": "0 10px 30px -14px rgba(80,55,30,.28)",
      "--on-accent": readableOn(tune(P, 0, +2, -8)),
      "--on-accent-2": readableOn(tune(S, 0, 0, -6)),
    };

    return { dark, light };
  }

  /* ----------------------------- اعمالِ تم ----------------------------- */
  /* پالت را به‌صورتِ یک <style> تزریق می‌کند تا هم تاریک و هم روشن کار کند و
     سوییچِ data-theme دست‌نخورده بماند. overrides روی توکن‌های مشتق‌شده می‌نشیند. */
  function paletteToCss(pal, overrides) {
    const ov = overrides || {};
    const lines = (obj, extra) => Object.entries(Object.assign({}, obj, extra || {}))
      .map(([k, v]) => `  ${k}:${v};`).join("\n");
    return `:root{\n${lines(pal.dark, ov.dark)}\n}\n` +
           `[data-theme="light"]{\n${lines(pal.light, ov.light)}\n}\n`;
  }

  function applyTheme(doc, theme) {
    const t = theme || {};
    const pal = buildPalette(t);
    const css = paletteToCss(pal, t.overrides);
    let el = doc.getElementById("damsa-theme");
    if (!el) {
      el = doc.createElement("style");
      el.id = "damsa-theme";
      doc.head.appendChild(el);
    }
    el.textContent = css;
    if (t.mode === "light" || t.mode === "dark") {
      doc.documentElement.setAttribute("data-theme", t.mode);
    }
    return pal;
  }

  root.DamsaTheme = {
    hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hexToHsl, hslToHex,
    tune, alpha, readableOn, buildPalette, paletteToCss, applyTheme,
  };
})(typeof window !== "undefined" ? window : globalThis);

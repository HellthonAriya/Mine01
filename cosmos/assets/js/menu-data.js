/* ===========================================================================
   ایستگاهِ فضاییِ دمسا · داده‌های پیش‌فرض (قالب ۳ — کیهان)
   منوی این کافه‌رستوران یک منظومهٔ شمسی است: هر دسته یک «سیاره» است و
   آیتم‌هایش مثلِ ماهواره دورِ آن می‌چرخند. ادمین این‌ها را از content.json
   بازنویسی می‌کند.
   =========================================================================== */
const TOMAN = (n) => (Number(n) || 0).toLocaleString("fa-IR");

/* ---------------------------------------------------------------------------
   سیاره‌ها (دسته‌ها)
   هر سیاره: id, fa, en, code (کدِ ماموریت), accent/accent2 (رنگِ نئونِ سیاره),
   surface (دو رنگِ سطحِ سیاره برای گرادیانِ کروی), ring (حلقه دارد؟),
   tagline (یک‌خطی), glyph (نامِ آیکنِ SVG)
   --------------------------------------------------------------------------- */
const PLANETS = [
  {
    id: "brew", fa: "قهوه و دمنوش", en: "Brews", code: "KP-01",
    accent: "#F4A93C", accent2: "#FFD98A",
    surf1: "#7A4A12", surf2: "#23130A", ring: false,
    tagline: "ستاره‌ای گرم که با هر فنجان بیدارت می‌کند.",
    glyph: "cup",
  },
  {
    id: "dawn", fa: "صبحانه", en: "Sunrise", code: "KP-02",
    accent: "#FF8A5B", accent2: "#FFC59B",
    surf1: "#8A3B2A", surf2: "#241009", ring: true,
    tagline: "سپیده‌دمِ منظومه؛ جایی که روز متولد می‌شود.",
    glyph: "sun",
  },
  {
    id: "verdant", fa: "پیش‌غذا و سالاد", en: "Verdant", code: "KP-03",
    accent: "#3FE0A8", accent2: "#B6F7DC",
    surf1: "#0E6E52", surf2: "#06231B", ring: false,
    tagline: "واحه‌ای سبز در دلِ خلأ؛ تازه و سبک.",
    glyph: "leaf",
  },
  {
    id: "core", fa: "غذای اصلی", en: "Core", code: "KP-04",
    accent: "#FF5C7A", accent2: "#FFB3C2",
    surf1: "#8E1E37", surf2: "#260910", ring: true,
    tagline: "هستهٔ سرخِ منظومه؛ سنگین، گرم، پرکشش.",
    glyph: "orbit",
  },
  {
    id: "ember", fa: "گریل و باربیکیو", en: "Ember", code: "KP-05",
    accent: "#FF7A1A", accent2: "#FFC07A",
    surf1: "#7E2E0C", surf2: "#220A04", ring: false,
    tagline: "آتش‌سیاره‌ای که روی زغالش طعم می‌سازد.",
    glyph: "flame",
  },
  {
    id: "nova", fa: "دسر و بستنی", en: "Nova", code: "KP-06",
    accent: "#B07CFF", accent2: "#E6CBFF",
    surf1: "#5B2E9E", surf2: "#190A33", ring: true,
    tagline: "ابرِ شیرینِ بنفش؛ پایانِ سفر با یک شکوفه.",
    glyph: "spark",
  },
];

/* برچسب‌ها (نشان‌های آیتم) */
const TAG_LABELS = {
  chef: { fa: "انتخابِ ناخدا", tone: "gold" },
  signature: { fa: "امضای دمسا", tone: "violet" },
  spicy: { fa: "تند", tone: "red" },
  veg: { fa: "گیاهی", tone: "green" },
  cold: { fa: "سرد", tone: "cyan" },
  new: { fa: "تازه‌رسیده", tone: "gold" },
};

/* ---------------------------------------------------------------------------
   آیتم‌ها (هر آیتم به یک سیاره وصل است)
   id, planet, name, en, desc, price, tags, kcal, glyph (آیکنِ روی هولوکارت)
   --------------------------------------------------------------------------- */
const DISHES = [
  /* ---- KP-01 · قهوه و دمنوش ---- */
  { id: "b1", planet: "brew", name: "اسپرسوی سیاه‌چاله", en: "Black-Hole Espresso", price: 90000,
    desc: "دو شاتِ ریستریتو با کرمای غلیظ؛ غلیظ‌تر از جاذبه.", tags: ["chef"], kcal: 15, glyph: "cup" },
  { id: "b2", planet: "brew", name: "لاتهٔ کهکشانی", en: "Galaxy Latte", price: 135000,
    desc: "اسپرسو، شیرِ مخملی و نقشِ مارپیچِ کهکشان روی فوم.", tags: ["signature"], kcal: 180, glyph: "cup" },
  { id: "b3", planet: "brew", name: "موکای شهاب‌سنگ", en: "Meteor Mocha", price: 150000,
    desc: "شکلاتِ تلخ، اسپرسو و خرده‌های کاکائوی برشته.", tags: [], kcal: 240, glyph: "cup" },
  { id: "b4", planet: "brew", name: "دمنوشِ سحابی", en: "Nebula Infusion", price: 110000,
    desc: "گلِ گاوزبان، اسطوخودوس و به‌لیمو؛ آرام‌بخشِ مدارها.", tags: ["veg", "cold"], kcal: 30, glyph: "leaf" },

  /* ---- KP-02 · صبحانه ---- */
  { id: "d1", planet: "dawn", name: "املتِ خورشیدی", en: "Solar Omelette", price: 185000,
    desc: "تخم‌مرغِ محلی، قارچ، پنیرِ گودا و سبزیجاتِ تفت‌داده.", tags: ["chef"], kcal: 420, glyph: "sun" },
  { id: "d2", planet: "dawn", name: "پنکیکِ حلقهٔ زحل", en: "Saturn-Ring Pancakes", price: 210000,
    desc: "سه لایه پنکیکِ پفی با شربتِ افرا و کرهٔ بادام.", tags: ["new"], kcal: 560, glyph: "sun" },
  { id: "d3", planet: "dawn", name: "بِنِدیکتِ مداری", en: "Orbit Benedict", price: 240000,
    desc: "نانِ برشته، تخم‌مرغِ آب‌پزِ روان و سُسِ هلندی.", tags: ["signature"], kcal: 480, glyph: "sun" },

  /* ---- KP-03 · پیش‌غذا و سالاد ---- */
  { id: "v1", planet: "verdant", name: "سالادِ واحهٔ سبز", en: "Green-Oasis Salad", price: 195000,
    desc: "کاهوی فرانسوی، آووکادو، انار و سُسِ مرکبات.", tags: ["veg", "cold"], kcal: 260, glyph: "leaf" },
  { id: "v2", planet: "verdant", name: "سوپِ کدوی فضایی", en: "Cosmic Squash Soup", price: 165000,
    desc: "کدوحلوایی، شیرِ نارگیل و کمی زنجبیل؛ مخملی و گرم.", tags: ["veg"], kcal: 220, glyph: "leaf" },
  { id: "v3", planet: "verdant", name: "بروشتای شهابی", en: "Shooting-Star Bruschetta", price: 180000,
    desc: "نانِ سنگکِ برشته، گوجهٔ کنفی، ریحان و روغنِ زیتون.", tags: ["new"], kcal: 300, glyph: "leaf" },

  /* ---- KP-04 · غذای اصلی ---- */
  { id: "c1", planet: "core", name: "ریزوتوی هستهٔ مرکزی", en: "Core Risotto", price: 420000,
    desc: "برنجِ آربوریو، قارچِ پورتوبلو و پارمزانِ رسیده.", tags: ["veg", "chef"], kcal: 560, glyph: "orbit" },
  { id: "c2", planet: "core", name: "پاستای ماهِ سرخ", en: "Red-Moon Pasta", price: 390000,
    desc: "فتوچینی با سُسِ گوجهٔ کبابی، فلفلِ دلمه و ریحان.", tags: ["spicy"], kcal: 640, glyph: "orbit" },
  { id: "c3", planet: "core", name: "سالمونِ مدارِ قطبی", en: "Polar-Orbit Salmon", price: 540000,
    desc: "فیلهٔ سالمونِ سرخ‌شده با کرهٔ لیمو و سبزیجاتِ فصل.", tags: ["signature"], kcal: 610, glyph: "orbit" },

  /* ---- KP-05 · گریل و باربیکیو ---- */
  { id: "e1", planet: "ember", name: "استیکِ ابرنواختر", en: "Supernova Steak", price: 920000,
    desc: "۳۰۰ گرم ریب‌آیِ رسیده روی زغال، سُسِ فلفلِ سیاه.", tags: ["chef", "signature"], kcal: 980, glyph: "flame" },
  { id: "e2", planet: "ember", name: "کبابِ شعله‌ور", en: "Flare Kebab", price: 480000,
    desc: "دنده‌های برهٔ مرینیت‌شده با رزماری و سیر.", tags: ["spicy"], kcal: 760, glyph: "flame" },
  { id: "e3", planet: "ember", name: "جوجهٔ زعفرانِ خورشیدی", en: "Saffron Solar Chicken", price: 430000,
    desc: "سینهٔ مرغِ زعفرانی با کرهٔ محلی و لیموی عمانی.", tags: ["new"], kcal: 520, glyph: "flame" },

  /* ---- KP-06 · دسر و بستنی ---- */
  { id: "n1", planet: "nova", name: "سوفلهٔ سحابی شکلات", en: "Nebula Chocolate Soufflé", price: 240000,
    desc: "سوفلهٔ گرمِ شکلاتِ تلخ با مرکزِ روان و بستنیِ وانیل.", tags: ["chef"], kcal: 480, glyph: "spark" },
  { id: "n2", planet: "nova", name: "بستنیِ ماهِ یخی", en: "Ice-Moon Gelato", price: 160000,
    desc: "ژلاتوی پسته و وانیل با تراشهٔ شکلاتِ سفید.", tags: ["cold", "veg"], kcal: 320, glyph: "spark" },
  { id: "n3", planet: "nova", name: "چیزکیکِ کهکشان", en: "Galaxy Cheesecake", price: 200000,
    desc: "چیزکیکِ نیویورکی با رویهٔ بلوبری و کاراملِ نمکی.", tags: ["signature"], kcal: 540, glyph: "spark" },
];

/* نظراتِ مسافران */
const TESTIMONIALS = [
  { name: "سارا و امید", role: "مسافرانِ شامِ سالگرد", rating: 5,
    text: "حسِ سفر بینِ سیاره‌ها واقعی بود! استیکِ ابرنواختر بهترین چیزی بود که خوردیم." },
  { name: "دکتر رضوی", role: "مهمانِ ثابتِ ایستگاه", rating: 5,
    text: "لاتهٔ کهکشانی و فضای بی‌نظیر. هر بار انگار دوباره پرتاب می‌شوی به یک دنیای تازه." },
  { name: "نگار ک.", role: "وبلاگ‌نویسِ سفر و غذا", rating: 5,
    text: "خلاقیت در چیدمان و طعم بی‌نظیر است؛ سوفلهٔ سحابی حتماً باید امتحان شود." },
];

window.DAMSA = { TOMAN, PLANETS, TAG_LABELS, DISHES, TESTIMONIALS };

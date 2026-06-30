/* ===========================================================================
   رستوران دمسا · داده‌های پیش‌فرض (قالب ۲)
   منبعِ پیش‌فرضِ منو (دوره‌ها/غذاها)، نظرات و طرح‌های رنگ. ادمین این‌ها را
   از طریقِ content.json بازنویسی می‌کند.
   =========================================================================== */
const TOMAN = (n) => (Number(n) || 0).toLocaleString("fa-IR");

/* دوره‌های غذایی (محورِ منو) */
const COURSES = [
  { id: "starter", fa: "پیش‌غذا", en: "Starters" },
  { id: "main", fa: "غذای اصلی", en: "Main Course" },
  { id: "grill", fa: "کباب و گریل", en: "Grill" },
  { id: "dessert", fa: "دسر", en: "Desserts" },
  { id: "drink", fa: "نوشیدنی", en: "Drinks" },
];

const TAG_LABELS = {
  chef: { fa: "پیشنهاد سرآشپز", tone: "gold" },
  signature: { fa: "امضای دمسا", tone: "wine" },
  spicy: { fa: "تند", tone: "wine" },
  veg: { fa: "گیاهی", tone: "green" },
  new: { fa: "تازه", tone: "gold" },
};

/* طرح‌های گرادیانِ هم‌خانوادهٔ برند (برای آیتم‌های بدونِ عکس) */
const ART = {
  ember: ["#3A1414", "#120707"],
  wine: ["#4A1322", "#15070C"],
  gold: ["#4A3416", "#170F06"],
  herb: ["#22361F", "#0C120B"],
  smoke: ["#2A2530", "#0E0C11"],
  cream: ["#574532", "#221A12"],
};

/* غذاها: name/en/desc/price/course/tags/art/illus/kcal */
const DISHES = [
  /* پیش‌غذا */
  { id: "s1", course: "starter", name: "سوپِ قارچِ ترافل", en: "Truffle Mushroom Soup", price: 180000,
    desc: "سوپِ مخملیِ قارچ با روغنِ ترافل و نانِ برشته.", art: "smoke", illus: "bowl", tags: ["chef"], kcal: 280 },
  { id: "s2", course: "starter", name: "سالادِ سزارِ گریل", en: "Grilled Caesar", price: 210000,
    desc: "کاهوی گریل‌شده، پارمزان، نانِ سیر و سُسِ سزارِ خانگی.", art: "herb", illus: "salad", tags: ["veg"], kcal: 320 },
  { id: "s3", course: "starter", name: "کارپاچوی گوشت", en: "Beef Carpaccio", price: 320000,
    desc: "برش‌های نازکِ فیله با روغنِ زیتون، کیپر و تراشهٔ پارمزان.", art: "wine", illus: "plate", tags: ["signature"], kcal: 260 },

  /* غذای اصلی */
  { id: "m1", course: "main", name: "ریزوتوی قارچ", en: "Wild Mushroom Risotto", price: 420000,
    desc: "برنجِ آربوریو، قارچِ جنگلی، پارمزان و کرهٔ مغزدار.", art: "gold", illus: "plate", tags: ["veg", "chef"], kcal: 560 },
  { id: "m2", course: "main", name: "پاستای خامه و مرغ", en: "Creamy Chicken Pasta", price: 380000,
    desc: "فتوچینی با سُسِ خامه، سینهٔ مرغِ گریل و ریحان.", art: "cream", illus: "pasta", tags: ["new"], kcal: 720 },
  { id: "m3", course: "main", name: "ماهیِ سالمونِ سوخاری", en: "Seared Salmon", price: 540000,
    desc: "سالمونِ سرخ‌شده با سُسِ کره‌لیمو و سبزیجاتِ فصل.", art: "ember", illus: "fish", tags: ["signature"], kcal: 610 },

  /* کباب و گریل */
  { id: "g1", course: "grill", name: "استیکِ ریب‌آی", en: "Ribeye Steak", price: 890000,
    desc: "۳۰۰ گرم ریب‌آیِ رسیده، گریلِ زغالی، سُسِ فلفل و سیب‌زمینی.", art: "ember", illus: "steak", tags: ["chef", "signature"], kcal: 980 },
  { id: "g2", course: "grill", name: "کبابِ برهٔ ممتاز", en: "Lamb Chops", price: 760000,
    desc: "دنده‌های برهٔ مرینیت‌شده با رزماری و سیر روی زغال.", art: "wine", illus: "steak", tags: ["signature"], kcal: 840 },
  { id: "g3", course: "grill", name: "جوجهٔ زعفرانی", en: "Saffron Chicken", price: 420000,
    desc: "سینهٔ مرغِ زعفرانی با کرهٔ محلی و لیموی عمانی.", art: "gold", illus: "steak", tags: ["new"], kcal: 520 },

  /* دسر */
  { id: "d1", course: "dessert", name: "سوفلهٔ شکلات", en: "Chocolate Soufflé", price: 240000,
    desc: "سوفلهٔ گرمِ شکلاتِ تلخ با مرکزِ روان و بستنیِ وانیل.", art: "ember", illus: "cake", tags: ["chef"], kcal: 480 },
  { id: "d2", course: "dessert", name: "کرم‌بروله وانیل", en: "Vanilla Crème Brûlée", price: 200000,
    desc: "کاستاردِ وانیلیِ مادگاسکار با رویهٔ کاراملِ ترَک‌خورده.", art: "gold", illus: "cake", tags: ["signature"], kcal: 360 },

  /* نوشیدنی */
  { id: "k1", course: "drink", name: "موکتلِ انار و نعنا", en: "Pomegranate Mocktail", price: 160000,
    desc: "عصارهٔ انارِ تازه، نعناع، لیموترش و سودا.", art: "wine", illus: "glass", tags: ["new", "veg"], kcal: 120 },
  { id: "k2", course: "drink", name: "لیموناد فرانسوی", en: "French Lemonade", price: 140000,
    desc: "لیموناد گازدار با شربتِ گلِ محمدی و یخِ نعنا.", art: "herb", illus: "glass", tags: ["veg"], kcal: 110 },
];

/* نظراتِ مهمان‌ها */
const TESTIMONIALS = [
  { name: "سارا و امید", role: "مهمانِ شامِ سالگرد", rating: 5,
    text: "بهترین استیکی که در تهران خوردیم. نورپردازی و موسیقی فضای فوق‌العاده‌ای ساخته بود." },
  { name: "دکتر رضوی", role: "مهمانِ ثابت", rating: 5,
    text: "ریزوتوی قارچ بی‌نظیر است و سرویس بسیار حرفه‌ای. هر بار تجربه‌ای یک‌دست و باکیفیت." },
  { name: "نگار ک.", role: "وبلاگ‌نویسِ غذا", rating: 5,
    text: "منوی فصلی و خلاقیتِ سرآشپز چشمگیر است؛ سوفلهٔ شکلات حتماً باید امتحان شود." },
];

window.DAMSA = { TOMAN, COURSES, TAG_LABELS, ART, DISHES, TESTIMONIALS };

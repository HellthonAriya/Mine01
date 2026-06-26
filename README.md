<div align="center">

# ☕ کافهٔ دمسا — Damsa Café

**وب‌سایتِ پریمیوم، موبایل‌اول و کاملاً فارسی (RTL) برای یک کافهٔ مدرن**

طراحیِ سینماییِ شبانه · انیمیشن‌های روان · رزرو میز · بدونِ build

![RTL](https://img.shields.io/badge/dir-RTL-E0922B?style=flat-square)
![Mobile First](https://img.shields.io/badge/design-mobile--first-2F8F86?style=flat-square)
![No Build](https://img.shields.io/badge/build-none-B0824E?style=flat-square)
![License: MIT](https://img.shields.io/badge/license-MIT-F3EAD9?style=flat-square)

</div>

---

## ✨ معرفی

«دمسا» قالبِ شمارهٔ ۱ از مجموعهٔ سه‌گانهٔ کافه/رستوران است. یک تجربهٔ تمام‌صفحه با
پالتِ **espresso / saffron / firouzeh**، امضای بصریِ **گره‌چینی** و فنجانِ شناورِ هیرو.
کانالِ اصلیِ کنشِ مشتری **رزرو میز** است؛ منو فقط برای مرور و دیدنِ جزئیات کاربرد دارد —
**بدون سبد خرید، سفارش آنلاین یا ارسال.**

## 🎯 امکانات

- **هیرو سینمایی** با بخار، ذرات، فنجانِ ۳بُعدیِ تعاملی و نقشِ گره‌چینی
- **منوی ویژه** با فیلتر و جست‌وجوی آنی
- **منوی کامل** در ۱۲ دسته، با کارتِ جزئیاتِ هر آیتم (کالری، زمان، مواد، حساسیت‌زاها)
- **رزرو میز**: تقویمِ فارسی، انتخابِ ساعت، تعداد مهمان، خواستهٔ ویژه
- **نظرات** (کاروسلِ خودکار)، **گالری** (لایت‌باکس)، **رویدادها** (+شمارش معکوس)
- **باشگاه مشتریان**، **تماس + نقشه + سؤالات متداول**
- **حالت تاریک/روشن**، ناوبریِ پایینِ موبایل، دکمهٔ شناورِ رزرو
- دسترس‌پذیر: فوکوسِ کیبورد، احترام به `prefers-reduced-motion`، ساختارِ معنایی

## 🧱 پشتهٔ فنی

HTML + CSS + JavaScriptِ خالص (Vanilla) — بدونِ فریم‌ورک و بدونِ مرحلهٔ build.
فونتِ **Vazirmatn** و **Lalezar** و کتابخانهٔ انیمیشنِ **GSAP** از CDN بارگذاری می‌شوند
(در نبودِ شبکه، سایت با فونتِ سیستمی و بدونِ انیمیشنِ اسکرول هم درست کار می‌کند).

---

## 🚀 نصب روی سرور (تک‌خطی)

روی یک سرورِ **Ubuntu/Debian** تازه؛ سایت روی **پورت ۸۰** بالا می‌آید و فقط با **IP** باز می‌شود:

```bash
curl -fsSL https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/claude/wizardly-feynman-nc1fzn/scripts/deploy.sh | sudo bash
```

### با دامنه + SSL رایگان (Let's Encrypt)

ابتدا رکوردِ **A** دامنه را به IP سرور وصل کن، سپس:

```bash
curl -fsSL https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/claude/wizardly-feynman-nc1fzn/scripts/deploy.sh | sudo bash -s -- example.com you@email.com
```

> `example.com` و ایمیل را با مقادیرِ خودت عوض کن. گواهیِ SSL خودکار گرفته و
> هر ۹۰ روز خودکار تمدید می‌شود؛ ترافیکِ HTTP هم به HTTPS هدایت می‌گردد.

## 🔄 آپدیت (تک‌خطی)

```bash
curl -fsSL https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/claude/wizardly-feynman-nc1fzn/scripts/update.sh | sudo bash
```

## 💻 اجرای محلی (برای توسعه)

هیچ نصبی لازم نیست — فقط فایلِ `index.html` را در مرورگر باز کن، یا:

```bash
python3 -m http.server 8000   # سپس: http://localhost:8000
```

---

## 🗂️ ساختار پروژه

```
Mine01/
├── index.html              ساختار صفحه + اسپرایتِ SVG (آیکن/تصویرسازی)
├── assets/
│   ├── css/styles.css      هویت بصری، RTL، تم تاریک/روشن، ریسپانسیو
│   └── js/
│       ├── menu-data.js    دادهٔ منو، نظرات، رویدادها، سطوحِ باشگاه
│       └── app.js          تعامل‌ها: ناوبری، انیمیشن، منو، رزرو، گالری…
├── scripts/
│   ├── deploy.sh           استقرار با Nginx + SSL
│   └── update.sh           آپدیتِ سایت روی سرور
├── LICENSE                 مجوز MIT
└── README.md
```

## 🎨 شخصی‌سازی

- **منو/قیمت/دسته‌ها** → `assets/js/menu-data.js`
- **رنگ‌ها/فونت/فاصله‌ها** → متغیرهای CSS در ابتدای `assets/css/styles.css` (بخش `:root`)
- **اطلاعات تماس/ساعت/نشانی** → داخل `index.html`

## 🛠️ مدیریت روی سرور

```bash
sudo systemctl reload nginx     # بارگذاری مجدد
sudo systemctl status nginx     # وضعیت
sudo nginx -t                   # تستِ پیکربندی
```

## 🗺️ نقشهٔ راه

- [x] قالب ۱ — **کافه** (همین مخزن)
- [ ] قالب ۲ — رستوران
- [ ] قالب ۳ — کافه‌رستوران

> تصاویر فعلاً **تصویرسازیِ SVG** هستند تا یک‌دست و همیشه رندر شوند؛ برای نسخهٔ نهایی،
> عکاسیِ واقعی جایگزین شود.

## 📄 مجوز

[MIT](LICENSE) — استفاده، تغییر و توزیع آزاد است.

<div align="center"><sub>طراحی‌شده با عشق به قهوه ☕</sub></div>

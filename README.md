<div align="center">

# 🍽️ دمسا — مجموعهٔ قالب‌ها (کافه + رستوران)

**دو وب‌سایتِ پریمیوم، موبایل‌اول و کاملاً فارسی (RTL) با صفحهٔ انتخابِ قالب و پنلِ مدیریتِ جداگانه**

کافهٔ سینمایی + رستورانِ منو‌محور · انیمیشن‌های روان · تمِ رنگِ هوشمند · بدونِ build

![RTL](https://img.shields.io/badge/dir-RTL-E0922B?style=flat-square)
![Mobile First](https://img.shields.io/badge/design-mobile--first-2F8F86?style=flat-square)
![No Build](https://img.shields.io/badge/build-none-B0824E?style=flat-square)
![License: MIT](https://img.shields.io/badge/license-MIT-F3EAD9?style=flat-square)

</div>

---

## ✨ معرفی

«دمسا» یک مجموعهٔ **دوقالبی** است. در ریشهٔ سایت یک **صفحهٔ انتخاب** داری که می‌توانی
بینِ دو قالبِ کاملاً متفاوت یکی را باز کنی — هرکدام طراحی، چیدمان و **پنلِ مدیریتِ مستقلِ خودش** را دارد:

- **قالب ۱ — کافه** (`/cafe/`): تجربهٔ سینمایی و تک‌صفحه‌ایِ اسکرولی با پالتِ
  espresso/saffron/firouzeh، امضای گره‌چینی و لیستِ سفارش (یادداشت).
- **قالب ۲ — رستوران** (`/restaurant/`): فاین‌داینینگِ **منو‌محور** و صحنه‌به‌صحنه
  (بدونِ اسکرولِ بلند) با نوارِ کناریِ عمودی، پالتِ شراب/طلایی و حرکت‌های لایه‌ای.

هر دو قالب از **موتورِ تمِ هوشمند** و **بک‌اندِ مشترک** استفاده می‌کنند، اما محتوای هرکدام
جداگانه ذخیره می‌شود (`cafe/content.json` و `restaurant/content.json`).

### نشانی‌ها
| | سایت | پنلِ مدیریت |
|---|---|---|
| انتخابِ قالب | `/` | — |
| کافه | `/cafe/` | `/cafe/admin` |
| رستوران | `/restaurant/` | `/restaurant/admin` |

## 🎯 امکانات

- **هیرو سینمایی** با بخار، ذرات، فنجانِ ۳بُعدیِ تعاملی و نقشِ گره‌چینی
- **منوی ویژه** با فیلتر و جست‌وجوی آنی
- **منوی کامل** در ۱۲ دسته، با کارتِ جزئیاتِ هر آیتم (کالری، زمان، مواد، حساسیت‌زاها)
- **لیستِ سفارش (یادداشت)**: افزودنِ آیتم‌ها، تنظیمِ تعداد، جمعِ تقریبی، کپیِ متنِ لیست؛
  ذخیره در `localStorage` — بدونِ سبد خرید، پرداخت یا ارسال
- **نظرات** (کاروسلِ خودکار)، **گالری** (لایت‌باکس)، **رویدادها** (+شمارش معکوس)
- **باشگاه مشتریان**، **تماس + نقشه + سؤالات متداول**
- **حالت تاریک/روشن**، ناوبریِ پایینِ موبایل، دکمهٔ شناورِ لیستِ سفارش
- دسترس‌پذیر: فوکوسِ کیبورد، احترام به `prefers-reduced-motion`، ساختارِ معنایی

## 🎛️ پنلِ مدیریت (کاستومایزِ کامل)

سایت یک **پنلِ مدیریت** دارد که با آن همه‌چیز را بدونِ کدنویسی عوض می‌کنی:

- **تمِ رنگِ هوشمند:** فقط **دو رنگِ پایه** را انتخاب کن؛ کلِ پالتِ سایت
  (پس‌زمینه، متن، خط‌ها، حالتِ روشن) **خودکار و هماهنگ** ساخته می‌شود. هر رنگ هم
  با **انتخابگرِ پیشرفته** (طیفِ کامل + هگز + پریست) جداگانه قابلِ تنظیم است.
- **متنِ همهٔ بخش‌ها**، **برند**، و **منو/دسته/نظرات/رویدادها/باشگاه** (افزودن/ویرایش/حذف).
- **پیش‌نمایشِ زنده** کنارِ ویرایش؛ با «ذخیره» برای همهٔ بازدیدکننده‌ها منتشر می‌شود.

آدرس: `https://دامنه/admin` — ورود با رمزی که هنگامِ نصب تعیین می‌شود
(پیش‌فرض: `damsa-admin` — حتماً عوضش کن).

## 🧱 پشتهٔ فنی

فرانت: HTML + CSS + JavaScriptِ خالص (Vanilla) — بدونِ فریم‌ورک و بدونِ build.
بک‌اند: سرورِ **Node** بسیار سبک و **بدونِ هیچ وابستگیِ npm** (فقط ماژول‌های داخلی)
که سایت را سرو می‌کند و محتوای پنل را در `content.json` نگه می‌دارد.
فونتِ **Vazirmatn** و **Lalezar** و **GSAP** از CDN بارگذاری می‌شوند
(در نبودِ شبکه، سایت با فونتِ سیستمی هم درست کار می‌کند).

---

## 🧰 پنلِ مدیریتِ سرور (منو‌محور — ساده‌ترین راه)

یک اسکریپتِ **منویی** که همهٔ کارها را از یک‌جا انجام می‌دهد: نصب، آپدیت، تغییرِ
رمزِ ادمین، وضعیت، لاگ، گرفتنِ SSL، بکاپ و حذفِ کامل. کافی‌ست روی سرور بزنی:

```bash
curl -fsSL https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/claude/wizardly-feynman-nc1fzn/scripts/manage.sh | sudo bash
```

سپس از منو گزینه‌ات را انتخاب کن (۱ نصب، ۲ آپدیت، ۳ تغییرِ رمز، … ۹ حذف).
بعد از نصب هم همیشه با `sudo bash /var/www/damsa/scripts/manage.sh` در دسترس است.

> اگر ترجیح می‌دهی دستی عمل کنی، دستورهای تک‌خطیِ زیر هم کار می‌کنند:

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

### تعیینِ رمزِ پنلِ مدیریت هنگامِ نصب

آرگومانِ سوم، رمزِ ورودِ پنل است (وگرنه `damsa-admin`):

```bash
curl -fsSL https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/claude/wizardly-feynman-nc1fzn/scripts/deploy.sh | sudo bash -s -- example.com you@email.com «رمزِ‌دلخواه»
```

> رمز در `/etc/damsa.env` ذخیره می‌شود و با آپدیت‌ها پاک نمی‌شود. برای تغییرِ بعدی،
> آن فایل را ویرایش و `sudo systemctl restart damsa` را اجرا کن.

## 🔄 آپدیت (تک‌خطی)

```bash
curl -fsSL https://raw.githubusercontent.com/HellthonAriya/Mine01/refs/heads/claude/wizardly-feynman-nc1fzn/scripts/update.sh | sudo bash
```

## 💻 اجرای محلی (برای توسعه)

سرورِ Node را اجرا کن (هم سایت‌ها و هم پنل‌ها را سرو می‌کند):

```bash
DAMSA_PASSWORD=test node server.js
# انتخابِ قالب:        http://localhost:3000/
# کافه:    /cafe/        · پنل:  /cafe/admin
# رستوران: /restaurant/  · پنل:  /restaurant/admin
```

---

## 🗂️ ساختار پروژه

```
Mine01/
├── index.html              صفحهٔ انتخابِ قالب (چوزر)
├── server.js               سرورِ سبکِ چندقالبیِ Node (سرو + API هر قالب) — بدونِ وابستگی
├── cafe/                   قالب ۱ — کافه
│   ├── index.html  admin.html  content.json (روی سرور)  uploads/ (روی سرور)
│   └── assets/{css,js}/    styles/admin css + theme-engine/menu-data/content/app/admin js
├── restaurant/             قالب ۲ — رستوران (ساختارِ مشابه، طراحی و دادهٔ متفاوت)
│   ├── index.html  admin.html  content.json  uploads/
│   └── assets/{css,js}/
├── scripts/
│   ├── manage.sh           پنلِ منویی: نصب/آپدیت/رمز/SSL/بکاپ/حذف
│   ├── deploy.sh           استقرار: Node + Nginx (reverse-proxy) + SSL
│   └── update.sh           آپدیتِ سایت روی سرور
├── LICENSE                 مجوز MIT
└── README.md
```

> هر قالب کاملاً مستقل است: دادهٔ خودش (`<site>/content.json`)، عکس‌های خودش
> (`<site>/uploads/`) و پنلِ ادمینِ خودش (`/<site>/admin`).

## 🎨 شخصی‌سازی

ساده‌ترین راه: **پنلِ مدیریتِ هر قالب** (`/cafe/admin` یا `/restaurant/admin`) — رنگ،
متن، منو/غذاها و همه‌چیز را آنجا عوض کن. برای ویرایشِ مستقیمِ کد (اختیاری):

- **دادهٔ پیش‌فرض** → `<site>/assets/js/menu-data.js`
- **رنگ‌های پیش‌فرض** → `<site>/assets/css/styles.css` (بخش `:root`) و `theme-engine.js`
- محتوای زندهٔ هر قالب در `<site>/content.json` نگه داشته می‌شود (با پنل ساخته می‌شود).

## 🛠️ مدیریت روی سرور

```bash
sudo systemctl restart damsa    # ری‌استارتِ سرورِ سایت (Node)
sudo systemctl status damsa     # وضعیتِ سرویس
sudo journalctl -u damsa -f     # لاگِ زنده
sudo systemctl reload nginx     # بارگذاری مجددِ Nginx
sudo nginx -t                   # تستِ پیکربندیِ Nginx
```

## 🗺️ نقشهٔ راه

- [x] قالب ۱ — **کافه**
- [x] قالب ۲ — **رستوران**
- [ ] قالب ۳ — کافه‌رستوران

> تصاویرِ پیش‌فرض **تصویرسازیِ SVG** هستند؛ از پنلِ مدیریت می‌توانی برای هر آیتم
> **عکسِ واقعی** آپلود کنی.

## 📄 مجوز

[MIT](LICENSE) — استفاده، تغییر و توزیع آزاد است.

<div align="center"><sub>طراحی‌شده با عشق ☕🍷 — دمسا</sub></div>

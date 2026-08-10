# ContactFlow Professional 1.2

یک مجموعه چنددستگاهی برای مدیریت مخاطبین، Import/Export، حساب و Sync، PWA، Desktop، Android و Telegram Mini App/Business.

## دانلودها

از بخش **Releases** نسخه `v1.2.0` را باز کنید. خروجی‌های Release شامل Windows Setup/Portable، Linux x64، macOS Intel/Apple Silicon، Android APK، PWA ZIP، Server ZIP، Source ZIP و SHA-256 هستند.

## ساختار پروژه

- `index.html`, `app.js`, `pro.js`, `styles.css`, `config.js` — هسته PWA
- `server/` — ثبت‌نام، ورود، تغییر نام کاربری/رمز، Recovery، Sync، Cloud Files و Telegram API
- `desktop/` — Shell دسکتاپ و Windows Installer
- `android/` — پروژه Android/WebView
- `docs/` — راهنمای جامع و آموزش Telegram
- `.github/workflows/` — Build و Release همه دستگاه‌ها

## شروع سریع

1. برای استفاده محلی، PWA یا نسخه Desktop را اجرا کنید.
2. برای Login/Sync بین چند دستگاه، `server/` باید روی یک URL مرکزی HTTPS با Storage پایدار Deploy شود.
3. `config.js` باید همان URL را در `apiBase` داشته باشد؛ پورت محلی Desktop مثل `127.0.0.1:17654` فقط UI است و Cloud API نیست.
4. برای Telegram، راهنمای `docs/TELEGRAM_GUIDE_FA.md` را بخوانید.

## راهنماها

- `docs/START_HERE_FA.html` — راهنمای گرافیکی و آفلاین کل برنامه
- `docs/CONTACTFLOW_MASTER_GUIDE_FA.md` — راهنمای جامع متنی
- `docs/TELEGRAM_GUIDE_FA.md` — آموزش مرحله‌به‌مرحله Telegram
- `README_FA.md` — توضیحات فارسی نسخه 1.2

## نکته Telegram

Mini App و Telegram Business Connection برای اتصال رسمی و مدیریت چت‌های موجود/مجاز طراحی شده‌اند. پروژه برای دورزدن محدودیت‌های Telegram، ارسال سرد انبوه به شماره‌های ناشناس یا اسکن شماره‌های تصادفی جهت کشف حساب‌ها طراحی نشده است.

## Build

Workflow `Release All Devices` می‌تواند تمام خروجی‌های قابل دانلود را Build و در GitHub Release `v1.2.0` منتشر کند.

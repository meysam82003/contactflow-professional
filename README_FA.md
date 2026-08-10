# ContactFlow Professional 1.2

نسخه شخصی چنددستگاهی ContactFlow. هسته Import/پاک‌سازی/نام‌گذاری/VCF/CSV روی خود دستگاه اجرا می‌شود؛ حساب و Sync به Gateway خصوصی متصل می‌شوند.

## خروجی‌ها

- `build/windows/ContactFlow_Setup.exe` — نصب واقعی Windows، بدون Python و بدون Node روی سیستم کاربر.
- فایل‌های ریشه (`index.html`, `app.js`, `pro.js`, ...) — PWA قابل انتشار روی HTTPS.
- `server/` — Gateway خصوصی حساب، Sync و Telegram.
- `android/` — سورس APK و Workflow ساخت Android.

## قابلیت‌های Professional

- حساب کاربری خصوصی
- مشتق‌سازی جداگانه کلید Authentication و Encryption روی Client
- AES-256-GCM برای Snapshotهای Sync و Backup
- Sync قطعه‌ای با Batch پیش‌فرض 5,000 مخاطب
- Restore با اعتبارسنجی رمز قبل از حذف دیتابیس محلی
- Auto-Sync بر اساس Revision دیتابیس
- Backup محلی رمزگذاری‌شده `.cfbackup`
- Sync بین دستگاه‌ها
- Telegram Gateway سمت Server
- Opt-in فقط با `/start` یا `/subscribe`
- Opt-out با `/stop` یا `/unsubscribe`
- Campaign Queue با Rate Limiter سمت Server
- PWA Offline برای هسته محلی
- Windows installer + Uninstaller
- Android wrapper source با ذخیره Export در Downloads

## شروع سریع Windows

1. `ContactFlow_Setup.exe` را اجرا کنید.
2. نصب را تأیید کنید.
3. برنامه از Desktop یا Start Menu اجرا می‌شود.
4. برای استفاده Local هیچ Server لازم نیست.
5. برای Sync چنددستگاهی، Gateway را مطابق `DEPLOY_PRO_FA.md` Deploy کنید.

## شروع سریع PWA

برای نصب واقعی PWA باید فایل‌های ریشه از HTTPS یا localhost باز شوند. برای حالت Professional بهتر است همین پروژه همراه `server/server.js` روی دامنه خصوصی Deploy شود تا UI و API یک Origin داشته باشند.

## امنیت

Bot Token را هرگز داخل `app.js` یا `pro.js` قرار ندهید. فقط روی Server در `TELEGRAM_BOT_TOKEN` نگه‌داری شود. رمز اصلی کاربر در LocalStorage ذخیره نمی‌شود و Encryption Key به Server ارسال نمی‌شود.


## Professional 1.2
- Login Gate اجباری با ثبت‌نام/ورود/Recovery.
- Import چندفایلی با تنظیمات مستقل و اجرای صف.
- Export Queue و ZIP اختیاری برای خروجی‌های چندبخشی.
- رفع 404 دسکتاپ: localhost UI دیگر به‌عنوان Cloud API فرض نمی‌شود.
- سورس کامل PWA/Server/Desktop/Android و Workflowهای همه دستگاه‌ها در Repository نگهداری می‌شود.


جزئیات نسخه 1.2: `IMPLEMENTATION_STATUS_1_2_FA.md`


## ساختار سورس 1.2

- `index.html`, `app.js`, `pro.js`, `styles.css`: رابط PWA و موتور محلی
- `server/`: حساب کاربری، Recovery، Sync رمزگذاری‌شده، Cloud Files و Telegram Mini App/Business API
- `desktop/`: Shell بدون Python برای Windows/Linux/macOS و Installer ویندوز
- `android/`: پروژه Native Android/WebView
- `scripts/`: همگام‌سازی Assetها و Build محلی Desktop
- `.github/workflows/`: Build Android، Windows، همه Desktopها و Release همه دستگاه‌ها

> برای ورود یک حساب روی چند دستگاه، `server/` باید روی یک آدرس HTTPS مرکزی با Storage پایدار Deploy شود و `config.js` همان URL را در `apiBase` قرار دهد. نسخه Desktop دیگر `127.0.0.1` را Cloud API فرض نمی‌کند؛ بنابراین خطای اشتباه HTTP 404 مربوط به Login/Sync حذف شده است.

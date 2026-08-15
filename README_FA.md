# ContactFlow Personal Ultimate 3.3

ContactFlow یک نرم‌افزار Local‑First برای مدیریت، پاک‌سازی، نام‌گذاری، Backup و خروجی مخاطبین است. نسخه ۳.۳ از یک Web Core مشترک برای Telegram Mini App، PWA، Android، Windows، Linux و macOS استفاده می‌کند.

## تغییر اصلی 3.3

صفحه «مخاطبین تلگرام» می‌تواند پس از ورود رسمی User Session، فهرست واقعی مخاطبین حساب را با `contacts.getContacts` دریافت کند و با تنظیمات کامل خروجی بگیرد:

- جستجو، مرتب‌سازی و فیلتر Mutual
- انتخاب صفحه یا همه نتایج
- خروجی همه یا فقط Selection
- CSV، VCF، TXT، JSON و XLS
- انتخاب ستون، Chunk و ZIP
- پروفایل‌های ذخیره‌شده خروجی
- Snapshot آفلاین و پاک‌سازی مستقل Cache
- Import به ContactFlow و Undo محدود به رکوردهای جدید

## محدودیت رسمی Telegram

Bot API و `Telegram.WebApp` مستقیماً فهرست مخاطبین حساب را نمی‌دهند. `requestContact` فقط درخواست شماره خود کاربر را به Bot می‌فرستد. مشاهده همه مخاطبین به User Session رسمی و API ID/Hash نیاز دارد.

ContactFlow دو روش دارد:

1. API ID/Hash از قبل در Build تنظیم شده باشد.
2. کاربر API ID/Hash رسمی خودش را از `my.telegram.org/apps` فقط روی همان دستگاه ذخیره کند.

Session و Snapshot در IndexedDB همان Origin نگه‌داری می‌شوند و به Account Server متعلق به ContactFlow ارسال نمی‌شوند. جزئیات: [راهنمای خروجی مخاطبین Telegram](docs/TELEGRAM_CONTACT_EXPORT_3_3_FA.md).

## ساختار سورس

- `web/` — هسته قابل ممیزی و مشترک همه دستگاه‌ها
- `enhancements/telegram-web-entry.js` — Connector رسمی MTProto/User Session
- `desktop/` — پوسته Go برای Windows/Linux/macOS
- `android/` — پوسته WebView با System Document Picker
- `telegram-miniapp/` — Gateway اختیاری Bot/Business و ورودی توسعه
- `scripts/build-miniapp.mjs` — ساخت Mini App کامل از همان `web/`
- `.github/workflows/release-all.yml` — Build و Release همه دستگاه‌ها

فایل‌های `.source-bundles/` فقط برای سابقه نسخه‌های قدیمی نگه‌داری شده‌اند و Source of Truth نسخه ۳.۳ نیستند.

## اجرای PWA محلی

یک Static Server در ریشه مخزن اجرا کنید و `web/index.html` را باز کنید. استفاده از User Session به HTTPS یا Origin امن نیاز دارد.

## Build Connector

```bash
npm --prefix enhancements install
npm --prefix enhancements run build
cp enhancements/dist/telegram-web.bundle.js web/
```

## تست

```bash
node --test tests/*.test.cjs
node scripts/verify-v33.mjs
```

## Mini App

Release با نام زیر یک بسته Flat و آماده cPanel می‌سازد:

`ContactFlow_Personal_Ultimate_3.3.0_Telegram_MiniApp_cPanel.zip`

محتویات ZIP را روی HTTPS Extract و `https://domain/path/miniapp.html` را در BotFather ثبت کنید. این فایل همان رابط کامل برنامه را بارگذاری می‌کند، نه صفحه Placeholder نسخه قبلی.

## اصول استفاده

- داده‌ها Local‑First هستند.
- Session Telegram در Backup عمومی صادر نمی‌شود.
- Bot یا Mini App برای اسکن پنهانی شماره‌ها استفاده نمی‌شود.
- ارسال تبلیغاتی باید فقط به مخاطب دارای رضایت صریح انجام شود.
- استفاده Flood/Spam می‌تواند باعث محدودیت یا مسدودشدن حساب Telegram شود.

فهرست قابلیت‌های جدید: [FEATURES_3_3_FA.md](docs/FEATURES_3_3_FA.md)

# ContactFlow Personal Ultimate 3.4

ContactFlow یک نرم‌افزار Local‑First برای Import، پاک‌سازی، Merge، Backup، بررسی وضعیت Telegram و خروجی مخاطبین است. نسخه ۳.۴ از یک Web Core مشترک برای Telegram Mini App، PWA، Android، Windows، Linux و macOS استفاده می‌کند.

## تغییر اصلی ۳.۴

مرکز «Import و Merge هوشمند» چند فایل CSV/TSV/TXT/VCF/JSON/XLS/XLSX یا ZIP را هم‌زمان تحلیل می‌کند؛ XLS باینری OLE/BIFF نیز با Parser نسخه‌پین‌شده پشتیبانی می‌شود. تشخیص `Qom.txt → قم`، ترانویسی فارسی، E.164، کشور، شهر تلفن ثابت، نوع و اعتبار شماره، تفکیک شرکت، گزارش تکراری شهر/فامیل/دامنه و نمودار شهرها روی دستگاه انجام می‌شود.

Merge ابتدا Dry-run است. کاربر می‌تواند نسخه قدیمی، جدید یا Smart Fill را برای تعارض انتخاب کند؛ سپس Undo مستقل هر فایل یا Rollback کامل آخرین Merge در دسترس است. Android دفترچه کامل را فقط با مجوز صریح می‌خواند و OCR کارت ویزیت را محلی اجرا می‌کند. در وب Contact Picker فقط موارد انتخاب‌شده کاربر را تحویل می‌دهد.

## قابلیت Telegram از ۳.۳، یکپارچه‌شده در ۳.۴

صفحه «مخاطبین تلگرام» می‌تواند پس از ورود رسمی User Session، فهرست واقعی مخاطبین حساب را با `contacts.getContacts` دریافت کند و با تنظیمات کامل خروجی بگیرد:

- جستجو، مرتب‌سازی و فیلتر Mutual
- انتخاب صفحه یا همه نتایج
- خروجی همه یا فقط Selection
- CSV، VCF، TXT، JSON و XLS
- انتخاب ستون، Chunk و ZIP
- پروفایل‌های ذخیره‌شده خروجی
- Snapshot آفلاین و پاک‌سازی مستقل Cache
- Import به ContactFlow و Undo محدود به رکوردهای جدید
- بررسی شماره‌های دیتابیس با User Session در Batch حداکثر ۵۰۰تایی
- ثبت `matched / not_returned / retry`، فیلتر، درصد و دو خروجی جدا

## محدودیت رسمی Telegram

Bot API و `Telegram.WebApp` مستقیماً فهرست مخاطبین حساب یا گوشی را نمی‌دهند. `requestContact` فقط درخواست شماره خود کاربر را به Bot می‌فرستد. مشاهده همه مخاطبین حساب به User Session رسمی و API ID/Hash نیاز دارد. `not_returned` نیز به‌دلیل Privacy معادل قطعی «تلگرام ندارد» نیست.

ContactFlow دو روش دارد:

1. API ID/Hash از قبل در Build تنظیم شده باشد.
2. کاربر API ID/Hash رسمی خودش را از `my.telegram.org/apps` فقط روی همان دستگاه ذخیره کند.

Session و Snapshot در IndexedDB همان Origin نگه‌داری می‌شوند و به Account Server متعلق به ContactFlow ارسال نمی‌شوند. جزئیات: [راهنمای خروجی مخاطبین Telegram](docs/TELEGRAM_CONTACT_EXPORT_3_3_FA.md).

## ساختار سورس

- `web/` — هسته قابل ممیزی و مشترک همه دستگاه‌ها
- `enhancements/telegram-web-entry.js` — Connector رسمی MTProto/User Session
- `desktop/` — پوسته Go برای Windows/Linux/macOS
- `android/` — پوسته WebView با System Document Picker، دفترچه مجوزمحور و OCR محلی
- `telegram-miniapp/` — Gateway اختیاری Bot/Business و ورودی توسعه
- `scripts/build-miniapp.mjs` — ساخت Mini App کامل از همان `web/`
- `.github/workflows/release-all.yml` — Build و Release همه دستگاه‌ها

موتور `web/import-merge.js` و رابط `web/v34.js` Source of Truth منطق Merge نسخه ۳.۴ هستند.

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
node scripts/verify-v34.mjs
```

## Mini App

Release با نام زیر یک بسته Flat و آماده cPanel می‌سازد:

`ContactFlow_Personal_Ultimate_3.4.0_Telegram_MiniApp_cPanel.zip`

محتویات ZIP را روی HTTPS Extract و `https://domain/path/miniapp.html` را در BotFather ثبت کنید. این فایل همان رابط کامل برنامه را بارگذاری می‌کند، نه صفحه Placeholder نسخه قبلی.

## اصول استفاده

- داده‌ها Local‑First هستند.
- Session Telegram در Backup عمومی صادر نمی‌شود.
- Bot یا Mini App برای اسکن پنهانی شماره‌ها استفاده نمی‌شود.
- ارسال تبلیغاتی باید فقط به مخاطب دارای رضایت صریح انجام شود.
- استفاده Flood/Spam می‌تواند باعث محدودیت یا مسدودشدن حساب Telegram شود.

فهرست قابلیت‌ها و مرزهای واقعی پلتفرم‌ها: [FEATURES_3_4_FA.md](docs/FEATURES_3_4_FA.md)

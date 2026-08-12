# ContactFlow Personal Ultimate 3.1

ContactFlow یک مجموعه Local‑First برای مدیریت حجم زیاد مخاطب، Import/Export، شماره‌ساز، Backup و Telegram Mini App است.

> نسخه پایه: `3.1.0-alpha.1` + Telegram Mini App Workspace refactor

## اصل معماری

ContactFlow حساب داخلی، Login، Register، Forgot Password یا Server URL اجباری ندارد. داده‌های اصلی روی همان دستگاه در IndexedDB نگه‌داری می‌شوند و Backup دستی انتخابی است.

## Telegram Mini App به‌عنوان Workspace اصلی

نسخه Hosted Mini App برای اجرای مستقیم داخل Telegram طراحی شده و Bot در مسیر اصلی فقط نقش Launcher دارد. شماره‌ساز، Import/Export، مخاطبین، نام‌گذاری، Backup و Activity Log داخل خود Mini App اجرا می‌شوند و به Bot Gateway وابسته نیستند.

URL نمونه:

`https://domain/contactflow/miniapp.html`

Mini App برای قابلیت‌های اصلی به `TELEGRAM_API_ID`، `TELEGRAM_API_HASH` یا `GOOGLE_CLIENT_ID` در Build نیاز ندارد.

قابلیت‌های Mini App:
- Import چند فایل TXT/CSV/TSV/VCF
- Paste شماره
- Normalize ایران/بین‌المللی
- حذف Duplicate
- شماره‌ساز ترتیبی/تصادفی
- نام‌گذاری و ویرایش گروهی
- جستجو و انتخاب مخاطبین
- CSV / TXT / VCF
- خروجی انتخاب‌شده‌ها یا نتیجه جستجو
- Share VCF و Backup
- Backup/Restore محلی `.cfbackup`
- Telegram ID/Username کاربر Mini App
- `requestContact` برای شماره خود همان کاربر با تأیید خودش
- باز کردن یک شماره انتخاب‌شده در Telegram با لینک رسمی شماره تلفن
- رابط Responsive برای Telegram Android/Desktop/Web

## User MTProto Connector

Telegram متدهای `contacts.importContacts`، `contacts.resolvePhone` و `contacts.addContact` را فقط برای User Session ارائه می‌کند. JavaScript یک Mini App به Session داخلی اپ Telegram دسترسی مستقیم ندارد.

برای User Client مستقل، برنامه باید `api_id` و `api_hash` خودش را از `my.telegram.org` داشته باشد و Login رسمی کاربر را انجام دهد. QR Login رسمی هم App credentials لازم دارد.

Hosted Mini App نتیجه ساختگی برای وضعیت شماره‌ها تولید نمی‌کند و Session داخلی Telegram را دور نمی‌زند.

## مسیرهای Telegram در Workspace

### باز کردن یک مخاطب در Telegram

برای هر مخاطب می‌توان لینک رسمی شماره تلفن را به Telegram داد:

`t.me/+<phone>?profile`

Telegram خودش Resolve و Privacy را مدیریت می‌کند.

### انتقال گروهی مخاطبین

1. شماره‌ها را Import و Normalize کنید.
2. VCF همه یا مخاطبین انتخاب‌شده را بسازید.
3. VCF را داخل Contacts گوشی/سیستم Import کنید.
4. اگر Sync Contacts در Telegram روشن باشد، Telegram دفترچه مخاطبین سیستم را Sync می‌کند.

## قابلیت‌های اصلی ContactFlow

- شماره‌ساز ایران: ترتیبی/تصادفی، Prefix، شهر، بخش و نام‌گذاری سریالی
- Import چندفایلی CSV/TSV/TXT/XLSX در هسته اصلی
- Normalize شماره ایران و بین‌المللی
- حذف تکراری، Mapping ستون، Sequence و Bulk Edit
- Contacts با فیلتر شهر/بخش/منبع
- Export CSV/VCF/TXT و خروجی قطعه‌ای/ZIP در هسته اصلی
- کنترل‌های جلوگیری از اجرای ناخواسته Campaign
- Campaign Composer
- Dry Run، Duplicate Guard، سقف اجرا، Delay، Stop/Pause
- توقف روی FloodWait / Restricted / Frozen
- گزارش پیشرفت
- Backup کامل `.cfbackup`
- Android System Document Picker
- Hosted Telegram Mini App
- Activity/Audit Log
- Windows Setup/Portable، Android، Linux، macOS و PWA

## Google Drive بدون GOOGLE_CLIENT_ID

Hosted Mini App برای Backup پایه به `GOOGLE_CLIENT_ID` نیاز ندارد. Backup و VCF فایل واقعی می‌سازند. روی Android و دستگاه‌های دارای Web Share API، فایل را می‌توان به Share Sheet فرستاد و Google Drive را انتخاب کرد. روی Desktop فایل دانلود می‌شود و قابل ذخیره در Drive است.

Direct Drive OAuth پیشرفته همچنان یک قابلیت جداگانه است.

## Telegram Mini App

کد cPanel در `telegram-miniapp/` است.

1. پوشه `telegram-miniapp` را روی HTTPS Upload/Extract کنید.
2. URL زیر را در BotFather به‌عنوان Main Mini App ثبت کنید:
   `https://domain/contactflow/miniapp.html`
3. Workspace بدون Build Secret اجباری باز می‌شود.

`setup.php` و Gateway فقط برای قابلیت‌های اختیاری Bot/Business هستند و برای خود Workspace لازم نیستند.

## Build از GitHub

Workflow اصلی:

`.github/workflows/release-all.yml`

Workflow PWA، Windows، Linux، macOS، Android، Mini App و Source را Build/Package می‌کند و SHA256 می‌سازد.

## فایل‌های مهم

- `.source-bundles/v3/` — Canonical Web Core 3.0
- `.source-bundles/v31/` — augmentation نسخه 3.1
- `enhancements/telegram-web-entry.js` — User MTProto connector اختیاری
- `enhancements/drive-sync.js` — Direct Drive Sync اختیاری
- `telegram-miniapp/miniapp.html` — Hosted Mini App Workspace
- `telegram-miniapp/` — بسته cPanel
- `desktop/` — Desktop shell
- `android/` — Android shell

## Debug

برای Hosted Mini App این URL را مستقیم در مرورگر باز کنید:

`https://domain/contactflow/miniapp.html`

اگر صفحه باز شد، Workspace مستقل از Bot Gateway سالم است. برای امکانات اختیاری Gateway از `telegram-miniapp/health.php` استفاده کنید.

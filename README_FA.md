# ContactFlow Personal Ultimate 3.2

ContactFlow یک مجموعه Local‑First برای مدیریت حجم زیاد مخاطب، Import/Export، شماره‌ساز، Campaign، Backup و Telegram Mini App است.

> نسخه پایه: `3.2.0` + Hosted Mini App Contact Workspace hotfix

## اصل معماری

ContactFlow حساب داخلی، Login، Register، Forgot Password یا Server URL ندارد. داده‌های اصلی روی همان دستگاه در IndexedDB نگه‌داری می‌شوند و Backup دستی انتخابی است.

## دو حالت Telegram

### 1) Hosted Mini App — بدون App credentials
این حالت برای چیزی است که فقط با Upload روی هاست و URL کار کند:

`https://domain/contactflow/miniapp.html`

Mini App در این حالت برای باز شدن و مدیریت شماره‌ها به `TELEGRAM_API_ID`، `TELEGRAM_API_HASH` یا `GOOGLE_CLIENT_ID` در Build نیاز ندارد.

قابلیت‌ها:
- Import چند فایل TXT/CSV
- Paste شماره
- Normalize ایران/بین‌المللی
- حذف Duplicate
- Preview و آمار معتبر/نامعتبر
- CSV
- VCF
- Share VCF به Google Drive از Share Sheet سیستم در دستگاه‌های پشتیبانی‌شده
- Backup/Restore محلی `.cfbackup`
- Telegram ID/Username کاربر Mini App
- `requestContact` برای شماره خود همان کاربر با تأیید خودش

### 2) User MTProto Connector — قابلیت‌های سطح حساب
Telegram متدهای `contacts.importContacts`، `contacts.resolvePhone` و `contacts.addContact` را فقط برای User Session ارائه می‌کند. بنابراین Phone Lookup واقعی و افزودن مستقیم مخاطب به حساب Telegram از داخل Bot/Mini App ممکن نیست مگر یک User Session رسمی وجود داشته باشد.

QR login رسمی User Session نیز در سطح پروتکل به App credentials نیاز دارد. اگر این credentials موجود نباشد، ContactFlow نباید QR یا نتیجه Checker ساختگی نمایش دهد.

## قابلیت‌های اصلی ContactFlow

- شماره‌ساز ایران: ترتیبی/تصادفی، Prefix، شهر، بخش و نام‌گذاری سریالی
- Import چندفایلی CSV/TSV/TXT/XLSX با تنظیمات مستقل هر فایل
- Normalize شماره ایران و بین‌المللی
- حذف تکراری، Mapping ستون، Sequence و Bulk Edit
- Contacts با فیلتر شهر/بخش/منبع
- Export CSV/VCF/TXT و خروجی قطعه‌ای/ZIP در هسته اصلی
- Suppression / مخاطبین مجاز برای جلوگیری از ارسال ناخواسته
- Campaign Composer
- Dry Run، Duplicate Guard، سقف اجرا، Delay، Stop/Pause
- توقف روی FloodWait / Restricted / Frozen
- گزارش پیشرفت
- Backup کامل `.cfbackup`
- Android System Document Picker
- Hosted Telegram Mini App
- Activity/Audit Log
- Windows Setup/Portable، Android، Linux، macOS و PWA

## Telegram Checker — واقعیت API

طبق API رسمی Telegram:

- `contacts.resolvePhone` می‌تواند برای User Session شماره را Resolve کند.
- `contacts.importContacts` می‌تواند لیست مخاطبین را وارد کند.
- هر دو فقط برای کاربران (User Session) هستند، نه Bot/Mini App.
- Privacy حساب مقصد می‌تواند باعث شود شماره‌ای با وجود داشتن Telegram برنگردد.

بنابراین Hosted Mini App بدون User Session نمی‌تواند به‌طور رسمی بگوید هر شماره Telegram دارد یا ندارد. این نسخه به‌جای نتیجه جعلی، `VCF` و `needs-check.csv` تولید می‌کند.

شماره‌ساز برای ساخت/پاک‌سازی دیتاست وجود دارد؛ خروجی شماره‌های تولیدشده به‌صورت خودکار برای کشف انبوه حساب‌های Telegram اسکن نمی‌شود.

## افزودن مخاطبین بدون API_ID/HASH

مسیر رسمی و بدون App credentials در Hosted Mini App:

1. شماره‌ها را Import و Normalize کنید.
2. VCF بگیرید.
3. VCF را داخل Contacts گوشی/سیستم Import کنید.
4. اگر Sync Contacts در Telegram روشن باشد، Telegram دفترچه مخاطبین سیستم را Sync می‌کند.

## Google Drive بدون GOOGLE_CLIENT_ID

Hosted Mini App دیگر برای Backup پایه خطای `GOOGLE_CLIENT_ID در Build تنظیم نشده است` نمی‌دهد. Backup و VCF فایل واقعی می‌سازند. روی Android و دستگاه‌های دارای Web Share API، فایل را می‌توان به Share Sheet فرستاد و Google Drive را انتخاب کرد. روی Desktop فایل دانلود می‌شود و قابل Upload در Drive است.

Direct Drive OAuth پیشرفته همچنان یک قابلیت جداگانه است و اگر فعال شود به Google Client ID نیاز دارد؛ نبود آن نباید مانع Backup محلی/Share شود.

## درباره پیام‌رسانی

عبارت `Opt-in` از رابط Hosted Mini App مخاطبین حذف شده است، اما کنترل جلوگیری از ارسال خودکار ناخواسته از موتور Campaign حذف نشده است. Public privacy یا قابل Resolve بودن شماره به معنی اجازه تبلیغ خصوصی محسوب نمی‌شود.

## Telegram Mini App

کد cPanel در `telegram-miniapp/` است. نصب ساده Contact Workspace:

1. پوشه `telegram-miniapp` را روی HTTPS Upload/Extract کنید.
2. URL زیر را در BotFather به‌عنوان Main Mini App یا Menu Button ثبت کنید:
   `https://domain/contactflow/miniapp.html`
3. صفحه بدون Build Secret باز می‌شود.

`setup.php` و Gateway فقط برای قابلیت‌های Bot/Business اختیاری هستند و برای خود Contact Workspace لازم نیستند.

## Build از GitHub

Workflow اصلی:

`.github/workflows/release-all.yml`

Workflow PWA، Windows، Linux، macOS، Android، Mini App و Source را Build/Package می‌کند و SHA256 می‌سازد.

## فایل‌های مهم

- `.source-bundles/v3/` — Canonical Web Core 3.0
- `.source-bundles/v31/` — augmentation نسخه 3.1
- `enhancements/telegram-web-entry.js` — User MTProto connector اختیاری
- `enhancements/drive-sync.js` — Direct Drive Sync اختیاری
- `telegram-miniapp/miniapp.html` — Hosted Mini App بدون Build Secrets
- `telegram-miniapp/` — بسته cPanel
- `desktop/` — Desktop shell
- `android/` — Android shell

## Debug

برای Hosted Mini App فقط این URL را مستقیم در مرورگر باز کنید:

`https://domain/contactflow/miniapp.html`

اگر صفحه باز شد، بخش Contact Workspace مستقل از Bot Gateway سالم است. برای امکانات اختیاری Gateway از `telegram-miniapp/health.php` استفاده کنید.

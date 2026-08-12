# ContactFlow Telegram Mini App — Workspace v3

این نسخه، Workspace اصلی ContactFlow را داخل Telegram اجرا می‌کند. Bot در این معماری فقط Launcher است؛ مدیریت مخاطبین، شماره‌ساز، Import/Export، نام‌گذاری، Backup و Activity Log داخل خود Mini App و به‌صورت Local‑First انجام می‌شود.

نمونه URL:

`https://domain/contactflow/miniapp.html`

## اجرای Workspace

برای قابلیت‌های اصلی Workspace به این موارد نیاز نیست:

- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `GOOGLE_CLIENT_ID`
- ContactFlow Login/Register
- Server URL
- Bot Gateway برای پردازش مخاطبین

## قابلیت‌های Mini App

- IndexedDB محلی و سازگار با دیتابیس نسخه قبلی Mini App
- شماره‌ساز ترتیبی و تصادفی تا 1,000,000 شماره در هر Job
- Import چند فایل TXT / CSV / TSV / VCF
- Paste مستقیم شماره‌ها
- Normalize ایران و E.164 بین‌المللی
- حذف Duplicate هنگام Import
- قالب نام، شهر، بخش و Tag
- جستجو و انتخاب مخاطبین
- حذف گروهی
- نام‌گذاری و ویرایش گروهی
- CSV / TXT / VCF
- Split Export
- Export همه، انتخاب‌شده‌ها یا نتیجه جستجو
- VCF برای Contacts گوشی و Telegram Sync
- Share VCF و Backup با Web Share API
- Backup و Restore محلی `.cfbackup`
- Activity Log
- نمایش Telegram ID و Username کاربر Mini App
- `requestContact` برای شماره همان حساب با تأیید خود کاربر
- باز کردن یک شماره انتخاب‌شده در Telegram با لینک رسمی شماره تلفن
- رابط Responsive برای Telegram Android / Desktop / Web

## Telegram Integration

Mini App به User Session داخلی Telegram دسترسی مستقیم ندارد. بنابراین قابلیت‌های MTProto سطح حساب را نمی‌توان از Session مخفی Telegram داخل WebView برداشت یا دور زد.

برای کار عادی با مخاطبین دو مسیر داخل Workspace وجود دارد:

### 1) باز کردن یک مخاطب در Telegram

در جدول مخاطبین برای هر شماره دکمه `باز کردن` وجود دارد. Workspace لینک رسمی زیر را به Telegram می‌دهد:

`t.me/+<phone>?profile`

خود Telegram تصمیم می‌گیرد شماره قابل Resolve هست یا نه و Privacy مقصد را اعمال می‌کند.

### 2) انتقال گروهی مخاطبین

1. شماره‌ها را Import و Normalize کنید.
2. از تب Telegram فایل VCF همه یا مخاطبین انتخاب‌شده را بسازید.
3. VCF را در Contacts گوشی یا سیستم Import کنید.
4. در Telegram گزینه Sync Contacts را فعال کنید.

## User Client / MTProto

متدهای زیر فقط برای User Session واقعی هستند:

- `contacts.importContacts`
- `contacts.resolvePhone`
- `contacts.addContact`

برای User Client مستقل، برنامه باید `api_id` و `api_hash` خودش را از `my.telegram.org` داشته باشد و Login رسمی کاربر را انجام دهد. QR Login رسمی هم این App credentials را نیاز دارد.

Hosted Mini App به‌تنهایی User Session داخلی Telegram را دریافت نمی‌کند و نتیجه ساختگی برای وضعیت شماره‌ها تولید نمی‌کند.

## نصب روی cPanel

1. پوشه `telegram-miniapp` را در مسیر HTTPS خود Upload/Extract کنید.
2. این URL را تست کنید:
   `https://domain/contactflow/miniapp.html`
3. همان URL را در BotFather به‌عنوان Main Mini App تنظیم کنید.

Bot برای اجرای Workspace فقط نقش Launcher دارد و Gateway برای مدیریت فایل‌ها و مخاطبین الزامی نیست.

## Backup و Google Drive

روی Android می‌توانید Backup یا VCF را Share کنید و Google Drive را از Share Sheet انتخاب کنید. روی Desktop فایل دانلود می‌شود و قابل ذخیره در پوشه Google Drive Desktop است. OAuth Client ID برای این مسیر لازم نیست.

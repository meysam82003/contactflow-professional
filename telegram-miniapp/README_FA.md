# ContactFlow Telegram Mini App — Hosted Workspace v2

این نسخه برای همان مدل ساده هاست طراحی شده است: فایل‌های پوشه را داخل مسیر HTTPS خود Extract کنید و `miniapp.html` را به‌عنوان Main Mini App ثبت کنید.

نمونه:

`https://domain/contactflow/miniapp.html`

## چیزی که برای اجرای Workspace لازم نیست

خود Mini App برای شماره‌ساز، Import/Export، مدیریت مخاطبین و Backup به این موارد نیاز ندارد:

- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `GOOGLE_CLIENT_ID`
- ContactFlow Login/Register
- Server URL

## قابلیت‌های Hosted Mini App

- دیتابیس محلی IndexedDB
- شماره‌ساز ترتیبی و تصادفی تا 1,000,000 شماره در هر Job
- Import همزمان TXT / CSV / VCF
- Paste مستقیم شماره‌ها
- Normalize ایران و E.164 بین‌المللی
- حذف Duplicate هنگام Import
- نام پایه، شهر، بخش و Tag
- جستجو و فیلتر مخاطبین
- انتخاب و حذف گروهی
- وضعیت‌های `Telegram Match / Needs Check / Not Returned / Retry`
- Import نتیجه Checker با قالب `phone,status,telegram_id,username`
- خروجی جداگانه هر وضعیت
- CSV / TXT / VCF
- Split Export بر اساس تعداد هر فایل
- VCF مخصوص انتقال به Contacts گوشی
- Share VCF به Contacts، Files یا Google Drive در Android
- Backup کامل `.cfbackup`
- Restore کامل
- انتخاب فولدر Backup با File System Access API در Chrome/Edge
- امکان انتخاب فولدر Google Drive Desktop برای Backup بدون OAuth
- Activity Log
- نمایش Telegram ID و Username کاربری که Mini App را باز کرده است
- `requestContact` برای شماره همان کاربر، فقط با تأیید خودش
- رابط واکنش‌گرا برای Telegram Android/Desktop/Web

## Telegram Checker و افزودن مستقیم به Telegram Contacts

طبق API رسمی Telegram، متد `contacts.importContacts` برای **User Session** است. JavaScript یک Mini App به Session داخلی اپ Telegram دسترسی ندارد؛ بنابراین Mini App به‌تنهایی و بدون User MTProto Session نمی‌تواند از طرف حساب شما شماره‌ها را به Telegram Contacts وارد کند یا Phone Lookup واقعی انجام دهد.

این محدودیت را با نتیجه ساختگی دور نمی‌زنیم.

### مسیر بدون API ID/HASH

برای اضافه‌کردن تعداد زیاد شماره به دفترچه مخاطبین خودتان:

1. فایل‌ها را در Mini App Import کنید.
2. Normalize/Dedupe را اجرا کنید.
3. `ساخت VCF برای Telegram Sync` را بزنید.
4. VCF را در Contacts گوشی Import کنید.
5. در Telegram، `Sync Contacts` را روشن کنید.

Telegram سپس دفترچه مخاطبین سیستم را با حساب شما Sync می‌کند.

### نتیجه Checker از Connector

اگر در آینده یک User Connector رسمی با App credentials خود برنامه فعال باشد، خروجی آن با این Header مستقیماً وارد Mini App می‌شود:

`phone,status,telegram_id,username`

و Mini App می‌تواند نتیجه‌های `matched / not_returned / retry` را ذخیره، فیلتر و جداگانه Export کند.

نکته: `not_returned` همیشه اثبات قطعی «Telegram ندارد» نیست؛ Privacy و محدودیت‌های Telegram می‌تواند روی نتیجه اثر بگذارد.

## Google Drive بدون GOOGLE_CLIENT_ID

دو مسیر بدون OAuth در Workspace فعال است:

### Android / Telegram Mobile
`Share Backup / Google Drive` یا `Share VCF` را بزنید و Google Drive را از Share Sheet انتخاب کنید.

### Windows / Chrome / Edge
اگر Google Drive for desktop نصب است، `انتخاب فولدر Backup` را بزنید و یکی از فولدرهای Drive خودتان را انتخاب کنید. Backup بعدی مستقیماً همان‌جا نوشته می‌شود.

اگر هیچ‌کدام در دسترس نبود، فایل `.cfbackup` دانلود می‌شود و می‌توانید دستی در Drive قرار دهید.

## نصب روی cPanel

1. ZIP Hosted Mini App را Extract کنید.
2. محتویات پوشه `telegram-miniapp` را در مسیر دلخواه، مثلاً `public_html/contactflow/` قرار دهید.
3. تست کنید:
   `https://domain/contactflow/miniapp.html`
4. همین URL را در BotFather به‌عنوان Main Mini App تنظیم کنید.

Bot در این معماری فقط می‌تواند نقش Launcher داشته باشد؛ Workspace مدیریت مخاطبین و فایل‌ها به Gateway Bot وابسته نیست.

## نکته درباره ارسال پیام

عبارت `Opt-in` از رابط Hosted Mini App حذف شده است. با این حال ContactFlow نباید برای پیام تبلیغاتی خودکار به شماره‌های تصادفی یا افراد ناشناس استفاده شود. برای ارسال خصوصی، فهرست مخاطبان مجاز/شناخته‌شده را در موتور Campaign نگه دارید.

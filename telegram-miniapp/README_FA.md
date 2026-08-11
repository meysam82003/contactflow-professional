# ContactFlow Telegram Mini App — Hosted Contact Workspace

## نصب ساده
فقط پوشه `telegram-miniapp` را روی هاست HTTPS Extract کنید و این آدرس را در BotFather / Main Mini App یا داخل ContactFlow ثبت کنید:

`https://domain/contactflow/miniapp.html`

خود صفحه Mini App برای باز شدن و امکانات مدیریت شماره به `TELEGRAM_API_ID`، `TELEGRAM_API_HASH` یا `GOOGLE_CLIENT_ID` در Build نیاز ندارد.

## قابلیت‌های Mini App
- Import چند فایل TXT/CSV
- Paste مستقیم شماره‌ها
- Normalize شماره‌های ایران و بین‌المللی
- حذف Duplicate
- شمارش معتبر/نامعتبر/تکراری
- Preview محلی
- خروجی CSV
- خروجی VCF
- Share VCF از Android به Google Drive یا سایر Providerهای سیستم
- Backup محلی `.cfbackup`
- Restore Backup
- نگهداری آخرین لیست کوچک در Local Storage
- دریافت Telegram ID/Username کاربر Mini App
- `requestContact` برای دریافت شماره خود همان کاربر با تأیید خودش

## نکته فنی مهم درباره Telegram Checker
API رسمی Telegram متدهای زیر را دارد:
- `contacts.importContacts`
- `contacts.resolvePhone`
- `contacts.addContact`

اما این متدها **فقط برای User Session** هستند. Bot/Mini App اجازه اجرای آن‌ها را از طرف حساب کاربر ندارد. بنابراین Mini App بدون یک User MTProto Session نمی‌تواند به‌طور رسمی یک لیست دلخواه شماره را بررسی کند که «چه کسی Telegram دارد» یا آن‌ها را مستقیماً وارد دفترچه مخاطبین Telegram کند.

برای جلوگیری از نتیجه جعلی، Mini App فعلی Checker شبکه‌ای ساختگی نمایش نمی‌دهد.

## مسیر بدون App Credentials برای مخاطبین
1. شماره‌ها را داخل Mini App Import و Normalize کنید.
2. فایل `VCF` بگیرید.
3. VCF را داخل Contacts گوشی/سیستم Import کنید.
4. اگر `Sync Contacts` در Telegram روشن باشد، Telegram دفترچه مخاطبین سیستم را Sync می‌کند.

به دلیل Privacy Telegram، نبود نتیجه در Phone Lookup همیشه به معنی «این شماره Telegram ندارد» نیست.

## Google Drive بدون GOOGLE_CLIENT_ID
Mini App برای Backup پایه به OAuth Google وابسته نیست. در Android و دستگاه‌هایی که Web Share API دارند، دکمه `Share VCF / Google Drive` فایل را به Share Sheet سیستم می‌فرستد و می‌توانید Google Drive را انتخاب کنید. در سایر دستگاه‌ها فایل دانلود می‌شود و قابل آپلود در Drive است.

## درباره ارسال پیام
بخش Contact Workspace مستقل از Bot Gateway کار می‌کند. موتور ارسال برنامه همچنان نباید به شماره‌های تصادفی یا افراد ناشناس پیام خودکار بفرستد. عبارت `Opt-in` از رابط Mini App مخاطبین حذف شده، اما کنترل جلوگیری از ارسال ناخواسته در موتور Campaign حذف نشده است.

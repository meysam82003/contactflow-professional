# معماری Telegram Mini App برای مخاطبین

## هدف
ContactFlow Mini App باید با یک URL ساده روی هاست اجرا شود:

`https://domain/contactflow/miniapp.html`

و برای امکانات پایه مدیریت مخاطبین به `TELEGRAM_API_ID`، `TELEGRAM_API_HASH` یا `GOOGLE_CLIENT_ID` در Build وابسته نباشد.

## APIهایی که Mini App واقعاً دارد
Mini App از `Telegram.WebApp` استفاده می‌کند و می‌تواند اطلاعات پایه کاربری مثل Telegram ID و Username را از `initData` دریافت کند. همچنین `requestContact` فقط شماره خود همان کاربر را با تأیید او دریافت می‌کند.

## APIهایی که Mini App ندارد
متدهای زیر از MTProto User API هستند و Bot/Mini App نمی‌تواند آن‌ها را به‌جای حساب کاربر اجرا کند:

- `contacts.resolvePhone`
- `contacts.importContacts`
- `contacts.addContact`

بنابراین بدون User Session رسمی:
- بررسی قطعی یک لیست دلخواه شماره برای Telegram ممکن نیست.
- افزودن مستقیم لیست دلخواه به Telegram Contacts ممکن نیست.
- استفاده از Session داخلی Telegram host توسط JavaScript Mini App در API رسمی وجود ندارد.

## مسیر بدون App Credentials
ContactFlow Mini App این مسیر را ارائه می‌دهد:

1. Import TXT/CSV یا Paste شماره‌ها
2. Normalize
3. Deduplicate
4. Export CSV
5. Export VCF
6. Import VCF در Contacts دستگاه
7. استفاده از Sync Contacts خود Telegram در صورت فعال بودن

این مسیر از API خصوصی/غیررسمی استفاده نمی‌کند.

## Privacy و نتیجه Checker
حتی در User API، `contacts.resolvePhone` می‌تواند به‌دلیل تنظیم Privacy مقصد همان خطایی را بدهد که برای شماره بدون حساب Telegram برمی‌گردد. بنابراین نتیجه نبود Match همیشه معادل «Telegram ندارد» نیست.

## Backup / Google Drive
Hosted Mini App برای Backup پایه فایل `.cfbackup` می‌سازد. در Android و مرورگرهای دارای Web Share API، فایل می‌تواند از Share Sheet به Google Drive ارسال شود. Direct Drive OAuth اختیاری است و نبود `GOOGLE_CLIENT_ID` نباید Contact Workspace را از کار بیندازد.

## پیام‌رسانی
Contact Workspace از Campaign Engine جداست. حذف واژه `Opt-in` از UI مخاطبین به معنی تبدیل Phone Lookup یا Public Privacy به اجازه ارسال پیام تبلیغاتی نیست. موتور ارسال نباید به شماره‌های تصادفی یا افراد ناشناس پیام خودکار بفرستد.

# ContactFlow Personal 2.0

نسخه Local‑First و بدون حساب کاربری ContactFlow.

## تغییر معماری

در این نسخه این بخش‌ها وجود ندارند:

- Login / Register
- Forgot Password / Recovery Code
- User/Session Server
- Cloud Account Sync
- Server URL
- PHP/MySQL backend برای حساب‌ها

اطلاعات اصلی روی همان دستگاه نگه‌داری می‌شود.

## نسخه‌ها

- Web / PWA
- Windows / Linux / macOS Desktop shell
- Android WebView shell با Storage Access Framework
- Telegram Mini App از همان PWA

## بکاپ

دو مسیر اصلی وجود دارد:

1. فایل دستی `.cfbackup` برای انتقال بین دستگاه‌ها.
2. Google Drive در Web/Desktop با OAuth `drive.file`. در Android انتخاب مقصد Google Drive از File Picker سیستم انجام می‌شود تا OAuth داخل WebView لازم نباشد.

Backup می‌تواند با AES‑GCM و کلید مشتق‌شده با PBKDF2 رمزگذاری شود.

## داده‌ها

IndexedDB شامل contacts، settings، history، projects، imports، exports و templates است. CSV/TXT به‌صورت خطی/بچ پردازش می‌شود تا حافظه برای لیست‌های بزرگ کنترل شود. XLSX در صورت در دسترس بودن SheetJS پشتیبانی می‌شود.

## Telegram

PWA را می‌توان URL مربوط به Mini App/Menu Button در BotFather قرار داد. Bot Token داخل کلاینت ذخیره نمی‌شود.

## اجرا

برای PWA فایل‌های پوشه `web/` را روی HTTPS قرار دهید. برای Desktop و Android از GitHub Actions موجود در `.github/workflows/` استفاده کنید.

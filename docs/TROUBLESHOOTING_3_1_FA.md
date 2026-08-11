# عیب‌یابی 3.1

## QR نمایش داده نمی‌شود

Diagnostics را باز کنید. اگر `telegramConfigured=false` است، GitHub Secrets مربوط به Telegram App تنظیم نشده‌اند. QR ساختگی نشان داده نمی‌شود.

## HTTP 501

در 3.1 endpoint قدیمی Native QR دیگر مسیر اصلی نیست و Desktop endpoint 501 نمی‌دهد. اگر هنوز 501 می‌بینید، Build قدیمی را اجرا کرده‌اید یا Service Worker/Shortcut قدیمی باز است.

## Google Drive popup error

`GOOGLE_CLIENT_ID` و Authorized JavaScript Origin را بررسی کنید. Windows پیش‌فرض `http://localhost:17655` است.

## Drive Auto Sync بعد از مدتی متوقف می‌شود

این رفتار token model مرورگر است؛ پس از انقضای Access Token روی Connect Google بزنید.

## Android Backup

در پنجره System Document Picker مقصد Google Drive یا حافظه را انتخاب کنید.

## Mini App

`health.php` را باز کنید. اگر `last_error_message` وجود دارد Webhook را بررسی کنید. Bot باید برای Membership check در کانال موردنظر دسترسی لازم داشته باشد.

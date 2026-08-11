# استقرار ContactFlow Personal Ultimate 3.1

## 1. Secrets/Variables در GitHub

Settings → Secrets and variables → Actions

Secrets:
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `GOOGLE_CLIENT_ID`

Variables یا Secrets اختیاری:
- `MINIAPP_URL`
- `TELEGRAM_BOT_USERNAME`

### Google Authorized JavaScript Origins

برای PWA دامنه HTTPS برنامه را اضافه کنید. برای Windows build پیش‌فرض:

`http://localhost:17655`

اگر Diagnostics نشان داد برنامه روی Port جایگزین اجرا شده، آن Origin را نیز در Google Cloud اضافه کنید.

## 2. PWA

ZIP PWA را روی HTTPS استخراج کنید. `index.html` را مستقیم با `file://` باز نکنید.

## 3. Windows

Setup را نصب کنید. Shell فقط برای سرو فایل‌های محلی برنامه از localhost استفاده می‌کند؛ این ContactFlow Server نیست و Login ندارد.

## 4. Android

APK از Assetهای داخلی روی `https://appassets.androidplatform.net` باز می‌شود. Backup/Restore با Android Document Picker انجام می‌شود.

## 5. Telegram Mini App روی cPanel

پوشه `telegram-miniapp` را در HTTPS آپلود کنید و `install.php` را اجرا کنید. MySQL، Bot Token و Admin Numeric ID لازم است. سپس:

- `health.php` را تست کنید.
- Bot را `/start` کنید.
- از Menu Button پنل را باز کنید.
- Admin داخل Mini App بخش مدیریت را می‌بیند.

## 6. Release

GitHub Actions → Release All Devices — Personal Ultimate 3.1 → Run workflow.

قبل از انتشار Workflow وجود Auth قدیمی، Server URL، HTTP 501 connector و `tdlib_not_configured` را در خروجی نهایی بررسی می‌کند.

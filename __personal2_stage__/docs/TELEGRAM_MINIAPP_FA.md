# Telegram Mini App — ContactFlow Personal 2.0

نسخه Personal 2.0 برای اجرای Mini App از همان PWA استفاده می‌کند.

1. پوشه `web/` را روی یک URL HTTPS قرار دهید.
2. همان URL را در BotFather به‌عنوان Menu Button / Mini App ربات تنظیم کنید.
3. ContactFlow داخل Telegram باز می‌شود و داده‌های برنامه در Storage محلی WebView/PWA نگه‌داری می‌شوند.

Bot Token داخل PWA ذخیره نمی‌شود و این نسخه برای ارسال انبوه پیام ناخواسته یا کشف حساب‌های Telegram از روی شماره تلفن طراحی نشده است.

برای انتقال داده بین Telegram Mini App و دستگاه دیگر از `.cfbackup` استفاده کنید.

# مهاجرت از ContactFlow Professional 1.x به Personal Ultimate 3.0

## تفاوت معماری

نسخه‌های 1.x بر Account/Server/Sync متکی بودند. نسخه 3.0 Local‑First است و حساب ContactFlow ندارد.

### حذف شده

```text
Login
Register
Forgot Password
Recovery
Server URL
Account API
Cloud Account Sync
```

### جایگزین

```text
Local IndexedDB
Manual .cfbackup
Google Drive Backup
Native Telegram Connector
```

## Windows

1. از داده مهم نسخه قدیمی Export/Backup بگیرید.
2. نسخه Professional قدیمی را ببندید.
3. Setup نسخه 3.0 را اجرا کنید.
4. Setup تلاش می‌کند Process و Shortcut قدیمی را حذف کند.
5. بعد از اجرا باید مستقیم Dashboard باز شود.

نسخه 3.0 از Local Port قبلی `17654` استفاده نمی‌کند تا UI قدیمی تصادفی نمایش داده نشود.

## داده‌های حساب قدیمی

Username/Password/Recovery Code نسخه 1.x در نسخه 3.0 کاربردی ندارند و منتقل نمی‌شوند.

## انتقال مخاطبین

روش پیشنهادی:

1. از نسخه قدیمی CSV/VCF خروجی بگیرید.
2. در 3.0 Import کنید.
3. City / Section / Name را بررسی کنید.
4. Backup 3.0 بگیرید.

اگر Backup سازگار 3.0 دارید، از Restore استفاده کنید.

## cPanel قدیمی

برای هسته Personal Ultimate 3.0 دیگر نصب PHP/MySQL Account Server لازم نیست.

اگر Bot/Mini App مستقلی روی cPanel دارید، آن سرویس را از دیتابیس محلی ContactFlow جدا نگه دارید.

## Android

APK جدید باید Local Assets را باز کند. اگر برنامه در شروع از شما Server URL می‌خواهد، APK قدیمی است.

## PWA

Cache نسخه قدیمی می‌تواند باعث دیده‌شدن UI قدیمی شود. در زمان مهاجرت:

1. PWA قدیمی را ببندید.
2. نسخه 3.0 را روی HTTPS Deploy کنید.
3. Service Worker جدید Cache با نام نسخه 3.0 می‌سازد و Cacheهای قبلی را حذف می‌کند.
4. در صورت باقی‌ماندن UI قدیمی، Site Data همان Origin را فقط بعد از Backup پاک کنید.

## Telegram

اطلاعات حساب Telegram نباید از LocalStorage/IndexedDB نسخه قدیمی به Session جدید کپی شود. Native Connector باید Authorization رسمی جدید را با QR انجام دهد.

## بعد از مهاجرت

این موارد را کنترل کنید:

- تعداد Contacts
- City / Section
- Export نمونه
- Audience/Suppression
- Backup جدید
- Activity Log
- نسخه برنامه `3.0.0-alpha.1`

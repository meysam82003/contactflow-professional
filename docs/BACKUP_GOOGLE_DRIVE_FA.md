# Backup و Google Drive در ContactFlow 3.0

## اصل طراحی

ContactFlow 3.0 حساب مرکزی ندارد؛ بنابراین Backup مسیر استاندارد انتقال داده بین دستگاه‌هاست.

```text
Device A
  ↓ Create .cfbackup
Google Drive / File
  ↓ Restore
Device B
```

## Backup دستی

Backup شامل Storeهای اصلی IndexedDB است:

- contacts
- imports
- meta
- settings
- artifacts
- contact_flags
- campaigns
- ad_requests
- telegram_accounts (فقط metadata غیرحساس)
- templates
- activity

فرمت:

```text
ContactFlow_2026-08-11T....cfbackup
```

## نکته امنیتی

فایل Backup می‌تواند حاوی داده مخاطبین و تنظیمات باشد. آن را مانند فایل حساس نگه‌داری کنید.

Telegram Session/Authorization نباید داخل Backup Web Core ذخیره شود.

## Restore

Restore داده‌های Storeهای برنامه را جایگزین می‌کند. قبل از Restore مهم:

1. یک Backup جدید بگیرید.
2. فایل مقصد را بررسی کنید.
3. Restore را تأیید کنید.
4. بعد از Reload تعداد مخاطبین و Campaignها را کنترل کنید.

## Google Drive در Android

روش پیشنهادی: System File Picker.

ContactFlow فایل `.cfbackup` را به سیستم‌عامل تحویل می‌دهد و کاربر می‌تواند Google Drive یا Storage محلی را به‌عنوان مقصد انتخاب کند.

مزیت:
- ContactFlow نیازی به نگه‌داری Google Refresh Token ندارد.
- انتخاب حساب و Folder در UI سیستم انجام می‌شود.

## Google Drive در PWA/Desktop

برای Upload مستقیم:

1. یک Google OAuth Client برای Origin برنامه بسازید.
2. Client ID را در `config.js` قرار دهید:

```js
window.CONTACTFLOW_CONFIG = {
  edition: 'Personal Ultimate 3.0',
  googleClientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  telegramNativeAppConfigured: false
};
```

3. برنامه Google Identity Services را بارگذاری می‌کند.
4. Scope استفاده‌شده:

```text
https://www.googleapis.com/auth/drive.file
```

5. Backup با Drive API آپلود می‌شود.

## وقتی Client ID تنظیم نشده است

هیچ خطایی برای هسته برنامه ایجاد نمی‌شود. Backup دستی همچنان کار می‌کند و UI توضیح می‌دهد که OAuth مستقیم Drive پیکربندی نشده است.

## Auto Backup

برای Alpha 3.0 Auto Backup اجباری نیست. پیشنهاد برای نسخه پایدار:
- Before Major Import
- Daily when app is open
- Weekly
- Manual only

در PWA اجرای زمان‌بندی دقیق در پس‌زمینه تضمین‌شده نیست؛ بنابراین Backup زمان‌بندی‌شده باید به محدودیت‌های Platform احترام بگذارد.

## تست Backup

برای هر Release:

1. چند Contact بسازید.
2. یک Campaign و Audience flag ایجاد کنید.
3. Backup بگیرید.
4. دیتابیس محلی را پاک کنید.
5. Restore کنید.
6. تعداد و داده‌ها را مقایسه کنید.

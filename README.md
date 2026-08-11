# ContactFlow Personal Ultimate 3.0

> **Local‑First · Accountless · Multi‑Device · Persian RTL**

نسخه فعال پروژه **ContactFlow Personal Ultimate 3.0 (`3.0.0-alpha.1`)** است.

این نسخه معماری Account/Server نسخه‌های قدیمی را کنار گذاشته است. برای استفاده از هسته ContactFlow دیگر این موارد وجود ندارند:

- Login
- Register
- Forgot Password
- Recovery
- Server URL
- Cloud Account
- Account Sync

داده‌ها به‌صورت Local‑First روی دستگاه ذخیره می‌شوند و جابه‌جایی بین دستگاه‌ها با Backup/Restore انجام می‌شود.

## قابلیت‌های اصلی

- شماره‌ساز ایران: ترتیبی و تصادفی، Batchهای بزرگ
- Import چندفایلی `CSV / TSV / TXT / XLSX`
- نرمال‌سازی شماره و Dedup
- City / Section / Source / Name Template
- Bulk Edit
- Export `CSV / VCF` + Chunk + ZIP
- Audience: `Opt-in / Existing Chat / Suppressed / Unverified`
- Campaign Composer: متن، Media، پیام مرجع کانال و لینک‌های عملیاتی
- Ad Request + Progress
- Template Library
- Activity Log
- `.cfbackup` Backup/Restore
- Google Drive backup path
- Windows / Android / PWA / Linux / macOS
- Telegram Native Connector contract با UX مبتنی بر QR

## Telegram QR

کاربر نهایی نباید `api_id` یا `api_hash` وارد کند. این‌ها Credential برنامه Native هستند و در Build تنظیم می‌شوند.

Build بدون TDLib و Credential رسمی Telegram **QR ساختگی نمایش نمی‌دهد** و وضعیت Setup را نشان می‌دهد. برای Release واقعی، Native Connector باید QR رسمی Telegram/TDLib را تولید کند و Session را فقط در Storage خصوصی دستگاه نگه دارد.

## مستندات

- [راهنمای کامل فارسی](README_FA.md)
- [نصب روی همه دستگاه‌ها](docs/INSTALL_FA.md)
- [آموزش کامل استفاده](docs/USER_GUIDE_FA.md)
- [معماری 3.0](docs/ARCHITECTURE_FA.md)
- [Telegram QR Connector](docs/TELEGRAM_QR_FA.md)
- [Backup و Google Drive](docs/BACKUP_GOOGLE_DRIVE_FA.md)
- [مهاجرت از Professional 1.x](docs/MIGRATION_1X_TO_3_FA.md)
- [چک‌لیست Release](docs/RELEASE_CHECKLIST_FA.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Build / Release

Workflow اصلی:

```text
.github/workflows/release-all.yml
```

خروجی Release:

```text
ContactFlow_Personal_Ultimate_3.0_Windows_Setup.exe
ContactFlow_Personal_Ultimate_3.0_Windows_Portable.exe
ContactFlow_Personal_Ultimate_3.0_Android_Alpha.apk
ContactFlow_Personal_Ultimate_3.0_PWA.zip
ContactFlow_Personal_Ultimate_3.0_Linux_x64
ContactFlow_Personal_Ultimate_3.0_macOS_Intel
ContactFlow_Personal_Ultimate_3.0_macOS_AppleSilicon
ContactFlow_Personal_Ultimate_3.0_Source.zip
ContactFlow_Personal_Ultimate_3.0_SHA256.txt
```

Release workflow قبل از Build بررسی می‌کند که UI قدیمی Account/Server و QR جعلی داخل Canonical source نباشد.

## Windows legacy-login fix

نسخه‌های قدیمی از `127.0.0.1:17654` استفاده می‌کردند و ممکن بود Process قدیمی باعث بازشدن Login UI قبلی شود. Desktop 3.0 این وابستگی را حذف کرده و فقط Server محلی نمایش Assetهای Embedشده خودش را اجرا می‌کند؛ `/health` باید `local_only:true` و نسخه 3.0 را برگرداند.

## سیاست استفاده Telegram

Build رسمی برای Audience رضایت‌داده، Existing Chat و Suppression طراحی شده است. Random-number Telegram discovery، Cold-DM خودکار به غریبه‌ها، چرخش حساب برای دورزدن محدودیت یا Ban/Spam evasion جزو Build رسمی نیست.

---

**ContactFlow Personal Ultimate 3.0 — Local‑First, Accountless, Multi‑Device.**

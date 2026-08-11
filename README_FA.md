# ContactFlow Personal Ultimate 3.0

ContactFlow یک ابزار **Local‑First** برای مدیریت حجم بالای مخاطب، Import/Export، شماره‌سازی، Backup و آماده‌سازی کمپین‌های مجاز است. نسخه 3.0 سیستم حساب ContactFlow را به‌طور کامل حذف می‌کند: **Login / Register / Forgot Password / Recovery / Server URL / Cloud Account / Account Sync وجود ندارند.**

> نسخه جاری: `3.0.0-alpha.1`  
> معماری: Local‑First / Offline‑First  
> زبان رابط: فارسی RTL

## تغییر اصلی نسخه 3.0

برنامه دیگر برای شروع کار به سرور مرکزی، MySQL، حساب کاربری یا رمز عبور نیاز ندارد. داده‌ها در دیتابیس محلی دستگاه نگه‌داری می‌شوند و انتقال بین دستگاه‌ها از طریق Backup انجام می‌شود.

## قابلیت‌ها

### مدیریت مخاطبین
- Import چندفایلی `CSV / TSV / TXT / XLSX`
- تنظیم مستقل برای هر فایل Import
- تشخیص و نرمال‌سازی شماره موبایل ایران
- حذف Duplicate
- City / Section / Source
- نام‌گذاری سریالی با Template
- ویرایش گروهی Name / City / Section
- جستجو و فیلتر

### شماره‌ساز
- ساخت رنج شماره ایران
- حالت ترتیبی و تصادفی
- تا 1,000,000 شماره در هر Batch
- City / Section / Source مستقل
- Template نام
- افزودن مستقیم به دیتابیس یا Export جدا

### Export
- VCF
- CSV
- خروجی قطعه‌ای Chunked
- ZIP برای چند قطعه
- صف خروجی با تنظیم مستقل

### Audience و Consent
- `Opt‑in`
- `Existing Chat`
- `Suppressed`
- `Unverified`
- Import رضایت از فایل
- Export لیست Suppression

### Campaign Composer
- متن
- عکس / ویدیو / فایل
- پیام مرجع کانال
- لینک اصلی
- لینک توقف تبلیغ
- لینک فعال‌سازی تبلیغ
- لینک درخواست تبلیغ
- Preview
- Template Library
- Draftهای محلی

### درخواست تبلیغ
- ثبت روی Telegram Numeric ID
- Username
- عنوان
- تعداد درخواست‌شده
- تعداد انجام‌شده
- باقی‌مانده
- Pending / Running / Completed

### Backup
- Backup دستی با فرمت `.cfbackup`
- Restore کامل دیتابیس محلی
- Activity Log
- Google Drive بدون حساب ContactFlow
- در Android انتخاب Google Drive از System File Picker
- در PWA/Desktop امکان OAuth مستقیم Google Drive بعد از تنظیم OAuth Client ID

## Telegram QR Connector

رابط کاربر فقط **QR** است و از کاربر `api_id` یا `api_hash` خواسته نمی‌شود. این مقادیر Credential برنامه هستند و باید فقط در Build Native تنظیم شوند.

Telegram برای QR Login رسمی از Login Token استفاده می‌کند و TDLib نیز `requestQrCodeAuthentication` و وضعیت `authorizationStateWaitOtherDeviceConfirmation` را ارائه می‌دهد.

منابع رسمی:
- https://core.telegram.org/api/qr-login
- https://core.telegram.org/api/obtaining_api_id
- https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1request_qr_code_authentication.html

### وضعیت فعلی Connector

Web Core و قرارداد Native Connector آماده‌اند. اگر Build فاقد TDLib و Credential رسمی Telegram App باشد، رابط **QR ساختگی نمایش نمی‌دهد** و وضعیت `QR Setup` نشان داده می‌شود.

برای Release واقعی Telegram Connector باید در GitHub Secrets یا محیط Build، Credential برنامه تنظیم و TDLib Native Connector کامپایل شود. Session حساب Telegram باید فقط روی دستگاه Native نگه‌داری شود؛ PWA محل ذخیره Session حساس نیست.

## سیاست Telegram

ContactFlow 3.0 برای عملیات مجاز طراحی شده است: Audience رضایت‌داده، Existing Chat و Suppression. قابلیت اسکن شماره‌های تصادفی برای کشف کاربران Telegram یا ارسال ناخواسته به غریبه‌ها جزو Build رسمی این پروژه نیست.

Telegram صراحتاً ارسال تبلیغات ناخواسته به غریبه‌ها و Spam/Flooding از API را محدود می‌کند:
- https://telegram.org/faq_spam
- https://core.telegram.org/api/terms
- https://core.telegram.org/api/obtaining_api_id

## ساختار Repository

```text
/
├── index.html
├── app.js
├── ultimate.js
├── config.js
├── styles.css
├── manifest.webmanifest
├── sw.js
├── icons/
│
├── desktop/
│   ├── main.go
│   ├── webapp/          # هنگام Build از Root Sync می‌شود
│   └── installer/
│
├── android/
│   └── app/
│       └── src/main/assets/   # هنگام Build از Root Sync می‌شود
│
├── docs/
│   ├── INSTALL_FA.md
│   ├── USER_GUIDE_FA.md
│   ├── ARCHITECTURE_FA.md
│   ├── BACKUP_GOOGLE_DRIVE_FA.md
│   └── TELEGRAM_QR_FA.md
│
└── .github/workflows/
    ├── build-android.yml
    └── release-all.yml
```

## Windows

نسخه Desktop یک HTTP Server حساب یا Cloud Server نیست. فایل‌های Embed شده برنامه روی یک **پورت آزاد تصادفی localhost** نمایش داده می‌شوند تا با نسخه‌های قدیمی روی `127.0.0.1:17654` تداخل نداشته باشند.

در نسخه 3.0 دیگر هیچ Server URL یا Account API وجود ندارد.

## Android

APK باید Assets نسخه 3.0 را از داخل خودش باز کند. کاربر در اولین اجرا Server URL وارد نمی‌کند. Import از File Picker سیستم و Export/Backup از Bridge بومی انجام می‌شود.

## PWA

فایل‌های Root را روی HTTPS قرار دهید. سپس در Chrome/Edge گزینه Install App / Add to Home Screen را بزنید. باز کردن مستقیم `index.html` با File Manager برای PWA کامل مناسب نیست، چون Service Worker روی `file://` فعال نمی‌شود.

## Google Drive

`config.js` دارای `googleClientId` خالی است. برای اتصال مستقیم Drive در PWA/Desktop باید OAuth Client رسمی Google خودتان را قرار دهید. اگر Client ID تنظیم نشده باشد، Backup دستی همیشه فعال باقی می‌ماند.

## Build

از GitHub Actions می‌توانید Build همه دستگاه‌ها را اجرا کنید:

1. Actions
2. `Release All Devices — Personal Ultimate 3.0`
3. `Run workflow`
4. Artifactهای Windows / Linux / macOS / Android / PWA / Source ساخته می‌شوند.

## تست Release

Workflow قبل از انتشار بررسی می‌کند که Asset نهایی شامل عبارت‌های زیر نباشد:

```text
auth-gate
auth-login
auth-register
Forgot Password
Server URL
127.0.0.1:17654
```

و وجود صفحات اصلی نسخه 3.0 را کنترل می‌کند:

```text
generator
import
contacts
exports
audience
telegram
campaign
requests
backup
activity
```

## اسناد

- نصب: `docs/INSTALL_FA.md`
- آموزش کامل: `docs/USER_GUIDE_FA.md`
- معماری: `docs/ARCHITECTURE_FA.md`
- Telegram QR: `docs/TELEGRAM_QR_FA.md`
- Backup و Google Drive: `docs/BACKUP_GOOGLE_DRIVE_FA.md`
- تغییرات: `CHANGELOG.md`

## امنیت و حریم خصوصی

- داده مخاطبین Local‑First است.
- Account Server وجود ندارد.
- Telegram Session نباید داخل PWA ذخیره شود.
- Telegram App Credentials نباید در JavaScript عمومی قرار بگیرند.
- Backup شامل داده حساس است؛ فایل `.cfbackup` را در محل مطمئن نگه دارید.

---

**ContactFlow Personal Ultimate 3.0 — Local‑First, Accountless, Multi‑Device.**

# ContactFlow Personal Ultimate 3.1

ContactFlow یک مجموعه Local‑First برای مدیریت حجم زیاد مخاطب، Import/Export، شماره‌ساز، Audience/Consent، Campaign، Backup، Google Drive، اتصال چند حساب Telegram با QR و Telegram Mini App است.

> نسخه: `3.1.0-alpha.1`

## اصل معماری

ContactFlow دیگر حساب داخلی، Login، Register، Forgot Password یا Server URL ندارد. داده‌های اصلی روی همان دستگاه در IndexedDB نگه‌داری می‌شوند و Backup دستی یا Google Drive انتخابی است.

Telegram Account با **QR واقعی Telegram** و Web‑MTProto متصل می‌شود. حداکثر ۱۰ Session مستقل روی هر دستگاه نگه‌داری می‌شود و برای هر کمپین حساب فرستنده به‌صورت دستی انتخاب می‌شود؛ هیچ account rotation برای دورزدن FloodWait وجود ندارد.

## قابلیت‌های اصلی

- شماره‌ساز ایران: ترتیبی/تصادفی، Prefix، شهر، بخش و نام‌گذاری سریالی
- Import چندفایلی CSV/TSV/TXT/XLSX با تنظیمات مستقل هر فایل
- Normalize شماره ایران و بین‌المللی
- حذف تکراری، Mapping ستون، Sequence و Bulk Edit
- Contacts با فیلتر شهر/بخش/منبع
- Export CSV/VCF/TXT و خروجی قطعه‌ای/ZIP در هسته اصلی
- Audience Ledger: `optin`, `existing_chat`, `suppressed`
- Suppression Enforcement
- Telegram QR Login واقعی در Web Core
- حداکثر ۱۰ حساب Telegram
- Session Vault رمزگذاری‌شده محلی
- انتخاب دستی حساب فعال و Health Check
- Authorized Contact Checker با نتایج `matched / not_returned / retry`
- پاک‌سازی Contact Import موقت بعد از Check
- خروجی جداگانه نتایج Checker
- نمایش چت‌های موجود
- Campaign Composer: متن، لینک‌ها و Reference Channel Post
- Forward پیام مرجع کانال برای مخاطب مجاز
- Promotional mode فقط برای Opt‑in صریح
- Service mode برای Opt‑in یا Existing Chat
- Dry Run، Duplicate Guard، سقف اجرا، Delay، Stop/Pause
- توقف روی FloodWait / PeerFlood / Restricted / Frozen
- گزارش پیشرفت لحظه‌ای
- Backup کامل `.cfbackup`
- Google Drive appData Sync + Backup قابل مشاهده
- SHA‑256 و Conflict Detection
- Android System Document Picker با امکان انتخاب Google Drive
- Telegram Mini App کامل: Consent، Pricing، Ad Request، Progress، Membership Gate
- Bot commands و Inline panel برای Opt‑in/Opt‑out، تعرفه و درخواست
- Admin Mini App dashboard برای پیشرفت درخواست‌ها
- Diagnostics و Feature Matrix
- Activity/Audit Log
- Windows Setup/Portable، Android، Linux، macOS و PWA از یک Canonical Web Core

فهرست توسعه‌های ۳.۱ در `docs/FEATURES_25PLUS_FA.md` آمده است.

## نکته مهم درباره Telegram Checker

Checker فقط روی شماره‌های **داده‌شده/مجاز** اجرا می‌شود. نتیجه `not_returned` به معنی قطعی «تلگرام ندارد» نیست؛ Privacy تلگرام می‌تواند مانع برگشت برخی حساب‌ها شود. ContactFlow این نتیجه را عمداً با همین نام ذخیره می‌کند.

شماره‌ساز برای ساخت/پاک‌سازی دیتاست وجود دارد؛ خروجی شماره‌های تولیدشده به‌صورت خودکار برای کشف انبوه حساب‌های Telegram اسکن نمی‌شود.

## ارسال پیام

- تبلیغ خصوصی: فقط `optin` صریح.
- پیام خدماتی: `optin` یا چت موجود.
- Privacy عمومی Telegram به‌تنهایی Consent تبلیغاتی محسوب نمی‌شود.
- هر Campaign فقط با حسابی که کاربر انتخاب می‌کند اجرا می‌شود.
- FloodWait باعث توقف می‌شود، نه سوییچ خودکار به حساب بعدی.

## Telegram QR — تنظیم Build یک‌بار برای توسعه‌دهنده

کاربر نهایی API ID/HASH وارد نمی‌کند. برای Build رسمی، مالک برنامه باید یک‌بار Telegram App credentials را در GitHub Actions Secrets بگذارد:

- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`

این مقادیر از `my.telegram.org` برای برنامه توسعه‌دهنده گرفته می‌شوند. اگر در Build تنظیم نباشند، صفحه Diagnostics صریحاً وضعیت `Not configured` نشان می‌دهد و QR ساختگی تولید نمی‌شود.

## Google Drive

برای PWA/Windows Direct Drive Sync، Secret زیر در GitHub تنظیم شود:

- `GOOGLE_CLIENT_ID`

Authorized JavaScript Origin برای Windows پیش‌فرض:

`http://localhost:17655`

برای PWA نیز Origin دامنه HTTPS خودتان اضافه شود.

Android برای Backup/Restore به جای نگهداری OAuth Token داخل WebView از System Document Picker استفاده می‌کند؛ در Picker می‌توان Google Drive را انتخاب کرد.

## Telegram Mini App

کد cPanel در `telegram-miniapp/` است و هیچ ContactFlow Account نمی‌سازد. نصب:

1. پوشه را روی HTTPS آپلود کنید.
2. `install.php` را باز کنید.
3. Bot Token، Admin Numeric ID و MySQL را وارد کنید.
4. Installer Webhook، Menu Button و Commands را تنظیم می‌کند.
5. `health.php` را برای Health Check بررسی کنید.

Mini App برای کاربر:
- Opt‑in / Opt‑out
- تعرفه
- ثبت درخواست تبلیغ
- وضعیت و Progress درخواست
- Membership Gate

برای Admin:
- آمار کاربران/Opt‑in/درخواست‌ها
- لیست درخواست‌ها
- تغییر `done_count` و Status
- API مدیریت Pricing و Required Channels

Bot فرستنده تبلیغ خصوصی نیست؛ وظیفه Bot/Mini App مدیریت رضایت، درخواست و وضعیت است.

## Build از GitHub

Workflow اصلی:

`.github/workflows/release-all.yml`

این Workflow:
1. Canonical 3.0 را بازسازی می‌کند.
2. لایه 3.1 را اعمال می‌کند.
3. Telegram Web bundle را Build می‌کند.
4. JavaScript/PHP را Validation می‌کند.
5. PWA، Windows، Linux، macOS، Android، Mini App و Source را Build/Package می‌کند.
6. بررسی می‌کند Login/Server URL/HTTP 501 قدیمی در Build نهایی نباشد.
7. SHA256 می‌سازد و GitHub Pre‑release را منتشر می‌کند.

## فایل‌های مهم سورس

- `.source-bundles/v3/` — Canonical Web Core 3.0
- `.source-bundles/v31/` — بسته augmentation نسخه 3.1
- `enhancements/telegram-web-entry.js` — Web‑MTProto connector
- `enhancements/runtime-patch.js` — UI/feature augmentation
- `enhancements/drive-sync.js` — Drive Sync 2.0
- `telegram-miniapp/` — Bot/Mini App cPanel package
- `desktop/` — Desktop shell/installer
- `android/` — Android shell
- `scripts/apply-v31.mjs` — اعمال 3.1 روی Canonical Core

## وضعیت امنیت

- Sessionهای Telegram در Backup معمولی به‌صورت plaintext صادر نمی‌شوند.
- ContactFlow Account Server وجود ندارد.
- Bot Token فقط روی cPanel Mini App نگه‌داری می‌شود.
- Telegram App credentials فقط هنگام Build تزریق می‌شوند و در Git repository نوشته نمی‌شوند.
- در Web client هر credential لازم برای MTProto نهایتاً قابل استخراج از Build است؛ بنابراین از credential اختصاصی همین برنامه استفاده کنید، نه credential برنامه دیگر.
- Suppression قبل از هر ارسال تبلیغاتی اعمال می‌شود.

## Debug

از صفحه `Diagnostics` داخل برنامه استفاده کنید. برای Mini App:

`telegram-miniapp/health.php`

و برای Desktop:

`http://localhost:17655/health`

در صورت تغییر Port، Diagnostics Port واقعی را نشان می‌دهد.

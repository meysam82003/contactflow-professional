# Changelog

## Hosted Mini App Contact Workspace hotfix — 2026-08-12

### Mini App
- `telegram-miniapp/miniapp.html` به یک Contact Workspace مستقل تبدیل شد.
- برای باز شدن و امکانات پایه به `TELEGRAM_API_ID`، `TELEGRAM_API_HASH` یا `GOOGLE_CLIENT_ID` در Build نیاز ندارد.
- Import TXT/CSV، Paste، Normalize، Dedup و Preview اضافه شد.
- خروجی CSV و VCF اضافه شد.
- Share VCF از Web Share API برای ارسال به Google Drive/Providerهای سیستم اضافه شد.
- Backup/Restore محلی `.cfbackup` اضافه شد.
- Telegram ID/Username از Mini App و `requestContact` برای شماره خود همان کاربر اضافه شد.
- واژه `Opt-in` از UI Contact Workspace حذف شد؛ کنترل جلوگیری از ارسال ناخواسته در Campaign Engine حذف نشده است.

### Telegram contacts API truth
- Checker شبکه‌ای ساختگی از Hosted Mini App حذف/غیرفعال است.
- مستند شد که `contacts.resolvePhone`, `contacts.importContacts`, `contacts.addContact` فقط User Session هستند.
- نبود Match به دلیل Privacy لزوماً به معنی «Telegram ندارد» نیست.
- مسیر بدون App credentials برای افزودن مخاطبین: VCF → Contacts سیستم → Telegram Sync Contacts.

### Google Drive fallback
- نبود `GOOGLE_CLIENT_ID` دیگر مانع Backup پایه Hosted Mini App نیست.
- فایل واقعی Backup/VCF ساخته می‌شود و در دستگاه‌های پشتیبانی‌شده می‌تواند از Share Sheet به Google Drive ارسال شود.

## 3.1.0-alpha.1 — Web Telegram / Drive / Mini App restoration

### Telegram Account Connector
- مسیر QR قدیمی Native/HTTP 501 از مسیر اصلی حذف شد.
- Web‑MTProto QR connector اضافه شد.
- حداکثر ۱۰ Session مستقل روی هر دستگاه.
- QR refresh و 2FA.
- Session Vault رمزگذاری‌شده محلی.
- Active account دستی و Health Check.
- هیچ account rotation برای دورزدن FloodWait وجود ندارد.

### Authorized Checker
- Checker واقعی روی Audience داده‌شده/مجاز.
- Batch import با `matched / not_returned / retry`.
- Cleanup contactهای موقت.
- CSV جداگانه هر نتیجه.
- `not_returned` عمداً معادل قطعی «تلگرام ندارد» نیست.

### Campaign execution
- Promotional فقط برای Opt‑in صریح.
- Service برای Opt‑in یا Existing Chat.
- Reference Channel Post / Forward.
- Dry Run، run cap، delay، duplicate-send guard، progress و stop.
- توقف روی FloodWait / PeerFlood / Restricted / Frozen.

### Google Drive Sync 2.0
- `appDataFolder` برای sync مخفی.
- `drive.file` برای Backup دستی قابل مشاهده.
- SHA‑256 metadata و conflict detection.
- Token expiry/reconnect handling.
- Android System Document Picker برای Backup/Restore و انتخاب Google Drive.
- Windows shell روی `localhost` باز می‌شود تا OAuth JavaScript origin قابل تنظیم باشد.

### Telegram Mini App / Bot
- Mini App به پروژه اصلی برگشت.
- Consent، Suppression، Pricing، Ad Request، progress هر ۵ ثانیه و Membership Gate.
- Admin dashboard و API مدیریت progress/pricing/channels.
- Commands جدید `/myads`, `/membership`, `/help`.
- `health.php` برای DB/Bot/Webhook diagnostics.
- Bot فرستنده advertising DMs نیست.

### Cross-device / CI
- Android WebViewAssetLoader با origin امن داخلی.
- Android 5+ با AndroidX WebKit 1.14.0.
- یک Canonical Web Core برای PWA/Desktop/Android.
- 35+ قابلیت افزوده/گسترش‌یافته بدون حذف قابلیت‌های Local 3.0.
- Release workflow PWA/Windows/Linux/macOS/Android/MiniApp/Source/SHA256 می‌سازد.

## 3.0.0-alpha.1 — ContactFlow Personal Ultimate

### Breaking architecture change
- حذف کامل Login / Register / Forgot Password / Recovery
- حذف Account Server / Server URL / Account Sync
- تبدیل پروژه به Local‑First / Accountless
- انتقال بین دستگاه‌ها از طریق Backup/Restore

### Restored and expanded
- Import چندفایلی با تنظیم مستقل
- CSV / TSV / TXT / XLSX
- Dedup و نرمال‌سازی شماره
- Name / City / Section bulk editing
- Export VCF / CSV / Chunk / ZIP
- شماره‌ساز ترتیبی/تصادفی تا 1,000,000 در Batch

### New local modules
- Audience / Consent / Suppression
- Campaign Composer
- Media Preview
- Reference Channel Post field
- Template Library
- Ad Requests / Progress
- Activity Log
- `.cfbackup` Backup/Restore
- Google Drive path

### Telegram
- UI جدید QR-first
- API ID/API Hash از UI کاربر حذف شد
- Native Connector contract اضافه شد
- PWA محل Telegram Session نیست
- QR جعلی نباید نمایش داده شود؛ Build بدون TDLib/Credential وضعیت Setup نشان می‌دهد

### Desktop
- Port ثابت `127.0.0.1:17654` حذف شد
- استفاده از پورت آزاد تصادفی برای جلوگیری از بازشدن UI قدیمی
- Health endpoint نسخه 3.0

### Android
- Server URL prompt حذف شد
- Assets محلی نسخه 3.0 مبنای APK است
- File picker و export bridge حفظ شد

### CI/CD
- Buildها به Personal Ultimate 3.0 تغییر نام می‌کنند
- Release validation عدم وجود Auth قدیمی و Server URL را بررسی می‌کند
- PWA / Windows / Linux / macOS / Android / Source package تولید می‌شوند

## 2.x
نسخه‌های آزمایشی Local‑First بین معماری Professional 1.x و Ultimate 3.0.

## 1.x
معماری قدیمی Professional مبتنی بر Account/Sync Server. از نسخه 3.0 دیگر معماری فعال پروژه نیست.

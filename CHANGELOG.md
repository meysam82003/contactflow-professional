# Changelog

## 3.6.0 — Essential extensions refresh — 2026-08-16

- Fixed adjacent city/province word spacing and added an automatic repair pass for existing names such as `ابرکوهیزد`.
- Added a native Windows sequential file renamer with Enter-to-next, extension safety, collision checks, Undo, natural ordering, templates and CSV audit reports.
- Added an offline native Android messenger-contact inspector for Telegram, WhatsApp, Rubika, Eitaa, Bale, Soroush and other registered contact actions, with TXT/CSV/XLSX/VCF Save As.

## 3.4.0 — Smart import, reversible merge and Telegram status — 2026-08-15

### Smart Import/Merge shared core
- موتور خالص `web/import-merge.js` برای تشخیص شهر/کشور/نوع شماره، E.164، ترانویسی فارسی، Dedupe و Smart Fill اضافه شد.
- مرکز مشترک `web/v34.js` برای Multi-file Drag & Drop، مقایسه، Dry-run، تصمیم دستی تعارض و گزارش یک‌صفحه‌ای اضافه شد.
- CSV/TSV/TXT/VCF/JSON/XLSX/SpreadsheetML-XLS و ZIP داده+عکس پشتیبانی می‌شوند؛ فایل خراب، حجم غیرمجاز و Zip Bomb رد می‌شود.
- گزارش به‌تفکیک فایل، شهر، نام خانوادگی و دامنه ایمیل، نمودار شهر، خروجی فقط جدید و Excel/Print-to-PDF اضافه شد.

### Reversible local data operations
- IndexedDB به نسخه ۴ و Backup به نسخه ۶ ارتقا یافت.
- Storeهای `merge_runs`، `contact_images` و `watch_state` و Indexهای منبع/Import/Telegram/کشور/نوع شماره اضافه شدند.
- Undo مستقل هر Import، Rollback کامل آخرین Merge، حذف Dry-run منبع و Re-numbering اضافه شد.

### Device and Telegram integration
- Android Runtime Permission برای دفترچه مخاطبین و OCR محلی کارت ویزیت با ML Kit اضافه شد.
- Contact Picker انتخابی، Watch Folder هنگام باز بودن اپ و Web Share در محیط‌های پشتیبانی‌شده فعال شد.
- Checker User Session با سقف ۵۰۰ شماره در هر اجرا، Cleanup مخاطب موقت، ثبت `matched/not_returned/retry`، فیلتر، آمار و خروجی جدا اضافه شد.
- UI عمداً `not_returned` را «برنگشته/نامشخص» نمایش می‌دهد چون Privacy مانع نتیجه قطعی می‌شود.

### Release and verification
- قرارداد نسخه، تست موتور Merge/Parser/گزارش، بررسی پل Android و Verify مستقل ۳.۴ اضافه شد.
- Pipeline همه پوسته‌ها و بسته Mini App را از Web Core مشترک می‌سازد و Release پایدار `v3.4.0` منتشر می‌کند.

## 3.3.0 — Shared core and Telegram contact export — 2026-08-15

### Shared application core
- سورس قابل ممیزی `web/` به Source of Truth همه خروجی‌ها تبدیل شد.
- Telegram Mini App، PWA، Android، Windows، Linux و macOS از همان Web Core ساخته می‌شوند.
- Placeholder قبلی Mini App با Workspace کامل برنامه جایگزین شد.
- نسخه همه پوسته‌ها، Manifest، Service Worker، Android، Desktop و Gateway روی `3.3.0` یکسان شد.

### Telegram contacts
- ورود مستقل User Session با QR رسمی و حداکثر ۱۰ حساب.
- دریافت دفترچه مخاطبین حساب با متد رسمی `contacts.getContacts`.
- Snapshot آفلاین مجزا برای هر حساب، Refresh اجباری و پاک‌سازی مستقل Cache.
- جستجو، مرتب‌سازی، فیلتر مخاطب دوطرفه، انتخاب صفحه و انتخاب همه نتایج.
- Import شماره‌های Telegram به ContactFlow همراه با Duplicate Guard و Undo محدود به رکوردهای تازه.
- تنظیم API ID/Hash از Build یا Storage محلی دستگاه؛ Bot API و `Telegram.WebApp` به‌عنوان جایگزین ساختگی معرفی نمی‌شوند.

### Export and cross-device features
- خروجی CSV، VCF، TXT، JSON و XLS با انتخاب ستون‌ها.
- Chunk، ZIP، پروفایل تنظیمات خروجی و نام فایل امن.
- Android System Document Picker، Web Share و دانلود استاندارد مرورگر.
- Telegram theme، Safe Area، Fullscreen، Home Screen، Offline state، میان‌برهای صفحه‌کلید، Activity Log و Diagnostics.
- بیش از ۲۰ قابلیت مشترک نسخه ۳.۳ در `docs/FEATURES_3_3_FA.md` ثبت شد.

### Quality and release
- موتور مستقل و تست‌پذیر Export به `web/contact-export.js` اضافه شد.
- تست‌های قرارداد نسخه، Dedupe، Filter، Serializer، Chunk و VCF اضافه شد.
- Pipeline واحد Release همه خروجی‌ها، Source ZIP، Release info و SHA-256 را تولید می‌کند.
- انتشار پایدار با Tag `v3.3.0` انجام می‌شود.

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
# 3.5.0

- Added offline Iranian city/province inference from Persian, English and Finglish text.
- Added original-prefix operator detection with an explicit mobile-number-portability warning.
- Added a persisted automatic/fixed/keep source policy for all Smart Import jobs.
- Added province/operator fields, IndexedDB indexes, search and export support.
- Added a consent-aware Telegram/WhatsApp/Rubika/Bale/Soroush handoff center, manual-confirmation CSV queues and VCF export.
- Upgraded shared PWA/Desktop/Android/Mini App assets, backup metadata and release automation to 3.5.0.

# 3.6.0

- Fixed Smart Import so the default action atomically analyzes, commits and verifies contacts in IndexedDB; preview-only is now explicit.
- Applied the saved automatic/fixed source policy to CSV, JSON, VCF, Telegram Desktop export and legacy-tool imports.
- Added an exact transactional name engine with count limits and rich templates.
- Replaced the primary Telegram credential flow with local parsing of official Telegram Desktop JSON/HTML/VCF exports.
- Added native Save As integration, city intelligence, a command palette and a complete Aurora UI refresh.
- Added an offline Legacy V14 toolbox for conversion, deduplication, prefix modes, chunked VCF, duplicate reports, Hex/Unicode and image Base64.
- Added WhatsApp, Rubika, Bale and Soroush visibility to the dashboard while retaining consent-aware manual handoff.
- Updated shared PWA, Desktop, Android and Mini App assets and release automation to 3.6.0.

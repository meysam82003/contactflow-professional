# ContactFlow Personal Ultimate 3.0 Alpha 1 — Release Notes

نسخه `3.0.0-alpha.1` بازطراحی معماری ContactFlow است.

## مهم‌ترین تغییر

ContactFlow دیگر Account Server ندارد. Login/Register/Forgot Password/Recovery/Server URL حذف شده‌اند و برنامه Local‑First است.

## Windows

- مشکل نمایش تصادفی UI قدیمی Professional بر اثر Port ثابت اصلاح شد.
- Setup Process نسخه قبلی را می‌بندد و Shortcut قدیمی را پاک می‌کند.
- Shell فقط Web Core Embedشده خودش را سرو می‌کند.
- `/health` باید `local_only:true` و نسخه 3.0 را برگرداند.

## Android

- Server URL prompt حذف شده است.
- Assets نسخه 3.0 داخل APK قرار می‌گیرند.
- Android 5+ هدف Alpha است (`minSdk 21`).
- File Picker و ذخیره Export/Backup بومی حفظ شده است.

## PWA

- IndexedDB Local
- Service Worker نسخه 3.0
- نصب روی Android/Windows از HTTPS
- بدون Account API

## Data tools

- Generator
- Multi-file Import
- XLSX / CSV / TSV / TXT
- Normalize + Dedup
- Bulk edit
- CSV / VCF / Chunk / ZIP

## Audience & Campaign

- Opt-in
- Existing Chat
- Suppressed
- Unverified
- Campaign Composer
- Media/Reference Channel Post
- Template Library
- Ad Requests/Progress
- Activity Log

## Backup

- `.cfbackup`
- Restore
- Google Drive path
- انتقال بین دستگاه‌ها بدون حساب ContactFlow

## Telegram QR

UI نهایی QR-first است. کاربر API ID/API Hash وارد نمی‌کند. این Credentialها در Native Build تنظیم می‌شوند.

در Alpha بدون TDLib/Credential رسمی، Connector باید `not_configured` برگرداند و QR ساختگی نمایش داده نمی‌شود.

## وضعیت Alpha

Windows/PWA/Linux/macOS از Canonical Web Core 3.0 ساخته می‌شوند. Android نیز از همان Canonical Bundle در GitHub Actions ساخته و داخل Release بررسی می‌شود.

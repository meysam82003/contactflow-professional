# Changelog

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

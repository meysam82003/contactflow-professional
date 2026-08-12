# ContactFlow Personal Ultimate 3.1

Local-first contact management, bulk import/export, Iranian number generator, Telegram Mini App workspace, desktop shell, and Android shell.

Version: `3.1.0-alpha.1`

## 🚀 دانلود برنامه‌ها

### Android APK

آخرین APK منتشرشده:

https://github.com/meysam82003/contactflow-professional/releases/download/v3.1.0-alpha.1/ContactFlow_Personal_Ultimate_3.1.0-alpha.1_Android_Alpha.apk

### همه نسخه‌های آماده دانلود

صفحه Release ها:

https://github.com/meysam82003/contactflow-professional/releases

شامل:

- Android APK
- Windows Build (در صورت انتشار Release مربوطه)
- Linux
- macOS
- PWA
- فایل‌های checksum

## 💻 سورس کامل پروژه

Repository اصلی:

https://github.com/meysam82003/contactflow-professional

## 📱 Telegram Mini App Source

مسیر سورس Mini App:

https://github.com/meysam82003/contactflow-professional/tree/agent/miniapp-workspace-refactor/telegram-miniapp

فایل اصلی:

`telegram-miniapp/miniapp.html`

## ⚙️ Build و CI/CD

GitHub Actions:

https://github.com/meysam82003/contactflow-professional/actions

Workflow ها برای ساخت:

- Android
- Desktop
- PWA
- Telegram Mini App Package

## 📘 راه‌اندازی Telegram Mini App

1. ساخت یا انتخاب Bot در BotFather
2. تنظیم Mini App URL
3. Deploy کردن پوشه `telegram-miniapp`
4. باز کردن Mini App داخل Telegram

## 🖥️ نسخه Desktop و Android

ساختار پروژه:

- `android/` — Android wrapper
- `desktop/` — Windows/Linux/macOS shell
- `telegram-miniapp/` — Telegram Mini App
- `enhancements/` — runtime features
- `scripts/` — build scripts

## 🏗️ معماری

ContactFlow از معماری Local-First استفاده می‌کند:

- اطلاعات مخاطبین در IndexedDB محلی نگهداری می‌شود.
- Backup و Export به‌صورت فایل انجام می‌شود.
- Telegram Mini App یک Workspace کامل است.
- Bot فقط Launcher و لایه Integration است.

## 🔗 قابلیت‌های Telegram

- باز کردن مخاطب انتخاب‌شده در Telegram
- خروجی CSV/TXT/VCF
- Share فایل VCF
- Backup و Restore

Mini App حریم خصوصی Telegram یا Session داخلی کاربران را دور نمی‌زند.

## 📚 مستندات فارسی

- `README_FA.md`
- پوشه `docs/`

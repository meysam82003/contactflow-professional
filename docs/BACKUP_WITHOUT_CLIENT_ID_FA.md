# Backup / Google Drive بدون Client ID اجباری

در این Hotfix نبودن `GOOGLE_CLIENT_ID` دیگر خطا محسوب نمی‌شود.

ContactFlow یکی از این مسیرها را خودکار انتخاب می‌کند:

1. **Android:** System Document Picker؛ در پنجره سیستم Google Drive را به‌عنوان مقصد/منبع انتخاب کنید.
2. **Windows/Chrome/Edge:** انتخاب یک Sync Folder با File System Access. اگر Google Drive for Desktop نصب است، پوشه‌ای داخل Google Drive را انتخاب کنید.
3. **مرورگر بدون Folder Picker:** Backup به‌صورت فایل `.cfbackup` دانلود می‌شود و Restore از File Picker انجام می‌شود.
4. **Google OAuth اختیاری:** اگر بعدها `googleClientId` وجود داشت، Direct Drive API همچنان حفظ شده و قابل استفاده است.

Sync Folder فایل ثابت `ContactFlow-Ultimate-sync.cfbackup` و Manifest شامل SHA-256 و زمان آخرین Backup را نگه می‌دارد و در صورت تغییر همزمان نسخه محلی و پوشه، Conflict را تشخیص می‌دهد.

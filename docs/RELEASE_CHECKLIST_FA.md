# چک‌لیست Release — ContactFlow Personal Ultimate 3.0

این چک‌لیست قبل از انتشار هر Build باید کامل شود.

## Web Core

- [ ] `VERSION` با نسخه Release یکسان است.
- [ ] `node --check app.js` موفق است.
- [ ] `node --check ultimate.js` موفق است.
- [ ] Dashboard مستقیم باز می‌شود.
- [ ] صفحات Generator / Import / Contacts / Exports / Audience / Telegram / Campaign / Requests / Backup / Activity وجود دارند.
- [ ] `auth-gate` وجود ندارد.
- [ ] `auth-login` وجود ندارد.
- [ ] `auth-register` وجود ندارد.
- [ ] `Forgot Password` وجود ندارد.
- [ ] `Server URL` وجود ندارد.
- [ ] `127.0.0.1:17654` در Web Core وجود ندارد.
- [ ] `pseudoQR` یا QR ساختگی وجود ندارد.

## Import / Contacts

- [ ] CSV تست می‌شود.
- [ ] TXT تست می‌شود.
- [ ] XLSX تست می‌شود.
- [ ] چند فایل همزمان تست می‌شود.
- [ ] Duplicate حذف/گزارش می‌شود.
- [ ] شماره ایران به `+98...` نرمال می‌شود.
- [ ] City / Section / Source مستقل حفظ می‌شوند.
- [ ] Name Template صحیح است.

## Generator

- [ ] حالت ترتیبی تست می‌شود.
- [ ] حالت تصادفی تست می‌شود.
- [ ] Preview قبل از افزودن کار می‌کند.
- [ ] خروجی CSV/TXT تست می‌شود.
- [ ] محدودیت Batch بدون Freeze بررسی می‌شود.

## Export

- [ ] CSV
- [ ] VCF
- [ ] Chunking
- [ ] ZIP
- [ ] نام فایل‌ها و شماره قطعات درست هستند.

## Audience / Campaign

- [ ] Opt-in
- [ ] Existing Chat
- [ ] Suppressed
- [ ] Unverified
- [ ] Suppressed در اولویت است.
- [ ] Campaign Draft ذخیره و دوباره باز می‌شود.
- [ ] Media Preview کار می‌کند.
- [ ] Reference Channel Post ذخیره می‌شود.
- [ ] Ad Request progress صحیح است.

## Backup

- [ ] `.cfbackup` ساخته می‌شود.
- [ ] Restore روی دیتابیس تست انجام می‌شود.
- [ ] Contacts بعد از Restore برابر است.
- [ ] Audience برابر است.
- [ ] Campaignها برابر هستند.
- [ ] Activity Log باقی می‌ماند.
- [ ] Telegram Authorization/Session داخل Backup Web Core قرار نمی‌گیرد.

## Windows

- [ ] Setup نسخه قدیمی را Stop می‌کند.
- [ ] Shortcut قدیمی Professional حذف می‌شود.
- [ ] برنامه روی Local Port جدید/آزاد بالا می‌آید.
- [ ] `/health` شامل `local_only:true` است.
- [ ] نسخه Health صحیح است.
- [ ] صفحه Login قدیمی باز نمی‌شود.

## Android

- [ ] APK بدون Server URL prompt باز می‌شود.
- [ ] Assets داخل APK نسخه 3.0 هستند.
- [ ] minSdk = 21 یا بالاتر.
- [ ] File Picker کار می‌کند.
- [ ] Backup/Export قابل ذخیره است.

## Telegram QR

- [ ] UI از کاربر API ID/API Hash نمی‌خواهد.
- [ ] Build بدون TDLib وضعیت Setup نشان می‌دهد.
- [ ] Build بدون TDLib QR ساختگی تولید نمی‌کند.
- [ ] Build دارای TDLib فقط QR واقعی Telegram را نشان می‌دهد.
- [ ] Session در Storage خصوصی Native است.

## GitHub Release

- [ ] Windows Portable
- [ ] Windows Setup
- [ ] Linux x64
- [ ] macOS Intel
- [ ] macOS Apple Silicon
- [ ] Android APK
- [ ] PWA ZIP
- [ ] Source ZIP
- [ ] SHA256
- [ ] Release Notes
- [ ] Prerelease برای Alpha فعال است.

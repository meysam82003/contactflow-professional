# راهنمای نصب ContactFlow Personal Ultimate 3.0

این راهنما برای نسخه `3.0.0-alpha.1` است. این نسخه **بدون حساب ContactFlow و بدون Server URL** کار می‌کند.

## 1. Windows

### روش Setup
1. از GitHub Release فایل `ContactFlow_Personal_Ultimate_3.0_Windows_Setup.exe` را دریافت کنید.
2. Setup را اجرا کنید.
3. برنامه در `%LOCALAPPDATA%\Programs\ContactFlow Personal Ultimate` نصب می‌شود.
4. Shortcut روی Desktop و Start Menu ساخته می‌شود.
5. برنامه را اجرا کنید؛ باید مستقیم Dashboard باز شود.

### روش Portable
فایل `ContactFlow_Personal_Ultimate_3.0_Windows_Portable.exe` را اجرا کنید. نصب لازم نیست.

### تست مهم
اگر صفحه Login/Register/Server URL دیدید، Build قدیمی اجرا شده است. نسخه 3.0 Desktop از پورت آزاد تصادفی localhost استفاده می‌کند تا با نسخه‌های قدیمی که روی `127.0.0.1:17654` مانده‌اند تداخل نداشته باشد.

## 2. Android APK

1. APK نسخه 3.0 را نصب کنید.
2. اگر Android اجازه نصب از منبع فعلی را نداد، فقط برای همان File Manager/Browser اجازه Install unknown apps بدهید.
3. برنامه باید مستقیم Dashboard محلی را باز کند.
4. برای Import از File Picker سیستم استفاده کنید.
5. برای Backup/Export، Android Bridge فایل را به System File Picker/Downloads تحویل می‌دهد.

در نسخه 3.0 دیگر پنجره «آدرس ContactFlow» یا Server URL وجود ندارد.

## 3. PWA / تحت وب

فایل‌های Root پروژه را روی HTTPS قرار دهید:

```text
index.html
app.js
ultimate.js
config.js
styles.css
manifest.webmanifest
sw.js
icons/
```

سپس URL را در Chrome یا Edge باز کنید.

### Android Chrome
Menu → Add to Home screen / Install app

### Windows Edge/Chrome
App available / Install this site as an app

### نکته
PWA را با File Manager و `file://` اجرا نکنید. Service Worker و نصب کامل PWA به HTTPS یا localhost نیاز دارند.

## 4. Linux

Artifact `ContactFlow_Personal_Ultimate_3.0_Linux_x64` را executable کنید:

```bash
chmod +x ContactFlow_Personal_Ultimate_3.0_Linux_x64
./ContactFlow_Personal_Ultimate_3.0_Linux_x64
```

## 5. macOS

دو Build وجود دارد:
- Intel: `macOS_Intel`
- Apple Silicon: `macOS_AppleSilicon`

در اولین اجرا ممکن است macOS به‌خاطر unsigned بودن Alpha اجازه دستی بخواهد.

## 6. Google Drive

Backup دستی بدون هیچ تنظیمی کار می‌کند.

برای OAuth مستقیم Google Drive در PWA/Desktop، مقدار `googleClientId` را در `config.js` تنظیم کنید. Scope مورد استفاده فقط `drive.file` است.

در Android می‌توانید از System File Picker استفاده کنید و Google Drive را به‌عنوان مقصد انتخاب کنید؛ این حالت نیاز به ذخیره Google Refresh Token داخل ContactFlow ندارد.

## 7. Telegram QR

UI از کاربر API ID/API Hash نمی‌خواهد. Credential برنامه باید در Native Build باشد. اگر TDLib/Credential تنظیم نشده باشد، برنامه باید `QR Setup` نشان دهد و QR جعلی نسازد.

راهنمای تخصصی: `docs/TELEGRAM_QR_FA.md`

## 8. Build از GitHub Actions

در GitHub:

1. وارد تب Actions شوید.
2. Workflow `Release All Devices — Personal Ultimate 3.0` را باز کنید.
3. `Run workflow` را بزنید.
4. بعد از موفقیت، Artifactها و Release نسخه 3.0 ساخته می‌شوند.

## 9. تشخیص نسخه صحیح

در UI باید عبارت زیر دیده شود:

```text
ContactFlow Personal Ultimate 3.0
Local Only
```

و هیچ‌کدام از این موارد نباید وجود داشته باشند:

```text
Login
Register
Forgot Password
Recovery
Server URL
Cloud Account
```

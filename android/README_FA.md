# Android / APK

این پوشه سورس Android نسخه Professional است. UI همان PWA است و داخل APK بسته‌بندی می‌شود؛ بنابراین برای اجرای هسته مخاطبین به سایت خارجی وابسته نیست. Sync و Telegram Gateway همچنان اینترنت می‌خواهند.

## ساخت خودکار در GitHub
پروژه را در GitHub قرار دهید و فایل workflow موجود در `.github/workflows/build-android.yml` را به مسیر `.github/workflows/` ریشه Repository منتقل کنید یا همان workflow را از ریشه اجرا کنید. سپس Actions → Build Android APK → Run workflow. خروجی `app-debug.apk` به‌عنوان Artifact ارائه می‌شود.

Toolchain مرجع پروژه: AGP 9.4.0، Gradle 9.6.0، JDK 17، compileSdk 37 و AndroidX WebKit 1.16.0.

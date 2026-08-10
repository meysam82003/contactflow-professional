# ساخت APK با GitHub Actions

پروژه شامل `.github/workflows/build-android.yml` است.

1. یک Repository **Private** بسازید.
2. کل سورس ContactFlow Professional 1.1 را Push کنید.
3. از تب **Actions**، Workflow با نام **Build Android APK** را اجرا کنید.
4. بعد از اتمام Build، Artifact با نام `ContactFlow-Professional-APK` را دانلود کنید.
5. داخل ZIP Artifact فایل `app-debug.apk` قرار دارد و برای نصب شخصی قابل استفاده است.

## نکته امنیتی
`.gitignore` دیتابیس، `.env`، Server Secret، keystore و Build outputs را از Commit خارج می‌کند. Bot Token داخل Repository قرار نمی‌گیرد و از داخل برنامه روی Server تنظیم می‌شود.

## Mini App
برای کارکرد داخل Telegram، PWA/Server باید روی HTTPS عمومی باشد. در ContactFlow بخش Telegram، URL عمومی Mini App را وارد کنید. Server هنگام ذخیره تنظیمات تلاش می‌کند Menu Button مخصوص Admin ID را روی Bot تنظیم کند. برای Main Mini App عمومی پروفایل Bot می‌توانید همان URL را در BotFather نیز ثبت کنید.

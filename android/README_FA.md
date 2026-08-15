# Android / APK — ContactFlow 3.4

Android یک پوسته WebViewAssetLoader روی همان Web Core پوشه `web/` است. بنابراین UI، مخاطبین Telegram و موتور خروجی با PWA، Mini App و Desktop یکسان‌اند و Assets درون APK قرار می‌گیرند.

ساخت رسمی از workflow واحد `.github/workflows/release-all.yml` انجام می‌شود و فایل `ContactFlow_Personal_Ultimate_3.4.0_Android.apk` را تولید می‌کند. حداقل نسخه Android 6 / API 23 است؛ دفترچه دستگاه فقط پس از Runtime Permission و OCR کارت ویزیت با ML Kit روی دستگاه پردازش می‌شود.

مشخصات نسخه ۳.۳:

- `minSdk 21`
- `targetSdk 36`
- `compileSdk 36`
- AGP `9.3.0`
- AndroidX WebKit `1.14.0`
- ذخیره خروجی و Backup با System Document Picker
- Telegram User API در هسته مشترک؛ اتصال شبکه برای QR و Refresh مخاطبین لازم است

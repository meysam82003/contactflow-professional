# راه‌اندازی Google Drive در ContactFlow Personal 2.0

ContactFlow Personal حساب و Backend مرکزی ندارد. اتصال Drive در Web/Desktop مستقیماً با Google Identity Services انجام می‌شود.

## Web / PWA / Desktop

1. در Google Cloud Console یک Project بسازید.
2. Google Drive API را فعال کنید.
3. OAuth consent screen را تنظیم کنید.
4. یک OAuth Client از نوع Web application بسازید.
5. Origin دامنه PWA را به Authorized JavaScript origins اضافه کنید، مثلاً `https://example.ir`.
6. برای Desktop محلی `http://127.0.0.1:17654` را نیز در صورت پذیرش تنظیمات Google به‌عنوان Origin استفاده کنید. اگر Google فقط `localhost` را برای HTTP محلی پذیرفت، Desktop را روی `http://localhost:17654` باز کنید.
7. Client ID را در بخش Backup برنامه وارد کنید.

Scope مورد استفاده فقط `https://www.googleapis.com/auth/drive.file` است. این Scope برای فایل‌هایی است که برنامه ایجاد/مدیریت می‌کند و جایگزین دسترسی کامل Drive نیست.

چون Backend و حساب ContactFlow عمداً حذف شده است، Refresh Token روی سرور ContactFlow ذخیره نمی‌شود. پس از پایان عمر Access Token ممکن است یک اتصال مجدد لازم شود.

## Android

در Android از Storage Access Framework استفاده می‌شود. هنگام ذخیره Backup، پنجره انتخاب مقصد Android باز می‌شود؛ اگر Google Drive روی دستگاه فعال باشد می‌توانید Drive را به‌عنوان مقصد انتخاب کنید. این روش نیاز به OAuth داخل WebView ندارد.

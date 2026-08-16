# چک‌لیست Release — ContactFlow 3.6

## قرارداد نسخه و سورس

- [ ] `VERSION`، `package.json`، Android، Desktop، Manifest، Service Worker و PHP Gateway روی `3.6.0` هستند.
- [ ] `node scripts/verify-v35.mjs` و همه تست‌های `node --test` موفق‌اند.
- [ ] تشخیص شهر/استان انگلیسی و فینگلیش، اپراتور و قانون منبع خودکار/ثابت تست شده‌اند.
- [ ] صف کانال‌ها فقط مخاطبین مجاز را وارد CSV/VCF می‌کند و ارسال نهایی نیازمند تأیید است.
- [ ] Dry-run، Commit، Undo فایل و Rollback آخرین Merge روی دیتابیس آزمایشی بررسی شده‌اند.
- [ ] APK فقط پس از کلیک کاربر مجوز `READ_CONTACTS` می‌خواهد و OCR تصویر را محلی اجرا می‌کند.
- [ ] Mini App در نبود Contact Picker ادعای خواندن دفترچه کامل گوشی ندارد.
- [ ] Checker بیش از ۵۰۰ شماره در یک اجرا نمی‌پذیرد و `not_returned` را قطعی معرفی نمی‌کند.
- [ ] `web/` Source of Truth است و Mini App/PWA/Desktop/Android از همان Artifact استفاده می‌کنند.
- [ ] `npm test` و `npm run verify` موفق‌اند.
- [ ] Placeholder قبلی Mini App در Release وجود ندارد.
- [ ] فایل Build شده `telegram-web.bundle.js` در تمام Artifactهای دارای Web Core وجود دارد.

## Telegram contacts

- [ ] Build بدون API credentials وضعیت «تنظیم نشده» نشان می‌دهد و QR ساختگی ندارد.
- [ ] Build دارای credentials یا تنظیم محلی می‌تواند QR رسمی بسازد.
- [ ] ورود 2FA، انتخاب حساب، Health و حذف Session تست شده است.
- [ ] `contacts.getContacts` فهرست حساب فعال را دریافت می‌کند.
- [ ] Snapshot هر حساب جدا، Offline قابل نمایش و مستقل قابل پاک‌سازی است.
- [ ] Bot و Deleted Account از خروجی پیش‌فرض حذف می‌شوند.
- [ ] Session و Snapshot داخل `.cfbackup` اصلی نیستند.

## فیلتر و Export

- [ ] جستجو در نام، شماره، Username و Telegram ID کار می‌کند.
- [ ] Sort، Mutual filter، بدون شماره، Pagination و Bulk selection تست شده‌اند.
- [ ] CSV، VCF، TXT، JSON و XLS با UTF-8 باز می‌شوند.
- [ ] انتخاب ستون، Chunk، ZIP و پروفایل ذخیره‌شده تست شده‌اند.
- [ ] Android picker، Web Share و Download مرورگر تست شده‌اند.
- [ ] Import به ContactFlow فقط رکورد جدید را اضافه می‌کند و Undo فقط همان رکوردها را حذف می‌کند.

## هسته قبلی

- [ ] Generator، Import CSV/TXT/XLSX، Contacts، Rename و Export اصلی Regression نشده‌اند.
- [ ] Audience/Suppression، Campaign draft، Backup/Restore، Drive و Activity اجرا می‌شوند.
- [ ] Login/Register/Recovery و ContactFlow Account Server برنگشته‌اند.

## دستگاه‌ها و بسته‌ها

- [ ] PWA روی HTTPS نصب و Offline باز می‌شود.
- [ ] Mini App از `miniapp.html` با Telegram theme و safe area باز می‌شود.
- [ ] Android با `minSdk 23` و Assets نسخه ۳.۵ ساخته می‌شود.
- [ ] Windows Portable/Setup، Linux x64 و هر دو macOS shell ساخته می‌شوند.
- [ ] PHP فایل‌های cPanel بدون Syntax error هستند و `health.php` نسخه ۳.۵ را برمی‌گرداند.

## GitHub Release

- [ ] Tag پایدار `v3.6.0` به Commit مورد نظر اشاره می‌کند.
- [ ] همه Artifactها، Source ZIP، Release info و SHA-256 پیوست‌اند.
- [ ] Release به‌صورت latest و non-prerelease منتشر شده است.
- [ ] توضیح Release محدودیت رسمی WebApp/Bot API و نیاز User Session را بیان می‌کند.

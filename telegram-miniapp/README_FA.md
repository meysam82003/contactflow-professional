# ContactFlow Telegram Mini App 3.4

بسته Release مینی‌اپ از همان Web Core نسخه‌های PWA، Android و Desktop ساخته می‌شود. فایل شروع `miniapp.html` است و دیگر صفحه Placeholder یا Workspace جداگانه‌ای وجود ندارد.

## نصب روی cPanel

1. فایل `ContactFlow_Personal_Ultimate_3.4.0_Telegram_MiniApp_cPanel.zip` را دانلود و در یک مسیر HTTPS Extract کنید.
2. مطمئن شوید `miniapp.html` و فایل‌های JavaScript/CSS در یک پوشه هستند.
3. آدرس `https://domain/path/miniapp.html` را باز کنید.
4. همان URL را در BotFather به‌عنوان Main Mini App ثبت کنید.
5. برای Launcher ساده همین مرحله کافی است. `setup.php` فقط وقتی لازم است که Bot/Business Gateway و Webhook را هم می‌خواهید.

## قابلیت‌های بدون Telegram User Session

- شماره‌ساز، Import و مدیریت مخاطبین ContactFlow
- خروجی و Backup محلی
- Campaign draft، Audience و Activity Log
- PWA/Offline cache پس از اولین بارگذاری موفق
- `requestContact` برای درخواست شماره خود کاربر با تأیید او

## مشاهده و خروجی همه مخاطبین Telegram

`Telegram.WebApp` و Bot API فهرست مخاطبین حساب را در اختیار Mini App قرار نمی‌دهند. نسخه ۳.۳ برای این کار یک User Session مستقل ایجاد می‌کند و متد رسمی `contacts.getContacts` را اجرا می‌کند.

1. در صفحه «مخاطبین تلگرام» API ID/Hash رسمی خود را وارد کنید، یا از Build دارای تنظیم سازمانی استفاده کنید.
2. «اتصال/مدیریت QR» را بزنید.
3. QR را از Telegram → Settings → Devices → Link Desktop Device اسکن کنید.
4. به صفحه «مخاطبین تلگرام» برگردید و «دریافت از Telegram» را بزنید.
5. فیلترها، ستون‌ها، فرمت، Chunk و ZIP را تنظیم و Export کنید.

در موبایل برای اسکن QR معمولاً به دستگاه دوم نیاز است. Session داخلی اپ Telegram قابل قرض گرفتن نیست.

## حریم خصوصی

- API credentials محلی، Session رمزگذاری‌شده و Snapshot مخاطبین به Backend ContactFlow ارسال نمی‌شوند.
- Session و Snapshot به Origin همان دامنه وابسته‌اند؛ دامنه را عوض نکنید و فقط از هاست مورد اعتماد استفاده کنید.
- داده Telegram داخل Backup عادی `.cfbackup` قرار نمی‌گیرد.
- حذف Snapshot حساب را Logout نمی‌کند. برای حذف Session از صفحه «تلگرام QR» استفاده کنید.

## Bot/Business Gateway اختیاری

اگر Gateway هم لازم است، پس از Extract کردن فایل‌ها `setup.php` را باز و Bot Token را وارد کنید. Admin Key نمایش‌داده‌شده را همان لحظه در Password Manager نگه دارید؛ صفحه Setup پس از نصب با همان کلید قفل می‌شود و تلاش Pair نیز Rate Limit دارد. Gateway برای نمایش دفترچه مخاطبین Telegram استفاده نمی‌شود و جای User Session را نمی‌گیرد.

فایل `health.php` باید نسخه `3.4.0` و وضعیت تنظیم Gateway را برگرداند. دسترسی نوشتن پوشه `storage/` را محدود نگه دارید و فایل‌های `.htaccess` بسته را حذف نکنید.

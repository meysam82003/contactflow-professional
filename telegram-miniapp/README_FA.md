# ContactFlow Telegram Mini App 3.6

بسته Release مینی‌اپ از همان Web Core نسخه‌های PWA، Android و Desktop ساخته می‌شود. فایل شروع `miniapp.html` است و دیگر صفحه Placeholder یا Workspace جداگانه‌ای وجود ندارد.

## نصب روی cPanel

1. فایل `ContactFlow_Personal_Ultimate_3.6.0_Telegram_MiniApp_cPanel.zip` را دانلود و در یک مسیر HTTPS Extract کنید.
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

## مشاهده و خروجی مخاطبین Telegram بدون API

`Telegram.WebApp` و Bot API فهرست خصوصی مخاطبین حساب را در اختیار Mini App قرار نمی‌دهند. نسخه ۳.۶ بدون API ID/Hash از فایل رسمی Telegram Desktop استفاده می‌کند.

1. در Telegram Desktop از Settings → Advanced → Export Telegram data فقط Contacts را انتخاب کنید.
2. فایل `result.json` یا HTML را در صفحه «تلگرام بدون API» باز کنید.
3. مخاطبین را جستجو و مشاهده کنید.
4. آن‌ها را در ContactFlow ثبت کنید یا VCF/CSV را با Save As بگیرید.

هیچ QR، API Hash یا Session جداگانه‌ای برای این مسیر ایجاد نمی‌شود.

## حریم خصوصی

- فایل Export فقط پس از انتخاب صریح کاربر خوانده می‌شود.
- پردازش و دیتابیس مخاطبین روی همان Origin و دستگاه می‌ماند.
- API credentials و Session تلگرام برای این قابلیت وجود ندارد.

## Bot/Business Gateway اختیاری

اگر Gateway هم لازم است، پس از Extract کردن فایل‌ها `setup.php` را باز و Bot Token را وارد کنید. Admin Key نمایش‌داده‌شده را همان لحظه در Password Manager نگه دارید؛ صفحه Setup پس از نصب با همان کلید قفل می‌شود و تلاش Pair نیز Rate Limit دارد. Gateway برای نمایش دفترچه مخاطبین Telegram استفاده نمی‌شود و جای User Session را نمی‌گیرد.

فایل `health.php` باید نسخه `3.6.0` و وضعیت تنظیم Gateway را برگرداند. دسترسی نوشتن پوشه `storage/` را محدود نگه دارید و فایل‌های `.htaccess` بسته را حذف نکنید.

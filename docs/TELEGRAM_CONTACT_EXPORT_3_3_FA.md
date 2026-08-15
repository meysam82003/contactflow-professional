# خروجی مخاطبین Telegram در ContactFlow 3.3

## مرز رسمی API

`Telegram.WebApp` اطلاعات پایه کاربری را از `initData` ارائه می‌کند و می‌تواند با `requestContact` از کاربر بخواهد شماره خودش را برای Bot ارسال کند. این API فهرست مخاطبین حساب Telegram را در اختیار Mini App قرار نمی‌دهد.

ContactFlow برای فهرست کامل از متد رسمی User API زیر استفاده می‌کند:

`contacts.getContacts`

این متد فقط با User Session مجاز اجرا می‌شود. بنابراین Bot Token یا Business Connection جایگزین ورود User Session نیست.

منابع رسمی:

- https://core.telegram.org/bots/webapps
- https://core.telegram.org/method/contacts.getContacts
- https://core.telegram.org/api/obtaining_api_id

## روش اتصال

1. در `https://my.telegram.org/apps` یک API ID و API Hash رسمی بسازید؛ یا از Build تنظیم‌شده سازمان خود استفاده کنید.
2. در صفحه «مخاطبین تلگرام» اطلاعات را فقط روی همان دستگاه ذخیره کنید.
3. «اتصال/مدیریت QR» را باز کنید و QR رسمی را از Telegram → Settings → Devices اسکن کنید.
4. حساب فعال را انتخاب و «دریافت از Telegram» را اجرا کنید.

در موبایل معمولاً برای اسکن QR به یک دستگاه دوم نیاز است.

## داده‌های ذخیره‌شده

- Session در IndexedDB همان Origin نگه‌داری می‌شود و پیش از ذخیره با کلید WebCrypto همان Origin رمز می‌شود.
- Snapshot مخاطبین فقط روی همان دستگاه ذخیره می‌شود.
- ContactFlow Session را به Backend خود ارسال نمی‌کند.
- رمزگذاری محلی در برابر کد مخرب اجراشده روی همان Origin محافظت کامل ایجاد نمی‌کند؛ هاست Mini App باید قابل اعتماد و HTTPS باشد.

## خروجی

خروجی برای همه نتایج فیلترشده یا فقط انتخاب‌ها ساخته می‌شود:

- CSV
- VCF / vCard
- TXT
- JSON
- XLS سازگار با Excel
- انتخاب ستون‌ها
- تقسیم فایل بر اساس تعداد رکورد
- ZIP برای خروجی چندبخشی
- پروفایل تنظیمات خروجی

## Import به ContactFlow

فقط مخاطب دارای شماره وارد دیتابیس اصلی می‌شود. Duplicate Guard شماره‌های موجود را حذف می‌کند. Undo فقط کلید شماره‌هایی را حذف می‌کند که در آخرین Import واقعاً جدید بوده‌اند؛ مخاطبین قدیمی حذف نمی‌شوند.

## نکات امنیتی و محدودیت‌ها

- از API برای Spam، Flood یا کشف انبوه حساب‌ها استفاده نکنید؛ Telegram استفاده سوء را محدود یا مسدود می‌کند.
- Mini App نمی‌تواند Session داخلی اپ Telegram را قرض بگیرد.
- مخاطب فاقد شماره همچنان می‌تواند با Username و Telegram ID در CSV/JSON/VCF خروجی داده شود.
- پاک‌کردن Snapshot، Session حساب را حذف نمی‌کند؛ حذف Session از بخش مدیریت حساب انجام می‌شود.

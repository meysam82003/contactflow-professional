# ContactFlow Professional 1.2 — وضعیت پیاده‌سازی

## انجام‌شده
- Login Gate: ثبت‌نام، ورود، تغییر نام کاربری، تغییر رمز و Recovery Code.
- Snapshot رمزگذاری‌شده مخاطبین و تاریخچه؛ Cloud Files رمزگذاری‌شده برای ورودی/خروجی.
- رفع HTTP 404 نسخه Desktop: پورت UI محلی دیگر به‌عنوان API Cloud فرض نمی‌شود.
- Import چندفایلی با صف و تنظیم مستقل City / Section / Source / Template / Start / Phone Column / Continue Sequence برای هر فایل.
- Export Queue با تنظیم مستقل Format / City / Section / Chunk Size / Filename.
- ZIP اختیاری همه قطعه‌های خروجی؛ فایل‌های تکی نیز حفظ می‌شوند.
- Telegram Mini App و اعتبارسنجی initData در Server.
- Telegram Business Connections و ارسال Private Message فقط به چت‌های موجود در Connection، از طرف حساب Business متصل.
- CSV از Business Chatهای موجود با last_business_interaction.
- Build Windows Setup/Portable، Linux، macOS Intel/Apple Silicon، Android، PWA و Server.
- GitHub Actions برای Android، Desktop و Release همه دستگاه‌ها.

## عمداً پیاده‌سازی نشده
- پیام انبوه سرد به شماره‌های ناشناس یا چرخاندن چند اکانت برای دور زدن محدودیت Telegram.
- تولید/اسکن انبوه شماره‌ها برای کشف اینکه چه شماره‌ای Telegram دارد.
- استخراج انبوه Last Seen/Online کاربران از یک دیتاست شماره تلفن.

برای کاربران و چت‌هایی که Telegram/Business API به‌صورت مجاز در اختیار حساب قرار می‌دهد، برنامه زمان آخرین تعامل ثبت‌شده را نگه می‌دارد و خروجی می‌دهد.

# Telegram Business Connector — ContactFlow 3.1 Hotfix

این Hotfix مسیر اصلی اتصال Telegram را از QR مبتنی بر MTProto به **Bot Pair + Telegram Business Connection** تغییر می‌دهد. برای این مسیر، کاربر ContactFlow نیازی به `TELEGRAM_API_ID` یا `TELEGRAM_API_HASH` ندارد.

## نصب ساده Mini App
1. فایل `Telegram_MiniApp_cPanel.zip` را در مسیر دلخواه هاست Extract کنید؛ مثال: `public_html/contactflow/`.
2. آدرس `https://domain/contactflow/miniapp.html` را در صفحه Mini App خود ContactFlow ثبت کنید.
3. Mini App برای باز شدن به Secret یا تنظیم Build نیاز ندارد.

## فعال کردن Bot Gateway برای ارسال پیام
Mini App مستقل است؛ فقط اگر ارسال از Telegram Business لازم است یک بار `https://domain/contactflow/setup.php` را باز کنید و Bot Token را وارد کنید. Setup به‌صورت خودکار Webhook، Commandها و Menu Button را ثبت می‌کند.

برای هر حساب فرستنده:
1. همان حساب Bot را Start کند.
2. Bot یک Pair Code شش‌رقمی می‌دهد.
3. Pair Code داخل ContactFlow وارد شود.
4. همان حساب در Telegram → Settings → Telegram Business → Chatbots، Bot را متصل و دسترسی چت‌های موردنظر را بدهد.
5. Business Connection در ContactFlow ظاهر می‌شود و می‌توان آن را دستی به‌عنوان فرستنده انتخاب کرد.

## قابلیت‌های Connector
- Pair امن و یک‌بارمصرف ۶ رقمی با انقضای ۱۰ دقیقه‌ای
- نگهداری حداکثر ۱۰ Pair محلی
- تشخیص Business Connectionهای فعال/غیرفعال
- انتخاب دستی حساب فرستنده
- Label برای هر Connection
- لیست چت‌های Business شناخته‌شده
- Test Message قبل از Campaign
- صف Campaign با Progress
- Cancel کمپین
- رعایت `retry_after` در خطای 429
- Opt-in اجباری برای تبلیغات
- `/subscribe` و `/stop`
- Mini App مستقل با URL
- Health و Diagnostics
- Cron اختیاری برای cPanel
- VCF چندبخشی برای انتقال مخاطبین به Contacts سیستم

## مخاطبین و شماره‌ها
Bot API وارد کردن مستقیم شماره‌ها به دفترچه مخاطبین حساب Telegram را انجام نمی‌دهد. ContactFlow به‌جای رفتار جعلی، VCF چندبخشی می‌سازد. فایل‌ها را در Contacts گوشی/سیستم Import کنید؛ در صورت فعال بودن Contact Sync، Telegram می‌تواند مخاطبین سیستم را ببیند.

## حریم خصوصی ارسال
Campaign تبلیغاتی فقط روی چت‌های Business شناخته‌شده‌ای اجرا می‌شود که Opt-in صریح دارند. این Hotfix اسکن شماره‌های تصادفی، پیام سرد یا چرخش خودکار حساب برای دور زدن محدودیت‌های Telegram انجام نمی‌دهد.

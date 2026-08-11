# ContactFlow Telegram Mini App + Business Gateway

## Mini App ساده
فقط پوشه را روی هاست Extract کنید و آدرس زیر را داخل ContactFlow ثبت کنید:

`https://domain/contactflow/miniapp.html`

Mini App برای باز شدن به هیچ Secret در Build برنامه نیاز ندارد.

## اتصال Bot / Business برای ارسال پیام
یک بار `setup.php` را باز کنید و Bot Token را وارد کنید. Setup به‌صورت خودکار Webhook، Commandها و Menu Button مینی‌اپ را تنظیم می‌کند.

برای هر حساب Telegram:
1. Bot را با همان حساب Start کنید.
2. کد ۶ رقمی Pair را داخل ContactFlow وارد کنید.
3. در Telegram → Settings → Telegram Business → Chatbots همین Bot را متصل کنید و دسترسی چت‌های لازم را بدهید.
4. ContactFlow Business Connection را دریافت و برای Campaign انتخاب می‌کند.

ContactFlow تا ۱۰ Pair را محلی نگه می‌دارد و حساب فرستنده به‌صورت دستی انتخاب می‌شود؛ چرخش خودکار برای دورزدن محدودیت‌ها وجود ندارد.

ارسال تبلیغاتی فقط برای Opt-inهای صریح انجام می‌شود. `/subscribe` رضایت را فعال و `/stop` آن را لغو می‌کند.

## مخاطبین
Bot نمی‌تواند شماره‌های دلخواه را مستقیماً داخل دفترچه مخاطبین حساب Telegram وارد کند. دکمه VCF در ContactFlow خروجی چندبخشی می‌سازد تا آن را در Contacts گوشی/سیستم Import کنید و سپس در صورت فعال بودن Contact Sync، Telegram آن مخاطبین را ببیند.

# Telegram Mini App / Bot

Mini App حذف نشده و در 3.1 به‌صورت ماژول مستقل cPanel برگشته است.

## وظایف Bot/Mini App

- ثبت Opt-in / Opt-out
- Suppression
- Pricing
- Ad Request
- Progress زنده درخواست
- Numeric ID binding
- Membership Gate
- Admin dashboard
- Health endpoint

Commands:
`/start`, `/panel`, `/ads_on`, `/ads_off`, `/pricing`, `/request`, `/myads`, `/membership`, `/help`

Bot برای ارسال تبلیغ خصوصی به Audience استفاده نمی‌شود. ارسال User Account فقط برای Audience مجاز از داخل ContactFlow انجام می‌شود.

## Health

`health.php` وضعیت DB، Bot getMe، Webhook URL، pending updates و آخرین webhook error را بدون نمایش Token برمی‌گرداند.

# Telegram Web Connector 3.1

## اتصال

کاربر فقط «اتصال با QR» را می‌زند و QR رسمی login token را با Telegram → Settings → Devices → Link Desktop Device اسکن می‌کند. 2FA در صورت نیاز بعد از Scan پرسیده می‌شود.

## حساب‌ها

حداکثر ۱۰ Session مستقل. حساب فعال برای هر Campaign دستی انتخاب می‌شود. Health Check، Disconnect و Active Account وجود دارد.

## Checker

منبع Checker باید Audience مجاز باشد. عملیات در Batch انجام می‌شود و نتیجه سه‌حالته است:
- `matched`
- `not_returned`
- `retry`

Contactهای موقت بعد از Check پاک می‌شوند. `not_returned` به دلیل Privacy قطعی نیست.

## Campaign

Promotional: فقط `optin`.
Service: `optin` یا `existing_chat`.

کنترل‌ها: Dry Run، cap، delay، duplicate guard، progress، manual stop و stop-on-FloodWait/restriction.

از Multi-account rotation برای دورزدن محدودیت استفاده نمی‌شود.

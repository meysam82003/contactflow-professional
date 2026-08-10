# آموزش Deploy نسخه Professional

## معماری پیشنهادی

`Browser/PWA/Windows APK → HTTPS → ContactFlow Gateway → SQLite encrypted blobs / Telegram Bot API`

خود شماره‌ها در زمان Sync قبل از ارسال در Client با AES-GCM رمز می‌شوند. Gateway محتوای plaintext مخاطبین را دریافت نمی‌کند.

## روش 1 — VPS + Node + Caddy

نیاز Server: Node.js 22+ و یک Reverse Proxy دارای HTTPS.

1. کل پوشه پروژه را روی Server، مثلاً در `/opt/contactflow` قرار دهید.
2. فایل `server/.env.example` را به `server/.env` کپی کنید.
3. حداقل این موارد را تنظیم کنید:

```env
HOST=127.0.0.1
PORT=8787
DATA_DIR=/opt/contactflow/server/data
PUBLIC_DIR=/opt/contactflow
SESSION_DAYS=30
CORS_ORIGIN=https://contactflow.example.com
TELEGRAM_BOT_TOKEN=توکن_بات_در_صورت_نیاز
```

4. اجرا برای تست:

```bash
cd /opt/contactflow
node server/server.js
```

5. فایل `deploy/contactflow.service` نمونه systemd است.
6. فایل `deploy/Caddyfile` را با دامنه واقعی خود تغییر دهید و HTTPS را فعال کنید.

پس از Deploy، خود سایت و API از یک دامنه قابل استفاده‌اند. در صفحه «حساب و Sync»، همان دامنه HTTPS را به‌عنوان Cloud URL وارد کنید.

## روش 2 — Docker

از `Dockerfile` و `docker-compose.yml` استفاده کنید. Volume `server-data` را حذف نکنید؛ دیتابیس حساب‌ها، Snapshotها و وضعیت Telegram آنجا قرار می‌گیرد.

## Telegram

1. Bot شخصی خود را بسازید.
2. Token را فقط در Environment Server قرار دهید.
3. Server را Restart کنید.
4. در ContactFlow → تلگرام → «Sync کاربران Bot» را بزنید.
5. کاربری فقط وقتی opt-in می‌شود که خودش در چت خصوصی Bot دستور `/start` یا `/subscribe` ارسال کند.
6. `/stop` و `/unsubscribe` کاربر را از لیست کمپین خارج می‌کنند.

## Backup Server

علاوه بر Backup رمزگذاری‌شده داخل خود ContactFlow، از پوشه `server/data` یا Docker Volume نیز Backup بگیرید. داده Snapshot مخاطبین در این دیتابیس Ciphertext هستند، اما اطلاعات حساب و وضعیت کمپین Server-side است و باید محافظت شود.

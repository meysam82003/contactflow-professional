# Deploy ContactFlow Professional 1.1

## نیازمندی Server
- Node.js 22.5+
- دیسک Persistent برای `DATA_DIR`
- HTTPS در Reverse Proxy
- متغیر `CONTACTFLOW_SERVER_SECRET` با مقدار تصادفی قوی
- برای PWA و API روی یک دامنه، `PUBLIC_DIR=..` و همان Origin توصیه می‌شود.

نمونه:
```bash
cd server
export HOST=127.0.0.1
export PORT=8787
export DATA_DIR=/srv/contactflow-data
export PUBLIC_DIR=..
export CONTACTFLOW_SERVER_SECRET='LONG_RANDOM_SECRET'
node server.js
```

Nginx/Caddy باید HTTPS را terminate کند و درخواست‌ها را به 127.0.0.1:8787 بفرستد.

## حساب چنددستگاهی
ثبت‌نام یک Vault Key تصادفی می‌سازد. همان Vault با Password و Recovery Code جداگانه Wrap می‌شود. Snapshotها و Cloud Files قبل از ارسال در Client با AES-GCM رمزگذاری می‌شوند.

## Cloud Files
فایل‌های Import و خروجی‌های VCF/CSV وقتی کاربر Login است به‌صورت 4MiB chunk رمزگذاری و آرشیو می‌شوند. سقف فعلی هر فایل 1GiB است.

## Telegram
در پنل فقط Bot Token، Admin numeric ID، Mini App URL و Required Chats وارد می‌شود. Bot Token در Server با Server Secret رمزگذاری می‌شود و به Client برگردانده نمی‌شود.

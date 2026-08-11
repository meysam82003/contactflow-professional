# معماری ContactFlow Personal Ultimate 3.0

## هدف معماری

نسخه 3.0 از معماری حساب/سرور نسخه‌های قدیمی فاصله گرفته و به مدل **Local‑First / Accountless** تبدیل شده است.

```text
UI
│
├── Contact / Import / Export Engine
├── Generator
├── Audience / Suppression
├── Campaign Drafts
├── Ad Requests
├── Backup Engine
└── Native Connector Contract
        ├── Windows
        ├── Android
        ├── Linux
        └── macOS
```

## Web Core مشترک

همه Buildها از یک Web Core استفاده می‌کنند:

```text
index.html
app.js
ultimate.js
config.js
styles.css
manifest.webmanifest
sw.js
```

مزیت این طراحی این است که منطق Import/Export/Generator/Backup بین PWA، Windows و Android از هم جدا نمی‌شود.

## IndexedDB

DB فعلی:

```text
contactflow_pwa_v2
DB_VERSION = 3
```

Storeهای اصلی:

```text
contacts
imports
meta
settings
artifacts
contact_flags
campaigns
ad_requests
telegram_accounts
templates
activity
```

### contacts
کلید اصلی: `phone`

Indexها:
- city
- section
- name
- createdAt

### contact_flags
کلید اصلی: `phone`

وضعیت‌ها:
- optin
- existing_chat
- suppressed
- unverified

### campaigns
Draftهای Campaign Composer را نگه می‌دارد.

### telegram_accounts
فقط Metadata غیرحساس حساب Native را می‌تواند نگه دارد. Authorization/session واقعی Telegram نباید داخل IndexedDB عمومی ذخیره شود.

## Desktop Shell

Desktop با Go ساخته می‌شود و Web Core را Embed می‌کند.

در 3.0 از Port ثابت استفاده نمی‌شود. Shell روی:

```text
127.0.0.1:0
```

Listen می‌کند تا OS یک پورت آزاد انتخاب کند؛ سپس همان URL را در App Mode مرورگر باز می‌کند.

این تغییر جلوی بازشدن UI نسخه قدیمی روی Port ثابت `17654` را می‌گیرد.

### Native endpoints

Desktop Shell می‌تواند APIهای محلی زیر را ارائه دهد:

```text
/health
/native/capabilities
/native/telegram/qr
```

تا زمانی که TDLib Native Connector به Build متصل نشده باشد، endpoint QR باید خطای `not_configured` بدهد؛ نه QR ساختگی.

## Android Shell

Android باید Web Core را از Assets داخلی باز کند و دیگر Server URL درخواست نکند.

Bridgeهای بومی:

```text
nativeCapabilities()
saveDocument(name, mime, base64)
startTelegramQr()      # فقط وقتی Connector واقعی نصب باشد
```

برای Alpha بدون TDLib، `startTelegramQr()` باید نتیجه `not_configured` بدهد.

## PWA

PWA هسته Local را مستقیم اجرا می‌کند. Service Worker فقط Assetهای Local را Cache می‌کند.

PWA نباید Telegram Session را نگه دارد. صفحه Telegram در PWA نقش UI/آماده‌سازی دارد و عملیات حساس Native است.

## Backup

Backup شیء JSON نسخه‌دار است:

```json
{
  "format": "ContactFlowBackup",
  "version": 3,
  "appVersion": "3.0.0",
  "createdAt": "...",
  "stores": {}
}
```

فرمت فایل:

```text
*.cfbackup
```

## Google Drive

دو مسیر وجود دارد:

### Android
System File Picker؛ Google Drive می‌تواند Provider مقصد باشد.

### PWA/Desktop
Google Identity Services + OAuth Token + Drive API با Scope محدود `drive.file`.

Credential Google در `config.js` به‌صورت Build/Deployment configuration تنظیم می‌شود.

## Telegram QR Contract

Web Core هیچ `api_id` یا `api_hash` از کاربر نمی‌گیرد.

Native Connector باید:
1. Credential برنامه را از Build امن دریافت کند.
2. TDLib Client را Initialize کند.
3. QR authentication را درخواست کند.
4. QR واقعی/اسکن‌پذیر را به UI تحویل دهد.
5. Session را در Storage خصوصی سیستم‌عامل نگه دارد.
6. وضعیت حساب را بدون افشای Secret به Web Core برگرداند.

## Campaign Safety Boundary

Campaign Composer به‌تنهایی Sender نیست. Audience مجاز توسط `contact_flags` تعیین می‌شود و `suppressed` باید همیشه از Queue حذف شود.

Build رسمی پروژه شامل Discovery شماره‌های تصادفی یا Cold-DM خودکار به غریبه‌ها نیست.

## Build pipeline

GitHub Actions:

```text
Root Web Core
      │
      ├── sync → desktop/webapp
      ├── sync → android/assets
      ├── package → PWA.zip
      └── git archive → Source.zip
```

Workflow باید قبل از Release وجود Auth قدیمی و Server URL قدیمی را Fail کند.

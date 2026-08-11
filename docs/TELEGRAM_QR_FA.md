# راهنمای Telegram QR Connector در ContactFlow 3.0

## هدف

کاربر نهایی نباید `api_id` یا `api_hash` را در فرم ContactFlow وارد کند. تجربه کاربر باید فقط این باشد:

```text
ContactFlow → Telegram → اتصال با QR
                       ↓
               QR واقعی Telegram
                       ↓
Telegram رسمی → Settings → Devices → Scan QR
```

## چرا Credential برنامه هنوز لازم است؟

Telegram برای Clientهای شخص ثالث `api_id` و `api_hash` برنامه را لازم می‌داند. این Credential مربوط به **برنامه** است، نه حساب کاربر، بنابراین باید هنگام Build Native تنظیم شود و در UI نمایش داده نشود.

منبع رسمی:
- https://core.telegram.org/api/obtaining_api_id

## QR Login رسمی

Telegram QR Login از Login Token استفاده می‌کند. جریان اصلی:

1. Client جدید Login Token صادر می‌کند.
2. Token به `tg://login?token=...` تبدیل می‌شود.
3. QR از این URI ساخته می‌شود.
4. کاربر QR را با Telegram رسمی روی دستگاهی که قبلاً Login است اسکن می‌کند.
5. Telegram رسمی Token را Accept می‌کند.
6. Client جدید Authorization را تکمیل می‌کند.

منبع رسمی:
- https://core.telegram.org/api/qr-login

## TDLib

برای Native Connector پیشنهاد اصلی پروژه TDLib است.

APIهای مرتبط TDLib:
- `requestQrCodeAuthentication`
- `authorizationStateWaitOtherDeviceConfirmation`

منابع رسمی:
- https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1request_qr_code_authentication.html
- https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1authorization_state_wait_other_device_confirmation.html

## Contract بین Web Core و Native

### قابلیت‌ها

Web Core می‌پرسد:

```json
{
  "telegramQr": true,
  "filePicker": true,
  "platform": "windows",
  "version": "3.0.0"
}
```

اگر Connector نصب/تنظیم نشده باشد:

```json
{
  "telegramQr": false,
  "reason": "not_configured"
}
```

### شروع QR

Native باید نتیجه واقعی برگرداند؛ ترجیحاً QR آماده نمایش:

```json
{
  "ok": true,
  "qrDataUrl": "data:image/png;base64,...",
  "expiresAt": 0
}
```

یا SVG:

```json
{
  "ok": true,
  "qrSvg": "<svg>...</svg>",
  "expiresAt": 0
}
```

Web Core نباید از یک Hash تصادفی QR جعلی بسازد.

## Refresh QR

Login Token معمولاً عمر کوتاه دارد. Native Connector باید هنگام انقضا QR جدید تولید و UI را Refresh کند.

## 2FA

اگر حساب Telegram رمز دومرحله‌ای داشته باشد، State مربوط به Password باید توسط Native Connector مدیریت شود. این بخش Credential برنامه را تغییر نمی‌دهد.

## Session Storage

Session باید در Storage خصوصی دستگاه نگه‌داری شود:

- Windows: AppData خصوصی برنامه
- Android: internal app storage
- macOS: Application Support
- Linux: user data directory با Permission محدود

Session نباید داخل `localStorage` یا IndexedDB عمومی Web Core قرار گیرد.

## GitHub Secrets پیشنهادی

```text
TELEGRAM_API_ID
TELEGRAM_API_HASH
```

این Secrets نباید در Artifactهای متنی، README یا JavaScript عمومی چاپ شوند.

## وضعیت Alpha 3.0

Web Core، UI و Contract آماده‌اند. Build Native باید فقط وقتی `telegramQr=true` گزارش دهد که TDLib واقعاً Initialize شده و Credential معتبر دارد.

اگر این شرط برقرار نباشد، UI باید «QR Setup» نشان دهد و هیچ QR ساختگی ارائه نکند.

## محدودیت استفاده

اتصال حساب Telegram به ContactFlow مجوز ارسال ناخواسته به دیگران ایجاد نمی‌کند. Campaign رسمی پروژه باید Audience مجاز/Existing Chat را رعایت کند و `Suppressed` را حذف کند.

منابع سیاست رسمی:
- https://telegram.org/faq_spam
- https://core.telegram.org/api/terms

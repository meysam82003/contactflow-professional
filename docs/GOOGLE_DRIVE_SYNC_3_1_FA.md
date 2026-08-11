# Google Drive Sync 2.0

## PWA / Windows

Google Identity Services token model + Drive REST API.

- Hidden sync: `appDataFolder`
- Manual visible backup: `drive.file`
- SHA-256 metadata
- Conflict detection
- Auto sync هر ۱۵ دقیقه فقط تا زمانی که Access Token معتبر است.

Google در pure browser refresh token دائمی نمی‌دهد؛ بعد از انقضای Access Token ممکن است اتصال مجدد با کلیک کاربر لازم شود.

برای Windows Origin پیش‌فرض `http://localhost:17655` را در Google OAuth Client اضافه کنید.

## Android

به جای OAuth در WebView، `ACTION_CREATE_DOCUMENT` و `ACTION_OPEN_DOCUMENT` استفاده می‌شود. کاربر می‌تواند Google Drive را از Providerهای Android انتخاب کند.

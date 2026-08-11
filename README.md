# ContactFlow Personal Ultimate 3.1

Local-first contact management, bulk import/export, Iranian number generator, consent-aware audiences, Telegram QR user-account connector, campaign composer, Google Drive backup/sync, and Telegram Mini App.

Version: `3.1.0-alpha.1`

## Architecture

There is no ContactFlow login/register/forgot-password/server-account layer. Core data stays in the local IndexedDB database. Optional backup paths are `.cfbackup`, Google Drive, and Android's system document picker.

Telegram user accounts are connected by QR through the Web-MTProto connector. Up to 10 independent sessions can be stored per device, with manual sender selection. The application does not rotate accounts to bypass Telegram rate limits.

Promotional private messaging is restricted to explicit opt-in recipients. Existing chats may be used for service/non-promotional messaging. The authorized phone checker reports `matched`, `not_returned`, and `retry`; `not_returned` is not proof that a number has no Telegram account.

See the full Persian documentation in [README_FA.md](README_FA.md) and `docs/`.

## Build-time configuration

GitHub Actions secrets/variables:
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `GOOGLE_CLIENT_ID`
- optional `MINIAPP_URL`
- optional `TELEGRAM_BOT_USERNAME`

Telegram API credentials belong to this app and are never requested from end users in the UI.

## Main components

- `enhancements/` — Web-MTProto, Drive Sync, runtime feature layer
- `telegram-miniapp/` — cPanel PHP Bot/Mini App package
- `desktop/` — Windows/Linux/macOS shell
- `android/` — Android shell
- `scripts/apply-v31.mjs` — build augmentation
- `.source-bundles/v3/` — canonical 3.0 web core
- `.source-bundles/v31/` — canonical 3.1 augmentation bundle

## Release

Run **Release All Devices — Personal Ultimate 3.1** in GitHub Actions. It validates and publishes Windows Setup/Portable, Android APK, Linux, macOS, PWA, Mini App cPanel package, source, release info, and SHA256 checksums.

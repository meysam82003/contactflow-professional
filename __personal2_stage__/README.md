# ContactFlow Personal 2.0

ContactFlow Personal 2.0 is the local-first edition of ContactFlow.

The account backend from 1.x is intentionally removed: there is no ContactFlow login, registration, password recovery, session service, server URL, PHP account API, or MySQL user database.

## Active architecture

- `web/` — PWA / cPanel static hosting / Telegram Mini App
- `desktop/` — local UI shell for Windows, Linux and macOS
- `android/` — Android WebView shell using the system Storage Access Framework
- `docs/` — setup notes
- `.github/workflows/` — validation and builds

## Backup

Manual `.cfbackup` export/restore is the portable data format. Optional AES-GCM encryption is supported. Web/Desktop can connect directly to Google Drive with OAuth `drive.file`; Android can save to a Google Drive provider through the system document picker.

## Important

The local desktop HTTP listener on `127.0.0.1:17654` serves only embedded UI files. It is not a remote API or account/sync server.

See `README_FA.md` for Persian documentation.

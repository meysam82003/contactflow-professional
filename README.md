# ContactFlow Personal Ultimate 3.4

ContactFlow is a local-first contact workspace with one shared web core for Telegram Mini App, PWA, Android, Windows, Linux and macOS.

Version 3.4 adds a shared smart import/merge engine: concurrent CSV/TSV/TXT/VCF/JSON/XLS/XLSX/ZIP input (including binary OLE/BIFF XLS), filename-to-Persian city inference, phonetic Persian fallback, E.164/country/landline-area validation, dry-run comparison, per-conflict old/new/smart decisions, per-file reports and undo, last-merge rollback, source search, city charts, new-only export and Excel/print-to-PDF reports. Android adds explicit-permission address-book import and on-device business-card OCR. Supported browsers expose user-selected Contact Picker and foreground Watch Folder workflows.

The official Telegram User API workspace from 3.3 remains part of the shared core. Version 3.4 can check a capped batch of locally held mobile numbers through the authenticated user session, clean up temporary imports, persist `matched / not_returned / retry` status, filter it and export separate result files. `not_returned` is privacy-sensitive and is not proof that a number has no Telegram account.

Telegram Bot API and `Telegram.WebApp` do not expose the current account's full address book. The feature therefore requires an official Telegram API ID/hash supplied by the build or stored locally by the user, plus a separate QR login. The Telegram app's internal session is never accessed.

## Source layout

- `web/` — canonical shared UI and contact engine
- `enhancements/telegram-web-entry.js` — MTProto user-session connector
- `desktop/` — Go desktop shell
- `android/` — Android WebView shell
- `telegram-miniapp/` — optional Bot/Business gateway
- `.github/workflows/release-all.yml` — all-device build and v3.4 release

## Verification

```bash
node --test tests/*.test.cjs
node scripts/verify-v34.mjs
```

See [Telegram contact export architecture](docs/TELEGRAM_CONTACT_EXPORT_3_3_FA.md) and the [3.4 feature and platform-boundary list](docs/FEATURES_3_4_FA.md).

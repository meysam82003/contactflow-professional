# ContactFlow Personal Ultimate 3.3

ContactFlow is a local-first contact workspace with one shared web core for Telegram Mini App, PWA, Android, Windows, Linux and macOS.

Version 3.3 adds an official Telegram User API contact workspace. After an independent QR-authenticated user session, it calls `contacts.getContacts`, keeps an offline snapshot on the current origin, and exports all filtered contacts or a selection as CSV, VCF, TXT, JSON or Excel-compatible XLS. Field selection, sorting, mutual-contact filters, chunking, ZIP packages, saved export profiles, safe local import and scoped undo are included.

Telegram Bot API and `Telegram.WebApp` do not expose the current account's full address book. The feature therefore requires an official Telegram API ID/hash supplied by the build or stored locally by the user, plus a separate QR login. The Telegram app's internal session is never accessed.

## Source layout

- `web/` — canonical shared UI and contact engine
- `enhancements/telegram-web-entry.js` — MTProto user-session connector
- `desktop/` — Go desktop shell
- `android/` — Android WebView shell
- `telegram-miniapp/` — optional Bot/Business gateway
- `.github/workflows/release-all.yml` — all-device build and v3.3 release

## Verification

```bash
node --test tests/*.test.cjs
node scripts/verify-v33.mjs
```

See [Telegram contact export architecture](docs/TELEGRAM_CONTACT_EXPORT_3_3_FA.md) and the [3.3 feature list](docs/FEATURES_3_3_FA.md).

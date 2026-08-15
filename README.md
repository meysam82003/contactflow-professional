# ContactFlow Personal Ultimate 3.5

ContactFlow is a local-first contact workspace with one shared web core for Telegram Mini App, PWA, Android, Windows, Linux and macOS.

Version 3.5 preserves the complete 3.4 smart import/merge engine and adds offline city/province inference from Persian, English and Finglish text, original mobile-prefix operator detection, a persisted automatic/fixed source policy, province/operator contact search, and a consent-aware handoff center for Telegram, WhatsApp, Rubika, Bale and Soroush Plus. It exports approved queues and VCF contacts and uses official share/click-to-chat flows where available; it does not access another app's private session or bypass anti-spam controls.

The official Telegram User API workspace from 3.3 remains part of the shared core. Version 3.4 can check a capped batch of locally held mobile numbers through the authenticated user session, clean up temporary imports, persist `matched / not_returned / retry` status, filter it and export separate result files. `not_returned` is privacy-sensitive and is not proof that a number has no Telegram account.

Telegram Bot API and `Telegram.WebApp` do not expose the current account's full address book. The feature therefore requires an official Telegram API ID/hash supplied by the build or stored locally by the user, plus a separate QR login. The Telegram app's internal session is never accessed.

## Source layout

- `web/` — canonical shared UI and contact engine
- `enhancements/telegram-web-entry.js` — MTProto user-session connector
- `desktop/` — Go desktop shell
- `android/` — Android WebView shell
- `telegram-miniapp/` — optional Bot/Business gateway
- `.github/workflows/release-all.yml` — all-device build and v3.5 release

## Verification

```bash
node --test tests/*.test.cjs
node scripts/verify-v35.mjs
```

See [Telegram contact export architecture](docs/TELEGRAM_CONTACT_EXPORT_3_3_FA.md), the [3.4 feature list](docs/FEATURES_3_4_FA.md), and the [3.5 location/operator/channel list](docs/FEATURES_3_5_FA.md).

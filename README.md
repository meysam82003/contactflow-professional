# ContactFlow Personal Ultimate 3.6

The `v3.6.0` release also ships three source-auditable essential binaries: native Windows and Android sequential file renamers plus an offline Android messenger-contact inspector. See [`extensions/README_FA.md`](extensions/README_FA.md).

ContactFlow is a local-first contact workspace with one shared web core for Telegram Mini App, PWA, Android, Windows, Linux and macOS. The million-contact exporter is intentionally shipped only in the PWA and installed apps, not in the Mini App.

Version 3.6 makes Smart Import atomic by default: analyze, merge, commit and database verification happen from one action, while preview-only remains optional. It adds an exact batch name engine, an API-free Telegram Desktop export reader, native Save As where the platform supports it, a live city-intelligence dashboard, and an offline Legacy V14 toolbox for TXT/CSV/VCF/JSON/Excel conversion, deduplication, chunked VCF, prefix conversion, Hex/Unicode and image Base64.

Telegram no longer requires an API ID/hash for the primary contact workflow. Export contacts from Telegram Desktop as `result.json`, HTML or VCF, then open that file in ContactFlow to view, search, import or save CSV/VCF locally. A Mini App cannot silently read the current account's private contact list; the file picker keeps the action explicit and auditable.

The installed-app Export Center now processes up to 1,000,000 contacts through IndexedDB cursors and bounded VCF chunks. It supports an offline-first engine with the existing browser-compatible fallback (neither path uploads contacts), per-city files, a shared Persian/English filename suffix, persistent preferences, progress and safe cancellation. A name such as `تهران ایرانسل_0001.vcf` keeps both readable spaces and its numeric part.

## Source layout

- `web/` — canonical shared UI and contact engine
- `enhancements/telegram-web-entry.js` — MTProto user-session connector
- `desktop/` — Go desktop shell
- `android/` — Android WebView shell
- `telegram-miniapp/` — optional Bot/Business gateway
- `.github/workflows/release-all.yml` — all-device build and v3.6 release

## Verification

```bash
node --test tests/*.test.cjs
node scripts/verify-v36.mjs
node scripts/stress-bulk-vcf.mjs
```

See the [3.4 import list](docs/FEATURES_3_4_FA.md), [3.5 location/operator/channel list](docs/FEATURES_3_5_FA.md), and [3.6 release contract](docs/FEATURES_3_6_FA.md).

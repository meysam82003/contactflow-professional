# Security Policy — ContactFlow Personal Ultimate 3.6

## Supported branch

The active architecture is ContactFlow Personal Ultimate 3.x on `main`. Professional 1.x account/server code is legacy and should not be used for new deployments.

## Local-first data

Contact data is intended to remain local to the user's device unless the user explicitly exports or backs it up.

- No ContactFlow username/password account is required.
- No central ContactFlow account server is required.
- `.cfbackup` files may contain sensitive contact and campaign data; store them securely.

## Telegram contact export

The primary v3.6 Telegram workflow does not require or store an `api_id`, `api_hash`, QR login or user session. It parses a user-selected official Telegram Desktop `result.json`, HTML or VCF export locally. Treat that export as sensitive personal data and remove unneeded copies after use.

## Device contacts and imported files

- Android requests `READ_CONTACTS` only after the user presses the address-book button. Denying it must leave the rest of the app usable.
- Browser Contact Picker results are user-selected and permission is not treated as persistent.
- Watch Folder requires an explicit directory picker and runs only while the app is open.
- Business-card OCR is local/capability-gated; imported images and extracted text can contain sensitive personal data.
- ZIP inputs are bounded by entry count, expanded size and compression ratio. Binary XLS/XLSX fallback uses the pinned SheetJS CE parser; row and input-size limits still apply before merge.

The Mini App must never claim that Bot API or `Telegram.WebApp` can silently read the account address book. File access must remain explicit and user initiated.

## Google Drive

For direct Drive OAuth, use your own official Google OAuth Client ID. Use the least-privilege `drive.file` scope for files created/opened by ContactFlow.

Do not commit OAuth client secrets to browser JavaScript. A browser OAuth Client ID is configuration, not a secret, but server/client secrets must remain protected.

## Content security

- Avoid loading untrusted HTML into the app UI.
- Treat imported spreadsheet/CSV values as data, not markup.
- Keep exported backups outside public web roots unless intentionally shared.
- Keep Android/WebView external navigation separated from local app assets.

## Telegram abuse boundary

The official ContactFlow build is not intended for random-number Telegram account discovery, unsolicited cold-DM automation, account rotation to evade Telegram limits, or anti-spam/ban evasion.

Audience states such as Opt-in, Existing Chat and Suppressed must be respected by any native sender implementation.

The contact-export workspace reads only files explicitly selected by the user. It must not be changed into bulk phone-number discovery, unsolicited messaging, or a mechanism to evade platform limits.

## Reporting a security issue

Do not publish tokens, sessions, recovery material, personal contact lists, or credentials in a public GitHub issue. Use a private repository channel or GitHub private vulnerability reporting when enabled.

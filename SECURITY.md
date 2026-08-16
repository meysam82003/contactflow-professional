# Security Policy — ContactFlow Personal Ultimate 3.5

## Supported branch

The active architecture is ContactFlow Personal Ultimate 3.x on `main`. Professional 1.x account/server code is legacy and should not be used for new deployments.

## Local-first data

Contact data is intended to remain local to the user's device unless the user explicitly exports or backs it up.

- No ContactFlow username/password account is required.
- No central ContactFlow account server is required.
- `.cfbackup` files may contain sensitive contact and campaign data; store them securely.

## Telegram User API credentials

Telegram `api_id` and `api_hash` are application credentials required by the official User API. Never commit private production credentials to the public repository. A private deployment can inject its own credentials at build time through protected configuration such as:

```text
TELEGRAM_API_ID
TELEGRAM_API_HASH
```

A public build can instead let a user enter credentials created for that user at `my.telegram.org/apps`. ContactFlow stores that choice only in browser storage for the current origin. Because every script running on an origin can access its storage, only install or open the Mini App from an HTTPS origin you control and trust.

Do not inject Telegram API credentials into a public GitHub Release: browser artifacts expose embedded configuration. The official public `v3.5.0` workflow intentionally leaves the Telegram credential pair empty and uses the per-device setup path.

## Device contacts and imported files

- Android requests `READ_CONTACTS` only after the user presses the address-book button. Denying it must leave the rest of the app usable.
- Browser Contact Picker results are user-selected and permission is not treated as persistent.
- Watch Folder requires an explicit directory picker and runs only while the app is open.
- Business-card OCR is local/capability-gated; imported images and extracted text can contain sensitive personal data.
- ZIP inputs are bounded by entry count, expanded size and compression ratio. Binary XLS/XLSX fallback uses the pinned SheetJS CE parser; row and input-size limits still apply before merge.

A real connector must use Telegram's official authorization flow. A build without credentials must report `not configured`; it must never display a fake QR code or claim that Bot API can read the account address book.

User sessions are encrypted at rest with a non-extractable WebCrypto key stored by the same origin. This is defense in depth, not protection from malicious JavaScript already executing on that origin. Telegram session data and Telegram contact snapshots are kept in a separate IndexedDB database and are intentionally excluded from normal `.cfbackup` files.

Use Telegram Settings → Devices to revoke a session if a device or deployment may be compromised.

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

The contact-export workspace reads only the authenticated user's existing Telegram contacts through `contacts.getContacts`. It must not be changed into bulk phone-number discovery, unsolicited messaging, or a mechanism to evade Telegram limits.

## Reporting a security issue

Do not publish tokens, sessions, recovery material, personal contact lists, or credentials in a public GitHub issue. Use a private repository channel or GitHub private vulnerability reporting when enabled.

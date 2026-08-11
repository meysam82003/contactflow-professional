# Security Policy — ContactFlow Personal Ultimate 3.0

## Supported branch

The active architecture is ContactFlow Personal Ultimate 3.x on `main`. Professional 1.x account/server code is legacy and should not be used for new deployments.

## Local-first data

Contact data is intended to remain local to the user's device unless the user explicitly exports or backs it up.

- No ContactFlow username/password account is required.
- No central ContactFlow account server is required.
- `.cfbackup` files may contain sensitive contact and campaign data; store them securely.

## Telegram credentials

Telegram `api_id` and `api_hash` are application credentials. They must not be requested from the end user by the ContactFlow UI and must not be committed to public JavaScript.

For native builds use protected build configuration / GitHub Secrets such as:

```text
TELEGRAM_API_ID
TELEGRAM_API_HASH
```

A real Telegram QR connector must use the official Telegram authorization flow. A build without configured TDLib/application credentials must report `not_configured`; it must not display a fake QR code.

Telegram authorization/session data must be kept in native private application storage and must not be copied into normal PWA IndexedDB backups.

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

## Reporting a security issue

Do not publish tokens, sessions, recovery material, personal contact lists, or credentials in a public GitHub issue. Use a private repository channel or GitHub private vulnerability reporting when enabled.

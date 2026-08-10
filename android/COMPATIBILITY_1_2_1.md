# Android compatibility — ContactFlow 1.2.1

- minSdk: 21 (Android 5.0+)
- targetSdk: 36
- AndroidX WebKit: 1.14.0
- Android 10+ exports use MediaStore Downloads.
- Android 5–9 exports use the app-specific Downloads directory to avoid legacy storage permission failures.

PWA ZIP files are not intended to be opened directly with `content://` or `file://`; installable PWA mode requires HTTPS or localhost.

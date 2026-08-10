# Build Notes — Professional 1.0

- Frontend JS syntax: checked with Node.
- Server JS syntax: checked with Node.
- Frontend/Server E2E auth + snapshot API: tested locally.
- All JS `$(id)` references validated against HTML IDs.
- Service Worker asset list validated.
- Windows binaries cross-compiled with Go for windows/amd64 and verified as PE32+ GUI executables.
- Android source created for AGP 9.4.0 / Gradle 9.6.0 / JDK 17 target workflow. Actual APK is not compiled in this environment because Android SDK binaries could not be downloaded into the runtime.

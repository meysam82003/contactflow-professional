#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

node --check app.js
node --check ultimate.js

grep -q 'ContactFlow' index.html
grep -q 'Personal Ultimate 3.0' index.html

for page in generator import contacts exports audience telegram campaign requests backup activity; do
  grep -q "data-page=\"$page\"" index.html
  echo "page:$page PASS"
done

if grep -ERn 'auth-gate|auth-login|auth-register|Forgot Password|Server URL|127\.0\.0\.1:17654|pseudoQR' \
  index.html app.js ultimate.js config.js sw.js desktop/webapp android/app/src/main/assets; then
  echo 'ERROR: legacy account/server/fake QR marker found.' >&2
  exit 1
fi

grep -q "3.0.0-alpha.1" desktop/main.go
grep -q "APP_URL = \"file:///android_asset/index.html\"" android/app/src/main/java/com/contactflow/pro/MainActivity.java
! grep -q 'EditText' android/app/src/main/java/com/contactflow/pro/MainActivity.java

echo 'ContactFlow Personal Ultimate 3.0 verification PASS'

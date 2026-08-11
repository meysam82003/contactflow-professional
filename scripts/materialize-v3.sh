#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cd "$ROOT"

cat .source-bundles/v3/web3.part* | base64 -d > "$TMP/web3.tgz"
tar -xzf "$TMP/web3.tgz" -C "$TMP"

node --check "$TMP/app.js"
node --check "$TMP/ultimate.js"
grep -q 'Personal Ultimate 3.0' "$TMP/index.html"

if grep -ERn 'auth-gate|auth-login|auth-register|Forgot Password|Server URL|127\.0\.0\.1:17654|pseudoQR' \
  "$TMP/index.html" "$TMP/app.js" "$TMP/ultimate.js" "$TMP/config.js" "$TMP/sw.js"; then
  echo 'ERROR: legacy account/server/fake QR marker found in canonical source.' >&2
  exit 1
fi

cp "$TMP/index.html" index.html
cp "$TMP/app.js" app.js
cp "$TMP/ultimate.js" ultimate.js
cp "$TMP/config.js" config.js
cp "$TMP/styles.css" styles.css
cp "$TMP/manifest.webmanifest" manifest.webmanifest
cp "$TMP/sw.js" sw.js
rm -rf icons
cp -R "$TMP/icons" icons

rm -f pro.js localplus.js localplus.css

rm -rf desktop/webapp
mkdir -p desktop/webapp
cp index.html app.js ultimate.js config.js styles.css manifest.webmanifest sw.js desktop/webapp/
cp -R icons desktop/webapp/icons

rm -rf android/app/src/main/assets
mkdir -p android/app/src/main/assets
cp index.html app.js ultimate.js config.js styles.css manifest.webmanifest sw.js android/app/src/main/assets/
cp -R icons android/app/src/main/assets/icons

echo 'ContactFlow Personal Ultimate 3.0 canonical source materialized successfully.'

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FILES=(index.html app.js pro.js config.js styles.css manifest.webmanifest sw.js)
rm -rf desktop/webapp android/app/src/main/assets
mkdir -p desktop/webapp/icons android/app/src/main/assets/icons
cp "${FILES[@]}" desktop/webapp/
cp "${FILES[@]}" android/app/src/main/assets/
cp -r icons/. desktop/webapp/icons/
cp -r icons/. android/app/src/main/assets/icons/
echo "PWA assets synced to Desktop and Android."

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
test -s enhancements/dist/telegram-web.bundle.js || npm --prefix enhancements run build
for target in desktop/webapp android/app/src/main/assets; do
  mkdir -p "$target"
  cp -R web/. "$target/"
  cp enhancements/dist/telegram-web.bundle.js "$target/"
done
echo "ContactFlow 3.4 shared web core synced to Desktop and Android."

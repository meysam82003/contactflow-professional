#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/scripts/sync-assets.sh"
mkdir -p "$ROOT/dist"
cd "$ROOT/desktop"
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -trimpath -ldflags='-s -w -H=windowsgui' -o "$ROOT/dist/ContactFlow_Professional_1.2_Windows_Portable.exe" .
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags='-s -w' -o "$ROOT/dist/ContactFlow_Professional_1.2_Linux_x64" .
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -trimpath -ldflags='-s -w' -o "$ROOT/dist/ContactFlow_Professional_1.2_macOS_Intel" .
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -trimpath -ldflags='-s -w' -o "$ROOT/dist/ContactFlow_Professional_1.2_macOS_AppleSilicon" .
mkdir -p installer/payload
cp "$ROOT/dist/ContactFlow_Professional_1.2_Windows_Portable.exe" installer/payload/ContactFlow.exe
cd installer
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -trimpath -ldflags='-s -w -H=windowsgui' -o "$ROOT/dist/ContactFlow_Professional_1.2_Windows_Setup.exe" .
echo "Desktop builds written to dist/."

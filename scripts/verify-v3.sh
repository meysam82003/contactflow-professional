#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
npm test
npm run verify
node --check web/app.js
node --check web/ultimate.js
node --check web/contact-export.js
node --check web/runtime-patch.js
node --check web/v33.js
echo "ContactFlow Personal Ultimate 3.3 verification PASS"

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
node --check web/import-merge.js
node --check web/v34.js
node scripts/verify-v34.mjs
echo "ContactFlow Personal Ultimate 3.5 verification PASS"

#!/bin/sh
# Runs tests/sentinel-elements.test.html in headless Chrome and fails on any FAIL or ERROR line.
# Scroll-to-compact and back-to-top rely on animation frames, which headless Chrome does not run;
# check those in the Wix preview.
set -eu
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Chrome not found; set CHROME=/path/to/chrome" >&2; exit 2; }
OUT=$("$CHROME" --headless=new --disable-gpu --allow-file-access-from-files --window-size=1280,900 \
  --virtual-time-budget=15000 --dump-dom "file://$PWD/tests/sentinel-elements.test.html" 2>/dev/null \
  | sed -n '/<pre id="result">/,/<\/pre>/p' | sed 's/<[^>]*>//g')
echo "$OUT"
echo "$OUT" | grep -q '^DONE' || { echo "tests did not finish" >&2; exit 1; }
! echo "$OUT" | grep -qE '^(FAIL|ERROR)'

#!/usr/bin/env bash
# Lighthouse-Messung eilersfriends.com — mobil + Desktop je Seite, nacheinander.
# Nutzung: scripts/lighthouse/run.sh <ausgabe-ordner> [seite ...]
# Erwartet CHROME_PATH (Chrome/Chromium) und npx. Schreibt JSON je Lauf + summary.csv.
set -u
OUT="${1:-./lh-out}"; shift || true
BASE="${LH_BASE:-https://www.eilersfriends.com}"
PAGES=("$@")
[ ${#PAGES[@]} -eq 0 ] && PAGES=(/ /academy /mystery-shopping /checkout/mystery-shopping /frameworks /frameworks/instant-influence /gespraechs-check /blog /markus /schedule /programme /liquidleadership)
LH="${LH_BIN:-npx -y lighthouse@13}"
mkdir -p "$OUT"
[ -f "$OUT/summary.csv" ] || echo "page,form,performance,accessibility,best_practices,seo,lcp_ms,cls,tbt_ms" > "$OUT/summary.csv"
for p in "${PAGES[@]}"; do
  for form in mobile desktop; do
    slug=$(echo "$p" | sed 's#^/##; s#/#_#g'); slug=${slug:-home}
    f="$OUT/${slug}.${form}.json"
    extra=""; [ "$form" = desktop ] && extra="--preset=desktop"
    $LH "$BASE$p" $extra --quiet --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
      --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$f" >/dev/null 2>&1
    python3 - "$f" "$p" "$form" >> "$OUT/summary.csv" <<'PY'
import json,sys
f,p,form=sys.argv[1:4]
try:
  d=json.load(open(f)); c=d['categories']; a=d['audits']
  s=lambda k: '' if c[k]['score'] is None else round(c[k]['score']*100)
  n=lambda k: round(a[k].get('numericValue') or 0, 3 if k=='cumulative-layout-shift' else 0)
  print(f"{p},{form},{s('performance')},{s('accessibility')},{s('best-practices')},{s('seo')},{n('largest-contentful-paint')},{n('cumulative-layout-shift')},{n('total-blocking-time')}")
except Exception as e: print(f"{p},{form},ERR,,,,,,")
PY
  done
done

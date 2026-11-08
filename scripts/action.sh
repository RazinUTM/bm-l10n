#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia
#
# Runs bml lint for the composite action in action.yml. Inputs arrive as environment
# variables (never interpolated into the script), the report goes to the Summary page,
# FIX and WATCH findings become annotations, and FIX > 0 fails the step when asked.
set -euo pipefail

here="${GITHUB_ACTION_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
summary="${GITHUB_STEP_SUMMARY:-/dev/stdout}"
output="${GITHUB_OUTPUT:-/dev/null}"

major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$major" -lt 18 ]; then
  echo "::error title=BM lint::bm-l10n needs Node 18 or newer on the runner (found: ${major})"
  exit 2
fi

patterns="${BML_PATTERNS:-}"
[ -n "$patterns" ] || patterns="$here/termbase/patterns.csv"
args=(--call "${BML_CALL:-L}" --patterns "$patterns" --no-fail)
[ -z "${BML_TERMBASE:-}" ] || args+=(--termbase "$BML_TERMBASE")
[ -z "${BML_IGNORE:-}" ] || args+=(--ignore "$BML_IGNORE")
read -r -a files <<< "${BML_FILES:-}"
if [ "${#files[@]}" -eq 0 ]; then
  echo "::error title=BM lint::no files given (input: files)"
  exit 2
fi

tmp="${RUNNER_TEMP:-/tmp}"
node "$here/bin/bml.js" lint "${args[@]}" --format json --out "$tmp/bm-lint.json" "${files[@]}"
node "$here/bin/bml.js" lint "${args[@]}" --format md --out "$tmp/bm-lint.md" "${files[@]}"
cat "$tmp/bm-lint.md" >> "$summary"

node - "$tmp/bm-lint.json" "$output" <<'JS'
const fs = require('fs');
const [file, output] = process.argv.slice(2);
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const esc = s => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escProp = s => esc(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
for (const [level, kind] of [['FIX', 'error'], ['WATCH', 'warning']]) {
  for (const f of r.findings.filter(x => x.level === level).slice(0, 10)) {
    const line = /@(\d+)#/.exec(f.key || '');                     // inline L() calls carry their line
    const loc = f.file && f.file !== '*' && f.file !== 'termbase' ? `file=${escProp(f.file)}${line ? `,line=${line[1]}` : ''},` : '';
    console.log(`::${kind} ${loc}title=${escProp(`BM lint ${f.rule}`)}::${esc(`${f.key}: ${f.msg}${f.suggest ? ` → ${f.suggest}` : ''}`)}`);
  }
}
fs.appendFileSync(output, `fix=${r.summary.FIX}\nwatch=${r.summary.WATCH}\n`);
console.log(`BM lint: FIX ${r.summary.FIX} · WATCH ${r.summary.WATCH} · INFO ${r.summary.INFO} (${r.summary.rows} strings)`);
JS

fix="$(node -p "require('$tmp/bm-lint.json').summary.FIX")"
if [ "$fix" -gt 0 ] && [ "${BML_FAIL:-true}" = "true" ]; then
  echo "::error title=BM lint::${fix} FIX finding(s). Open the run's Summary for the report."
  exit 1
fi

#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia
//
// bml — Bahasa Melayu localisation toolkit.
//   bml lint  [options] <files...>     lint EN/MS string files
//   bml terms <termbase.csv>           show the termbase and its check status
//   bml dbp   <termbase.csv>           list PRPM URLs for unchecked entries (no fetching)
//
// Options for lint:
//   --termbase <csv>   project termbase (default: ./termbase.csv if present)
//   --patterns <csv>   calque patterns (default: ./patterns.csv if present)
//   --accept <csv>     findings the author has accepted: rule,file,match,note (default: ./bm-lint-accepted.csv if present)
//   --format md|json   report format (default md)
//   --out <file>       write the report to a file instead of stdout
//   --rules R01,R09    run only these rules
//   --ignore R11       skip these rules
//   --with R03         also run opt-in rules (R03, the length rule, is off by default)
//   --call L,LL        names of the inline bilingual helpers to extract (default L); name:k skips k
//                      leading arguments, e.g. tx:1 for tx(element, en, ms)
//   --pair-arrays      also read two-string arrays ["en text", "teks ms"] as pairs (one element must have a space)
//   --langs en,ms      language keys in the tables (default en,ms)
//   --casual           allow casual pronouns (persona voice)
//   --no-fail          exit 0 even when FIX findings exist
//   --quiet            suppress INFO in the markdown report

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { lint, toMarkdown, toJSON } from '../src/lint.js';
import { loadTermbase } from '../src/termbase.js';

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-fail') opts.noFail = true;
    else if (a === '--casual') opts.allowCasualPronouns = true;
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--pair-arrays') opts.pairArrays = true;
    else if (a.startsWith('--')) { opts[a.slice(2)] = argv[++i]; }
    else opts._.push(a);
  }
  return opts;
}

function usage(code = 0) {
  console.log('usage: bml lint [--termbase t.csv] [--patterns p.csv] [--accept a.csv] [--format md|json] [--out f] [--rules R..] [--with R03] [--ignore R..] [--call L,LL,tx:1] [--pair-arrays] [--casual] [--no-fail] <files...>\n       bml terms <termbase.csv>\n       bml dbp <termbase.csv>');
  process.exit(code);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === '-h' || cmd === '--help') usage(0);
  const o = parseArgs(rest);

  if (cmd === 'lint') {
    if (!o._.length) usage(1);
    const termbase = o.termbase || (existsSync('termbase.csv') ? 'termbase.csv' : undefined);
    const patterns = o.patterns || (existsSync('patterns.csv') ? 'patterns.csv' : undefined);
    const accept = o.accept || (existsSync('bm-lint-accepted.csv') ? 'bm-lint-accepted.csv' : undefined);
    const result = await lint(o._.map(p => resolve(p)), {
      termbase, patterns, accept,
      langs: o.langs ? o.langs.split(',') : undefined,
      callName: o.call,
      pairArrays: !!o.pairArrays,
      rules: o.rules ? o.rules.split(',') : [],
      ignore: o.ignore ? o.ignore.split(',') : [],
      with: o.with ? o.with.split(',') : [],
      allowCasualPronouns: !!o.allowCasualPronouns,
      relativeTo: process.cwd(),
    });
    const text = o.format === 'json' ? toJSON(result) : toMarkdown(result, { title: `bm-lint report — ${o._.join(', ')}`, showInfo: !o.quiet });
    if (o.out) { await writeFile(o.out, text, 'utf8'); console.error(`wrote ${o.out}  (FIX ${result.summary.FIX} · WATCH ${result.summary.WATCH} · INFO ${result.summary.INFO}${result.summary.accepted ? ` · accepted ${result.summary.accepted}` : ''})`); }
    else process.stdout.write(text + '\n');
    process.exit(result.summary.FIX && !o.noFail ? 1 : 0);
  }

  if (cmd === 'terms' || cmd === 'dbp') {
    const path = o._[0] || 'termbase.csv';
    const terms = await loadTermbase(path);
    if (cmd === 'terms') {
      console.log(`${terms.length} terms — tier1 ${terms.filter(t => t.tier === 1).length}, tier2 ${terms.filter(t => t.tier === 2).length}, tier3 ${terms.filter(t => t.tier === 3).length}; checked ${terms.filter(t => t.status === 'checked').length}, unchecked ${terms.filter(t => t.status === 'unchecked').length}`);
      for (const t of terms) console.log(`${String(t.tier).padEnd(2)} ${t.en.padEnd(26)} → ${(t.bm || t.en).padEnd(26)} ${t.status.padEnd(9)} ${t.reject.length ? 'reject: ' + t.reject.join('|') : ''}`);
      return;
    }
    const todo = terms.filter(t => t.tier !== 2 && t.status === 'unchecked' && t.bm);
    console.log(`# ${todo.length} termbase entries to check against PRPM.`);
    console.log('# Look each one up (one page at a time: PRPM rate-limits parallel fetches), then set status=checked and source=<URL>.');
    console.log('# With the prpm-dbp CLI installed:  npx prpm-dbp lookup <word>   (caches locally; keeps DBP content out of this repo)\n');
    for (const t of todo) { const w = t.bm.split('|')[0].trim(); console.log(`${t.en.padEnd(26)} ${w.padEnd(26)} https://prpm.dbp.gov.my/Cari1?keyword=${encodeURIComponent(w.split(' ')[0])}`); }
    return;
  }
  usage(1);
}

main().catch(e => { console.error(`bml: ${e.message}`); process.exit(2); });

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia

import { loadFiles } from './load.js';
import { loadTermbase, loadPatterns, loadAccepted } from './termbase.js';
import { RULES, RULE_DOC, OPT_IN } from './rules.js';

const LEVEL_ORDER = { FIX: 0, WATCH: 1, INFO: 2 };

/**
 * lint(paths, options) -> { rows, findings, summary }
 * options: { termbase, patterns, langs, callName, rules: ['R01', ...], ignore: ['R03'], ...rule options }
 */
export async function lint(paths, options = {}) {
  const rows = await loadFiles(paths, { langs: options.langs, callName: options.callName, relativeTo: options.relativeTo, pairArrays: options.pairArrays });
  const terms = options.termbase ? await loadTermbase(options.termbase) : [];
  const patterns = options.patterns ? await loadPatterns(options.patterns) : [];
  const accepted = options.accept ? await loadAccepted(options.accept) : [];
  const ctx = { terms, patterns, options };
  let findings = [];
  for (const rule of RULES) findings.push(...rule(rows, ctx));
  const only = options.rules && options.rules.length ? new Set(options.rules) : null;
  const extra = new Set(options.with || []);
  const ignore = new Set(options.ignore || []);
  findings = findings.filter(f => (only ? only.has(f.rule) : (!OPT_IN.has(f.rule) || extra.has(f.rule))) && !ignore.has(f.rule));
  // Findings the author has accepted (accepted-findings CSV) leave the counts but stay listed.
  const acceptedHits = [];
  const used = new Set();
  findings = findings.filter(f => {
    const a = accepted.find(a => (a.rule === '*' || a.rule === f.rule) && (a.file === '*' || a.file === f.file) &&
      ((f.en && f.en.includes(a.match)) || (f.ms && f.ms.includes(a.match)) || f.key === a.match));
    if (!a) return true;
    used.add(a); acceptedHits.push({ ...f, note: a.note });
    return false;
  });
  for (const a of accepted) if (!used.has(a)) findings.push({ rule: 'R00', level: 'INFO', file: a.file, key: a.match, en: '', ms: '', msg: `accepted entry no longer matches any finding (${a.rule}, "${a.match}"); remove it from the accepted list`, suggest: '' });
  findings.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.rule.localeCompare(b.rule) || String(a.file).localeCompare(String(b.file)) || String(a.key).localeCompare(String(b.key)));
  const summary = { rows: rows.length, msOnly: rows.filter(r => r.en == null).length, files: [...new Set(rows.map(r => r.file))], warnings: rows.warnings || [], FIX: 0, WATCH: 0, INFO: 0, accepted: acceptedHits.length, byRule: {} };
  for (const f of findings) { summary[f.level]++; summary.byRule[f.rule] = (summary.byRule[f.rule] || 0) + 1; }
  return { rows, findings, summary, terms, patterns, accepted: acceptedHits };
}

const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '⏎').trim();
const clip = (s, n = 110) => { s = cell(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

export function toMarkdown(result, { title = 'bm-lint report', showInfo = true } = {}) {
  const { findings, summary } = result;
  const lines = [`# ${title}`, '', `${summary.rows} strings in ${summary.files.length} file(s)${summary.msOnly ? ` (${summary.msOnly} of them Malay-only, checked on the Malay side alone)` : ''}: ${summary.files.join(', ')}.`, '',
    `**FIX ${summary.FIX} · WATCH ${summary.WATCH} · INFO ${summary.INFO}**`, ''];
  if (summary.warnings.length) lines.push('Loader notes:', ...summary.warnings.map(w => `- ${w}`), '');
  const byRule = Object.entries(summary.byRule).sort().map(([r, n]) => `${r} ${n}`).join(' · ');
  if (byRule) lines.push(`By rule: ${byRule}`, '');
  if (summary.accepted) lines.push(`Accepted by the author and not counted: ${summary.accepted} (listed at the end).`, '');
  for (const level of ['FIX', 'WATCH', 'INFO']) {
    const fs = findings.filter(f => f.level === level);
    if (!fs.length || (level === 'INFO' && !showInfo)) continue;
    lines.push(`## ${level} (${fs.length})`, '');
    if (level === 'INFO') {
      for (const f of fs) lines.push(`- **${f.rule}** ${f.file !== '*' && f.file !== 'termbase' ? `\`${f.file}:${f.key}\` — ` : ''}${cell(f.msg)}${f.suggest ? ` → ${cell(f.suggest)}` : ''}`);
      lines.push('');
      continue;
    }
    lines.push('| # | rule | file : key | EN | MS | finding | suggest |', '|---|---|---|---|---|---|---|');
    fs.forEach((f, i) => lines.push(`| ${i + 1} | ${f.rule} | \`${cell(f.file)}:${cell(f.key)}\` | ${clip(f.en)} | ${clip(f.ms)} | ${cell(f.msg)} | ${cell(f.suggest)} |`));
    lines.push('');
  }
  if (result.accepted && result.accepted.length) {
    lines.push(`## Accepted (${result.accepted.length})`, '', '| rule | file : key | MS | note |', '|---|---|---|---|');
    for (const f of result.accepted) lines.push(`| ${f.rule} | \`${cell(f.file)}:${cell(f.key)}\` | ${clip(f.ms, 80)} | ${cell(f.note)} |`);
    lines.push('');
  }
  lines.push('## Rules', '', ...Object.entries(RULE_DOC).map(([k, v]) => `- ${k}: ${v}`), '');
  lines.push('_FIX blocks by default; WATCH and INFO are for the author to judge. Strings not listed passed every mechanical rule — that says nothing about whether they read well._', '');
  return lines.join('\n');
}

export function toJSON(result) {
  return JSON.stringify({ summary: result.summary, findings: result.findings, accepted: result.accepted }, null, 2);
}

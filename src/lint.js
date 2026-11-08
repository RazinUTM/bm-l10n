// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia

import { loadFiles } from './load.js';
import { loadTermbase, loadPatterns } from './termbase.js';
import { RULES, RULE_DOC } from './rules.js';

const LEVEL_ORDER = { FIX: 0, WATCH: 1, INFO: 2 };

/**
 * lint(paths, options) -> { rows, findings, summary }
 * options: { termbase, patterns, langs, callName, rules: ['R01', ...], ignore: ['R03'], ...rule options }
 */
export async function lint(paths, options = {}) {
  const rows = await loadFiles(paths, { langs: options.langs, callName: options.callName, relativeTo: options.relativeTo });
  const terms = options.termbase ? await loadTermbase(options.termbase) : [];
  const patterns = options.patterns ? await loadPatterns(options.patterns) : [];
  const ctx = { terms, patterns, options };
  let findings = [];
  for (const rule of RULES) findings.push(...rule(rows, ctx));
  const only = options.rules && options.rules.length ? new Set(options.rules) : null;
  const ignore = new Set(options.ignore || []);
  findings = findings.filter(f => (!only || only.has(f.rule)) && !ignore.has(f.rule));
  findings.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.rule.localeCompare(b.rule) || String(a.file).localeCompare(String(b.file)) || String(a.key).localeCompare(String(b.key)));
  const summary = { rows: rows.length, msOnly: rows.filter(r => r.en == null).length, files: [...new Set(rows.map(r => r.file))], warnings: rows.warnings || [], FIX: 0, WATCH: 0, INFO: 0, byRule: {} };
  for (const f of findings) { summary[f.level]++; summary.byRule[f.rule] = (summary.byRule[f.rule] || 0) + 1; }
  return { rows, findings, summary, terms, patterns };
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
  lines.push('## Rules', '', ...Object.entries(RULE_DOC).map(([k, v]) => `- ${k}: ${v}`), '');
  lines.push('_FIX blocks by default; WATCH and INFO are for the author to judge. Strings not listed passed every mechanical rule — that says nothing about whether they read well._', '');
  return lines.join('\n');
}

export function toJSON(result) {
  return JSON.stringify({ summary: result.summary, findings: result.findings }, null, 2);
}

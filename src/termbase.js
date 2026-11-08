// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia
//
// Termbase: a CSV the project owns. One row per English term.
//   en      English term (matched case-insensitively on word boundaries in the EN string)
//   bm      the Malay rendering the project has chosen; for tier 2 this equals en
//   tier    1 = translate, 2 = keep in English, 3 = grey zone (decided per project)
//   reject  forms that must not appear in MS strings, separated by |
//   status  checked | unchecked | flagged | n/a   (PRPM check of the bm form; flagged = checked,
//           and PRPM does not support it: the author has a decision to make)
//   source  URL of the PRPM page or other evidence; empty if none
//   note    free text (reason for the decision)
//
// The termbase records decisions and their evidence (a URL). It never stores
// dictionary content copied from PRPM: that content belongs to DBP.

import { readFile, writeFile } from 'node:fs/promises';

export const COLUMNS = ['en', 'bm', 'tier', 'reject', 'status', 'source', 'note'];

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim() !== ''));
}

export function toCSV(rows, columns = COLUMNS) {
  const esc = v => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(','), ...rows.map(r => columns.map(c => esc(r[c])).join(','))].join('\n') + '\n';
}

export function normaliseTerm(t) {
  const tier = Number(t.tier) || 3;
  return {
    en: (t.en || '').trim(),
    bm: (t.bm || '').trim() || (tier === 2 ? (t.en || '').trim() : ''),
    tier,
    reject: (t.reject || '').split('|').map(s => s.trim()).filter(Boolean),
    status: (t.status || 'unchecked').trim(),
    source: (t.source || '').trim(),
    note: (t.note || '').trim(),
  };
}

export async function loadTermbase(path) {
  const rows = parseCSV(await readFile(path, 'utf8'));
  const header = rows.shift().map(h => h.trim().toLowerCase());
  const terms = rows.map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return normaliseTerm(o);
  }).filter(t => t.en);
  return terms;
}

export async function saveTermbase(path, terms) {
  await writeFile(path, toCSV(terms.map(t => ({ ...t, reject: t.reject.join('|') }))), 'utf8');
}

/**
 * Calque / idiom patterns: a CSV with columns  pattern, level, suggest, note[, flags]
 * pattern is a JS regular expression body applied to MS strings; flags default to i (u is always added); write - for none (case-sensitive).
 */
export async function loadPatterns(path) {
  const rows = parseCSV(await readFile(path, 'utf8'));
  const header = rows.shift().map(h => h.trim().toLowerCase());
  return rows.map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return { re: new RegExp(o.pattern, (o.flags === '-' ? '' : (o.flags || 'i')) + 'u'), pattern: o.pattern, suggest: o.suggest || '', note: o.note || '', level: (o.level || 'WATCH').toUpperCase() };
  }).filter(p => p.pattern);
}

/**
 * Accepted findings: a CSV with columns  rule, file, match, note
 * A finding is accepted when its rule matches (or *), its file matches (or *), and `match`
 * is a substring of its English or Malay text (or equals its key). Matching on text, not on
 * line-based keys, keeps an entry valid when code moves.
 */
export async function loadAccepted(path) {
  const rows = parseCSV(await readFile(path, 'utf8'));
  const header = rows.shift().map(h => h.trim().toLowerCase());
  return rows.map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return { rule: o.rule || '*', file: o.file || '*', match: o.match || '', note: o.note || '' };
  }).filter(a => a.match);
}

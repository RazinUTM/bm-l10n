// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia
//
// Loaders: turn a string file into a flat list of {file, key, en, ms} pairs.
// Supported inputs (detected by extension and content, see detect()):
//   .json      {en:{...}, ms:{...}} or flat {key: {en, ms}}; nested keys flattened with "."
//   .js (table) a plain script or ESM module holding an object with en/ms blocks
//               (e.g. const I18N = { en: {...}, ms: {...} }) or an array of
//               {term, en, ms} entries (glossary style). The script is run in a
//               node:vm sandbox with no access to the host, so it can be any
//               hand-written JS; functions and side effects are ignored.
//   .js (inline) calls of the form L("english", "malay") anywhere in the source.
//               The call names are configurable (default L; e.g. "L,LL").
//   .js (ms-only) a table that holds Malay text only (e.g. translations of engine output whose
//               English lives elsewhere). Its string leaves become rows with en = null, so the
//               rules that need only the Malay side (grammar, pronouns, rejected forms, patterns)
//               still run on it.
// Objects are searched at any depth: an object with en/ms sub-objects is paired key by key, an
// object with en/ms strings is one row. If a script throws while loading, whatever it defined
// before the error is still harvested, and literal pairs  en: '…', ms: '…'  are read by regex.

import { readFile } from 'node:fs/promises';
import { basename, extname, relative } from 'node:path';
import vm from 'node:vm';

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Flatten nested string tables: {a:{b:"x"}} -> {"a.b":"x"} */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (isObj(v)) flatten(v, key, out);
  }
  return out;
}

/** Pair an {en:{}, ms:{}} table into rows. */
function pairTable(file, table, langs = ['en', 'ms']) {
  const [a, b] = langs;
  const en = flatten(table[a] || {});
  const ms = flatten(table[b] || {});
  const keys = new Set([...Object.keys(en), ...Object.keys(ms)]);
  const rows = [];
  for (const key of keys) rows.push({ file, key, en: en[key] ?? null, ms: ms[key] ?? null });
  return rows;
}

/** Glossary-style array: [{term, en, ms, ...}] -> rows keyed by term (or index). */
function pairArray(file, arr, langs = ['en', 'ms']) {
  const [a, b] = langs;
  return arr
    .filter(e => isObj(e) && (typeof e[a] === 'string' || typeof e[b] === 'string'))
    .map((e, i) => ({ file, key: e.term || e.key || e.id || String(i), en: e[a] ?? null, ms: e[b] ?? null }));
}

/** Walk any value and collect en/ms pairs at any depth. */
function harvest(file, values, langs, maxDepth = 8) {
  const [a, b] = langs;
  const rows = [];
  const seen = new WeakSet();
  const walk = (v, path, depth) => {
    if (depth > maxDepth || v === null || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    if (isObj(v) && isObj(v[a]) && isObj(v[b])) {                       // { en: {...}, ms: {...} }
      for (const r of pairTable(file, v, langs)) rows.push({ ...r, key: path ? `${path}.${r.key}` : r.key });
      for (const [k, c] of Object.entries(v)) if (k !== a && k !== b) walk(c, path ? `${path}.${k}` : k, depth + 1);
      return;
    }
    if (isObj(v) && (typeof v[a] === 'string' || typeof v[b] === 'string')) { // { en: '…', ms: '…' }
      const label = v.term || v.key || v.id || path;
      rows.push({ file, key: String(label), en: typeof v[a] === 'string' ? v[a] : null, ms: typeof v[b] === 'string' ? v[b] : null });
      for (const [k, c] of Object.entries(v)) if (k !== a && k !== b && typeof c === 'object') walk(c, `${label}.${k}`, depth + 1);
      return;
    }
    const entries = Array.isArray(v) ? v.map((c, i) => [String(i), c]) : Object.entries(v);
    for (const [k, c] of entries) walk(c, path ? `${path}.${k}` : k, depth + 1);
  };
  for (const [name, v] of values) walk(v, name, 0);
  return rows;
}

/** Every string leaf of the given values, as Malay-only rows (for ms-only tables). */
function harvestLeaves(file, values, maxDepth = 6) {
  const rows = [];
  const seen = new WeakSet();
  const walk = (v, path, depth) => {
    if (typeof v === 'string') { if (/\p{L}{2,}\s+\p{L}/u.test(v)) rows.push({ file, key: path, en: null, ms: v }); return; }
    if (depth > maxDepth || v === null || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    const entries = Array.isArray(v) ? v.map((c, i) => [String(i), c]) : Object.entries(v);
    for (const [k, c] of entries) walk(c, path ? `${path}.${k}` : k, depth + 1);
  };
  for (const [name, v] of values) walk(v, name, 0);
  return rows;
}

/** Literal pairs  en: '…', ms: '…'  (same object, en first), for scripts that cannot be evaluated. */
export function extractPairs(file, src) {
  const q = `(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^'\\\\]|\\\\.)*)'|\`((?:[^\`\\\\]|\\\\.)*)\`)`;
  const re = new RegExp(`\\ben\\s*:\\s*${q}\\s*,\\s*ms\\s*:\\s*${q}`, 'g');
  const unesc = s => s.replace(/\\(["'`\\nt])/g, (_, c) => ({ n: '\n', t: '\t' }[c] ?? c));
  const rows = [];
  let m;
  while ((m = re.exec(src))) {
    const line = src.slice(0, m.index).split('\n').length;
    rows.push({ file, key: `pair@${line}`, en: unesc(m[1] ?? m[2] ?? m[3] ?? ''), ms: unesc(m[4] ?? m[5] ?? m[6] ?? '') });
  }
  return rows;
}

/** Run a script in a sandbox; return [name, value] pairs for its top-level bindings, exports and
 *  the properties it assigned to the global object (window.X = …, root.X = …). Never throws: an
 *  error during evaluation is returned with whatever was defined before it. */
function evalScript(src) {
  // Strip ESM syntax so the file runs as a classic script; keep the bindings.
  const body = src
    .replace(/^\s*import\s[^;]*;?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'module.exports.default = ')
    .replace(/^\s*export\s+(const|let|var|function|class)\s/gm, '$1 ')
    .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '');
  const sandbox = { module: { exports: {} }, console: { log() {}, warn() {}, error() {}, info() {} } };
  sandbox.exports = sandbox.module.exports;
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  sandbox.document = undefined; sandbox.localStorage = undefined; sandbox.navigator = undefined;
  const preset = new Set(Object.keys(sandbox));
  const ctx = vm.createContext(sandbox);
  const names = [...body.matchAll(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  const fnNames = [...body.matchAll(/^\s*function\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  const grab = [...new Set([...names, ...fnNames])].map(n => `try{__out[${JSON.stringify(n)}]=${n}}catch(e){}`).join(';');
  // Bindings are grabbed in a finally block, so a throw part-way still yields what was defined.
  const wrapped = `(function(){ const __out = {}; try {\n${body}\n} catch (e) { __out.__error = String(e && e.message || e); } finally { ${grab}; } return __out; })()`;
  let out = {};
  try {
    out = vm.runInContext(wrapped, ctx, { timeout: 2000 }) || {};
  } catch (e) {
    out = { __error: String(e && e.message || e) };            // syntax errors land here
  }
  const error = out.__error; delete out.__error;
  const values = [
    ...Object.entries(out),
    ...Object.entries(sandbox.module.exports),
    ...Object.keys(sandbox).filter(k => !preset.has(k)).map(k => [k, sandbox[k]]),
  ].filter(([, v]) => v !== null && typeof v === 'object');
  return { values, error };
}

/** Extract inline L("en", "ms") calls. Handles '…', "…" and `…` without nested quotes of the same kind. */
export function extractInline(file, src, callName = 'L') {
  const names = String(callName).split(',').map(n => n.trim()).filter(Boolean).map(n => n.replace(/[^\w$]/g, ''));
  const q = `(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^'\\\\]|\\\\.)*)'|\`((?:[^\`\\\\]|\\\\.)*)\`)`;
  const re = new RegExp(`(?<![\\w$.])(${names.join('|')})\\(\\s*${q}\\s*,\\s*${q}\\s*\\)`, 'g');
  const unesc = s => s.replace(/\\(["'`\\nt])/g, (_, c) => ({ n: '\n', t: '\t' }[c] ?? c));
  const rows = [];
  let m, i = 0;
  while ((m = re.exec(src))) {
    const en = unesc(m[2] ?? m[3] ?? m[4] ?? '');
    const ms = unesc(m[5] ?? m[6] ?? m[7] ?? '');
    const line = src.slice(0, m.index).split('\n').length;
    rows.push({ file, key: `${m[1]}@${line}#${++i}`, en, ms });
  }
  return rows;
}

export function detect(path, src) {
  const ext = extname(path).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs' || ext === '.ts') {
    // A table file declares an object with en: { and ms: { blocks; otherwise treat as inline.
    if (/\ben\s*:\s*\{/.test(src) && /\bms\s*:\s*\{/.test(src)) return 'js-table';
    if (/\ben\s*:\s*['"`]/.test(src) && /\bms\s*:\s*['"`]/.test(src)) return 'js-table';
    if (/(?<![\w$.])[A-Za-z_$][\w$]*\(\s*["'`][^"'`]*["'`]\s*,\s*["'`]/.test(src)) return 'js-inline';
    return 'js-ms-only';
  }
  throw new Error(`unsupported file type: ${path}`);
}

/**
 * Load one file. opts: { langs: ['en','ms'], callName: 'L', kind: force a loader }
 */
export async function loadFile(path, opts = {}) {
  const langs = opts.langs || ['en', 'ms'];
  const src = await readFile(path, 'utf8');
  const kind = opts.kind || detect(path, src);
  const file = opts.label || basename(path);
  if (kind === 'json') {
    const data = JSON.parse(src);
    if (isObj(data) && isObj(data[langs[0]])) return pairTable(file, data, langs);
    if (Array.isArray(data)) return pairArray(file, data, langs);
    // flat {key: {en, ms}}
    return Object.entries(data)
      .filter(([, v]) => isObj(v))
      .map(([key, v]) => ({ file, key, en: v[langs[0]] ?? null, ms: v[langs[1]] ?? null }));
  }
  const call = opts.callName || 'L';
  if (kind === 'js-table') {
    const { values, error } = evalScript(src);
    let rows = harvest(file, values, langs);
    if (!rows.length) rows = extractPairs(file, src);                 // could not evaluate: read literal pairs
    if (error) rows.warning = `${file}: evaluation stopped early (${error}); ${rows.length} pairs read`;
    // A table file may also carry inline calls; collect them too.
    const all = rows.concat(extractInline(file, src, call));
    all.warning = rows.warning;
    return all;
  }
  if (kind === 'js-inline') {
    const rows = extractInline(file, src, call);
    return rows.length ? rows : loadMsOnly(file, src);
  }
  if (kind === 'js-ms-only') return loadMsOnly(file, src);
  throw new Error(`unknown loader kind: ${kind}`);
}

function loadMsOnly(file, src) {
  const { values, error } = evalScript(src);
  const rows = harvestLeaves(file, values);
  if (error) rows.warning = `${file}: evaluation stopped early (${error}); ${rows.length} Malay strings read`;
  return rows;
}

export async function loadFiles(paths, opts = {}) {
  const all = [];
  const warnings = [];
  for (const p of paths) {
    const label = opts.relativeTo ? relative(opts.relativeTo, p) : undefined;
    const rows = await loadFile(p, { ...opts, label });
    if (rows.warning) warnings.push(rows.warning);
    if (!rows.length) warnings.push(`${basename(p)}: no strings found`);
    all.push(...rows);
  }
  all.warnings = warnings;
  return all;
}

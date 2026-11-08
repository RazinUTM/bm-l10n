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
//               The call name is configurable (default L).

import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
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

/** Find every en/ms table or glossary array among the values of a sandbox. */
function harvest(file, values, langs) {
  const [a, b] = langs;
  const rows = [];
  for (const v of values) {
    if (isObj(v) && isObj(v[a]) && isObj(v[b])) rows.push(...pairTable(file, v, langs));
    else if (Array.isArray(v) && v.some(e => isObj(e) && typeof e[a] === 'string')) rows.push(...pairArray(file, v, langs));
  }
  return rows;
}

/** Run a script in a sandbox and collect its top-level bindings and exports. */
function evalScript(src) {
  // Strip ESM syntax so the file runs as a classic script; keep the bindings.
  const body = src
    .replace(/^\s*import\s[^;]*;?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'module.exports.default = ')
    .replace(/^\s*export\s+(const|let|var|function|class)\s/gm, '$1 ')
    .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '');
  const sandbox = { module: { exports: {} }, console: { log() {}, warn() {}, error() {} } };
  sandbox.exports = sandbox.module.exports;
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  sandbox.document = undefined; sandbox.localStorage = undefined;
  const ctx = vm.createContext(sandbox);
  // Top-level const/let are not properties of the context; wrap in a function that
  // returns every identifier declared at top level.
  const names = [...body.matchAll(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  const fnNames = [...body.matchAll(/^\s*function\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  const ret = [...new Set([...names, ...fnNames])].map(n => `try{__out[${JSON.stringify(n)}]=${n}}catch(e){}`).join(';');
  const wrapped = `(function(){ const __out = {};\n${body}\n;${ret}; return __out; })()`;
  try {
    const out = vm.runInContext(wrapped, ctx, { timeout: 2000 });
    return [...Object.values(out), ...Object.values(sandbox.module.exports)];
  } catch (e) {
    throw new Error(`could not evaluate script as a string table: ${e.message}`);
  }
}

/** Extract inline L("en", "ms") calls. Handles '…', "…" and `…` without nested quotes of the same kind. */
export function extractInline(file, src, callName = 'L') {
  const q = `(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^'\\\\]|\\\\.)*)'|\`((?:[^\`\\\\]|\\\\.)*)\`)`;
  const re = new RegExp(`\\b${callName}\\(\\s*${q}\\s*,\\s*${q}\\s*\\)`, 'g');
  const unesc = s => s.replace(/\\(["'`\\nt])/g, (_, c) => ({ n: '\n', t: '\t' }[c] ?? c));
  const rows = [];
  let m, i = 0;
  while ((m = re.exec(src))) {
    const en = unesc(m[1] ?? m[2] ?? m[3] ?? '');
    const ms = unesc(m[4] ?? m[5] ?? m[6] ?? '');
    const line = src.slice(0, m.index).split('\n').length;
    rows.push({ file, key: `${callName}@${line}#${++i}`, en, ms });
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
    return 'js-inline';
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
  if (kind === 'js-table') {
    const rows = harvest(file, evalScript(src), langs);
    // A table file may also carry inline calls; collect them too.
    return rows.concat(extractInline(file, src, opts.callName || 'L'));
  }
  if (kind === 'js-inline') return extractInline(file, src, opts.callName || 'L');
  throw new Error(`unknown loader kind: ${kind}`);
}

export async function loadFiles(paths, opts = {}) {
  const all = [];
  for (const p of paths) all.push(...await loadFile(p, opts));
  return all;
}

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia
//
// A small scanner for hand-written UI JavaScript: enough to find helper calls such as
// L("english", "malay"), split their arguments, and read strings built by concatenation
// ("Score " + c + " / " + n). It is not a parser. codeMask() blanks the contents of strings,
// comments and regex literals (keeping the quotes and the code inside template ${…}), so
// brackets, commas and plus signs can then be counted on the mask without being fooled by
// text. Regex literals are recognised by the usual heuristic (a slash after an operator or a
// keyword such as return).

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OPEN = { '(': ')', '[': ']', '{': '}' };
const REGEX_AFTER_WORD = /^(return|typeof|case|in|of|void|delete|throw|new|instanceof|yield|await)$/;

/** Same-length copy of src with string, template-text, comment and regex contents blanked. */
export function codeMask(src) {
  const out = src.split('');
  const n = src.length;
  const blank = (a, b) => { for (let k = a; k < b && k < n; k++) if (out[k] !== '\n') out[k] = ' '; };
  const stack = [{ mode: 'code', depth: 0, inTpl: false }];
  let i = 0, last = '', lastWord = '';
  while (i < n) {
    const top = stack[stack.length - 1];
    if (top.mode === 'tpl') {                                   // template text up to ` or ${
      const start = i;
      while (i < n && src[i] !== '`' && !(src[i] === '$' && src[i + 1] === '{')) i += src[i] === '\\' ? 2 : 1;
      blank(start, i);
      if (i >= n) break;
      if (src[i] === '`') { stack.pop(); i++; last = '`'; lastWord = ''; continue; }
      i += 2; stack.push({ mode: 'code', depth: 0, inTpl: true }); last = '{'; lastWord = ''; continue;
    }
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      blank(i + 1, j); i = j + 1; last = c; lastWord = ''; continue;
    }
    if (c === '`') { stack.push({ mode: 'tpl' }); i++; continue; }
    if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); const e = j < 0 ? n : j; blank(i, e); i = e; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); const e = j < 0 ? n : j + 2; blank(i, e); i = e; continue; }
    if (c === '/' && (last === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(last) || REGEX_AFTER_WORD.test(lastWord))) {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== '\n') {
        const d = src[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break;
        j++;
      }
      blank(i + 1, j); i = j + 1;
      while (i < n && /[a-z]/i.test(src[i])) i++;
      last = '/'; lastWord = ''; continue;
    }
    if (top.inTpl) {
      if (c === '{') top.depth++;
      else if (c === '}') { if (top.depth === 0) { stack.pop(); i++; last = '}'; lastWord = ''; continue; } top.depth--; }
    }
    if (/\s/.test(c)) { i++; continue; }
    if (/[\w$]/.test(c)) { let j = i; while (j < n && /[\w$]/.test(src[j])) j++; lastWord = src.slice(i, j); last = 'a'; i = j; continue; }
    last = c; lastWord = ''; i++;
  }
  return out.join('');
}

/** mask[i] is an opening bracket; index of its matching closing bracket (or -1). */
export function matchBracket(mask, i) {
  const stack = [OPEN[mask[i]]];
  for (let j = i + 1; j < mask.length; j++) {
    const c = mask[j];
    if (OPEN[c]) stack.push(OPEN[c]);
    else if (c === ')' || c === ']' || c === '}') {
      if (c !== stack[stack.length - 1]) return -1;             // unbalanced: give up on this call
      stack.pop();
      if (!stack.length) return j;
    }
  }
  return -1;
}

/** Split mask[a..b) at depth-0 separators. sep ',' or '+' (binary plus only). Returns [s, e] ranges. */
export function splitTop(mask, a, b, sep) {
  const parts = [];
  let depth = 0, start = a;
  for (let j = a; j < b; j++) {
    const c = mask[j];
    if (OPEN[c]) { depth++; continue; }
    if (c === ')' || c === ']' || c === '}') { depth--; continue; }
    if (depth !== 0 || c !== sep) continue;
    if (sep === '+') {
      if (mask[j + 1] === '+' || mask[j + 1] === '=' || mask[j - 1] === '+') continue;   // ++ or +=
      const prev = mask.slice(start, j).trim();
      if (!prev || /[=(,?:&|!<>*/%\-~^]$/.test(prev)) continue;                          // unary plus
    }
    parts.push([start, j]); start = j + 1;
  }
  parts.push([start, b]);
  return parts;
}

/** Depth-0 ternary or logical operators make an argument a single expression for our purpose. */
function hasTopTernary(mask, a, b) {
  let depth = 0;
  for (let j = a; j < b; j++) {
    const c = mask[j];
    if (OPEN[c]) depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (depth === 0 && c === '?' && mask[j + 1] !== '.' && mask[j + 1] !== '?' && mask[j - 1] !== '?') return true;
    else if (depth === 0 && ((c === '|' && mask[j + 1] === '|') || (c === '&' && mask[j + 1] === '&') || (c === '?' && mask[j + 1] === '?'))) return true;
  }
  return false;
}

/** Unescape the body of a JS string literal. */
export function unescapeJs(s) {
  return s.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\r?\n|.)/g, (_, e) => {
    if (e[0] === 'u' && e[1] === '{') return String.fromCodePoint(parseInt(e.slice(2, -1), 16));
    if (e[0] === 'u' && e.length === 5) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e[0] === 'x' && e.length === 3) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e === '\n' || e === '\r\n') return '';
    return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[e] ?? e;
  });
}

const trimRange = (src, [s, e]) => { while (s < e && /\s/.test(src[s])) s++; while (e > s && /\s/.test(src[e - 1])) e--; return [s, e]; };

/** One operand: {kind:'str'|'tpl'|'expr', text, key}. */
function operand(src, mask, range) {
  const [s, e] = trimRange(src, range);
  const raw = src.slice(s, e), m = mask.slice(s, e);
  if (/^(["'])\s*\1$/.test(m)) return { kind: 'str', text: unescapeJs(raw.slice(1, -1)) };
  if (raw[0] === '`' && raw[raw.length - 1] === '`' && raw.length >= 2 && !/`[^`]*`[^`]*`/.test(m.replace(/\$\{[^}]*\}/g, ''))) return { kind: 'tpl', text: unescapeJs(raw.slice(1, -1)) };
  return { kind: 'expr', key: m.replace(/\s+/g, '') };
}

/** An argument as a list of operands, or null when it is one expression with no literal text. */
export function readArg(src, mask, range) {
  const [s, e] = trimRange(src, range);
  if (s >= e) return null;
  if (hasTopTernary(mask, s, e)) {
    const whole = operand(src, mask, [s, e]);
    return whole.kind === 'expr' ? null : [whole];
  }
  const ops = splitTop(mask, s, e, '+').map(r => operand(src, mask, r));
  return ops.some(o => o.kind !== 'expr') ? ops : null;
}

/** Render two operand lists with shared placeholder numbers: same expression, same {eN}. */
export function renderPair(a, b) {
  const ids = new Map();
  const id = k => { if (!ids.has(k)) ids.set(k, ids.size + 1); return `{e${ids.get(k)}}`; };
  const render = ops => ops.map(o => (o.kind === 'expr' ? id(o.key) : o.text)).join('');
  return [render(a), render(b)];
}

/** Elements of a literal map {k:"…", …} or array ["…", …] spanning mask[s..e], or null. */
function literalElements(src, mask, s, e) {
  const open = mask[s], close = matchBracket(mask, s);
  if (close < 0 || (open !== '{' && open !== '[')) return null;
  const items = splitTop(mask, s + 1, close, ',').map(r => trimRange(src, r)).filter(([a, b]) => b > a);
  const out = [];
  for (const [a, b] of items) {
    let key = String(out.length), vs = a;
    if (open === '{') {
      const colon = mask.slice(a, b).search(/:/);
      if (colon < 0) return null;
      key = src.slice(a, a + colon).trim().replace(/^["']|["']$/g, '');
      vs = a + colon + 1;
    }
    const o = operand(src, mask, [vs, b]);
    if (o.kind !== 'str') return null;
    out.push([key, o.text]);
  }
  return { items: out, close };
}

/** {…}[k] or […][i]: the literal's elements, when the argument is exactly that shape. */
function indexedLiteral(src, mask, range) {
  const [s, e] = trimRange(src, range);
  if (mask[s] !== '{' && mask[s] !== '[') return null;
  const lit = literalElements(src, mask, s, e);
  if (!lit) return null;
  const rest = mask.slice(lit.close + 1, e).trim();
  if (!/^\[[\s\S]*\]$/.test(rest)) return null;
  return lit.items;
}

const lineAt = (src, i) => src.slice(0, i).split('\n').length;

/**
 * Bilingual helper calls. spec "L,LL,tx:1": names, and for each the number of leading
 * arguments to skip before the (en, ms) pair. Returns rows; rows.stats has the counts.
 */
export function extractCalls(file, src, spec = 'L', mask = codeMask(src)) {
  const helpers = String(spec).split(',').map(x => x.trim()).filter(Boolean).map(x => {
    const [name, k] = x.split(':');
    return { name: name.replace(/[^\w$]/g, ''), skip: Number(k) || 0 };
  }).filter(h => h.name);
  const rows = [];
  rows.stats = { calls: 0, read: 0, skipped: [], passThrough: 0 };
  if (!helpers.length) return rows;
  const skipOf = new Map(helpers.map(h => [h.name, h.skip]));
  const re = new RegExp(`(?<![\\w$.])(${helpers.map(h => esc(h.name)).join('|')})\\s*\\(`, 'g');
  let m, i = 0;
  while ((m = re.exec(mask))) {
    if (/\bfunction\s*$/.test(mask.slice(Math.max(0, m.index - 30), m.index))) continue;   // the helper's own definition
    const open = m.index + m[0].length - 1;
    const close = matchBracket(mask, open);
    const line = lineAt(src, m.index);
    rows.stats.calls++;
    if (close < 0) { rows.stats.skipped.push(line); continue; }
    const args = splitTop(mask, open + 1, close, ',').slice(skipOf.get(m[1]));
    if (args.length !== 2) { rows.stats.skipped.push(line); continue; }
    const key = `${m[1]}@${line}#${++i}`;
    const ia = indexedLiteral(src, mask, args[0]), ib = indexedLiteral(src, mask, args[1]);
    if (ia && ib) {
      const kb = new Map(ib);
      if (ia.length === ib.length && ia.every(([k]) => kb.has(k))) {
        for (const [k, en] of ia) rows.push({ file, key: `${key}.${k}`, en, ms: kb.get(k) });
        rows.stats.read++;
      } else rows.stats.skipped.push(line);
      continue;
    }
    const a = readArg(src, mask, args[0]), b = readArg(src, mask, args[1]);
    if (!a || !b) {
      if (!/["'`]/.test(mask.slice(open, close))) rows.stats.passThrough++;   // L(en, ms) inside a helper: variables only
      else rows.stats.skipped.push(line);
      continue;
    }
    const [en, ms] = renderPair(a, b);
    if (en.trim() || ms.trim()) rows.push({ file, key, en, ms });       // tx(el, "", "") clears a label: nothing to check
    rows.stats.read++;
  }
  return rows;
}

/** Object properties  en: <expr>, ms: <expr>  (en first, same object), strings built by concatenation included. */
export function extractObjectPairs(file, src, langs = ['en', 'ms'], mask = codeMask(src)) {
  const [A, B] = langs.map(esc);
  const re = new RegExp(`(?<![\\w$.])${A}\\s*:`, 'g');
  const rows = [];
  let m;
  const valueEnd = from => {                       // end of a property value: depth-0 comma or closing bracket
    let depth = 0;
    for (let j = from; j < mask.length; j++) {
      const c = mask[j];
      if (OPEN[c]) depth++;
      else if (c === ')' || c === ']' || c === '}') { if (depth === 0) return j; depth--; }
      else if (c === ',' && depth === 0) return j;
    }
    return mask.length;
  };
  while ((m = re.exec(mask))) {
    const vs = m.index + m[0].length, ve = valueEnd(vs);
    if (mask[ve] !== ',') continue;
    const next = new RegExp(`^\\s*${B}\\s*:`).exec(mask.slice(ve + 1, ve + 40));
    if (!next) continue;
    const ws = ve + 1 + next[0].length, we = valueEnd(ws);
    const a = readArg(src, mask, [vs, ve]), b = readArg(src, mask, [ws, we]);
    if (!a || !b) continue;
    const [en, ms] = renderPair(a, b);
    rows.push({ file, key: `pair@${lineAt(src, m.index)}`, en, ms });
  }
  return rows;
}

/** Two-element arrays of string literals read as [en, ms] when one element has a space (opt-in). */
export function extractPairArrays(file, src, mask = codeMask(src)) {
  const rows = [];
  let i = 0;
  for (let j = 0; j < mask.length; j++) {
    if (mask[j] !== '[') continue;
    const close = matchBracket(mask, j);
    if (close < 0) continue;
    const parts = splitTop(mask, j + 1, close, ',').map(r => trimRange(src, r)).filter(([a, b]) => b > a);
    if (parts.length !== 2) continue;
    if (/^\s*\[/.test(mask.slice(close + 1, close + 3))) continue;     // […][i]: an indexed list, not a pair
    const [x, y] = parts.map(r => operand(src, mask, r));
    if (x.kind !== 'str' || y.kind !== 'str') continue;
    if (!/\s/.test(x.text) && !/\s/.test(y.text)) continue;              // ["R_A", "R_B"]: symbols, not a pair
    rows.push({ file, key: `pair@${lineAt(src, j)}#${++i}`, en: x.text, ms: y.text });
  }
  return rows;
}

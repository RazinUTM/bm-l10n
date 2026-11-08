// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia
//
// HTML loader for pages that carry both languages side by side and let CSS show one:
//
//   <span class="en">Short notes</span><span class="ms">Nota ringkas</span>
//   <p class="lead en">…</p>
//   <p class="lead ms">…</p>
//   <input data-ph-en="Search, e.g. kgf" data-ph-ms="Cari, contoh kgf">
//
// An element whose class list has `en`, followed by a sibling (only whitespace between them)
// whose class list has `ms`, is one row. The inner HTML is kept as stored, markup included, as
// the JSON and JS loaders keep <b> inside a string; runs of spaces and newlines become one space.
// An `en` element without an `ms` partner is a row with an empty Malay side (R02 reports it); an
// `ms` element without a partner is a Malay-only row. Elements inside another en/ms element are
// part of it. Attribute pairs data-…-en / data-…-ms on one element are rows too. <script>, <style>
// and comments are skipped. The tokenizer is tolerant, not validating: it expects the
// hand-written, well-formed HTML of a course page, not arbitrary web pages.

const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const ENT = { amp: '&', nbsp: ' ', quot: '"', apos: "'", ndash: '–', mdash: '—', hellip: '…', times: '×', minus: '−', middot: '·', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', deg: '°', thinsp: ' ', laquo: '«', raquo: '»', copy: '©', eacute: 'é' };

/** Decode entities, except &lt; and &gt; (decoded they would look like markup to the rules). */
export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      const ch = String.fromCodePoint(cp);
      return ch === '<' || ch === '>' ? m : ch;
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}

function parseAttrs(s) {
  const out = {};
  const re = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
  let m;
  while ((m = re.exec(s))) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return i => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= i) lo = mid; else hi = mid - 1; } return lo + 1; };
}

/** Parse into a tree of element nodes with source offsets. */
export function parseHtml(src) {
  const lineAt = lineIndex(src);
  const root = { tag: '#root', attrs: {}, start: 0, cstart: 0, cend: src.length, end: src.length, children: [], parent: null, line: 1 };
  const stack = [root];
  const tagRe = /<!--[\s\S]*?-->|<!(?:[^>"']|"[^"]*"|'[^']*')*>|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  let m;
  while ((m = tagRe.exec(src))) {
    if (m[2] === undefined) continue;                          // comment or doctype
    const [all, close, tagRaw, attrStr, selfClose] = m;
    const tag = tagRaw.toLowerCase();
    if (!close) {
      const parent = stack[stack.length - 1];
      const node = { tag, attrs: parseAttrs(attrStr), start: m.index, cstart: m.index + all.length, cend: null, end: null, children: [], parent, line: lineAt(m.index) };
      parent.children.push(node);
      if (VOID.has(tag) || selfClose) { node.cend = node.end = node.cstart; continue; }
      if (tag === 'script' || tag === 'style') {               // raw text: skip to the end tag
        const endRe = new RegExp(`</${tag}\\s*>`, 'gi');
        endRe.lastIndex = tagRe.lastIndex;
        const e = endRe.exec(src);
        node.cend = e ? e.index : src.length; node.end = e ? e.index + e[0].length : src.length;
        node.raw = true; tagRe.lastIndex = node.end;
        continue;
      }
      stack.push(node);
    } else {
      let k = stack.length - 1;
      while (k > 0 && stack[k].tag !== tag) k--;
      if (k === 0) continue;                                    // stray end tag
      while (stack.length - 1 > k) { const x = stack.pop(); x.cend = x.end = m.index; }   // implicitly closed (e.g. <li>)
      const x = stack.pop(); x.cend = m.index; x.end = m.index + all.length;
    }
  }
  while (stack.length > 1) { const x = stack.pop(); x.cend = x.end = src.length; }
  return root;
}

const classes = n => (n.attrs.class || '').split(/\s+/).filter(Boolean);
const text = (src, n) => decodeEntities(src.slice(n.cstart, n.cend).replace(/<!--[\s\S]*?-->/g, '')).replace(/[ \t\r\n]+/g, ' ').trim();

/** Rows from an HTML page. rows.warning summarises unpaired elements; rows.stats has the counts. */
export function extractHtml(file, src, langs = ['en', 'ms']) {
  const [A, B] = langs;
  const root = parseHtml(src);
  const rows = [];
  const stats = { pairs: 0, enOnly: [], msOnly: [], nested: 0, attrPairs: 0 };
  let i = 0;
  const ctxId = n => { for (let x = n; x && x.tag !== '#root'; x = x.parent) if (x.attrs.id) return `${x.attrs.id}/`; return ''; };
  const isLang = (n, l) => classes(n).includes(l);
  const countNested = n => { for (const c of n.children) { if (isLang(c, A) || isLang(c, B)) stats.nested++; countNested(c); } };
  const attrRows = n => {
    for (const [name, v] of Object.entries(n.attrs)) {
      const m = new RegExp(`^(data-(?:[\\w-]+-)?)${A}$`).exec(name);
      if (!m || !(m[1] + B in n.attrs)) continue;
      rows.push({ file, key: `${ctxId(n)}${n.tag}[${name}]@${n.line}#${++i}`, en: decodeEntities(v), ms: decodeEntities(n.attrs[m[1] + B]) });
      stats.attrPairs++;
    }
  };
  const walk = n => {
    const kids = n.children;
    const used = new Set();
    for (let k = 0; k < kids.length; k++) {
      const c = kids[k];
      attrRows(c);
      if (isLang(c, A) && !isLang(c, B)) {
        const d = kids[k + 1];
        const gap = d ? src.slice(c.end, d.start) : '';
        if (d && isLang(d, B) && !isLang(d, A) && /^\s*$/.test(gap.replace(/<!--[\s\S]*?-->/g, ''))) {
          rows.push({ file, key: `${ctxId(c)}${c.tag}@${c.line}#${++i}`, en: text(src, c), ms: text(src, d) });
          stats.pairs++; used.add(d);
          countNested(c); countNested(d);
          walkAttrsOnly(c); walkAttrsOnly(d);
        } else {
          rows.push({ file, key: `${ctxId(c)}${c.tag}@${c.line}#${++i}`, en: text(src, c), ms: '' });
          stats.enOnly.push(c.line);
          countNested(c); walkAttrsOnly(c);
        }
        continue;
      }
      if (isLang(c, B) && !isLang(c, A)) {
        if (!used.has(c)) {
          rows.push({ file, key: `${ctxId(c)}${c.tag}@${c.line}#${++i}`, en: null, ms: text(src, c) });
          stats.msOnly.push(c.line);
          countNested(c); walkAttrsOnly(c);
        }
        continue;
      }
      if (!c.raw) walk(c);
    }
  };
  const walkAttrsOnly = n => { for (const c of n.children) { attrRows(c); walkAttrsOnly(c); } };
  attrRows(root);
  walk(root);
  rows.stats = stats;
  const notes = [];
  if (stats.enOnly.length) notes.push(`${stats.enOnly.length} "${A}" element(s) without a "${B}" partner (line ${stats.enOnly.join(', ')})`);
  if (stats.msOnly.length) notes.push(`${stats.msOnly.length} "${B}" element(s) without a "${A}" partner, checked on the Malay side alone (line ${stats.msOnly.join(', ')})`);
  if (stats.nested) notes.push(`${stats.nested} ${A}/${B} element(s) inside another ${A}/${B} element, read as part of it`);
  if (notes.length) rows.warning = `${file}: ${notes.join('; ')}`;
  return rows;
}

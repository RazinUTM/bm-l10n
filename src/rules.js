// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia
//
// Lint rules. Each rule takes the full row list and a context and returns findings:
//   { rule, level: 'FIX' | 'WATCH' | 'INFO', file, key, en, ms, msg, suggest }
// FIX   = an error, a contradiction with a label or a project decision, or a form the
//         project has rejected. Blocks (exit code 1) by default.
// WATCH = reads as translated, or a choice the author should look at. Never blocks.
// INFO  = bookkeeping (unchecked terms, mixed renderings) for the author's attention.
//
// Rules are deliberately mechanical. Anything that needs taste (register, idiom beyond
// the pattern list) belongs to the human or to the authoring skill, not here.

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (term, flags = 'i') => new RegExp(`(^|[^\\p{L}\\p{N}_])${esc(term)}(?=$|[^\\p{L}\\p{N}_])`, flags + 'u');
const has = (text, term, flags) => text != null && wordRe(term, flags).test(text);
const hasTerm = (text, term) => has(text, term, /\p{Lu}/u.test(term) ? '' : 'i');   // capitalised termbase entries match case-sensitively
const words = s => (s || '').trim().split(/\s+/).filter(Boolean);
// Placeholders and markup are not words: blank them before matching words (keeps offsets).
const PH_ANY = /\{\{[^{}]+\}\}|\{[^{}]+\}|\$\{[^}]*\}|%(?:\d+\$)?[sdif]|<[^>]+>/g;
const maskPh = s => (s || '').replace(PH_ANY, ' 9 ');   // a placeholder counts as a number: "{n} fail-fail" is still a counted plural
// Blank every tier-2 (kept-English) phrase of two or more words, so a word inside it
// ("Room" in "Deal Room", "Team" in "Park Management Team") is not read as the bare word.
function maskPhrases(text, terms) {
  let t = text || '';
  for (const p of terms) if (p.includes(' ')) t = t.replace(new RegExp(esc(p), 'giu'), m => ' '.repeat(m.length));
  return t;
}
const F = (rule, level, r, msg, suggest = '') => ({ rule, level, file: r.file, key: r.key, en: r.en, ms: r.ms, msg, suggest });

/* ---------- R01 placeholders and markup must survive ---------- */
const TPL_RE = /\$\{[^}]*\}/g;                                   // JS template expressions: localised helpers may differ
const PH_RE = /\{\{[^{}]+\}\}|\{[^{}\s]+\}|%(?:\d+\$)?[sdif]|<\/?[a-zA-Z][^>]*>|\\[nt]/g;
function placeholders(s) { return ((s || '').replace(TPL_RE, '').match(PH_RE) || []).sort(); }
export function r01_placeholders(rows) {
  const out = [];
  for (const r of rows) {
    if (r.en == null || r.ms == null) continue;
    const a = placeholders(r.en), b = placeholders(r.ms);
    if (a.join('\u0001') !== b.join('\u0001')) {
      const miss = a.filter(x => !b.includes(x)), extra = b.filter(x => !a.includes(x));
      out.push(F('R01', 'FIX', r, `placeholders differ: missing ${JSON.stringify(miss)} extra ${JSON.stringify(extra)}`));
    }
    // ${n > 1 ? "s" : ""} adds an English plural suffix; Malay needs none, so it is not counted
    const PLURAL_S = /^\$\{[^}]*\?\s*["'`](?:s|es)["'`]\s*:\s*["'`]["'`]\s*\}$/;
    const count = s => (s.match(TPL_RE) || []).filter(x => !PLURAL_S.test(x)).length;
    const ta = count(r.en), tb = count(r.ms);
    if (ta !== tb) out.push(F('R01', 'WATCH', r, `${ta} template expression(s) in EN, ${tb} in MS; fine if a plural suffix was dropped or a localised helper is used`));
  }
  return out;
}

/* ---------- R02 missing translation ---------- */
export function r02_missing(rows) {
  // an English plural suffix ("s") or an empty string legitimately has an empty Malay counterpart
  const hasWord = s => /\p{L}{2,}/u.test(maskPh(s || ''));
  return rows.filter(r => r.en != null && hasWord(r.en) && (r.ms == null || r.ms.trim() === ''))
    .map(r => F('R02', 'FIX', r, 'no MS string for this key'));
}

/* ---------- R03 length: short UI strings that grew a lot ---------- */
export function r03_length(rows, ctx) {
  const shortMax = ctx.options.shortMax ?? 40, shortRatio = ctx.options.shortRatio ?? 1.6, longRatio = ctx.options.longRatio ?? 1.6;
  const out = [];
  for (const r of rows) {
    if (!r.en || !r.ms) continue;
    const ratio = r.ms.length / Math.max(1, r.en.length);
    if (r.en.length >= 8 && r.en.length <= shortMax && ratio > shortRatio && r.ms.length - r.en.length >= 8)
      out.push(F('R03', 'WATCH', r, `short string grew ×${ratio.toFixed(2)} (${r.en.length}→${r.ms.length} chars); check the layout`));
    else if (r.en.length > shortMax && ratio > longRatio)
      out.push(F('R03', 'WATCH', r, `string grew ×${ratio.toFixed(2)}; Malay normally runs 1.15–1.3×, check for padding`));
  }
  return out;
}

/* ---------- R04 untranslated (identical) strings ---------- */
export function r04_untranslated(rows, ctx) {
  const keep = ctx.terms.filter(t => t.tier === 2).map(t => t.en.toLowerCase());
  const out = [];
  for (const r of rows) {
    if (!r.en || !r.ms || r.en.trim() !== r.ms.trim()) continue;
    const w = (maskPh(r.en).match(/\p{L}{2,}/gu) || []);
    if (w.length < 3) continue;                       // labels kept in English are a decision, not a bug
    const covered = keep.some(k => r.en.toLowerCase().includes(k));
    if (!covered) out.push(F('R04', 'WATCH', r, 'MS is identical to EN; intentional?'));
  }
  return out;
}

/* ---------- R05 grammar and spelling that are always wrong in standard Malay ---------- */
const ALWAYS = [
  { re: /\badalah\s+merupakan\b/i, msg: '"adalah merupakan" is a doubled copula', suggest: 'use "ialah", "merupakan" or neither' },
  { re: /\b(di)(sini|situ|sana|mana|atas|bawah|dalam|luar|antara|samping|sebelah|hadapan|belakang)\b/i, msg: 'preposition "di" is written apart from a place word', suggest: '"di $2"' },
  { re: /\b(ke)(sini|situ|sana|atas|bawah|hadapan|belakang)\b/i, msg: 'preposition "ke" is written apart from a place word', suggest: '"ke $2"' },
  { re: /\bdi\s+(simpan|padam|hantar|muat|pilih|buka|tutup|tambah|buang|ubah|kemas|cetak|salin|papar|semak|sahkan|tetapkan|jalankan|mulakan)\b/i, msg: 'passive prefix "di-" must be attached to the verb', suggest: '"di$1"' },
  { re: /(\b\d+|\{[^{}]+\}|\b(?:beberapa|banyak|semua|setiap|para|ramai|segala|pelbagai|kebanyakan))\s+(\p{L}+)-\2\b/iu, msg: 'reduplicated plural after a number or quantifier', suggest: '"$1 $2"' },
  { re: /\bantara\s+satu\s+sama\s+lain\b/i, msg: 'calque of "one another"', suggest: '"sesama sendiri" or restructure' },
];
export function r05_grammar(rows) {
  const out = [];
  for (const r of rows) {
    if (!r.ms) continue;
    const ms = maskPh(r.ms);
    for (const g of ALWAYS) {
      const hit = ms.match(g.re);                       // detect with placeholders blanked out
      if (!hit) continue;
      const m = r.ms.match(g.re) || hit;                // but quote the author's own text in the suggestion
      out.push(F('R05', 'FIX', r, g.msg, g.suggest.replace(/\$(\d)/g, (_, i) => m[i] ?? '')));
    }
  }
  return out;
}

/* ---------- R06 register: pronouns that do not belong in an app ---------- */
export function r06_pronouns(rows, ctx) {
  if (ctx.options.allowCasualPronouns) return [];
  const re = /\b(kamu|awak|engkau|kau|korang|aku)\b/i;
  return rows.filter(r => r.ms && re.test(r.ms))
    .map(r => F('R06', 'FIX', r, `pronoun "${r.ms.match(re)[1]}" in an app string`, 'use "anda" (reader) / "saya" (speaker)'));
}

/* ---------- R07 "Sila" on a button or menu label ---------- */
export function r07_sila_button(rows) {
  return rows.filter(r => r.en && r.ms && words(r.en).length <= 3 && !/[.!?]$/.test(r.en.trim()) && /^\s*sila\b/i.test(r.ms))
    .map(r => F('R07', 'WATCH', r, 'label starts with "Sila"; buttons and menu items take the bare verb', r.ms.replace(/^\s*sila\s+/i, '').replace(/^\p{Ll}/u, c => c.toUpperCase())));
}

/* ---------- R08 ICU plural branches left in MS ---------- */
export function r08_plural(rows) {
  return rows.filter(r => r.ms && /\bplural\s*,/.test(r.ms) && /\b(one|zero|two|few|many)\s*\{/.test(r.ms))
    .map(r => F('R08', 'WATCH', r, 'ICU plural with one/few/many branches; Malay has a single plural category (other)', 'collapse to one form, keep =0 only if its wording differs'));
}

/* ---------- R09 control names quoted in prose must match the translated label ---------- */
const LABEL_SPLIT = /\s[-–—]\s|[,·:(–—]/;          // an intra-word hyphen ("Take-home") does not split
function labelHeads(en) {
  const heads = new Set([en.trim()]);
  const first = en.split(LABEL_SPLIT)[0].trim();
  if (first && first !== en.trim()) heads.add(first);
  return [...heads].filter(h => h.length >= 3 && /^\p{Lu}/u.test(h));
}
export function r09_control_names(rows, ctx) {
  const keepEn = new Set(ctx.terms.filter(t => t.tier === 2).map(t => t.en.toLowerCase()));
  // labels: short EN strings whose MS differs
  const labels = [];
  for (const r of rows) {
    if (!r.en || !r.ms) continue;
    if (words(r.en).length > 4 || r.en.length > 30) continue;
    if (r.en.trim().toLowerCase() === r.ms.trim().toLowerCase()) continue;
    const msHeads = r.ms.split(LABEL_SPLIT)[0].trim();
    for (const h of labelHeads(r.en)) {
      if (keepEn.has(h.toLowerCase())) continue;
      labels.push({ en: h, ms: msHeads || r.ms.trim(), key: r.key, file: r.file });
    }
  }
  // de-duplicate by EN head; if the same EN head maps to several MS labels, keep all
  const byEn = new Map();
  for (const l of labels) { if (!byEn.has(l.en)) byEn.set(l.en, []); byEn.get(l.en).push(l); }
  // standalone: the head appears, and not as part of a longer capitalised name ("Game" in "Game Master")
  const standalone = (text, head) => {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}_])${esc(head)}(?=$|[^\\p{L}\\p{N}_])(\\s+\\p{Lu}\\p{L}*)?`, 'gu');
    let m; while ((m = re.exec(text))) { if (!m[2]) return true; }
    return false;
  };
  const keepPhrases = ctx.terms.filter(t => t.tier === 2 && t.en.includes(' ')).map(t => t.en);
  const hits = new Map(); // enHead -> {ls, keys:[]}
  for (const r of rows) {
    if (!r.en || !r.ms || words(r.en).length < 6) continue;   // prose only
    const enP = maskPhrases(maskPh(r.en), keepPhrases), msP = maskPhrases(maskPh(r.ms), keepPhrases);
    for (const [enHead, ls] of byEn) {
      if (!standalone(msP, enHead) || !standalone(enP, enHead)) continue;
      const msForms = [...new Set(ls.map(l => l.ms))];
      if (msForms.some(f => has(r.ms, f))) continue;        // the MS prose already uses the MS label
      if (!hits.has(enHead)) hits.set(enHead, { ls, msForms, rows: [] });
      hits.get(enHead).rows.push(r);
    }
  }
  const out = [];
  for (const [enHead, h] of hits) {
    const ref = h.ls.map(l => `${l.file}:${l.key}`).slice(0, 2).join(', ');
    if (h.rows.length >= 3) {
      const keys = h.rows.map(r => `${r.file}:${r.key}`);
      out.push({ rule: 'R09', level: 'FIX', file: '*', key: enHead, en: enHead, ms: h.msForms.join(' / '), msg: `label "${enHead}" is translated "${h.msForms.join('" / "')}" (${ref}) but ${h.rows.length} prose strings still say "${enHead}": ${keys.slice(0, 6).join(', ')}${keys.length > 6 ? ', …' : ''} — one form everywhere`, suggest: `decide: "${h.msForms[0]}" in prose, or keep "${enHead}" as a term and add it to the termbase (tier 2)` });
    } else {
      for (const r of h.rows) out.push(F('R09', 'FIX', r, `MS prose names the control "${enHead}" by its English label; the MS label is "${h.msForms.join('" / "')}" (${ref})`, `"${h.msForms[0]}"`));
    }
  }
  return out;
}

/* ---------- R10 termbase: rejected forms, expected renderings, English terms translated ---------- */
export function r10_termbase(rows, ctx) {
  const out = [];
  const keepPhrases = ctx.terms.filter(t => t.tier === 2).map(t => t.en).filter(e => e.includes(' '));
  const bmPhrases = ctx.terms.flatMap(t => (t.bm || '').split('|')).map(b => b.trim()).filter(b => b.includes(' '));
  const seen = new Set();
  for (const r of rows) {
    if (!r.ms) continue;
    // a rejected form inside a chosen multi-word rendering ("aras" in "penanda aras") or inside a
    // placeholder ("{team}") is not a hit
    const msNoPh = maskPh(r.ms);
    const masked = maskPhrases(maskPhrases(msNoPh, bmPhrases), keepPhrases);
    for (const t of ctx.terms) {
      for (const rej of t.reject) {
        const k = `${r.file}|${r.key}|${rej.toLowerCase()}`;
        if (has(masked, rej) && !seen.has(k)) { seen.add(k); out.push(F('R10', 'FIX', r, `rejected form "${rej}" (termbase: ${t.en} → ${t.bm || t.en})`, `"${t.bm || t.en}"`)); }
      }
      if (!r.en) continue;
      // single-word terms are matched with kept-English phrases blanked out on both sides
      const multi = t.en.includes(' ');
      const enText = multi ? maskPh(r.en) : maskPhrases(maskPh(r.en), keepPhrases.filter(p => p !== t.en));
      const msText = multi ? msNoPh : maskPhrases(msNoPh, keepPhrases.filter(p => p !== t.en));
      if (!hasTerm(enText, t.en)) continue;
      const alts = (t.bm || '').split('|').map(x => x.trim()).filter(Boolean);
      const msHas = alts.some(a => has(msText, a));
      const enHas = hasTerm(msText, t.en);
      if (t.tier === 2) {
        // kept if the term appears anywhere in the Malay (also inside a longer kept phrase),
        // or one of the renderings the project allows (bm column: "impact|impak ekonomi")
        const kept = hasTerm(msNoPh, t.en) || alts.some(a => has(msNoPh, a));
        if (!kept) out.push(F('R10', 'WATCH', r, `technical term "${t.en}" not kept in English (termbase tier 2)`, `keep "${t.en}"`));
      } else if (t.tier === 1) {
        const rejectsEn = t.reject.some(x => x.toLowerCase() === t.en.toLowerCase());   // already a FIX above
        if (!msHas && enHas && !rejectsEn) out.push(F('R10', 'WATCH', r, `"${t.en}" left in English; termbase renders it "${alts[0]}"`, `"${alts[0]}"`));
        else if (!msHas && !enHas && !t.reject.some(x => has(msText, x))) out.push(F('R10', 'INFO', r, `"${t.en}" rendered differently from termbase "${alts.join('" / "')}" (may be fine in context)`));
      } else if (t.tier === 3 && t.bm) {
        if (!msHas && !t.reject.some(x => has(msText, x))) out.push(F('R10', 'WATCH', r, `grey-zone term "${t.en}": project chose "${alts.join('" / "')}"`, `"${alts[0]}"`));
      }
    }
  }
  return out;
}

/* ---------- R11 mixed rendering of the same English word across strings ---------- */
export function r11_mixed(rows, ctx) {
  const known = new Set(ctx.terms.map(t => t.en.toLowerCase()));
  const stop = new Set(['the', 'this', 'that', 'your', 'you', 'with', 'from', 'when', 'what', 'where', 'which', 'then', 'than', 'they', 'there', 'their', 'have', 'will', 'into', 'about', 'after', 'before', 'each', 'every', 'only', 'also', 'more', 'most', 'some', 'such', 'next', 'back', 'please', 'click', 'press', 'open', 'show', 'hide', 'start', 'year', 'month', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december']);
  const stats = new Map(); // word -> {kept:[keys], gone:[keys]}
  const phrases = ctx.terms.filter(t => t.tier === 2 && t.en.includes(' ')).map(t => t.en);
  for (const r of rows) {
    if (!r.en || !r.ms) continue;
    let en = r.en;
    for (const p of phrases) en = en.replace(new RegExp(esc(p), 'giu'), ' ');
    const seen = new Set();
    for (const w of en.match(/\b\p{Lu}\p{Ll}{3,}\b/gu) || []) {
      const lw = w.toLowerCase();
      if (seen.has(lw) || stop.has(lw) || known.has(lw)) continue;
      seen.add(lw);
      if (!stats.has(w)) stats.set(w, { kept: [], gone: [] });
      (has(r.ms, w, '') ? stats.get(w).kept : stats.get(w).gone).push(`${r.file}:${r.key}`);
    }
  }
  const out = [];
  for (const [w, s] of stats) {
    if (s.kept.length >= 2 && s.gone.length >= 2) {
      const total = s.kept.length + s.gone.length;
      if (total < 4) continue;
      out.push({ rule: 'R11', level: 'INFO', file: '*', key: w, en: w, ms: '', msg: `"${w}" kept in English in ${s.kept.length} strings, not in ${s.gone.length} — decide once and add it to the termbase (kept: ${s.kept.slice(0, 3).join(', ')}; not: ${s.gone.slice(0, 3).join(', ')})`, suggest: '' });
    }
  }
  return out.sort((a, b) => b.msg.length - a.msg.length);
}

/* ---------- R12 patterns: calques and idioms from patterns.csv ---------- */
export function r12_patterns(rows, ctx) {
  const out = [];
  for (const r of rows) {
    if (!r.ms) continue;
    const ms = maskPh(r.ms);
    for (const p of ctx.patterns) {
      if (p.re.test(ms)) out.push(F('R12', p.level === 'FIX' ? 'FIX' : 'WATCH', r, p.note || `pattern /${p.pattern}/`, p.suggest));
    }
  }
  return out;
}

/* ---------- R13 unchecked termbase entries ---------- */
export function r13_unchecked(rows, ctx) {
  return ctx.terms.filter(t => t.tier !== 2 && t.status !== 'checked' && t.status !== 'n/a')
    .map(t => ({ rule: 'R13', level: 'INFO', file: 'termbase', key: t.en, en: t.en, ms: t.bm, msg: `"${t.bm.split('|')[0]}" not yet checked against PRPM`, suggest: `https://prpm.dbp.gov.my/Cari1?keyword=${encodeURIComponent(t.bm.split('|')[0].trim().split(' ')[0])}` }));
}

export const RULES = [r01_placeholders, r02_missing, r03_length, r04_untranslated, r05_grammar, r06_pronouns, r07_sila_button, r08_plural, r09_control_names, r10_termbase, r11_mixed, r12_patterns, r13_unchecked];

export const RULE_DOC = {
  R01: 'placeholders and markup identical in EN and MS',
  R02: 'every EN key has an MS string',
  R03: 'length growth beyond what Malay normally needs',
  R04: 'MS identical to EN on a multi-word string',
  R05: 'spelling and grammar that are always wrong (adalah merupakan, di sini, di- prefix, counted reduplication)',
  R06: 'pronouns kamu/awak/engkau/kau/aku in app strings',
  R07: '"Sila" on a button or menu label',
  R08: 'ICU plural branches Malay does not need',
  R09: 'control names in prose must use the translated label',
  R10: 'termbase: rejected forms, expected renderings, tier-2 terms kept in English',
  R11: 'the same English word kept in some strings and translated in others',
  R12: 'calque and idiom patterns from patterns.csv',
  R13: 'termbase entries not yet checked against PRPM',
};

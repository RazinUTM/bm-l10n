// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { lint } from '../src/lint.js';
import { loadFile, extractInline } from '../src/load.js';
import { parseCSV, toCSV } from '../src/termbase.js';

const here = dirname(fileURLToPath(import.meta.url));
const fx = f => join(here, 'fixtures', f);
const run = async (opts = {}) => lint([fx('strings.json')], { termbase: fx('termbase.csv'), patterns: join(here, '..', 'termbase', 'patterns.csv'), ...opts });
const find = (res, rule, key) => res.findings.filter(f => f.rule === rule && (!key || f.key === key));

test('loader: json en/ms table pairs by key', async () => {
  const rows = await loadFile(fx('strings.json'));
  assert.equal(rows.length, 15);
  assert.equal(rows.find(r => r.key === 'btn.save').ms, 'Sila simpan');
});

test('loader: inline L(en, ms) calls, template literals included, other call names ignored', async () => {
  const rows = await loadFile(fx('inline.js'));
  assert.equal(rows.length, 3);
  assert.equal(rows[1].en, 'Gold');
  assert.ok(rows[2].en.includes('${t.ap > 1 ? "s" : ""}'));
});

test('csv round trip with quotes and commas', () => {
  const rows = parseCSV('a,b\n"x, y","he said ""hi"""\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'he said "hi"']]);
  assert.ok(toCSV([{ a: 'x, y', b: 'q"q' }], ['a', 'b']).includes('"x, y","q""q"'));
});

test('R01 placeholders: missing {folder} is FIX', async () => {
  const r = await run();
  assert.equal(find(r, 'R01', 'msg.ok').filter(f => f.level === 'FIX').length, 1);
});

test('R05 grammar: di simpan, disini, adalah merupakan, counted reduplication', async () => {
  const r = await run();
  const msgs = find(r, 'R05').map(f => `${f.key}:${f.msg}`);
  assert.ok(msgs.some(m => m.startsWith('msg.ok:') && /di-/.test(m)));
  assert.ok(msgs.some(m => m.startsWith('msg.ok:') && /place word/.test(m)));
  assert.ok(msgs.some(m => m.startsWith('stiff:') && /adalah merupakan/.test(m)));
  assert.ok(msgs.some(m => m.startsWith('files.n:') && /reduplicated/.test(m)));
});

test('R07 Sila on a button label', async () => {
  const r = await run();
  assert.equal(find(r, 'R07', 'btn.save').length, 1);
  assert.equal(find(r, 'R07', 'btn.save')[0].suggest, 'Simpan');
});

test('R08 plural branches', async () => {
  const r = await run();
  assert.equal(find(r, 'R08', 'plural').length, 1);
});

test('R09 control name: "Cash" in prose vs label "Tunai" is FIX; "Game Master" is not a hit for label "Game"', async () => {
  const r = await run();
  assert.equal(find(r, 'R09', 'tip.cash').length, 1);
  assert.equal(find(r, 'R09', 'tip.gm').length, 0);
});

test('R10 termbase: rejected form dijeda, tier-2 term translated as matriks kekakuan', async () => {
  const r = await run();
  assert.ok(find(r, 'R10', 'nav.home.tip').some(f => f.level === 'FIX' && /dijeda/.test(f.msg)));
  assert.ok(find(r, 'R10', 'stiff').some(f => f.level === 'FIX' && /matriks kekakuan/.test(f.msg)));
});

test('R12 patterns: membersihkan hutan is FIX, Level sebelum is WATCH', async () => {
  const r = await run();
  assert.ok(find(r, 'R12', 'esg').some(f => f.level === 'FIX'));
  assert.ok(find(r, 'R12', 'lvl.prev').some(f => f.level === 'WATCH'));
});

test('R04 identical string containing a tier-2 term is not flagged', async () => {
  const r = await run();
  assert.equal(find(r, 'R04', 'same').length, 0);
});

test('R13 lists unchecked tier-1 terms with a PRPM URL', async () => {
  const r = await run();
  const u = find(r, 'R13', 'previous');
  assert.equal(u.length, 1);
  assert.match(u[0].suggest, /prpm\.dbp\.gov\.my\/Cari1\?keyword=sebelumnya/);
});

test('--ignore and --rules filters', async () => {
  const r = await run({ ignore: ['R12'] });
  assert.equal(find(r, 'R12').length, 0);
  const only = await run({ rules: ['R09'] });
  assert.ok(only.findings.every(f => f.rule === 'R09'));
});

test('extractInline handles single quotes and custom call names', () => {
  const rows = extractInline('x.js', `tr('Hello', 'Helo'); tr("A", "B")`, 'tr');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].ms, 'Helo');
});

test('loader: nested en/ms blocks assigned to window', async () => {
  const rows = await loadFile(fx('lessons.js'));
  assert.deepEqual(rows.map(r => r.key).sort(), ['LESSONS.contractor.principle', 'LESSONS.contractor.watch']);
  assert.equal(rows.find(r => r.key.endsWith('watch')).ms, 'Penghunian tahun depan.');
});

test('loader: IIFE that assigns root.X is harvested', async () => {
  const rows = await loadFile(fx('moves-iife.js'));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ms, 'Berkembang secara berfasa');
});

test('loader: Malay-only table yields en = null rows; Malay-side rules still run', async () => {
  const rows = await loadFile(fx('ms-only.js'));
  assert.ok(rows.length >= 3 && rows.every(r => r.en === null));
  const res = await lint([fx('ms-only.js')], { patterns: join(here, '..', 'termbase', 'patterns.csv') });
  assert.ok(res.findings.some(f => f.rule === 'R12' && /bisa/.test(f.msg)));
  assert.ok(res.findings.some(f => f.rule === 'R05' && /place word/.test(f.msg)) === false); // "di sini" is correct
  assert.equal(res.findings.filter(f => f.rule === 'R02').length, 0);                        // no EN, so not "missing"
});

test('loader: a script that throws on load still gives its literal en/ms pairs, with a note', async () => {
  const rows = await loadFile(fx('throws.js'));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ms, 'Penghunian sekarang');
  assert.match(rows.warning, /evaluation stopped early/);
});

test('loader: several inline helper names; unrelated two-string calls ignored', async () => {
  const rows = await loadFile(fx('two-helpers.js'), { callName: 'L,LL' });
  assert.deepEqual(rows.map(r => r.ms), ['Tetapan', 'Fasa 2 · Kembang']);
});

test('R10: a rejected word inside a placeholder or a kept-English phrase is not a hit', async () => {
  const { r10_termbase } = await import('../src/rules.js');
  const terms = [
    { en: 'team', bm: 'pasukan', tier: 1, reject: ['team'], status: 'n/a', source: '', note: '' },
    { en: 'Park Management Team', bm: 'Park Management Team', tier: 2, reject: [], status: 'n/a', source: '', note: '' },
    { en: 'Room', bm: 'Bilik', tier: 1, reject: [], status: 'n/a', source: '', note: '' },
    { en: 'Deal Room', bm: 'Deal Room', tier: 2, reject: [], status: 'n/a', source: '', note: '' },
  ];
  const rows = [
    { file: 'x', key: 'a', en: 'Back to the session · Room {room} · {team}', ms: 'Kembali ke sesi · Bilik {room} · {team}' },
    { file: 'x', key: 'b', en: 'Park Management Team adds one action point.', ms: 'Park Management Team memberi satu action point.' },
    { file: 'x', key: 'c', en: 'Open the Deal Room card.', ms: 'Buka kad Deal Room.' },
    { file: 'x', key: 'd', en: 'Join your team.', ms: 'Sertai team anda.' },
  ];
  const f = r10_termbase(rows, { terms, options: {} });
  assert.deepEqual(f.filter(x => x.level !== 'INFO').map(x => `${x.key}:${x.level}`), ['d:FIX']);
});

test('R02 ignores a plural suffix or an empty pair; R01 ignores plural-s ternaries', async () => {
  const { r02_missing, r01_placeholders } = await import('../src/rules.js');
  const rows = [
    { file: 'x', key: 's', en: 's', ms: '' },
    { file: 'x', key: 'e', en: '', ms: '' },
    { file: 'x', key: 'm', en: 'Missing text', ms: '' },
    { file: 'x', key: 't', en: 'You have ${n} point${n > 1 ? "s" : ""}.', ms: 'Anda ada ${n} point.' },
  ];
  assert.deepEqual(r02_missing(rows).map(f => f.key), ['m']);
  assert.equal(r01_placeholders(rows).length, 0);
});

test('R10 tier 2: a term kept inside a longer phrase counts as kept; allowed alternatives pass', async () => {
  const { r10_termbase } = await import('../src/rules.js');
  const terms = [
    { en: 'fund', bm: 'fund', tier: 2, reject: [], status: 'n/a', source: '', note: '' },
    { en: 'Development Fund', bm: 'Development Fund', tier: 2, reject: [], status: 'n/a', source: '', note: '' },
    { en: 'impact', bm: 'impact|impak ekonomi', tier: 2, reject: [], status: 'n/a', source: '', note: '' },
  ];
  const rows = [
    { file: 'x', key: 'a', en: 'The fund has closed.', ms: 'Development Fund sudah ditutup.' },
    { file: 'x', key: 'b', en: 'Economic impact, Cr/yr', ms: 'Impak ekonomi, Cr/thn' },
    { file: 'x', key: 'c', en: 'Spend the fund before month 24.', ms: 'Belanjakan dana sebelum bulan 24.' },
  ];
  assert.deepEqual(r10_termbase(rows, { terms, options: {} }).map(f => f.key), ['c']);
});

test('R09: "Take" in "Take-home points" is not a label head; "Room" inside "Deal Room" is not a bare label', async () => {
  const { r09_control_names } = await import('../src/rules.js');
  const terms = [{ en: 'Deal Room', bm: 'Deal Room', tier: 2, reject: [], status: 'n/a', source: '', note: '' }];
  const rows = [
    { file: 'x', key: 'lbl1', en: 'Take-home points', ms: 'Perkara utama untuk dibawa pulang' },
    { file: 'x', key: 'lbl2', en: 'Room', ms: 'Bilik' },
    { file: 'x', key: 'p1', en: 'Leave is safe but Take or Conditions can pay when the checks are met.', ms: 'Leave memang selamat tetapi Take atau Conditions boleh berbaloi apabila semakan dipenuhi.' },
    { file: 'x', key: 'p2', en: 'Decide the card in the Deal Room before the month ends.', ms: 'Putuskan kad dalam Deal Room sebelum bulan tamat.' },
  ];
  assert.equal(r09_control_names(rows, { terms, options: {} }).length, 0);
});

test('masking keeps word boundaries: a term next to an HTML tag still matches', async () => {
  const { r10_termbase } = await import('../src/rules.js');
  const terms = [{ en: 'park', bm: 'park', tier: 2, reject: [], status: 'n/a', source: '', note: '' }];
  const rows = [{ file: 'x', key: 'h', en: '<h4>What the park score measures</h4>', ms: '<h4>Apa yang diukur oleh skor park</h4>' }];
  assert.equal(r10_termbase(rows, { terms, options: {} }).length, 0);
});

test('R05 suggestion quotes the original placeholder, not the mask', async () => {
  const r = await run();
  const f = find(r, 'R05', 'files.n')[0];
  assert.equal(f.suggest, '"{n} fail"');
});

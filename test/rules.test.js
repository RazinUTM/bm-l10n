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

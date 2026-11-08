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

test('R03 is opt-in: off by default, on with "with"', async () => {
  const { r03_length } = await import('../src/rules.js');
  const def = await run();
  assert.equal(find(def, 'R03').length, 0);
  const on = await run({ with: ['R03'] });
  const direct = r03_length([{ file: 'x', key: 'k', en: 'New game', ms: 'Permainan yang sangat baharu' }], { options: {} });
  assert.equal(direct.length, 1);
  assert.ok(on.findings.every(f => f.rule !== 'R03' || f.level === 'WATCH'));
});

test('longest match: "linked" inside the termbase term "university-linked" is not the bare term', async () => {
  const { r10_termbase } = await import('../src/rules.js');
  const terms = [
    { en: 'linked', bm: 'linked', tier: 2, reject: [], status: 'n/a', source: '', note: '' },
    { en: 'university-linked', bm: 'berkait universiti', tier: 1, reject: [], status: 'n/a', source: '', note: '' },
  ];
  const rows = [
    { file: 'x', key: 'a', en: 'University-linked', ms: 'Berkait universiti' },
    { file: 'x', key: 'b', en: 'Admit linked tenants first.', ms: 'Terima penyewa berkait universiti dahulu.' },
    { file: 'x', key: 'c', en: 'Admit linked tenants first.', ms: 'Terima penyewa linked dahulu.' },
  ];
  assert.deepEqual(r10_termbase(rows, { terms, options: {} }).filter(f => f.level !== 'INFO').map(f => f.key), ['b']);
});

test('accepted findings leave the counts, stay listed, and a stale entry is reported', async () => {
  const r = await run({ accept: fx('accepted.csv') });
  assert.equal(find(r, 'R07', 'btn.save').length, 0);
  assert.equal(r.summary.accepted, 1);
  assert.equal(r.accepted[0].note, 'author keeps it (test)');
  assert.ok(r.findings.some(f => f.rule === 'R00' && /no longer matches/.test(f.msg)));
});

test('R13: a flagged term (PRPM does not support it) is a WATCH with its note', async () => {
  const { r13_unchecked } = await import('../src/rules.js');
  const terms = [
    { en: 'graduate', bm: 'bergraduat', tier: 1, reject: [], status: 'flagged', source: 'https://prpm.dbp.gov.my/Cari1?keyword=graduat', note: 'graduat is not in Kamus Dewan' },
    { en: 'n/a', bm: 't/b', tier: 1, reject: [], status: 'unchecked', source: '', note: '' },
    { en: 'phase', bm: 'Fasa', tier: 1, reject: [], status: 'checked', source: 'x', note: '' },
  ];
  const f = r13_unchecked([], { terms, options: {} });
  assert.deepEqual(f.map(x => `${x.key}:${x.level}`), ['graduate:WATCH', 'n/a:INFO']);
  assert.match(f[0].msg, /not in Kamus Dewan/);
});

/* ---------- v0.1.3 loader: HTML pairs, built strings, pair arrays ---------- */
test('HTML loader pairs en/ms siblings, keeps markup, reports unpaired elements', async () => {
  const rows = await loadFile(fx('page.html'));
  const by = s => rows.find(r => (r.en || '').startsWith(s) || (r.en == null && (r.ms || '').startsWith(s)));
  assert.equal(by('Notes').ms, 'Nota');
  assert.equal(by('Notes').key.startsWith('t-notes/span@'), true);
  assert.equal(by('1 Why').ms, '1 Mengapa influence line?');
  const lead = by('The load');
  assert.equal(lead.en, 'The load moves along the <b>beam</b>; \\(\\eta_A(x)\\) changes.');
  assert.equal(lead.ms, 'Load bergerak di sepanjang <b>beam</b>; \\(\\eta_A(x)\\) berubah.');
  assert.equal(by('An English paragraph').ms, '');                      // en without ms: R02 will report it
  assert.equal(by('Ayat Melayu').en, null);                             // ms without en: Malay-only row
  assert.equal(by('Outer').ms, 'Luar <span class="ms">dalam</span> teks'); // nested en/ms belong to the outer string
  assert.equal(by('Search').ms, 'Cari, contoh kgf');                    // data-ph-en / data-ph-ms
  assert.equal(by('Tom').en, 'Tom & Jerry &lt;3');                 // entities decoded, except &lt; &gt;
  assert.equal(rows.some(r => /commented|in a script|not a string/.test(r.en || '')), false);
  assert.equal(rows.length, 8);
  assert.match(rows.warning, /1 "en" element\(s\) without a "ms" partner/);
  assert.match(rows.warning, /1 "ms" element\(s\) without a "en" partner/);
  assert.match(rows.warning, /2 en\/ms element\(s\) inside another/);
});

test('JS loader reads built strings, skipped arguments, indexed literals and pair arrays', async () => {
  const rows = await loadFile(fx('built-strings.js'), { callName: 'L2,tx:1', pairArrays: true });
  const by = s => rows.find(r => (r.en || '').startsWith(s));
  assert.equal(by('Correct.').ms, 'Betul.');
  assert.deepEqual([by('Score').en, by('Score').ms], ['Score ${e1} / ${e2} answered', 'Skor ${e1} / ${e2} dijawab']);
  assert.equal(by(' · time ').ms, ' · masa ');                           // a call nested in another expression
  assert.deepEqual([by('${e1} of 8').en, by('${e1} of 8').ms], ['${e1} of 8 sections read', 'Bahagian dibaca: ${e1} daripada 8']);
  assert.equal(by('The PDF').ms, 'PDF tidak dapat disimpan di sini.');
  assert.equal(by('Theme: dark').ms, 'Tema: gelap');
  assert.equal(by('(b) load on CD').ms, '(b) load pada CD');
  assert.equal(by('Done').ms, 'Selesai');                                 // inside a template literal
  assert.equal(by('The mass').ms, 'Jisim berada di halt 5. Yang mana benar?');
  assert.equal(by('it doubles').ms, 'ia berganda');
  assert.equal(rows.some(r => r.en === 'R_A' || r.en === 'R_C'), false);  // symbol pairs are not language pairs
  assert.deepEqual([by('Lab ·').en, by('Lab ·').ms], ['Lab · checklist (${e1} of 7 items)', 'Makmal · senarai semak (${e1} daripada 7 item)']);
  const sum = by('Sum =');
  assert.equal(sum.en, "Sum = <b class='num'>${e1} kgf</b> against ${e2} kgf (${e3})");
  assert.equal(sum.ms, "Jumlah = <b class='num'>${e1} kgf</b> berbanding ${e2} kgf (${e3})");  // ternaries with different text share a number
  assert.equal(by('R = 0.5').en, 'R = 0.5 w');                       // \u escapes decoded
  assert.equal(rows.some(r => /data-en/.test(r.en || '')), false);
  assert.match(rows.warning, /12 helper call\(s\): 10 read, 1 with variables only, 1 not read \(.*line 11\)/);    // L2(el.getAttribute(...), ...) is dynamic
});

test('pair arrays are off unless asked for', async () => {
  const rows = await loadFile(fx('built-strings.js'), { callName: 'L2,tx:1' });
  assert.equal(rows.some(r => r.en === 'it doubles'), false);
});

test('built strings with a localised expression on each side are not a placeholder error', async () => {
  const { r01_placeholders } = await import('../src/rules.js');
  const rows = extractInline('x.js', 'L(item.en + " ordered in Zone " + z + ".", item.ms + " diarahkan di Zon " + z + ".")', 'L');
  assert.equal(rows[0].en, '${e1} ordered in Zone ${e2}.');
  assert.equal(rows[0].ms, '${e3} diarahkan di Zon ${e2}.');
  assert.deepEqual(r01_placeholders(rows), []);
});

/* ---------- v0.1.3 rule fixes from the Lab S2 out-of-sample test ---------- */
test('R05 does not flag "antara satu sama lain" (DBP: correct)', async () => {
  const { r05_grammar } = await import('../src/rules.js');
  const rows = [{ file: 'p.html', key: 'k', en: 'rotate relative to each other', ms: 'berputar relatif antara satu sama lain' }];
  assert.deepEqual(r05_grammar(rows), []);
});

test('R09 does not split a name at an unspaced en dash', async () => {
  const { r09_control_names } = await import('../src/rules.js');
  const rows = [
    { file: 'p.html', key: 'h', en: 'Müller–Breslau principle', ms: 'Prinsip Müller–Breslau' },
    { file: 'p.html', key: 'a', en: 'Müller–Breslau: release the support, displace it and read the shape', ms: 'Müller–Breslau: lepaskan support, anjakkan dan baca bentuknya' },
    { file: 'p.html', key: 'b', en: 'Use the Müller–Breslau method to find the ordinate at halt 4', ms: 'Guna kaedah Müller–Breslau untuk mencari ordinate di halt 4' },
    { file: 'p.html', key: 'c', en: 'The Müller–Breslau shortcut gives the shape of every line', ms: 'Jalan pintas Müller–Breslau memberi bentuk setiap garis' },
  ];
  assert.deepEqual(r09_control_names(rows, { terms: [], options: {} }), []);
  // a spaced dash still separates a label from its description
  const rows2 = [
    { file: 'p.html', key: 'l', en: 'Explorer – tasks', ms: 'Penjelajah – tugasan' },
    { file: 'p.html', key: 'p', en: 'Open the Explorer and try all five tasks before the lab', ms: 'Buka Explorer dan cuba kelima-lima tugasan sebelum makmal' },
  ];
  assert.equal(r09_control_names(rows2, { terms: [], options: {} }).length, 1);
});

test('R11 counts a kept word in lower case as kept', async () => {
  const { r11_mixed } = await import('../src/rules.js');
  const rows = ['Gauge resolution, ±1 division|Resolusi gauge, ±1 division', 'Gauge reading that does not return to zero|Bacaan gauge yang tidak kembali ke sifar',
    'Gauge ±1 division|Gauge ±1 division', 'Gauge, ±1 division|Gauge, ±1 division'].map((x, i) => { const [en, ms] = x.split('|'); return { file: 'p.html', key: String(i), en, ms }; });
  assert.deepEqual(r11_mixed(rows, { terms: [], options: {} }), []);
});

test('pattern: di mana / yang mana as a relative word, not in questions', async () => {
  const { loadPatterns } = await import('../src/termbase.js');
  const { r12_patterns } = await import('../src/rules.js');
  const patterns = (await loadPatterns(join(here, '..', 'termbase', 'patterns.csv'))).filter(p => /mana/.test(p.pattern));
  const hit = ms => r12_patterns([{ file: 'x', key: 'k', en: 'x', ms }], { patterns }).length > 0;
  assert.equal(hit('B ialah titik di mana moment diambil, bukan tempat beam melentur.'), true);
  assert.equal(hit('Perbezaan hanya bermakna di halt 2, di mana η = 0.2, dan bukan di tempat lain.'), true);
  assert.equal(hit('Pilih jawapan yang mana sesuai dengan data.'), true);
  assert.equal(hit('Di mana anda tinggal?'), false);
  assert.equal(hit('Pernyataan yang mana benar?'), false);
  assert.equal(hit('Dengan jisim di mana-mana halt, jumlah bacaan sama dengan beban.'), false);
  assert.equal(hit('Tentukan di mana load perlu diletakkan.'), false);
  assert.equal(hit('Di mana ada kemahuan, di situ ada jalan.'), false);
  assert.equal(hit('Jumlahnya mesti sama, walau di mana pun jisim itu berada.'), false);   // concessive, not relative
});

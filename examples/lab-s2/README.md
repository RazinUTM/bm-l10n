# Lab S2: the out-of-sample test (8 November 2026)

bm-l10n's rules were written and tuned on one project, IMPAK Technovation Park. This test runs
them, unchanged, on a project they had never seen: SEAA 3012 Lab S2 *Influence Lines*
(`RazinUTM/My_Lectures` @ `25799b0`). The protocol was fixed and pushed before the run
([PROTOCOL.md](PROTOCOL.md)); the loader's coverage was recorded before the run
([coverage.md](coverage.md)); a random sample was audited by hand before the findings were
read ([sample-audit.json](sample-audit.json)).

## Result in one paragraph

On 756 strings the frozen v0.1.2 rules reported **FIX 2 · WATCH 2 · INFO 2**. Both FIX findings
were false, and either one would have failed a CI check: a grammar entry that DBP itself
contradicts, and a label heuristic that split the name *Müller–Breslau*. Both WATCH findings
were real (one change, one termbase decision). The blind audit found an issue an editor would
change in 9 of 80 sampled strings; run 1 caught **none of the 9**. Out of the box, on a project
written in a different style, the generic rules found almost nothing and raised two false
alarms that would block a build.

## Run 1: frozen v0.1.2 rules

Settings: `--patterns termbase/patterns.csv --call L2,tx:1 --pair-arrays`, no termbase (Lab S2 has
none), R03 off. Report: [run1.md](run1.md); labels with reasons: [run1-labels.json](run1-labels.json).

| # | Rule | Level | Where | Label | Why |
|---|---|---|---|---|---|
| 1 | R05 | FIX | `p1_start_notes.html` n2, *berputar relatif antara satu sama lain* | FP | The R05 entry was wrong: DBP Khidmat Nasihat says *antara satu sama lain* is correct (21.02.2011, 05.11.2011), and Kamus Dewan uses it. |
| 2 | R09 | FIX | label *Müller–Breslau principle*, 5 prose strings | FP | The label was split at the unspaced en dash, so "Müller" was read as a control name. |
| 3 | R04 | WATCH | `p3` lab sheet, *kgf per division* | TP-decision | Identical by the author's rule (kgf a unit, division a kept term); belongs in a termbase. |
| 4 | R12 | WATCH | `p2` slide button *Previous* = *Sebelum* | TP-change | A label needs *Sebelumnya* (Next is *Seterusnya*); the author chose the same form for IMPAK. |
| 5 | R11 | INFO | *Gauge* kept in 3, not in 2 | FP | Kept in all 5; in 2 the Malay word order puts it mid-sentence as *gauge*, and the match was case-sensitive. |
| 6 | R11 | INFO | *Worked* kept in 7, not in 18 | TP-decision | Two terms share the word: *Worked example* kept, *Worked solution* = *Penyelesaian*. Debatable. |

Precision (Claude's labels; the author's review is pending, and his answer wins where it differs).
The intervals are 95 % Wilson intervals; with four findings they are wide.

| | Findings | Strict (text should change) | Standard (change or decision) |
|---|---|---|---|
| FIX | 2 | 0/2 (0–66 %) | 0/2 (0–66 %) |
| WATCH | 2 | 1/2 (9–91 %) | 2/2 (34–100 %) |
| FIX + WATCH | 4 | 1/4 (5–70 %) | 2/4 (15–85 %) |
| INFO | 2 | 0/2 | 1/2 |

For comparison, the in-sample figure on IMPAK main after tuning was WATCH 20/20 real decisions
and no FIX. The drop is in FIX: both FIX findings came from rules that had never met these text
shapes on IMPAK.

## Recall: the blind sample

80 rows drawn with `random.Random(20261108)` from the 756 rows in code-point order, audited with
the terjemah-bm-dbp procedure before run 1 was opened ([sample-80.json](sample-80.json),
[sample-audit.json](sample-audit.json)).

- 9 of 80 rows have an issue an editor would change (11 %; 95 % interval 6–20 %, so somewhere
  around 45 to 150 strings app-wide). All are WATCH level; none is a FIX-type error (no
  placeholder, missing-string, pronoun, Indonesian-form or spacing error in the sample).
- 4 are *mechanical* (a rule could catch them from the text alone): *di mana* as a relative word;
  *page*, *full screen* and *browser* kept in English where established Malay UI words exist;
  *didarab jarak … dibahagi span* without *dengan*.
- 5 are *taste*: *teka* for *meneka*, *berlaku dengan* for *apabila*, *setiap 17 halt* (readable as
  every 17th halt), *Bandingkan dengan* for *berdasarkan*, *Section* in its everyday sense.
- **Run 1 caught 0 of 9** (95 % interval 0–30 %), **0 of 4 mechanical** (0–49 %).

## What this shows, and what it does not

It shows that the generic layer (R05, the shipped patterns) reflects IMPAK's errors, which were
calques typical of machine-drafted Malay (*membeli masa*, *bisa*, *membersihkan hutan*). Lab S2's
Malay has a different profile: no Indonesian forms, no pronoun or *Sila* problems, no spacing
errors; its issues are relative-clause calques, everyday English words kept, and phrasing. It also
shows that a generic FIX entry without recorded DBP evidence is a liability: the one that failed
was an entry written from memory in v0.1.0.

It does not show a stable precision figure: four FIX/WATCH findings cannot. It does not test R10
and R13, which need a termbase; with one, several of the sample's "decision" issues (*page*, *full
screen*, *browser*, *division*) become checks. The labels are Claude's until the author reviews
them. And it is one second project, by the same author.

## v0.1.3 and run 2 (not out-of-sample)

After run 1 was labelled and committed, v0.1.3 changed the rules:

- R05: *antara satu sama lain* removed, with the DBP evidence in a code comment.
- R09: a label no longer splits at an unspaced en dash.
- R11: a kept word counts as kept in lower case.
- `patterns.csv`: *di mana* / *yang mana* / *dalam mana* / *dengan mana* used as a relative word
  (WATCH), per DBP Khidmat Nasihat (12.08.2010, 27.08.2012, 14.07.2017). Questions, *di mana-mana*
  and the concessive *walau di mana pun* are left alone. The first version of this pattern also
  flagged *walau di mana pun*; it was corrected on this data, which is one more reason run 2 is not
  out-of-sample.

Run 2 ([run2.md](run2.md), [run2-labels.json](run2-labels.json)): **FIX 0 · WATCH 14 · INFO 1**:
12 *di mana* (all 12 relative uses in Lab S2, none of the 4 correct uses), *Sebelum*, *kgf per
division*, and *Worked* (INFO). Strict 13/14, standard 14/14; sample recall 1/9 (the *di mana*
row). These are in-sample numbers and say only that the fixes do what they were written to do.

IMPAK under v0.1.3: every v0.1.2 finding unchanged; the loader now reads 65 more strings (built
by concatenation), and they add one WATCH, *fund lapsed* → *dana … luput* (R10, tier-2 *fund*),
a decision for the author like N2 and N7 in his review. The IMPAK workflow pins v0.1.2, so his
check does not change until he moves the pin.

## Lessons for bm-l10n

1. Every FIX-level generic entry (R05 rows, FIX patterns) should carry a PRPM evidence URL, as
   termbase rows do; an entry without evidence should be WATCH. (v0.1.4 task.)
2. A generic layer can only catch what is wrong everywhere. Most of what Lab S2 needs (which
   English words to keep) is a project decision, so the useful next step for Lab S2 is a termbase,
   seeded from its glossary tab, not more generic patterns.
3. Phrasing issues (5 of 9 in the sample) are out of a linter's reach; they stay with the
   authoring skill and human review, as DESIGN §1 says.
4. The loader now reads HTML pages with `en`/`ms` siblings and strings built by concatenation.
   Accessibility text is still outside its reach: 112 `aria-label` attributes (on 72 lines) and 3
   `title` attributes carry English only in the HTML (the language switch says *Language /
   Bahasa*; `app.js` updates two labels at run time) and sit outside any pair.

## Findings for the author (decisions, not yet applied)

| # | What | Where | Suggestion |
|---|---|---|---|
| 1 | *Previous* = *Sebelum* | slide navigation | *Sebelumnya* |
| 2 | *di mana* as a relative word | 12 strings (notes n1, n2, n4, n6; slides; Explorer, exercises, `app.js`) | *yang*, *tempat* or *iaitu*, or split the sentence |
| 3 | English kept where Malay UI words exist: *page* (3), *full screen* (3), *browser* (2) | Start tab, glossary, slides, `app.js` | keep and record, or *halaman*, *skrin penuh*, *pelayar* |
| 4 | *section* in the everyday sense (notes sections) | progress and "Section read" | keep (structural *section* rightly stays English), or *bahagian* (already used for the five parts) |
| 5 | kept terms to record | *division*, *Worked example*, *gauge*, … | a Lab S2 termbase |
| 6 | phrasing from the sample | 5 strings | *meneka*; *berlaku apabila*; *setiap satu daripada 17 halt*; *Bandingkan berdasarkan*; *didarab dengan … dibahagi dengan* |
| 7 | English-only accessibility labels | 112 `aria-label` (72 lines), 3 `title` | decide whether they follow the language switch |

## Files

| File | What |
|---|---|
| `PROTOCOL.md` | the protocol, pushed before the run (`fda6aba`; amended before the run in `bbb5cc4`) |
| `coverage.md` | rows read against the markup, before the run (`a175a9b`) |
| `sample-80.json`, `sample-audit.json` | the blind sample and its audit (`eac1632`) |
| `run1.*` | run 1 report, JSON, log, labels and metrics (`ed201b8`) |
| `run2.*` | run 2 with v0.1.3 (`142efdc`) |

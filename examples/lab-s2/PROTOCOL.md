# Lab S2 out-of-sample test: protocol

Written on 8 November 2026, before the first lint run on Lab S2. Nothing in this file was
changed after the run, except the two fields marked *(filled before the run)* below.

## Question

How well do the bm-l10n rules, tuned on one project (IMPAK Technovation Park), work on
a project they have never seen? Measured: precision of the findings, recall on a random
sample audited by hand, and coverage of the loader.

## What is frozen

The rules and patterns stay exactly as released in v0.1.2 (`f039eb5`):

| File | SHA-256 |
|---|---|
| `src/rules.js` | `90b55ce8f5720e257d2970af9b1a0c6525e7862be8702b3d6a1823e28444e0ea` |
| `termbase/patterns.csv` | `95584e633c8fbcb00a5f64cdf5b612e0224ab28b4ad4614e879b62d398f7a220` |
| `src/lint.js` | `ae0927ad9a756c5a95b908b04d9e350868a5fe8f7dde05fb63e8f7596ef0b936` (v0.1.2) |

`src/lint.js` may change in one place only: the options it passes to the loader (needed
for the new loader option `pairArrays`). Finding logic, filtering and counting stay as they
are; the diff is shown in the report.

## What is new

Lab S2 keeps its strings in a format bm-l10n could not read in v0.1.2, so a loader is
added (the author's answer to DESIGN §9 Q3: the next loader is Lab S2's format). The loader
was designed from a survey of the markup (marker counts, helper names), not from lint
results:

1. **HTML pairs**: an element whose class list has `en`, followed by a sibling element (only
   whitespace between them) whose class list has `ms`. The inner HTML is kept as stored,
   markup included, the same way the JSON and JS loaders keep `<b>` inside a string;
   whitespace runs become one space. An `en` element with no `ms` partner becomes a row with
   an empty Malay side; an `ms` element with no partner becomes a Malay-only row. Elements
   inside another `en`/`ms` element are part of it, not separate rows. Attribute pairs
   `data-…-en` / `data-…-ms` on one element are read too. `<script>`, `<style>` and comments
   are skipped.
2. **JS helper calls with built strings**: `L2("…" + n + "…", "…" + n + "…")` is read as the
   equivalent template literal, each non-literal operand becoming `${eN}`, numbered by the
   expression's text with its string literals blanked, so the same expression gets the same
   number on both sides. *(Amended before the run: the first version used `{eN}`; the IMPAK
   regression check showed that a localised expression such as `item.en` / `item.ms` then
   reads as a placeholder error, while the rules already treat `${…}` as template expressions
   whose names may differ by side. A concatenation is a template literal written another way,
   so `${eN}` is the faithful form.)* `name:k` skips `k` leading arguments (`tx:1` for `tx(el, en, ms)`). Calls whose
   arguments are `{…}[key]` maps or `[…][i]` arrays of the same shape are paired element by
   element. `en: <expr>, ms: <expr>` object properties are read the same way.
3. **Pair arrays** (opt-in, `--pair-arrays`): a two-element array of string literals is read
   as `[en, ms]` when at least one element contains a space (`["it doubles", "ia berganda"]`;
   not `["R_A", "R_B"]`).

## Inputs and settings

- Repository `RazinUTM/My_Lectures` at `25799b0`, folder
  `SEAA3012-CE-Lab-II/S2-influence-lines/web/src/`: `p1_start_notes.html`,
  `p2_slides.html`, `p3_explorer_ex_lab.html`, `app.js`. These are the sources the author
  edits; `index.html` and the tutor manifest are generated from them. The shared `rz-tutor`
  widget is out of scope (a separate component with its own version).
- `bml lint --patterns termbase/patterns.csv --call L2,tx:1 --pair-arrays --no-fail`, no
  termbase (Lab S2 has none), default rules (R03 off). This is what a new user gets on day
  one; R10 and R13 need a termbase and are therefore not tested here.
- Loader commit *(filled before the run)*: see the report.
- IMPAK regression with the new loader (branch `bm-lint-termbase` @ `4a8bcf8`): every v0.1.2
  finding is unchanged; 65 more strings are read (built strings), and they add one WATCH
  (*fund lapsed* → *dana … luput*, R10, a real decision for the author).
- Rows read per file against marker counts *(filled before the run)*: see the report.

## Labels

Each finding as reported is one unit (an aggregated R09 or R11 finding counts once).

- **TP-change**: the string has the defect the rule names, and the text should change.
- **TP-decision**: the observation is right (a term kept in some strings and translated in
  others, a string identical to EN), the text may stay, and a project decision is worth
  recording (termbase row or accepted finding). The in-sample WATCH findings on IMPAK were
  counted this way.
- **FP**: the claim is false for this string, or the flag would be dismissed with neither a
  change nor a decision worth recording. Each FP gets a cause: `markup` (tags or math read
  as words or numbers), `loader` (pairing or extraction artefact), `term` (a technical term
  or symbol read as an untranslated word), `pattern` (a pattern matched another sense),
  `other`.

Precision is reported strict (TP-change / all) and standard ((TP-change + TP-decision) /
all), for FIX, WATCH and both; INFO separately. Claude labels first with a one-line reason
per finding; the author reviews the labels, his answer wins where they differ, and both
sets are kept.

## Recall

Before run 1 is read, a random sample of 80 rows is drawn from all loaded rows (sorted by
file and key; Python `random.Random(20261108).sample`) and audited by hand with the
terjemah-bm-dbp audit procedure. Each issue is classed FIX or WATCH, and *mechanical* (a
rule could catch it from the text alone) or *taste*. An issue counts as caught when run 1
has a finding on that row, or an aggregated finding naming it, about the same problem.
Recall is reported on all issues and on mechanical issues.

## After run 1

No rule or pattern changes until the run-1 labels are saved. Fixes for the false
positives go into v0.1.3 and are measured as run 2 on the same inputs; run 2 is no longer
out-of-sample and is reported apart.

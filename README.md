# bm-l10n

A small toolkit for localising apps into **Bahasa Melayu (Malaysia)** the way a Malaysian would write it: everyday words in DBP-standard Malay, engineering / science / computing and product terms kept in English, and every terminology decision recorded once with its evidence.

It ships one command, `bml lint`: mechanical checks on EN/MS string files against a project **termbase** and a **pattern list**, reported as FIX / WATCH / INFO. It is the QA layer: the writing is done by a person or in a Claude session with the `terjemah-bm-dbp` skill, and the check runs on every pull request. An evaluation harness (`bml eval`) is planned (see `DESIGN.md`).

It does **not** translate, and it does **not** contain or fetch dictionary content: PRPM (prpm.dbp.gov.my) belongs to Dewan Bahasa dan Pustaka. The termbase stores *your decision and the URL that supports it*.

## Use it from the browser (GitHub Actions, no terminal)

1. Put the termbase in your app's repository, e.g. `content/termbase-bm.csv` (format below). You can edit it later in the browser: open the file on GitHub and press the pencil.
2. Add this workflow as `.github/workflows/bm-lint.yml` (Claude can open this pull request for you):

   ```yaml
   name: BM lint
   on:
     pull_request:
     workflow_dispatch:
   permissions:
     contents: read
   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: RazinUTM/bm-l10n@<commit-sha>   # v0.1.2
           with:
             files: src/i18n.js content/texts.js src/game.js
             termbase: content/termbase-bm.csv
             accepted: content/bm-lint-accepted.csv
             call: L,LL
   ```

3. Every pull request now shows a **BM lint** check. Green: no FIX finding. Red: at least one; open *Details → Summary* for the report. FIX and WATCH findings also appear as notes on the changed files.
4. To check the current state at any time: *Actions → BM lint → Run workflow*.

Pin `uses:` to a commit SHA (or to a release tag once one exists) so a later change to bm-l10n never changes your check without a pull request of your own.

## Install and run from a terminal

Node ≥ 18, no dependencies.

```bash
git clone https://github.com/RazinUTM/bm-l10n && cd bm-l10n
npm test
node bin/bml.js lint --termbase examples/impak/termbase.csv --patterns termbase/patterns.csv \
  path/to/src/i18n.js path/to/content/texts.js path/to/src/game.js
```

Or, from your own project after `npm link`:

```bash
bml lint src/i18n.js            # uses ./termbase.csv and ./patterns.csv if present
bml lint --format json --out lint.json locales/*.json
bml terms termbase.csv          # list the termbase and its check status
bml dbp   termbase.csv          # PRPM URLs for the entries still marked unchecked
```

Exit code is 1 when there is at least one FIX (use `--no-fail` to disable), so `bml lint` can gate CI. `--accept bm-lint-accepted.csv` (default when present) applies the accepted findings; `--with R03` turns on the length rule.

### Input files

| Shape | Example |
|---|---|
| JSON `{ "en": {...}, "ms": {...} }` (nested keys allowed) | `locales/strings.json` |
| JSON flat `{ "key": { "en": "...", "ms": "..." } }` or `[{ "term", "en", "ms" }]` | glossary exports |
| JS script or module declaring `const X = { en: {...}, ms: {...} }` or a glossary array | `src/i18n.js`, `content/texts.js` |
| JS with inline calls `L("English", "Melayu")` (`--call L,LL` for several helper names) | `src/game.js` |
| JS objects at any depth with `en`/`ms` sub-objects or strings, including scripts that assign `window.X = …` or `root.X = …` inside an IIFE | `content/lessons.js`, `content/moves.js` |
| JS tables that hold Malay only (translations of text whose English lives elsewhere) | `content/game-ms.js` |

JS files are evaluated in a `node:vm` sandbox with no access to the host; functions and side effects are ignored. If a script stops with an error part-way, whatever it defined before the error is still read, literal `en: '…', ms: '…'` pairs are read by pattern, and the report says so. Malay-only strings are checked on the Malay side alone (grammar, pronouns, rejected forms, patterns).

## What it checks

| Rule | Level | Catches |
|---|---|---|
| R01 | FIX | placeholders / tags that differ between EN and MS (`{x}`, `%s`, `<b>`); template `${}` count differences are WATCH |
| R02 | FIX | missing MS string |
| R03 | WATCH | strings that grew far beyond the 1.15–1.3× Malay normally needs (off unless `--with R03`) |
| R04 | WATCH | multi-word MS identical to EN with no tier-2 term inside |
| R05 | FIX | `adalah merupakan`, `disini` / `kesana`, `di simpan`, `3 fail-fail` |
| R06 | FIX | `kamu / awak / engkau / kau / aku` in app strings (`--casual` to allow a persona voice) |
| R07 | WATCH | `Sila` on a button or menu label |
| R08 | WATCH | ICU plural branches Malay does not need |
| R09 | FIX | prose that names a control by its English label while the label itself is translated (`tile Cash` vs label `Tunai`) |
| R10 | FIX / WATCH | termbase: rejected forms, technical terms translated, chosen renderings not used |
| R11 | INFO | the same English word kept in some strings and translated in others |
| R12 | FIX / WATCH | calques and Indonesian forms from `patterns.csv` (`bisa`, `unduh`, "buys time", `(pilihan)`, `membersihkan hutan`, …) |
| R13 | INFO / WATCH | termbase entries not yet checked against PRPM, with the URL to open; WATCH for a form the check found unsupported (`status=flagged`) |

Strings that pass every rule are not listed. That means they contain no mechanical error; it says nothing about whether they read well — that judgement stays with a Malay-speaking reviewer or the authoring prompt.

## The termbase

`termbase.csv` — one row per English term:

| column | meaning |
|---|---|
| `en` | the English term; a capitalised entry (`Level`) matches case-sensitively, lower-case matches any case |
| `bm` | the Malay rendering your project chose; equals `en` for tier 2. Several allowed renderings are separated by `\|` (`impact\|impak ekonomi`) |
| `tier` | `1` translate · `2` keep in English · `3` grey zone, decided per project |
| `reject` | forms that must not appear, `\|`-separated (`dijeda`, `matriks kekakuan`) |
| `status` | `checked` / `unchecked` / `flagged` / `n/a` — whether `bm` was checked against PRPM; `flagged` = checked, and PRPM does not support it |
| `source` | the PRPM URL (or other evidence) for the choice |
| `note` | why |

Three tiers, one test: *would the term appear as-is in an English journal paper, textbook, API reference or your product's own glossary?* If yes, tier 2 — keep it in English, whole, unglossed. The reason is practical: DBP's technical registers are not consistent across fields (PRPM gives *pekali kekakuan*, *matriks ketegangan* and *kekakuan lentur* for one concept), and a learner who meets the Malay coinage cannot search for it or find it in the software.

A term inside a longer termbase term is not checked as the bare term there: with `university-linked → berkait universiti` in the termbase, *linked* (kept in English) is not expected inside *University-linked*.

`bm-lint-accepted.csv` — `rule, file, match, note`: findings the author has decided to keep. They leave the counts and appear under *Accepted* at the end of the report; `match` is a piece of the English or Malay text, so the entry survives code moving; an entry that no longer matches anything is reported, so the list stays honest.

`patterns.csv` — `pattern, level, suggest, note, flags`: regular expressions over MS strings with a level each. The shipped list is generic Malaysian Malay; add project rows or a second file.

A worked example lives in `examples/impak/`: the termbase taken from IMPAK – Technovation Park's own BM glossary and the lint report on its main branch (1,578 strings in 11 files, 8 Nov 2026).

## Checking terms against PRPM

`bml dbp termbase.csv` prints one PRPM URL per unchecked entry. Open them one at a time — PRPM rate-limits parallel requests — and record `status=checked` and the URL. The `prpm-dbp` CLI (`npx prpm-dbp lookup <word>`) does the same from a terminal with a local cache; it is not a dependency of this project. Either way the dictionary text stays out of your repository.

## Licence

MIT — Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia. See `LICENSE`.

## Code authorship and AI-assisted development

Designed and reviewed by the author; code, tests and the seed termbase were generated with Claude (claude.ai) from the design note and a manual audit of a real project. Details per module in `AI_USAGE.md`; design decisions in `DECISIONS.md`.

## Third-party components

None bundled. `THIRD_PARTY_LICENSES.md` records the external resources the tool points to (PRPM, `prpm-dbp`, candidate MT backends) and their licences.

## Validation status

`npm test` runs 29 tests covering every rule's positive case and the false positives met in the field. On IMPAK's 5 Nov code the lint reported 9 of the 11 FIX items found by a manual audit, plus one the audit missed (medal labels `Emas / Perak / Gangsa` vs prose `Gold / Silver / Bronze`); the author had fixed all of them by 7 Nov; on 8 Nov main gave FIX 0 and 20 WATCH, which the author answered in a review page; after his answers the check reports FIX 0, WATCH 1 (a form PRPM does not support) and 5 accepted findings. Those figures are in-sample (rules were tuned on this project); a second project is the next test. Termbase rows marked `unchecked` still need their PRPM evidence.

## Disclaimer

A lint pass is not a proofreading pass. Research and teaching software provided as is.

## How to cite

See `CITATION.cff`.

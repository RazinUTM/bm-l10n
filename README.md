# bm-l10n

A small toolkit for localising apps into **Bahasa Melayu (Malaysia)** the way a Malaysian would write it: everyday words in DBP-standard Malay, engineering / science / computing and product terms kept in English, and every terminology decision recorded once with its evidence.

v0.1 ships one command, `bml lint`: mechanical checks on EN/MS string files against a project **termbase** and a **pattern list**, reported as FIX / WATCH / INFO. It is the QA layer; the writing is done by a person or by an authoring prompt, and a draft backend (`bml draft`) and an evaluation harness (`bml eval`) are planned (see `DESIGN.md`).

It does **not** translate, and it does **not** contain or fetch dictionary content: PRPM (prpm.dbp.gov.my) belongs to Dewan Bahasa dan Pustaka. The termbase stores *your decision and the URL that supports it*.

## Install and run

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

Exit code is 1 when there is at least one FIX (use `--no-fail` to disable), so `bml lint` can gate CI.

### Input files

| Shape | Example |
|---|---|
| JSON `{ "en": {...}, "ms": {...} }` (nested keys allowed) | `locales/strings.json` |
| JSON flat `{ "key": { "en": "...", "ms": "..." } }` or `[{ "term", "en", "ms" }]` | glossary exports |
| JS script or module declaring `const X = { en: {...}, ms: {...} }` or a glossary array | `src/i18n.js`, `content/texts.js` |
| JS with inline calls `L("English", "Melayu")` (`--call tr` to change the name) | `src/game.js` |

JS files are evaluated in a `node:vm` sandbox with no access to the host; functions and side effects are ignored.

## What it checks

| Rule | Level | Catches |
|---|---|---|
| R01 | FIX | placeholders / tags that differ between EN and MS (`{x}`, `%s`, `<b>`); template `${}` count differences are WATCH |
| R02 | FIX | missing MS string |
| R03 | WATCH | strings that grew far beyond the 1.15–1.3× Malay normally needs |
| R04 | WATCH | multi-word MS identical to EN with no tier-2 term inside |
| R05 | FIX | `adalah merupakan`, `disini` / `kesana`, `di simpan`, `3 fail-fail` |
| R06 | FIX | `kamu / awak / engkau / kau / aku` in app strings (`--casual` to allow a persona voice) |
| R07 | WATCH | `Sila` on a button or menu label |
| R08 | WATCH | ICU plural branches Malay does not need |
| R09 | FIX | prose that names a control by its English label while the label itself is translated (`tile Cash` vs label `Tunai`) |
| R10 | FIX / WATCH | termbase: rejected forms, technical terms translated, chosen renderings not used |
| R11 | INFO | the same English word kept in some strings and translated in others |
| R12 | FIX / WATCH | calques and Indonesian forms from `patterns.csv` (`bisa`, `unduh`, "buys time", `(pilihan)`, `membersihkan hutan`, …) |
| R13 | INFO | termbase entries not yet checked against PRPM, with the URL to open |

Strings that pass every rule are not listed. That means they contain no mechanical error; it says nothing about whether they read well — that judgement stays with a Malay-speaking reviewer or the authoring prompt.

## The termbase

`termbase.csv` — one row per English term:

| column | meaning |
|---|---|
| `en` | the English term; a capitalised entry (`Level`) matches case-sensitively, lower-case matches any case |
| `bm` | the Malay rendering your project chose; equals `en` for tier 2 |
| `tier` | `1` translate · `2` keep in English · `3` grey zone, decided per project |
| `reject` | forms that must not appear, `\|`-separated (`dijeda`, `matriks kekakuan`) |
| `status` | `checked` / `unchecked` / `n/a` — whether `bm` was checked against PRPM |
| `source` | the PRPM URL (or other evidence) for the choice |
| `note` | why |

Three tiers, one test: *would the term appear as-is in an English journal paper, textbook, API reference or your product's own glossary?* If yes, tier 2 — keep it in English, whole, unglossed. The reason is practical: DBP's technical registers are not consistent across fields (PRPM gives *pekali kekakuan*, *matriks ketegangan* and *kekakuan lentur* for one concept), and a learner who meets the Malay coinage cannot search for it or find it in the software.

`patterns.csv` — `pattern, level, suggest, note, flags`: regular expressions over MS strings with a level each. The shipped list is generic Malaysian Malay; add project rows or a second file.

A worked example lives in `examples/impak/` (termbase and lint report for IMPAK – Technovation Park v0.6, 442 string pairs).

## Checking terms against PRPM

`bml dbp termbase.csv` prints one PRPM URL per unchecked entry. Open them one at a time — PRPM rate-limits parallel requests — and record `status=checked` and the URL. The `prpm-dbp` CLI (`npx prpm-dbp lookup <word>`) does the same from a terminal with a local cache; it is not a dependency of this project. Either way the dictionary text stays out of your repository.

## Licence

MIT — Copyright (c) 2026 Ahmad Razin Zainal Abidin and Universiti Teknologi Malaysia. See `LICENSE`.

## Code authorship and AI-assisted development

Designed and reviewed by the author; code, tests and the seed termbase were generated with Claude (claude.ai) from the design note and a manual audit of a real project. Details per module in `AI_USAGE.md`; design decisions in `DECISIONS.md`.

## Third-party components

None bundled. `THIRD_PARTY_LICENSES.md` records the external resources the tool points to (PRPM, `prpm-dbp`, candidate MT backends) and their licences.

## Validation status

`npm test` runs 14 tests covering every rule's positive case and the known false positives. A field run on IMPAK v0.6 reported 9 of the 11 FIX items found by a manual audit, plus one the audit missed (medal labels `Emas / Perak / Gangsa` vs prose `Gold / Silver / Bronze`). The termbase and pattern list are seeds: rows marked `unchecked` still need their PRPM evidence.

## Disclaimer

A lint pass is not a proofreading pass. Research and teaching software provided as is.

## How to cite

See `CITATION.cff`.

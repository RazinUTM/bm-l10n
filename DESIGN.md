# bm-l10n — design note

*Drafted by AI (Claude, claude.ai) from the author's description and the two preceding working sessions (5–8 November 2026) — reviewed and amended by: ______ on ______.*

## 1. Problem

The author builds bilingual (BM/EN) web apps and teaching tools. Malay strings produced by an LLM or by MT read as *translated* rather than *written in Malay*: calqued English syntax, Indonesian-leaning vocabulary, strings translated without the screen in view (prose naming a control by its English label while the label itself is translated), and the same term rendered two ways in different files. A manual audit of IMPAK – Technovation Park v0.6 (442 string pairs) found 11 FIX, 12 WATCH and 9 open terminology decisions; six of the eleven FIX items were mechanically detectable.

Existing open-source pieces each cover one layer — MT models (Mesolitica nanot5, NLLB, MADLAD), a PRPM lookup CLI (`prpm-dbp`), localisation platforms with glossary enforcement (Weblate, OmegaT) — but nothing combines Malaysian-Malay style rules, tiered terminology (translate / keep in English / grey zone), a DBP evidence trail and QA for i18n files. That integration layer is what this project builds. It does **not** train or ship a translation model.

## 2. Scope and non-goals

In scope, in order of delivery:

1. **`bml lint`** — mechanical checks on EN/MS string files against a project termbase and a pattern list, producing a FIX / WATCH / INFO report. *(v0.1, this release)*
2. **`bml draft`** — produce a first Malay draft through a pluggable backend (Claude API with the `terjemah-bm-dbp` authoring prompt and termbase injection; or a local Mesolitica model), always passed through `lint` before a human sees it. *(later)*
3. **`bml eval`** — score a draft against a gold set of author-corrected strings (chrF / COMET where available, lint pass-rate, and a human A/B "written vs translated" protocol). *(later)*

Non-goals: training an MT model; storing or redistributing dictionary content from PRPM; deciding taste questions (register, idiom beyond the pattern list) automatically.

## 3. Principles

- **Decisions live in data, not code.** The termbase (`termbase.csv`) and pattern list (`patterns.csv`) are the project's; rules in code are only those that are wrong in every Malaysian-Malay context.
- **Three tiers for words** (from the authoring skill): tier 1 translate (everyday and established UI vocabulary, DBP spelling); tier 2 keep in English (would appear as-is in an English paper, textbook, API reference or the product's own glossary); tier 3 grey zone, decided once per project and recorded.
- **Evidence, not content.** A termbase row records the decision and a URL (PRPM page) as evidence. Dictionary text is never copied in: PRPM content belongs to DBP.
- **Levels mean something.** FIX = error, contradiction with a label or with a project decision, or a rejected form; blocks CI. WATCH = reads as translated; the author judges. INFO = bookkeeping (unchecked terms, mixed renderings).
- **No taste in the linter.** Anything that needs a reader's ear belongs to the human or the authoring skill. A lint that nags about register gets switched off.
- **Zero dependencies.** Node ≥ 18, ESM, `node:test`. Nothing to audit at release beyond our own code.

## 4. Inputs

| Input | Loader | Notes |
|---|---|---|
| `.json` `{en:{…}, ms:{…}}`, nested keys, or flat `{key:{en,ms}}`, or `[{term,en,ms}]` | `json` | keys flattened with `.` |
| `.js` script or ESM module declaring an object with `en`/`ms` blocks or a glossary array | `js-table` | evaluated in a `node:vm` sandbox with no host access; functions and side effects ignored; ESM syntax stripped |
| `.js` with inline `L("en", "ms")` calls (call name configurable) | `js-inline` | regex extraction; template literals kept verbatim |

Out of scope for v0.1: ARB, PO, `.strings`, XLIFF (planned; each is a small loader).

## 5. Rules (v0.1)

| Rule | Level | What it catches | Why it is mechanical |
|---|---|---|---|
| R01 | FIX / WATCH | ICU/printf/`{x}` placeholders and tags differ; template `${}` counts differ (WATCH) | set comparison |
| R02 | FIX | missing MS string | key diff |
| R03 | WATCH | short string grew > 1.6× (≥ 8 chars), long string > 1.6× | length ratio; Malay runs 1.15–1.3× |
| R04 | WATCH | MS identical to EN on ≥ 3 words, no tier-2 term inside | string equality |
| R05 | FIX | `adalah merupakan`; `disini/kesana`; `di simpan`; `3 fail-fail` | always wrong in standard Malay |
| R06 | FIX | `kamu/awak/engkau/kau/aku` in app strings (`--casual` disables) | regex |
| R07 | WATCH | `Sila` on a ≤ 3-word label | labels take the bare verb |
| R08 | WATCH | ICU plural with one/few/many branches | Malay has one plural category |
| R09 | FIX | prose names a control by its English label while the label is translated | label map built from short strings; proper-noun exclusion ("Game Master"); aggregated when ≥ 3 strings share the problem |
| R10 | FIX / WATCH / INFO | rejected forms; tier-2 term translated; tier-1 term left in English; grey-zone term not as chosen | termbase; capitalised entries match case-sensitively; rejected forms inside a chosen multi-word rendering are masked |
| R11 | INFO | same capitalised English word kept in ≥ 2 strings and translated in ≥ 2 others | token statistics; tier-2 phrases masked |
| R12 | FIX / WATCH | calque and idiom patterns from `patterns.csv` (Indonesian forms, "buys time", "(pilihan)", "membersihkan hutan", …) | regex with per-row level and flags |
| R13 | INFO | termbase entries with `status=unchecked`, with the PRPM URL to check | bookkeeping |

## 6. Termbase and patterns

`termbase.csv`: `en, bm, tier, reject, status, source, note`. `reject` holds forms the project has rejected (`|`-separated). `status` ∈ checked / unchecked / n/a. `source` is the PRPM (or other) URL that supports the `bm` choice. A capitalised `en` matches case-sensitively (so `Level` the game term does not match "six levels").

`patterns.csv`: `pattern, level, suggest, note, flags`. `pattern` is a JS regex body; flags default to `i`; `-` means case-sensitive. The shipped list is generic Malaysian Malay; a project adds its own file or rows.

## 7. Report

Markdown (default) or JSON. Markdown lists FIX, WATCH and INFO in that order, one table per level, with `file : key`, EN, MS, finding and suggestion; then the rule key. Strings not listed passed every mechanical rule, and the report says that this does not mean they read well. Exit code 1 when FIX > 0 (unless `--no-fail`), so the lint can gate CI.

## 8. Validation

- `node --test`: 14 tests on fixtures that reproduce each rule's positive and the known false positives (`Game Master` vs label `Game`; `penanda aras` vs rejected `aras`; `keluar` vs `ke luar`).
- Field run on IMPAK v0.6: 442 pairs → FIX 11 · WATCH 35 · INFO 13. Against the manual audit's 11 FIX items, 9 are reported; the two misses need grammar, not pattern matching (`digunakan build ini`) or taste. The run also surfaced one inconsistency the manual audit missed: medal labels translated `Emas/Perak/Gangsa` in `game.js` while 13 prose strings say `Gold/Silver/Bronze`.
- Gold set: `eval/gold/impak-v0.6.jsonl` — 23 author-reviewed pairs (before/after, category, rule) seeded from the audit; the first data for `bml eval`.

## 9. Open decisions (for the author)

1. Does R03 (length) earn its place, or is it noise in practice? Default thresholds were loosened once already.
2. Should R09 be WATCH rather than FIX when the English label is also a glossary term (medals)?
3. ARB / PO / `.strings` loaders: which first? (ARB if a Flutter app is next; PO for anything gettext-based.)
4. `bml draft` backend order: Claude API first (quality) or Mesolitica local first (free, offline)? The Mesolitica model card states no licence; download at runtime, never vendor.
5. Should the termbase accept a `match` column (`cs`/`ci`/`regex`) instead of the capitalisation convention?

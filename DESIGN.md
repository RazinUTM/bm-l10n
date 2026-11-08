# bm-l10n — design note

*Drafted by AI (Claude, claude.ai) from the author's description and the two preceding working sessions (5–8 November 2026) — reviewed and amended by: ______ on ______.*

## 1. Problem

The author builds bilingual (BM/EN) web apps and teaching tools. Malay strings produced by an LLM or by MT read as *translated* rather than *written in Malay*: calqued English syntax, Indonesian-leaning vocabulary, strings translated without the screen in view (prose naming a control by its English label while the label itself is translated), and the same term rendered two ways in different files. A manual audit of IMPAK – Technovation Park v0.6 (442 string pairs) found 11 FIX, 12 WATCH and 9 open terminology decisions; six of the eleven FIX items were mechanically detectable.

Existing open-source pieces each cover one layer — MT models (Mesolitica nanot5, NLLB, MADLAD), a PRPM lookup CLI (`prpm-dbp`), localisation platforms with glossary enforcement (Weblate, OmegaT) — but nothing combines Malaysian-Malay style rules, tiered terminology (translate / keep in English / grey zone), a DBP evidence trail and QA for i18n files. That integration layer is what this project builds. It does **not** train or ship a translation model.

## 2. Scope and non-goals

In scope, in order of delivery:

1. **`bml lint`** — mechanical checks on EN/MS string files against a project termbase and a pattern list, producing a FIX / WATCH / INFO report. *(v0.1.0)* Run as a **GitHub Action** on every pull request, with the report on the run's Summary page, because the author works in the browser and merges pull requests rather than running commands. *(v0.1.1)*
2. ~~`bml draft`~~ — *not built (author's answer to §9 Q4, 8 Nov 2026): drafts come from Claude sessions using the `terjemah-bm-dbp` skill; the tool's job is the check.*
3. **`bml eval`** — score a draft against a gold set of author-corrected strings (chrF / COMET where available, lint pass-rate, and a human A/B "written vs translated" protocol). *(later, once the gold set is reviewed)*

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
| `.js` with inline `L("en", "ms")` calls (several helper names: `--call L,LL`) | `js-inline` | regex extraction; template literals kept verbatim |
| `.js` objects with `en`/`ms` at any depth, scripts that assign `window.X` / `root.X` in an IIFE | `js-table` | deep walk over top-level bindings, exports and new globals *(v0.1.1)* |
| `.js` tables holding Malay only | `js-ms-only` | every string leaf becomes a row with `en = null`; only Malay-side rules apply *(v0.1.1)* |

A script that throws while loading still yields what it defined before the error, plus literal `en: '…', ms: '…'` pairs read by pattern, and the report lists a loader note. Report paths are relative to the working directory, so GitHub annotations land on the right file.

Out of scope so far: ARB, PO, `.strings`, XLIFF, and whatever Lab S2's build uses (§9 Q3).

## 5. Rules (v0.1)

| Rule | Level | What it catches | Why it is mechanical |
|---|---|---|---|
| R01 | FIX / WATCH | ICU/printf/`{x}` placeholders and tags differ; template `${}` counts differ (WATCH) | set comparison |
| R02 | FIX | missing MS string | key diff |
| R03 | WATCH | short string grew > 1.6× (≥ 8 chars), long string > 1.6× — **opt-in** (`--with R03`) since v0.1.2 | length ratio; Malay runs 1.15–1.3× |
| R04 | WATCH | MS identical to EN on ≥ 3 words, no tier-2 term inside | string equality |
| R05 | FIX | `adalah merupakan`; `disini/kesana`; `di simpan`; `3 fail-fail` | always wrong in standard Malay |
| R06 | FIX | `kamu/awak/engkau/kau/aku` in app strings (`--casual` disables) | regex |
| R07 | WATCH | `Sila` on a ≤ 3-word label | labels take the bare verb |
| R08 | WATCH | ICU plural with one/few/many branches | Malay has one plural category |
| R09 | FIX | prose names a control by its English label while the label is translated | label map built from short strings; proper-noun exclusion ("Game Master"); aggregated when ≥ 3 strings share the problem |
| R10 | FIX / WATCH / INFO | rejected forms; tier-2 term translated; tier-1 term left in English; grey-zone term not as chosen | termbase; capitalised entries match case-sensitively; rejected forms inside a chosen multi-word rendering are masked |
| R11 | INFO | same capitalised English word kept in ≥ 2 strings and translated in ≥ 2 others | token statistics; tier-2 phrases masked |
| R12 | FIX / WATCH | calque and idiom patterns from `patterns.csv` (Indonesian forms, "buys time", "(pilihan)", "membersihkan hutan", …) | regex with per-row level and flags |
| R13 | INFO / WATCH | termbase entries with `status=unchecked` (INFO, with the PRPM URL to check); `status=flagged`, i.e. checked and not supported by PRPM (WATCH, with the note) | bookkeeping |

## 6. Termbase and patterns

`termbase.csv`: `en, bm, tier, reject, status, source, note`. `reject` holds forms the project has rejected (`|`-separated). `status` ∈ checked / unchecked / n/a. `source` is the PRPM (or other) URL that supports the `bm` choice. A capitalised `en` matches case-sensitively (so `Level` the game term does not match "six levels").

Several allowed renderings go in `bm` separated by `|` (`impact|impak ekonomi`): a tier-2 term counts as kept if the term or any listed rendering appears, also inside a longer kept phrase. Before matching words, placeholders (`{x}`, `${…}`, `%s`, tags) are blanked as a number-like token and kept-English multi-word phrases are blanked, so `{team}` is not the word *team* and *Room* in *Deal Room* is not the bare word *Room*. *(v0.1.1)*

A term inside a longer termbase term is not the bare term: *linked* in *university-linked*, *Room* in *Deal Room* (longest match wins, any tier). *(v0.1.2)*

`bm-lint-accepted.csv`: `rule, file, match, note`. Findings the author has decided to keep (an exception to a termbase rule, a reading he prefers) leave the counts and are listed under "Accepted" in the report. `match` is a substring of the English or Malay text, so an entry survives code moving to other lines; an entry that no longer matches anything is reported (R00), so the list cannot rot silently. *(v0.1.2)*

`patterns.csv`: `pattern, level, suggest, note, flags`. `pattern` is a JS regex body; flags default to `i`; `-` means case-sensitive. The shipped list is generic Malaysian Malay; a project adds its own file or rows.

## 7. Report

Markdown (default) or JSON. Markdown lists FIX, WATCH and INFO in that order, one table per level, with `file : key`, EN, MS, finding and suggestion; then the rule key. Strings not listed passed every mechanical rule, and the report says that this does not mean they read well. Exit code 1 when FIX > 0 (unless `--no-fail`), so the lint can gate CI.

## 8. Validation

- `node --test`: 25 tests on fixtures that reproduce each rule's positive case and the false positives met in the field (`Game Master` vs label `Game`; `penanda aras` vs rejected `aras`; `keluar` vs `ke luar`; `{team}`; *Room* in *Deal Room*; *Take* in *Take-home*; `L("s", "")`; a term next to an HTML tag).
- IMPAK, 5 Nov code (442 pairs in 4 files): FIX 11 · WATCH 35 · INFO 13; 9 of the manual audit's 11 FIX items reported, plus the medal-label inconsistency the audit missed. **That run used a stale clone**; the author had already fixed these items in his 6–7 Nov pass.
- IMPAK, main `badb3bd`, 8 Nov (1,578 strings in 11 files, 106 Malay-only), termbase taken from the author's `content/glossary-bm.md`, R03 off: **FIX 0 · WATCH 20 · INFO 14**. Each WATCH is a real decision (e.g. *University-linked → berkait universiti* in 9 strings against the rule that *linked* stays English). Before tuning, the same run gave FIX 15 · WATCH 65, all extra findings being false positives of the rules, now covered by tests.
- IMPAK branch after the author's review (8 Nov, 24 answers applied): FIX 0 · WATCH 1 · INFO 2 · accepted 5; the one WATCH was *bergraduat*, flagged by the PRPM check (Khidmat Nasihat: *graduat* is not in Kamus Dewan Edisi Keempat or Kamus Dewan Perdana). The author kept it as a declared project term: final state **FIX 0 · WATCH 0 · INFO 2 · accepted 6** (PR #1).
- These figures are in-sample: the loader and rules were tuned on IMPAK. A second project (§9 Q3) is the out-of-sample test.
- Gold set: `eval/gold/impak-v0.6.jsonl` — 23 pairs seeded from the audit; on 8 Nov, 15 settled in main by the author, 8 open. The author answers them in the review page; only answered rows count as gold.

## 9. Decisions answered by the author (8 Nov 2026, review page "IMPAK BM review")

1. **Length rule (R03):** off by default; on with `--with R03` (evidence: 22 WATCH on IMPAK, none a real layout problem).
2. **R09 level:** stays FIX (it found the two real cross-file problems, tile *Cash* and the medals).
3. **Next loader:** whatever Lab S2's build (SEAA 3012, `web/build_web.py`) uses, as the out-of-sample test; ARB / PO / XLIFF only when a project needs them.
4. **`bml draft`:** not built; drafts stay in Claude sessions with the skill.
5. **Termbase matching:** keep the capitalisation convention; no `match` column.

Open: the second project; whether the termbase should gain a status between `checked` and `flagged` for forms DBP accepts but the project avoids (e.g. *muflis*).

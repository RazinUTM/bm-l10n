# Decisions

## 2026-11-08 Build a terminology + QA layer, not a translation model
Decision: bm-l10n is a linter, termbase and (later) evaluation harness around existing translation backends; it does not train or ship an MT model.
Alternatives: fine-tune or train an EN→MS model; adopt Weblate/OmegaT as-is; keep LLM + authoring skill only.
Rationale: the "reads as translated" problem in IMPAK was caused by calques, missing terminology decisions and strings translated without the screen in view — none of which a better MT model fixes; Mesolitica already covers the model layer; the gap is Malaysian-specific QA and terminology.
Decided by: Ahmad Razin (session of 2026-11-08, "saya setuju dgn cara yg awak cadang tu").

## 2026-11-08 Node ESM, zero dependencies
Decision: Node ≥ 18, ESM, `node:test`; no npm dependencies.
Alternatives: Python (matches the author's `paper-cracks` library); Node with a CSV and a CLI framework.
Rationale: the string files to lint are JavaScript (plain scripts and inline calls), which a `node:vm` sandbox loads without a JS parser dependency; `prpm-dbp` is Node; zero dependencies keeps the pre-release licence scan trivial.
Decided by: proposed by AI, accepted implicitly by the author's go-ahead; to be confirmed when DESIGN.md is reviewed.

## 2026-11-08 Decisions in data (termbase.csv, patterns.csv), only universal rules in code
Decision: project terminology and calque patterns live in CSV files the project owns; code holds only checks that are wrong in every Malaysian-Malay context (R01, R02, R05–R09).
Rationale: tier-3 (grey-zone) choices differ by audience and product; the same rule set must serve a public school app and an engineering tool.
Decided by: AI proposal following the authoring skill's design; author to confirm.

## 2026-11-08 Termbase records evidence, never dictionary content
Decision: a termbase row stores the chosen form, status and the PRPM URL; PRPM text is never copied into the repository, and lookups are cached only locally (`.prpm-cache/`, git-ignored).
Rationale: PRPM content belongs to DBP; the `prpm-dbp` maintainers draw the same line. Redistribution of a scraped dictionary (e.g. the 2022 `malaysia-ai/dbp` dump) is not used.
Decided by: author (standing IP practice) and AI.

## 2026-11-08 Levels: FIX blocks, WATCH and INFO do not
Decision: FIX = error / contradiction with a label or a project decision / rejected form, exit code 1; WATCH = reads as translated, author judges; INFO = bookkeeping.
Rationale: a CI gate that fails on taste gets disabled; a gate that fails only on contradictions gets kept.
Decided by: AI proposal from the audit categories the author accepted on 2026-11-05.

## 2026-11-08 Capitalised termbase entries match case-sensitively
Decision: `Level` matches only "Level"; `phase` matches "Phase" and "phase".
Rationale: separates a product term from the same word used as a common noun ("up to six levels") without a new column. Open: replace with an explicit `match` column (DESIGN.md §9.5).
Decided by: AI, after a false positive on the IMPAK glossary; author to confirm.

## 2026-11-08 The check runs as a GitHub Action; the CLI is secondary
Decision: ship a composite action (`action.yml`) that runs `bml lint` on pull requests, writes the report to the run's Summary page, annotates the changed files and fails on FIX.
Rationale: the author works in Chrome and merges pull requests that Claude opens (recorded in rz-tnl-app-template v1.5); a CLI he must run in a terminal gives him nothing. The v0.1.0 README assumed a terminal, which was a mistake.
Decided by: AI, from the author's recorded working mode; author to confirm by merging the IMPAK pull request.

## 2026-11-08 Pin the action by commit SHA
Decision: workflows use `RazinUTM/bm-l10n@<commit-sha>`; release tags are optional and created by the author in the browser (Releases → Draft a new release).
Rationale: pushing tags from the Claude session is refused by the session's proxy (HTTP 403, a policy, not retried); a SHA is immutable, so a change to bm-l10n reaches an app only through that app's own pull request.
Decided by: AI.

## 2026-11-08 The IMPAK example follows the author's glossary, and the stale report is withdrawn
Decision: `examples/impak/termbase.csv` is transcribed from IMPAK's `content/glossary-bm.md` (decided by the author on 6 Nov); the report is regenerated on main `badb3bd`.
Rationale: the v0.1.0 example was seeded from the 5 Nov audit and linted a stale clone; the author had meanwhile decided several terms differently (benchmark kept in English, *ada services*, *membuka hutan*, *kotak penuh*). The author's glossary outranks an audit.
Decided by: AI, correcting its own v0.1.0 example.

## 2026-11-08 Matching rules after the IMPAK main run
Decision: blank placeholders and kept-English phrases before matching words; count a tier-2 term as kept wherever it appears in the Malay; allow several renderings in `bm` with `|`; ignore an empty Malay string when the English has no word (`L("s", "")`); ignore English plural-suffix template expressions in R01; split label heads only on spaced hyphens.
Rationale: each change removes a class of false positive seen on IMPAK main (FIX 15 → 0 with no real finding lost); each has a regression test.
Decided by: AI; author to confirm by reviewing the remaining 20 WATCH findings.

## 2026-11-08 Answers to DESIGN §9 (author, review page)
Decision: R03 opt-in; R09 stays FIX; next loader follows Lab S2; no `bml draft`; capitalisation convention kept.
Rationale: the evidence on each card of the review page (IMPAK runs of 8 Nov).
Decided by: Ahmad Razin (review page "IMPAK BM review", 8 Nov 2026).

## 2026-11-08 Accepted findings, longest match, flagged terms (v0.1.2)
Decision: (1) an accepted-findings CSV (`rule,file,match,note`) removes findings the author has decided to keep from the counts and lists them under "Accepted", matching on text rather than line-based keys, with stale entries reported; (2) a termbase term contained in a longer termbase term is masked there (longest match wins, any tier); (3) termbase `status=flagged` marks a form that PRPM does not support and reports it as WATCH.
Rationale: the author kept three strings against the termbase (review N2, N6, N7); without (1) they would stay as WATCH on every pull request and teach him to ignore the check. (2) follows from N1 (*university-linked → berkait universiti* while *linked* stays). (3) follows from the PRPM check of *bergraduat*.
Decided by: AI, from the author's answers; author to confirm with the IMPAK pull request.

## 2026-11-08 A flagged term the author keeps goes into the accepted list
Decision: when the author keeps a form that PRPM does not support (IMPAK: *bergraduat*), the termbase keeps `status=flagged` with the evidence, and the decision goes into the accepted-findings file with its reason. No new status value.
Rationale: the termbase stays a truthful record of what DBP supports; the accepted list is the record of what the project decided; the report shows both.
Decided by: Ahmad Razin (choice A, 8 Nov 2026), mechanism by AI.

## 2026-11-08 Out-of-sample test on Lab S2: protocol before results
Decision: the second project is measured with the v0.1.2 rules frozen (hashes recorded), the protocol, loader coverage and a blind random-sample audit pushed before the findings were read, and rule fixes measured separately as run 2 (not out-of-sample).
Alternatives: tune on Lab S2 and report the tuned numbers; audit the findings only (no recall).
Rationale: the IMPAK figures were in-sample; only a frozen run says how the rules generalise, and only a blind sample says what they miss.
Decided by: author ("boleh, kita mulakan skrg", after agreeing the rules stay unchanged before the first run); protocol by AI.

## 2026-11-08 HTML loader keeps markup; built strings are template literals
Decision: an HTML `en`/`ms` element pair is read with its inner markup as stored; a JS string built by concatenation is read as the equivalent template literal (`"Score " + c` → `Score ${e1}`).
Alternatives: strip tags to text; `{eN}` placeholders.
Rationale: the JSON and JS loaders already keep `<b>` inside strings, so R01 can check markup parity in HTML too; a concatenation is a template literal written another way, and the rules already treat `${…}` as expressions whose names may differ by side (`{eN}` turned localised expressions such as `item.en` / `item.ms` into false placeholder errors in the IMPAK regression check).
Decided by: AI, before the Lab S2 run (protocol amendment recorded).

## 2026-11-08 R05 drops "antara satu sama lain"
Decision: removed from R05 (FIX). It had been listed as a calque of "one another" since v0.1.0.
Evidence: DBP Khidmat Nasihat, 21.02.2011 ("Yang tepat ialah antara satu sama lain atau antara satu dengan yang lain") and 05.11.2011; Kamus Dewan Edisi Keempat uses the phrase in its own definitions. Found as a FIX false positive in the Lab S2 out-of-sample run.
Rationale: an entry that DBP contradicts cannot block a build. Lesson: FIX-level generic entries need recorded PRPM evidence (open task).
Decided by: AI, on DBP evidence; confirmed by the author (Lab S2 review D1, 9 Nov 2026).

## 2026-11-08 R09 does not split at an unspaced en dash; R11 ignores case for "kept"
Decision: R09 splits a label at a spaced dash, an em dash, a comma, a middle dot, a colon or an opening bracket, not at an unspaced en dash ("Müller–Breslau", "1–11"); R11 counts an English word as kept whatever its case.
Rationale: both were false positives in the Lab S2 run (a proper name read as a control label; *gauge* moved mid-sentence by Malay word order). IMPAK findings unchanged by both.
Decided by: AI; confirmed by the author (Lab S2 review D1, 9 Nov 2026).

## 2026-11-08 Pattern: "di mana" / "yang mana" as a relative word (WATCH)
Decision: `patterns.csv` flags *di mana*, *yang mana*, *dalam mana*, *dengan mana* used as relative words; questions, *di mana-mana* and the concessive *walau di mana pun* are excluded.
Evidence: DBP Khidmat Nasihat 12.08.2010, 27.08.2012, 14.07.2017 (these are translations of *where* / *which*; in Malay they belong in questions; use *yang* or *tempat*).
Rationale: the one mechanical issue type in the Lab S2 blind sample with clear DBP backing; 12 relative uses in Lab S2. Added after the sample, so its Lab S2 numbers are in-sample.
Decided by: AI; confirmed by the author (Lab S2 review D1, 9 Nov 2026), who also had all 12 strings changed.

## 2026-11-09 FIX-level generic entries need PRPM evidence
Decision: every R05 entry and every FIX-level pattern carries the URL of the PRPM page that supports it; an entry without one is reported as WATCH, not FIX.
Alternatives: keep FIX on the maintainer's judgement; remove unsupported entries.
Rationale: the only generic FIX entry tested out of sample that failed (R05, *antara satu sama lain*) had been written from memory, and a FIX blocks the author's pull requests. WATCH keeps the hint visible without blocking.
Decided by: Ahmad Razin (Lab S2 BM review, card D2, 9 Nov 2026), for v0.1.4.
Done in v0.1.4 (9 Nov): R05 *adalah merupakan* (Khidmat Nasihat 26.05.2009), *di* / *ke* apart from place words and *di-* joined to verbs (12.07.2009) keep FIX; counted reduplication, the six Indonesian-form patterns and *membersihkan hutan* are WATCH until a PRPM page is recorded in their `evidence`.


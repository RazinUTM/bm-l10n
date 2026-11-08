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

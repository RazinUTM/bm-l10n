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

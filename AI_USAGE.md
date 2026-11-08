# AI usage disclosure

Tools: Claude (Claude Fable 5.1, claude.ai), 5–8 November 2026 (v0.1.0); Claude (Claude Opus 5.5, claude.ai), 8 November 2026 (v0.1.1, v0.1.2).
Scope: code generation, tests, documentation, termbase and pattern seeding, this disclosure.
Human verification: the author specified the problem, the three-tier terminology rule and the audit categories (FIX / WATCH / INFO) in the preceding sessions; the architecture (data-over-code, zero dependencies, sandboxed loaders) and every rule threshold were presented as options and decided as recorded in DECISIONS.md. All generated code was run against the fixture tests and against a real project (IMPAK v0.6) before this release. DESIGN.md is marked for the author's review and amendment.
Last updated: 2026-11-08 (v0.1.2)

| Component | Origin | Human role | Verified by |
| --- | --- | --- | --- |
| src/load.js | AI-generated from DESIGN.md §4; extended in v0.1.1 for the shapes found on IMPAK main | Specified input shapes (IMPAK script tables, inline L()) | test/rules.test.js (9 loader tests); field run on IMPAK main (11 files) |
| src/termbase.js | AI-generated from DESIGN.md §6 | Specified columns and the evidence-not-content rule | test (csv round trip); field run |
| src/rules.js | AI-generated from the manual audit of IMPAK (2026-11-05) and DESIGN.md §5; tuned in v0.1.1 against false positives on IMPAK main | Chose which findings become rules; set levels; answers the §9 questions | test (one or more assertions per rule, plus regression tests); IMPAK main FIX 0 · WATCH 20 |
| src/lint.js, bin/bml.js | AI-generated | Specified report format and exit-code behaviour | test (filters); manual run |
| action.yml, scripts/action.sh | AI-generated (v0.1.1) for the author's browser-only workflow | Asked for a check he can read without a terminal | simulated runs with GitHub's environment variables: pass on IMPAK main, fail (exit 1) on the FIX fixture |
| termbase/patterns.csv | AI-drafted from the authoring skill's false-friend list and the IMPAK audit | To be reviewed row by row; PRPM evidence still to be added where status is unchecked | — |
| examples/impak/termbase.csv | Since v0.1.1: transcribed by AI from the author's own `content/glossary-bm.md` (6 Nov 2026) | Author wrote the glossary; confirms the transcription with the IMPAK pull request | IMPAK main run |
| eval/gold/impak-v0.6.jsonl | AI-drafted from the audit and the 8 Nov lint findings | Author answered every row in the review page (8 Nov 2026); his answers and wording are the gold | review page database (24 answers) |
| DESIGN.md | AI-drafted from the author's description | Review and amend (marked) | — |

No third-party code was consulted or adapted while writing the rules; the regular expressions and CSV parser are original.

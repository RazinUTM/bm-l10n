# AI usage disclosure

Tools: Claude (Claude Fable 5.1, claude.ai), 5–8 November 2026.
Scope: code generation, tests, documentation, termbase and pattern seeding, this disclosure.
Human verification: the author specified the problem, the three-tier terminology rule and the audit categories (FIX / WATCH / INFO) in the preceding sessions; the architecture (data-over-code, zero dependencies, sandboxed loaders) and every rule threshold were presented as options and decided as recorded in DECISIONS.md. All generated code was run against the fixture tests and against a real project (IMPAK v0.6) before this release. DESIGN.md is marked for the author's review and amendment.
Last updated: 2026-11-08

| Component | Origin | Human role | Verified by |
| --- | --- | --- | --- |
| src/load.js | AI-generated from DESIGN.md §4 | Specified input shapes (IMPAK script tables, inline L()) | test/rules.test.js (loader tests); field run on IMPAK |
| src/termbase.js | AI-generated from DESIGN.md §6 | Specified columns and the evidence-not-content rule | test (csv round trip); field run |
| src/rules.js | AI-generated from the manual audit of IMPAK (2026-11-05) and DESIGN.md §5 | Chose which findings become rules; set levels | test (one or more assertions per rule); field run recall 9/11 |
| src/lint.js, bin/bml.js | AI-generated | Specified report format and exit-code behaviour | test (filters); manual run |
| termbase/patterns.csv | AI-drafted from the authoring skill's false-friend list and the IMPAK audit | To be reviewed row by row; PRPM evidence still to be added where status is unchecked | — |
| examples/impak/termbase.csv | AI-drafted from the audit's DECISION list and the project's DECISIONS.md | Author decides the tier-3 rows | field run |
| eval/gold/impak-v0.6.jsonl | AI-drafted from the audit; "after" forms are proposals | Author confirms each pair before it counts as gold | — |
| DESIGN.md | AI-drafted from the author's description | Review and amend (marked) | — |

No third-party code was consulted or adapted while writing the rules; the regular expressions and CSV parser are original.

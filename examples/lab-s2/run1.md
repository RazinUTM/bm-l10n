# bm-lint report — p1_start_notes.html, p2_slides.html, p3_explorer_ex_lab.html, app.js

756 strings in 4 file(s): p1_start_notes.html, p2_slides.html, p3_explorer_ex_lab.html, app.js.

**FIX 2 · WATCH 2 · INFO 2**

Loader notes:
- p3_explorer_ex_lab.html: 1 "en" element(s) without a "ms" partner (line 138)
- app.js: evaluation stopped early (Cannot read properties of undefined (reading 'querySelectorAll')); 5 pairs read
- app.js: 97 helper call(s): 91 read, 3 with variables only, 3 not read (one side has no literal text, or not an (en, ms) pair; line 34, 35, 594)

By rule: R04 1 · R05 1 · R09 1 · R11 2 · R12 1

## FIX (2)

| # | rule | file : key | EN | MS | finding | suggest |
|---|---|---|---|---|---|---|
| 1 | R05 | `p1_start_notes.html:n2/span@181#98` | Beam ABC is continuous over B, so it carries moment there (that is why it can cantilever out to C). The hinge… | Beam ABC selanjar melalui B, jadi ia membawa moment di situ (sebab itulah ia boleh menjulur sebagai cantileve… | calque of "one another" | "sesama sendiri" or restructure |
| 2 | R09 | `*:Müller` | Müller | Prinsip Müller | label "Müller" is translated "Prinsip Müller" (p1_start_notes.html:n4/span@254#141) but 5 prose strings still say "Müller": p1_start_notes.html:n3/span@227#123, p1_start_notes.html:n8/ul@359#215, p1_start_notes.html:n8/p@363#216, p2_slides.html:deck/ol@26#8, p3_explorer_ex_lab.html:q9/span@221#175 — one form everywhere | decide: "Prinsip Müller" in prose, or keep "Müller" as a term and add it to the termbase (tier 2) |

## WATCH (2)

| # | rule | file : key | EN | MS | finding | suggest |
|---|---|---|---|---|---|---|
| 1 | R04 | `p3_explorer_ex_lab.html:v-lab/span@259#205` | kgf per division | kgf per division | MS is identical to EN; intentional? |  |
| 2 | R12 | `p2_slides.html:sprev/span@6#1` | Previous | Sebelum | bare "sebelum" is a preposition; as a label it needs -nya | sebelumnya |

## INFO (2)

- **R11** "Gauge" kept in English in 3 strings, not in 2 — decide once and add it to the termbase (kept: p2_slides.html:deck/span@152#90, p3_explorer_ex_lab.html:q7/span@191#144, p3_explorer_ex_lab.html:q7/span@198#152; not: p1_start_notes.html:n7/span@341#200, p3_explorer_ex_lab.html:v-glossary/span@341#265)
- **R11** "Worked" kept in English in 7 strings, not in 18 — decide once and add it to the termbase (kept: p1_start_notes.html:n5/span@289#163, p1_start_notes.html:n5/span@297#168, p1_start_notes.html:n8/p@363#216; not: p3_explorer_ex_lab.html:q1/span@113#62, p3_explorer_ex_lab.html:q1/span@115#64, p3_explorer_ex_lab.html:q2/span@126#74)

## Rules

- R01: placeholders and markup identical in EN and MS
- R02: every EN key has an MS string
- R03: length growth beyond what Malay normally needs (opt-in: --with R03)
- R04: MS identical to EN on a multi-word string
- R05: spelling and grammar that are always wrong (adalah merupakan, di sini, di- prefix, counted reduplication)
- R06: pronouns kamu/awak/engkau/kau/aku in app strings
- R07: "Sila" on a button or menu label
- R08: ICU plural branches Malay does not need
- R09: control names in prose must use the translated label
- R10: termbase: rejected forms, expected renderings, tier-2 terms kept in English
- R11: the same English word kept in some strings and translated in others
- R12: calque and idiom patterns from patterns.csv
- R13: termbase entries not yet checked against PRPM (INFO), or checked and not supported by PRPM (status flagged: WATCH)

_FIX blocks by default; WATCH and INFO are for the author to judge. Strings not listed passed every mechanical rule — that says nothing about whether they read well._

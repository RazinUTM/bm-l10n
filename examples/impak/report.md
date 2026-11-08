# bm-lint report — IMPAK – Technovation Park, branch bm-lint-termbase after the author's review (8 Nov 2026)

1578 strings in 11 file(s) (106 of them Malay-only, checked on the Malay side alone): src/i18n.js, content/texts.js, content/glossary.js, content/lessons.js, content/moves.js, content/game-ms.js, src/advice.js, src/app.js, src/bench.js, src/debrief.js, src/game.js.

**FIX 0 · WATCH 1 · INFO 2**

Loader notes:
- src/advice.js: evaluation stopped early (Cannot read properties of undefined (reading 'CFG')); 21 pairs read
- src/app.js: evaluation stopped early (Cannot read properties of undefined (reading 'CFG')); 0 pairs read

By rule: R11 1 · R13 2

Accepted by the author and not counted: 5 (listed at the end).

## WATCH (1)

| # | rule | file : key | EN | MS | finding | suggest |
|---|---|---|---|---|---|---|
| 1 | R13 | `termbase:graduate` | graduate | bergraduat | PRPM does not support "bergraduat": a startup leaving the incubator. Khidmat Nasihat (2009-2021): graduat and graduasi are not in Kamus Dewan Edisi Keempat or Kamus Dewan Perdana; a graduate (person) is siswazah. Author to decide: keep bergraduat as a project term, or rephrase (17 strings) | https://prpm.dbp.gov.my/Cari1?d=175768&keyword=graduat |

## INFO (2)

- **R11** "Land" kept in English in 3 strings, not in 2 — decide once and add it to the termbase (kept: src/game.js:L@667#114, src/game.js:L@951#348, src/game.js:L@1153#467; not: src/bench.js:L@99#16, src/game.js:L@933#299)
- **R13** "t/b" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=t%2Fb

## Accepted (5)

| rule | file : key | MS | note |
|---|---|---|---|
| R10 | `content/moves.js:IMPAK_MOVES.PROFILES.caretaker.lesson` | Mengelak risiko tidak sama dengan mengurus risiko: fund yang tidak digunakan da… | author keeps the sentence as it is (review N7, 8 Nov 2026) |
| R10 | `src/app.js:LL@562#36` | Pekali impak | socio-economic multipliers, so impak (review N6, 8 Nov 2026) |
| R10 | `src/debrief.js:L@116#38` | Belanjakan dana tersebut untuk kerja modal sebelum bulan 24: bangunan, services… | author keeps dana tersebut in this tip (review N2, 8 Nov 2026) |
| R11 | `*:Leave` |  | the strings that translate Leave use it as a verb (Tinggalkan sesi); the Deal Room option stays Leave (checked 8 Nov 2026) |
| R11 | `*:Take` |  | the strings that translate Take use it as a verb (Ambil pinjaman, Ikut lawatan); the Deal Room option stays Take (checked 8 Nov 2026) |

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

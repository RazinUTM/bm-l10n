# bm-lint report — IMPAK – Technovation Park, main badb3bd (8 Nov 2026), length rule (R03) off

1578 strings in 11 file(s) (106 of them Malay-only, checked on the Malay side alone): src/i18n.js, content/texts.js, content/glossary.js, content/lessons.js, content/moves.js, content/game-ms.js, src/advice.js, src/app.js, src/bench.js, src/debrief.js, src/game.js.

**FIX 0 · WATCH 20 · INFO 14**

Loader notes:
- src/advice.js: evaluation stopped early (Cannot read properties of undefined (reading 'CFG')); 21 pairs read
- src/app.js: evaluation stopped early (Cannot read properties of undefined (reading 'CFG')); 0 pairs read

By rule: R10 20 · R11 3 · R12 5 · R13 6

## WATCH (20)

| # | rule | file : key | EN | MS | finding | suggest |
|---|---|---|---|---|---|---|
| 1 | R10 | `content/moves.js:IMPAK_MOVES.PROFILES.caretaker.lesson` | Avoiding risk is not the same as managing it: an unused fund and empty land are impact the park never deliver… | Mengelak risiko tidak sama dengan mengurus risiko: fund yang tidak digunakan dan tanah kosong ialah impact ya… | technical term "park" not kept in English (termbase tier 2) | keep "park" |
| 2 | R10 | `content/texts.js:CONTENT.pq.rent.r` | back-office pays 1.0 Cr per unit a year, Tech SME 0.7 and spin-off 0.4 — but SMEs and spin-offs bring IP poin… | back-office membayar 1.0 Cr seunit setahun, Tech SME 0.7 dan spin-off 0.4 — tapi SME dan spin-off membawa mat… | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 3 | R10 | `content/texts.js:CONTENT.why.2` | <h4>ESG as a running score</h4><p>Every environmental decision moves a running ESG score: clearing forest −3,… | <h4>ESG sebagai skor berjalan</h4><p>Setiap keputusan alam sekitar menggerakkan skor ESG: membuka hutan −3, m… | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 4 | R10 | `src/app.js:LL@562#36` | Impact coefficients | Pekali impak | technical term "impact" not kept in English (termbase tier 2) | keep "impact" |
| 5 | R10 | `src/debrief.js:L@116#38` | Spend the fund on capital works before month 24: buildings, services and facilities. Whatever is left lapses … | Belanjakan dana untuk kerja modal sebelum bulan 24: bangunan, services dan kemudahan. Baki yang tinggal akan … | technical term "fund" not kept in English (termbase tier 2) | keep "fund" |
| 6 | R10 | `src/debrief.js:L@316#125` | University-linked | Berkait universiti | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 7 | R10 | `src/game.js:L@1078#417` | university-linked | berkait universiti | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 8 | R10 | `src/game.js:L@546#51` | Wetland · retention works first | Tanah lembap · retention works dahulu | technical term "Wetland" not kept in English (termbase tier 2) | keep "Wetland" |
| 9 | R10 | `src/game.js:L@770#191` | University-linked share | Bahagian berkait universiti | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 10 | R10 | `src/game.js:L@773#194` | University-linked | Berkait universiti | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 11 | R10 | `src/game.js:L@774#196` | University-linked | Berkait universiti | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 12 | R10 | `src/game.js:L@775#198` | University-linked: spin-offs, graduates, alumni-founded firms, R&D anchors with a lab link, covenant leases a… | Berkait universiti: spin-off, graduan, syarikat yang diasaskan alumni, R&D anchor yang berhubung dengan makma… | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 13 | R10 | `src/game.js:L@776#199` | For comparison, the benchmark park with most jobs right now is ${esc(best.name)}: ${best.so.jobs} jobs, ${bes… | Sebagai perbandingan, park benchmark dengan pekerjaan paling banyak sekarang ialah ${esc(best.name)}: ${best.… | technical term "linked" not kept in English (termbase tier 2) | keep "linked" |
| 14 | R10 | `src/game.js:L@829#253` | Water surcharge +0.4 Cr a year until | Surcaj air +0.4 Cr setahun sehingga | technical term "water" not kept in English (termbase tier 2) | keep "water" |
| 15 | R10 | `src/game.js:L@947#336` | Forest clearance | Pembukaan hutan | technical term "Forest clearance" not kept in English (termbase tier 2) | keep "Forest clearance" |
| 16 | R12 | `content/texts.js:CONTENT.say.running` | The clock runs month by month. Orders take effect at once; works and buildings take months to finish. | Jam bergerak bulan demi bulan. Arahan berkuat kuasa serta-merta; kerja dan bangunan ambil masa berbulan untuk… | reduplicated form for the indefinite plural | berbulan-bulan |
| 17 | R12 | `src/i18n.js:I18N.join.pdpa` | Your name and e-mail are kept in a private sheet on a UTM account to identify your team and report results; t… | Nama dan e-mel anda disimpan dalam sheet persendirian atas akaun UTM untuk mengenal pasti pasukan dan melapor… | spoken form; written Malay uses di bawah | di bawah akaun |
| 18 | R12 | `src/i18n.js:I18N.tr.play.tip` | Run or pause the month clock (space bar) | Jalankan atau jeda jam bulanan (Space) | "jeda" is a noun; as a verb in a sentence it takes -kan | jedakan |
| 19 | R12 | `src/i18n.js:I18N.ui.reg.viewport.d` | The park as it stands: eight zones, services, buildings under construction and their tenants. Click a zone to… | Park seperti sedia ada: lapan zon, services, bangunan dalam pembinaan dan penyewanya. Klik zon untuk memilihn… | "sedia ada" means existing/available; "as it stands" is about the current state | keadaan … sekarang |
| 20 | R12 | `src/i18n.js:I18N.ui.stage.prevTo` | Previous: {where} | Sebelum: {where} | bare "sebelum" is a preposition; as a label it needs -nya | sebelumnya |

## INFO (14)

- **R10** `content/glossary.js:Emergency loan · bailout` — "quarter" rendered differently from termbase "suku tahun" (may be fine in context)
- **R10** `content/glossary.js:Start-up · incubator · graduation` — "fee" rendered differently from termbase "fi" (may be fine in context)
- **R10** `content/texts.js:CONTENT.say.ap.none` — "quarter" rendered differently from termbase "suku tahun" (may be fine in context)
- **R10** `src/i18n.js:I18N.ui.stage.prevTo` — "previous" rendered differently from termbase "sebelumnya" (may be fine in context)
- **R10** `src/i18n.js:I18N.vp.zoom.tip` — "pan" rendered differently from termbase "anjak" (may be fine in context)
- **R11** "Land" kept in English in 3 strings, not in 2 — decide once and add it to the termbase (kept: src/game.js:L@667#114, src/game.js:L@951#348, src/game.js:L@1153#467; not: src/bench.js:L@99#16, src/game.js:L@933#299)
- **R11** "Leave" kept in English in 7 strings, not in 3 — decide once and add it to the termbase (kept: content/texts.js:CONTENT.say.hold.event, content/glossary.js:Deal Room, content/glossary.js:Dare index; not: src/i18n.js:I18N.land.leave, src/i18n.js:I18N.join.leave, src/game.js:L@1018#378)
- **R11** "Take" kept in English in 2 strings, not in 4 — decide once and add it to the termbase (kept: content/lessons.js:LESSONS.donor.principle, src/debrief.js:L@156#54; not: src/i18n.js:I18N.ui.info.tour, content/texts.js:CONTENT.say.paused, content/texts.js:CONTENT.act.1.loan)
- **R13** "bankrap" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=bankrap
- **R13** "bergraduat" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=bergraduat
- **R13** "t/b" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=t%2Fb
- **R13** "Fasa" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=Fasa
- **R13** "pratonton" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=pratonton
- **R13** "sebelumnya" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=sebelumnya

## Rules

- R01: placeholders and markup identical in EN and MS
- R02: every EN key has an MS string
- R03: length growth beyond what Malay normally needs
- R04: MS identical to EN on a multi-word string
- R05: spelling and grammar that are always wrong (adalah merupakan, di sini, di- prefix, counted reduplication)
- R06: pronouns kamu/awak/engkau/kau/aku in app strings
- R07: "Sila" on a button or menu label
- R08: ICU plural branches Malay does not need
- R09: control names in prose must use the translated label
- R10: termbase: rejected forms, expected renderings, tier-2 terms kept in English
- R11: the same English word kept in some strings and translated in others
- R12: calque and idiom patterns from patterns.csv
- R13: termbase entries not yet checked against PRPM

_FIX blocks by default; WATCH and INFO are for the author to judge. Strings not listed passed every mechanical rule — that says nothing about whether they read well._

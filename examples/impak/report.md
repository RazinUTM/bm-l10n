# bm-lint report — IMPAK – Technovation Park v0.6 (src/i18n.js, content/texts.js, content/glossary.js, src/game.js)

442 string pairs in 4 file(s): i18n.js, texts.js, glossary.js, game.js.

**FIX 11 · WATCH 35 · INFO 13**

By rule: R01 2 · R03 5 · R04 1 · R09 6 · R10 21 · R11 4 · R12 15 · R13 5

## FIX (11)

| # | rule | file : key | EN | MS | finding | suggest |
|---|---|---|---|---|---|---|
| 1 | R09 | `*:Gold` | Gold | Emas | label "Gold" is translated "Emas" (game.js:L@991#70) but 9 prose strings still say "Gold": texts.js:say.final.gold, texts.js:say.final.silver, texts.js:act.1.survive.h, texts.js:why.1, texts.js:why.2, glossary.js:Emergency loan · bailout, … — one form everywhere | decide: "Emas" in prose, or keep "Gold" as a term and add it to the termbase (tier 2) |
| 2 | R09 | `glossary.js:Medals · gates` | Gold 80, Silver 65, Bronze 50 marks. Silver and Gold also need a park score of at least half the target (park… | Gold 80, Silver 65, Bronze 50 markah. Silver dan Gold juga perlukan skor park sekurang-kurangnya separuh sasa… | MS prose names the control "Silver" by its English label; the MS label is "Perak" (game.js:L@991#71) | "Perak" |
| 3 | R09 | `glossary.js:Medals · gates` | Gold 80, Silver 65, Bronze 50 marks. Silver and Gold also need a park score of at least half the target (park… | Gold 80, Silver 65, Bronze 50 markah. Silver dan Gold juga perlukan skor park sekurang-kurangnya separuh sasa… | MS prose names the control "Bronze" by its English label; the MS label is "Gangsa" (game.js:L@991#72) | "Gangsa" |
| 4 | R09 | `texts.js:act.0.year1.h` | Keep an eye on the Cash tile: the small arrow is the monthly change. | Perhatikan tile Cash: anak panah kecil ialah perubahan bulanan. | MS prose names the control "Cash" by its English label; the MS label is "Tunai" (i18n.js:kpi.cash) | "Tunai" |
| 5 | R09 | `texts.js:say.final.bronze` | Bronze. The park stands, but the score shows what was missing: usually impact or financial cover. | Bronze. Park berdiri, tapi skor menunjukkan apa yang kurang: biasanya impak atau cover kewangan. | MS prose names the control "Bronze" by its English label; the MS label is "Gangsa" (game.js:L@991#72) | "Gangsa" |
| 6 | R09 | `texts.js:say.final.silver` | Silver. A real park with sound decisions. Check which Gold gate you missed in the results. | Silver. Park yang sebenar dengan keputusan yang wajar. Semak gate Gold mana yang terlepas dalam keputusan. | MS prose names the control "Silver" by its English label; the MS label is "Perak" (game.js:L@991#71) | "Perak" |
| 7 | R10 | `i18n.js:nav.home.tip` | Back to the start page (your practice game is paused and kept; a live session stays joined) | Kembali ke halaman mula (permainan latihan dijeda dan disimpan; sesi langsung kekal disertai) | rejected form "dijeda" (termbase: pause → jeda) | "jeda" |
| 8 | R10 | `texts.js:act.0.road.h` | In the Selected zone group: Road link. Unserviced plots cannot take a building. | Dalam kumpulan Zon dipilih: Road link. Plot tanpa perkhidmatan tidak boleh dibina. | rejected form "tanpa perkhidmatan" (termbase: serviced → serviced) | "serviced" |
| 9 | R12 | `glossary.js:ESG` | A running score of environmental decisions: clearing forest −3, building on wetland −1, a green buffer +2, re… | Skor berjalan bagi keputusan alam sekitar: membersihkan hutan −3, membina di tanah lembap −1, green buffer +2… | "membersihkan" reads as cleaning; forest clearing is "menebang" or "pembukaan hutan" | menebang hutan |
| 10 | R12 | `texts.js:act.2.esg.h` | Retention works, a forest buffer, a park, solar or green certification. Clearing forest costs ESG. | Retention works, forest buffer, park, solar atau green certification. Membersihkan hutan mengurangkan ESG. | "membersihkan" reads as cleaning; forest clearing is "menebang" or "pembukaan hutan" | menebang hutan |
| 11 | R12 | `texts.js:why.2` | <h4>ESG as a running score</h4><p>Every environmental decision moves a running ESG score: clearing forest −3,… | <h4>ESG sebagai skor berjalan</h4><p>Setiap keputusan alam sekitar menggerakkan skor ESG: membersihkan hutan … | "membersihkan" reads as cleaning; forest clearing is "menebang" or "pembukaan hutan" | menebang hutan |

## WATCH (35)

| # | rule | file : key | EN | MS | finding | suggest |
|---|---|---|---|---|---|---|
| 1 | R01 | `game.js:L@549#20` | ${adm.length} applicant${adm.length > 1 ? "s" : ""} can move in now. Admitting is free and uses no action poi… | ${adm.length} pemohon boleh masuk sekarang. Penerimaan percuma dan tidak menggunakan action point. | 2 template expression(s) in EN, 1 in MS; fine if a plural suffix was dropped or a localised helper is used |  |
| 2 | R01 | `game.js:L@560#33` | You still have ${t.ap} action point${t.ap > 1 ? "s" : ""}. They are lost at the end of ${mm}. | Anda masih ada ${t.ap} action point. Ia akan hilang pada hujung ${mm}. | 3 template expression(s) in EN, 2 in MS; fine if a plural suffix was dropped or a localised helper is used |  |
| 3 | R03 | `game.js:L@997#87` | New game | Permainan baharu | short string grew ×2.00 (8→16 chars); check the layout |  |
| 4 | R03 | `i18n.js:act.partial` | Part {k} of {m} done | Bahagian {k} daripada {m} selesai | short string grew ×1.65 (20→33 chars); check the layout |  |
| 5 | R03 | `i18n.js:gloss.none` | No term matches. | Tiada istilah yang sepadan. | short string grew ×1.69 (16→27 chars); check the layout |  |
| 6 | R03 | `i18n.js:ro.sync.wait` | syncing… | menunggu pelayan… | short string grew ×2.13 (8→17 chars); check the layout |  |
| 7 | R03 | `i18n.js:tr.reset` | New game | Permainan baharu | short string grew ×2.00 (8→16 chars); check the layout |  |
| 8 | R04 | `i18n.js:ui.tour.of` | {i} / {n} | {i} / {n} | MS is identical to EN; intentional? |  |
| 9 | R10 | `game.js:L@236#1` | Phase 1 · Build | Phase 1 · Bina | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 10 | R10 | `game.js:L@236#2` | Phase 2 · Operate | Phase 2 · Operasi | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 11 | R10 | `game.js:L@237#3` | Phase 1 · Build | Phase 1 · Bina | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 12 | R10 | `game.js:L@237#4` | Phase 2 · Expand | Phase 2 · Kembang | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 13 | R10 | `game.js:L@237#5` | Phase 3 · Survive | Phase 3 · Bertahan | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 14 | R10 | `game.js:L@576#38` | Checkpoint · end of Phase 1. | Checkpoint · tamat Phase 1. | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 15 | R10 | `game.js:L@577#42` | Checkpoint · end of Phase 2. | Checkpoint · tamat Phase 2. | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 16 | R10 | `game.js:L@577#46` | Phase 3 begins: a downturn will start in an unannounced month between January and June of Year 4. | Phase 3 bermula: downturn akan bermula pada bulan yang tidak diumumkan antara Januari dan Jun Tahun 4. | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 17 | R10 | `game.js:L@949#62` | End of Phase 1 | Tamat Phase 1 | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 18 | R10 | `game.js:L@950#66` | End of Phase 2 | Tamat Phase 2 | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 19 | R10 | `glossary.js:A · B1 · B2 · B3 · C · D · E` | The parts of the final mark: A park score against the target; B1 Phase 1 (fund used, income gained); B2 Zone … | Bahagian markah akhir: A skor park berbanding sasaran; B1 Phase 1 (fund digunakan, pendapatan bertambah); B2 … | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 20 | R10 | `glossary.js:Downturn · forecast` | An economic slump in Phase 3: mild, severe or crisis. Rates rise, the loan limit falls, unlinked rents fall (… | Kemelesetan ekonomi dalam Phase 3: ringan, teruk atau krisis. Kadar naik, had pinjaman turun, sewa unlinked j… | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 21 | R10 | `glossary.js:Phase 1 · 2 · 3` | Phase 1 Build (Years 1–2, the fund pays); Phase 2 Expand (Year 3, Zone H released; in Rintis: Operate); Phase… | Phase 1 Bina (Tahun 1–2, fund membayar); Phase 2 Kembang (Tahun 3, Zon H dilepaskan; dalam Rintis: Operasi); … | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 22 | R10 | `i18n.js:ui.reg.stages` | Level menu | Menu level | technical term "Level" not kept in English (termbase tier 2) | keep "Level" |
| 23 | R10 | `i18n.js:ui.sym.tags` | Chips: amber = something is waiting for you (Deal Room, checkpoint); red = downturn or danger; “Phase” shows … | Chip: amber = ada sesuatu menunggu anda (Deal Room, checkpoint); merah = downturn atau bahaya; “Phase” menunj… | "phase" left in English; termbase renders it "Fasa" | "Fasa" |
| 24 | R12 | `i18n.js:join.org` | Organisation (optional) | Organisasi (pilihan) | calque of "(optional)" | (tidak wajib) |
| 25 | R12 | `i18n.js:join.pdpa` | Your name and e-mail are kept in a private sheet on a UTM account to identify your team and report results; t… | Nama dan e-mel anda disimpan dalam sheet peribadi atas akaun UTM untuk mengenal pasti team dan melaporkan kep… | "peribadi" = personal; "persendirian" = private (not public) | … persendirian |
| 26 | R12 | `i18n.js:join.pdpa` | Your name and e-mail are kept in a private sheet on a UTM account to identify your team and report results; t… | Nama dan e-mel anda disimpan dalam sheet peribadi atas akaun UTM untuk mengenal pasti team dan melaporkan kep… | spoken form; written Malay uses di bawah | di bawah akaun |
| 27 | R12 | `i18n.js:tr.play.tip` | Run or pause the month clock (space bar) | Jalankan atau jeda jam bulanan (bar ruang) | "jeda" is a noun; as a verb in a sentence it takes -kan | jedakan |
| 28 | R12 | `i18n.js:ui.reg.viewport.d` | The park as it stands: eight zones, services, buildings under construction and their tenants. Click a zone to… | Park seperti sedia ada: lapan zon, perkhidmatan, bangunan dalam pembinaan dan penyewanya. Klik zon untuk memi… | "sedia ada" means existing/available; "as it stands" is about the current state | keadaan … sekarang |
| 29 | R12 | `i18n.js:ui.stage.prev` | Previous level | Level sebelum | bare "sebelum" is a preposition; as a label it needs -nya | sebelumnya |
| 30 | R12 | `i18n.js:ui.stage.prevTo` | Previous: {where} | Sebelum: {where} | bare "sebelum" is a preposition; as a label it needs -nya | sebelumnya |
| 31 | R12 | `i18n.js:ui.sym.lines` | On the plan: solid boxes = buildings in use, hatched = under construction, dashed = free plots; a lock marks … | Pada plan: kotak padat = bangunan digunakan, berjalur = dalam pembinaan, putus-putus = plot kosong; kunci men… | "padat/pejal" mean dense or not hollow, not a line style | garis penuh |
| 32 | R12 | `texts.js:act.1.fund.h` | The Fund tile counts down. Phase 1 marks reward fund used and income gained. | Tile Fund mengira turun. Markah Fasa 1 mengganjari fund yang digunakan dan pendapatan yang bertambah. | calque of "counts down" | semakin susut / menurun |
| 33 | R12 | `texts.js:say.cash.low` | Cash is running low. Check the Money group: a loan buys time, but every Cr of debt needs cover. | Tunai semakin rendah. Semak kumpulan Kewangan: pinjaman membeli masa, tapi setiap Cr hutang perlukan cover. | calque of "buys time" | memberi anda masa |
| 34 | R12 | `texts.js:say.running` | The clock runs month by month. Orders take effect at once; works and buildings take months to finish. | Jam bergerak bulan demi bulan. Arahan berkuat kuasa serta-merta; kerja dan bangunan ambil masa berbulan untuk… | reduplicated form for the indefinite plural | berbulan-bulan |
| 35 | R12 | `texts.js:why.2` | <h4>ESG as a running score</h4><p>Every environmental decision moves a running ESG score: clearing forest −3,… | <h4>ESG sebagai skor berjalan</h4><p>Setiap keputusan alam sekitar menggerakkan skor ESG: membersihkan hutan … | two yang within a few words usually marks a calqued relative clause | restructure |

## INFO (13)

- **R10** `glossary.js:Checkpoint` — "pause" rendered differently from termbase "jeda" (may be fine in context)
- **R10** `i18n.js:join.pdpa` — "private" rendered differently from termbase "persendirian" (may be fine in context)
- **R10** `i18n.js:ui.stage.prev` — "previous" rendered differently from termbase "sebelumnya" (may be fine in context)
- **R10** `i18n.js:ui.stage.prevTo` — "previous" rendered differently from termbase "sebelumnya" (may be fine in context)
- **R11** "Build" kept in English in 2 strings, not in 4 — decide once and add it to the termbase (kept: texts.js:act.1.build.h, glossary.js:Modular block · New Build; not: texts.js:say.welcome.2, glossary.js:Phase 1 · 2 · 3, game.js:L@236#1)
- **R11** "Game" kept in English in 8 strings, not in 2 — decide once and add it to the termbase (kept: i18n.js:land.resume.gm, i18n.js:tr.locked, i18n.js:ui.stage.live; not: i18n.js:ui.stage.module, game.js:L@246#7)
- **R11** "Impact" kept in English in 2 strings, not in 6 — decide once and add it to the termbase (kept: glossary.js:Impact · verified impact, game.js:L@555#24; not: i18n.js:tab.impact, i18n.js:ui.reg.results.d, texts.js:say.final.gold)
- **R11** "Leave" kept in English in 3 strings, not in 2 — decide once and add it to the termbase (kept: texts.js:say.hold.event, glossary.js:Deal Room, glossary.js:Dare index; not: i18n.js:land.leave, i18n.js:join.leave)
- **R13** "penghunian" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=penghunian
- **R13** "Fasa" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=Fasa
- **R13** "sebelumnya" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=sebelumnya
- **R13** "pelayan" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=pelayan
- **R13** "Tetapan" not yet checked against PRPM → https://prpm.dbp.gov.my/Cari1?keyword=Tetapan

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

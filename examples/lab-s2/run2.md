# bm-lint report — p1_start_notes.html, p2_slides.html, p3_explorer_ex_lab.html, app.js

756 strings in 4 file(s): p1_start_notes.html, p2_slides.html, p3_explorer_ex_lab.html, app.js.

**FIX 0 · WATCH 14 · INFO 1**

Loader notes:
- p3_explorer_ex_lab.html: 1 "en" element(s) without a "ms" partner (line 138)
- app.js: evaluation stopped early (Cannot read properties of undefined (reading 'querySelectorAll')); 5 pairs read
- app.js: 97 helper call(s): 91 read, 3 with variables only, 3 not read (one side has no literal text, or not an (en, ms) pair; line 34, 35, 594)

By rule: R04 1 · R11 1 · R12 13

## WATCH (14)

| # | rule | file : key | EN | MS | finding | suggest |
|---|---|---|---|---|---|---|
| 1 | R04 | `p3_explorer_ex_lab.html:v-lab/span@259#205` | kgf per division | kgf per division | MS is identical to EN; intentional? |  |
| 2 | R12 | `app.js:pair@470#15` | B is where the moment is taken, not where the beam bends: for any load on ABC the same lever rule applies, an… | B ialah titik di mana moment diambil, bukan tempat beam melentur: bagi sebarang load pada ABC, lever rule yan… | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 3 | R12 | `p1_start_notes.html:n1/span@136#56` | the point where \(R\) is evaluated | titik di mana \(R\) dinilai | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 4 | R12 | `p1_start_notes.html:n1/span@137#58` | the section where \(V\) or \(M\) is read | section di mana \(V\) atau \(M\) dibaca | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 5 | R12 | `p1_start_notes.html:n1/span@144#66` | the section where \(R_A\) is read | section di mana \(R_A\) dibaca | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 6 | R12 | `p1_start_notes.html:n2/span@180#95` | at support B, where beam ABC is continuous | di support B, di mana beam ABC selanjar | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 7 | R12 | `p1_start_notes.html:n4/p@263#146` | Two remarks. The principle gives exact ordinates only for statically determinate structures, where the releas… | Dua catatan. Prinsip ini memberi ordinate yang tepat hanya bagi struktur statically determinate, di mana rele… | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 8 | R12 | `p1_start_notes.html:n6/p@321#188` | <b>How to compare.</b> Report the difference \(\eta_{\text{test}}-\eta_{\text{theory}}\) at every halt. A per… | <b>Cara membandingkan.</b> Laporkan perbezaan \(\eta_{\text{test}}-\eta_{\text{theory}}\) pada setiap halt. P… | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 9 | R12 | `p2_slides.html:deck/span@57#16` | the point where \(R\) is read | titik di mana \(R\) dibaca | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 10 | R12 | `p2_slides.html:deck/span@58#18` | the section where \(V\), \(M\) are read | section di mana \(V\), \(M\) dibaca | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 11 | R12 | `p2_slides.html:sprev/span@6#1` | Previous | Sebelum | bare "sebelum" is a preposition; as a label it needs -nya | sebelumnya |
| 12 | R12 | `p3_explorer_ex_lab.html:q3/span@141#95` | The only vertex where \(\eta_B\) peaks is C (1.76). Try the 4 kg axle at C, then the 2 kg axle at C, and comp… | Satu-satunya vertex di mana \(\eta_B\) memuncak ialah C (1.76). Cuba axle 4 kg di C, kemudian axle 2 kg di C,… | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 13 | R12 | `p3_explorer_ex_lab.html:q7/span@193#146` | (b) Take the combined uncertainty as ±0.03 per unit load in round numbers. Among the halts with a non-zero th… | (b) Ambil uncertainty gabungan sebagai ±0.03 per unit load (nombor bulat). Antara halt yang mempunyai ordinat… | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |
| 14 | R12 | `p3_explorer_ex_lab.html:tk4/span@63#31` | Keep these loads. Move the group with the halts or the slider and find the <b>largest R<sub>B</sub></b>. Ente… | Kekalkan load ini. Gerakkan kumpulan load dengan halt atau slider dan cari <b>R<sub>B</sub> terbesar</b>. Mas… | "di mana / yang mana" used as a relative word is a calque of where / which; DBP Khidmat Nasihat: they belong in questions only (12.08.2010, 27.08.2012, 14.07.2017) | yang / tempat / iaitu, or split the sentence |

## INFO (1)

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

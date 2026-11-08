# Lab S2: loader coverage (recorded before run 1)

Input: `RazinUTM/My_Lectures` @ `25799b0`, `SEAA3012-CE-Lab-II/S2-influence-lines/web/src/`.
Loader options: `--call L2,tx:1 --pair-arrays`. Rows read: **756**.

| File | Bilingual units in the source | Rows read | Not read |
|---|---|---|---|
| `p1_start_notes.html` | 232 `en` and 232 `ms` elements | 232 | none |
| `p2_slides.html` | 108 `en` and 108 `ms` elements | 108 | none |
| `p3_explorer_ex_lab.html` | 290 `en` and 289 `ms` elements; 3 `data-ph-en`/`data-ph-ms` attribute pairs | 293 | none; the one `en` element without a partner (line 138) is a word-order span ("largest" + " R_B" in English, "R_B terbesar" in Malay) and becomes a row with an empty Malay side |
| `app.js` | 97 helper calls (73 `L2`, 26 `tx`, less the 2 definitions); 25 two-string `[en, ms]` arrays in the exercise data (5 symbol arrays such as `["R_A", "R_B"]` left out); 5 `en:`/`ms:` property pairs | 123 | 3 calls with variables only (inside the helpers); 3 calls not read: lines 34 and 35 (the language switch reads `data-en`/`data-ms` at run time) and line 594 (`"Resume" : "Start timer"` chosen by a ternary); 2 `tx(el, "", "")` calls that clear a label |

Not loaded at all, by design of this loader:

- `aria-label` attributes (72 lines across the four files) and 3 `title` attributes. They carry
  English only, so there is no pair to read; whether they should be bilingual is a question for
  the author, not a rule result.
- Text inside a ternary that is one operand of a built string, e.g.
  `"… divisions). " + (ok ? "Acceptable: within two divisions." : "…")`: the operand becomes a
  placeholder `{eN}` and its two literal texts are not linted.

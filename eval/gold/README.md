# Gold set

One JSON object per line: `project, file, key, en, ms_before, ms_after, category (FIX|WATCH|DECISION), rule, note, reviewed_by, reviewed_on`.

`ms_after` values seeded from the 2026-11-05 audit are **proposals** until `reviewed_by` is filled in by a Malay-speaking reviewer. Only reviewed rows count as gold for `bml eval`.

Add rows whenever a human corrects a string: the correction is the most valuable data this project collects.

## State on 8 November 2026

`status_8nov` and `ms_main_badb3bd` record each row against IMPAK main `badb3bd`: 15 rows were settled by the author in his 6–7 Nov pass (for those, the main text is the gold candidate, even where it differs from `ms_after`), 8 are still open. The author answered every row in the review page *IMPAK BM review* on 8 Nov 2026; `answer` records it (`settled`, `agree`, `revise`, `reject`) and `ms_after` is the final text. Rows N1–N7 are the lint's new findings on main, added with his answers. All 30 rows carry `reviewed_by` and count as gold.

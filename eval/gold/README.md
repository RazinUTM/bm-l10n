# Gold set

One JSON object per line: `project, file, key, en, ms_before, ms_after, category (FIX|WATCH|DECISION), rule, note, reviewed_by, reviewed_on`.

`ms_after` values seeded from the 2026-11-05 audit are **proposals** until `reviewed_by` is filled in by a Malay-speaking reviewer. Only reviewed rows count as gold for `bml eval`.

Add rows whenever a human corrects a string: the correction is the most valuable data this project collects.

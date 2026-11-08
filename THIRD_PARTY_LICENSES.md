# Third-party components

| Component | Version | Licence (SPDX) | How used | Obligation / notice | Source |
| --- | --- | --- | --- | --- | --- |
| Node.js standard library (`node:fs`, `node:vm`, `node:test`) | ≥ 18 | MIT (Node.js) | runtime | none | nodejs.org |

No npm dependencies. Checked with `npm ls --all` on 2026-11-08 (empty).

## External resources this tool points to but does not include

| Resource | Owner / licence | How this tool relates to it |
| --- | --- | --- |
| PRPM — Pusat Rujukan Persuratan Melayu (prpm.dbp.gov.my) | Dewan Bahasa dan Pustaka; dictionary content copyrighted | `bml dbp` prints lookup URLs for the author to open. The termbase stores the author's decision and the URL, never the dictionary text. No automated fetching in v0.1. |
| `prpm-dbp` (npm CLI by afu-it) | MIT (code); dictionary content remains DBP's | Suggested in `bml dbp` output as a way to look words up with a local cache. Not a dependency. |
| Mesolitica `nanot5-*-malaysian-translation-v2.1` | Licence not stated on the model card (checked 2026-11-08) | Candidate backend for a future `bml draft`. Would be downloaded at runtime by the user, never vendored. Status: unknown — check before release of that feature. |
| NLLB-200 (Meta) | CC-BY-NC-4.0 | Not used: non-commercial licence does not suit an MIT tool. Listed so the decision is on record. |

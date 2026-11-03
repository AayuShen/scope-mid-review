# scope-mid-review

Mid-review material for **SCoPe: Trust-Region Latent Planning with JEPA World Models**.
Project overview and results: [scope-project](https://github.com/AayuShen/scope-project); code: [scope-planning](https://github.com/AayuShen/scope-planning).


| File | What it is |
|---|---|
| `SCoPe_mid_review.pptx` | **The deck to present: 8 slides** (7 presented + references), about 10 minutes. Covers the six required areas: title (1), problem and research question (2), existing work and our difference (3), MDP, algorithm and data (4), system architecture (5), evidence, novel components, progress and next steps (6–7). Speaker notes on every slide. |
| `SCoPe_mid_review.pdf` | PDF export of the 8-slide deck. |
| `SCoPe_mid_review_extended.pptx` / `.pdf` | The 38-slide extended version kept as backup for questions: the full 13-study comparison, counter-evidence, positioning matrix, agent–environment loop, data-flow and deployment views, benchmark design, the H1 pilot numbers, planned figures, contribution matrix, progress table and appendix. |
| `architecture/` | The four architecture views (extended deck slides 19–22) as 3200×1800 PNGs for reports. |
| `references.md` | The 26 numbered references with links, generated from `src/refs.js`. Both decks use the same numbering. |
| `data/phase0_metrics.json` | Every measured number in the charts, parsed from the run logs by `src/extract_metrics.py`. |
| `assets/` | Rollout images cropped from the Phase 0 run plots. |

Every diagram is native PowerPoint shapes and every chart a native chart, so both decks can be edited in PowerPoint. Placeholders to fill before the review: `[TEAM MEMBERS]`, `[GUIDE NAME]`, `[DEPARTMENT]`, `[INSTITUTION]`, `[REVIEW DATE]` (title slide, and the extended deck's closing slide).

## Rebuild

Slide sources live in `src/`: `short_slides.js` (8-slide deck), `s1_problem.js` … `s6_back.js` (extended deck, whose title slide and architecture view are reused by the short deck), drawing helpers in `lib.js`, shared theme and layouts in `common.js`.

```bash
cd src
npm install                  # first time only: pptxgenjs, jszip
python3 extract_metrics.py   # needs the run logs of a scope-planning checkout
node build_deck.js           # ../SCoPe_mid_review.pptx (8 slides)
node build_extended.js       # ../SCoPe_mid_review_extended.pptx (38 slides)
node write_references.js
```

The build scripts expect the pptx skill's `apply_theme.js`; set `PPTX_APPLY_THEME` to its path if it lives elsewhere. Export PDFs from PowerPoint (File → Export) after rebuilding.

Evidence labels on the slides: MEASURED (our logs), PUBLISHED (cited paper), ILLUSTRATIVE (chart layout, no data), TARGET (planned, not achieved), PROPOSED (design only).

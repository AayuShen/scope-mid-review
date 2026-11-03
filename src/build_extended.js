'use strict';
// Builds docs/mid_review/SCoPe_mid_review_extended.pptx: the 38-slide version (34 main slides,
// references, appendix), kept as backup for questions.
//   cd docs/mid_review/src && node build_extended.js
// Every measured number is read from ../data/phase0_metrics.json (made by extract_metrics.py
// from the run logs) or typed from docs/experiments/phase0_dino_wm_reproduction.md.

const { createDeck, finish } = require('./common');

const ctx = createDeck('SCoPe: Trust-Region Latent Planning with JEPA World Models (mid-review, extended)');
require('./s1_problem')(ctx);
require('./s2_literature')(ctx);
require('./s3_method')(ctx);
require('./s4_architecture')(ctx);
require('./s5_results')(ctx);
require('./s6_back')(ctx);

finish(ctx, 'SCoPe_mid_review_extended.pptx').catch((e) => { console.error(e); process.exit(1); });

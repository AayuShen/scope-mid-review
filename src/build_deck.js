'use strict';
// Builds docs/mid_review/SCoPe_mid_review.pptx: the 8-slide mid-review deck (7 presented + references).
//   cd docs/mid_review/src && node build_deck.js
// The 38-slide extended version is built by build_extended.js. Every measured number is read from
// ../data/phase0_metrics.json (made by extract_metrics.py from the run logs) or typed from
// docs/experiments/phase0_dino_wm_reproduction.md.

const { createDeck, finish } = require('./common');

const ctx = createDeck('SCoPe: Trust-Region Latent Planning with JEPA World Models (mid-review)');
require('./short_slides')(ctx);

finish(ctx, 'SCoPe_mid_review.pptx').catch((e) => { console.error(e); process.exit(1); });

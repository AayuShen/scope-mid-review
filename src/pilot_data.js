'use strict';
// H1 pilot results for both decks: the pooled multi-seed summary (scripts/h1_aggregate.py) when present,
// otherwise the single-run summary (scripts/h1_pilot.py). Both are returned in the single-run shape,
// plus `seeds` (number of runs) and `byRun` (AUROC per run, pooled file only).
const fs = require('fs');
const path = require('path');

module.exports = function loadPilot(ASSETS) {
  const dir = path.join(ASSETS, '..', 'data');
  const pooled = path.join(dir, 'h1_pilot_pooled.json');
  const single = path.join(dir, 'h1_pilot_summary.json');
  if (fs.existsSync(pooled)) {
    const P = JSON.parse(fs.readFileSync(pooled, 'utf8'));
    const gate = {};
    Object.entries(P.offline_gate_success).forEach(([k, v]) => { gate[k] = { success: v }; });
    return {
      setup: Object.assign({ cem_iters: 10, recorded_per_episode: 192, reject_fraction: 0.3 }, P.setup),
      auroc_stratified: P.auroc_stratified, offline_gate: gate, candidate_success_rate: P.candidate_success_rate,
      seeds: P.setup.runs.length, byRun: P.auroc_by_run,
    };
  }
  if (fs.existsSync(single)) return Object.assign(JSON.parse(fs.readFileSync(single, 'utf8')), { seeds: 1, byRun: null });
  return null;
};

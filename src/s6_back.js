'use strict';
// References and appendix slides.
const { MX, CW } = require('./lib');

module.exports = function back(ctx) {
  const { L, K, add, REFS } = ctx;

  const refColumn = (s, items, x) => {
    const runs = [];
    items.forEach((r, i) => {
      runs.push({ text: `[${r.n}] `, options: { bold: true, color: K.orangeDark } });
      runs.push({ text: r.text + ' ', options: { color: K.ink } });
      runs.push({ text: r.url.replace(/^https?:\/\//, ''), options: { color: K.blue, hyperlink: { url: r.url }, breakLine: i < items.length - 1 } });
    });
    L.text(s, runs, { x, y: 1.62, w: 5.95, h: 5.25, fontSize: 11.5, paraSpaceAfter: 9, math: false });
  };
  [[0, 13], [13, 26]].forEach(([a, b], k) => {
    const s = add('References', 'REFERENCES', `References [${a + 1}]–[${b}]`);
    const part = REFS.slice(a, b);
    const half = Math.ceil(part.length / 2);
    refColumn(s, part.slice(0, half), MX);
    refColumn(s, part.slice(half), 6.78);
    L.notes(s, {
      say: k === 0
        ? 'Numbered references used on the slides. Peer-reviewed papers are listed with their venue; preprints, the workshop paper and the position paper are marked as such.'
        : 'Second page of references, including the counter-evidence papers (2026 preprints and one workshop paper), the uncertainty-estimation methods, the task sources and the DINO-WM code and data.',
      takeaway: 'Every citation on the slides resolves to a stable link here.',
      careful: 'Preprints [2, 11, 15, 19, 20, 21, 25] are not peer-reviewed; [18] is a workshop paper; [5] is a position paper. Links were checked when the deck was prepared (October 2026).',
    });
  });

  // ---------------------------------------------------------------- A1. Deviations from upstream
  {
    const s = add('Appendix', 'APPENDIX A1', 'Deviations from the upstream DINO-WM setup, and their risk to fidelity');
    const rule = () => [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: K.hair }, { type: 'none' }];
    const h = (t) => ({ text: t, options: { bold: true, color: K.ink, fill: { color: K.panel }, border: rule() } });
    const c = (t, o = {}) => ({ text: t, options: Object.assign({ color: K.body, border: rule() }, o) });
    const rows = [
      [h('Change'), h('Reason'), h('Risk to fidelity')],
      [c('PyTorch 2.3.0 → 2.7.1 (CUDA 12.8)'), c('RTX 5060 (sm_120) has no kernels in 2.3'), c('numerical drift; low')],
      [c('Python 3.9 → 3.10'), c('shared environment with the scope package'), c('low')],
      [c('mujoco-py built with system gcc, -std=gnu17, pointer-type errors as warnings'), c('2021-era generated C fails on gcc 14+'), c('none (compile flags only)')],
      [c('Lean dependency set (no TF, JAX, robosuite)'), c('unused on the planning path'), c('none if imports resolve')],
      [c('wandb disabled, git lookup skipped'), c('no W&B project; git probe fails on /mnt/e'), c('none')],
      [c('Runtime patches: fused attention, encoder dedup, chunked rollouts, TF32'), c('upstream needs > 8 GB and 26 s per 300-candidate rollout here'), c('latent drift ≤ 0.7%; identical CEM elites and updates in every benchmark case')],
      [c('PyTorch capped at 75% of VRAM'), c('Windows silently spills GPU overflow into system RAM'), c('none; overflow raises an error instead')],
      [c('TORCH_FORCE_NO_WEIGHTS_ONLY_LOAD=1'), c('torch ≥ 2.6 refuses checkpoints that pickle whole modules'), c('none; restores torch 2.3 loading of the checksummed official files')],
      [c('MPC capped at 3 rounds; serial in-process simulators'), c('upstream max_iter is unbounded; 50 forked simulators exhaust WSL memory'), c('paper\'s budget unstated, so every round is reported')],
    ];
    s.addTable(rows, { x: MX, y: 1.62, w: CW, colW: [4.3, 4.2, 3.633], fontFace: 'Calibri', fontSize: 12, rowH: 0.47, margin: [0.05, 0.08, 0.05, 0.08], valign: 'middle' });
    L.notes(s, {
      say: 'Backup slide. Every place where our setup differs from upstream DINO-WM, why, and how much it could affect fidelity. The only change on the numerical path is the runtime patch set, which was benchmarked for decision fidelity.',
      takeaway: 'All deviations are documented, and none is expected to change planning decisions; the three-seed Push-T result supports that.',
      careful: 'Full details, including the benchmark table, are in docs/experiments/phase0_dino_wm_reproduction.md. The 85% VRAM cap mentioned in an early version of that document was lowered to 75% for the full runs.',
      q: 'Could the PyTorch upgrade explain any difference from the paper?',
      a: 'It could cause small numerical drift, but our Push-T results match the paper within seed noise, so there is no sign of a material effect.',
    });
  }

  // ---------------------------------------------------------------- A2. Glossary
  {
    const s = add('Appendix', 'APPENDIX A2', 'Glossary of terms and abbreviations used in this deck');
    const terms = [
      ['JEPA', 'joint-embedding predictive architecture: predicts representations, not pixels [4, 5]'],
      ['DINOv2', 'self-supervised vision transformer; its patch features are DINO-WM\'s frozen encoder [3]'],
      ['Latent z', 'the encoder\'s representation of an image: 196 patch tokens × 384 numbers'],
      ['World model', 'learned model predicting the next latent from the current one and an action'],
      ['MDP / POMDP', '(partially observable) Markov decision process'],
      ['MPC', 'model predictive control: plan a short horizon, execute, observe, replan'],
      ['CEM', 'cross-entropy method: sample, keep the best (elites), refit, repeat'],
      ['Elites', 'the top-k candidates by cost in one CEM iteration (k = 30 here)'],
      ['MPPI', 'model predictive path integral: averages all samples weighted by cost'],
      ['RSSM', 'recurrent state-space model (PlaNet, Dreamer)'],
      ['Trust score u_k', 'per-imagined-step unreliability estimate; higher = less trusted'],
      ['τ, λ', 'rejection threshold of the gate; weight of the soft-penalty control'],
      ['AUROC / AUPRC', 'area under the ROC / precision-recall curve'],
      ['ECE', 'expected calibration error of binned scores'],
      ['FRR / FAR', 'false rejection / false acceptance rate of the gate'],
      ['Spearman ρ', 'rank correlation between score and real error'],
      ['OOD', 'out of distribution: unlike the training data'],
      ['Proprio', 'proprioceptive input: the agent\'s own position'],
      ['Frameskip', 'simulator steps per planned action (5 here)'],
      ['TF32 / bf16', 'reduced-precision GPU number formats'],
      ['SDPA', 'scaled dot-product attention (fused GPU kernel)'],
      ['OSF / WSL2', 'Open Science Framework (data host) / Windows Subsystem for Linux'],
    ];
    const half = Math.ceil(terms.length / 2);
    [terms.slice(0, half), terms.slice(half)].forEach((col, k) => {
      L.text(s, col.flatMap((t, i) => [
        { text: t[0] + '  ', options: { bold: true, color: K.ink } },
        { text: t[1], options: { color: K.body, breakLine: i < col.length - 1 } },
      ]), { x: k === 0 ? MX : 6.78, y: 1.62, w: 5.95, h: 5.25, fontSize: 12.5, paraSpaceAfter: 5 });
    });
    L.notes(s, {
      say: 'Backup slide: every abbreviation used in the deck, in one place.',
      takeaway: 'Terms are defined where first used and collected here.',
    });
  }
};

'use strict';
// The 8-slide mid-review deck (7 presented + references). Covers the six required review areas:
// 1 title (slide 1), 2 problem (2), 3 existing work and difference (3), 4 MDP, algorithm, data (4),
// 5 architecture (5), 6 novel components, demo, progress, next steps (6, 7).
const fs = require('fs');
const path = require('path');
const { MX, CW } = require('./lib');
const { titleSlide } = require('./s1_problem');
const { viewA } = require('./s4_architecture');
const SCRIPT = require('./script');

module.exports = function shortDeck(ctx) {
  const { pres, L, K, M, add, cite, ASSETS } = ctx;
  const rule = () => [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: K.hair }, { type: 'none' }];
  const head = (t, o = {}) => ({ text: t, options: Object.assign({ bold: true, color: K.ink, fill: { color: K.panel }, border: rule() }, o) });
  const cell = (t, o = {}) => ({ text: L.mr(t), options: Object.assign({ color: K.body, border: rule(), valign: 'top' }, o) });
  const capsLabel = (s, t, x, y, w, color) => L.text(s, t, { x, y, w, h: 0.24, fontSize: 10.5, bold: true, color: color || K.muted, charSpacing: 1.2, valign: 'middle' });

  const P = M.envs.pusht; const seeds = ['99', '100', '101'];
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
  const r1 = seeds.map((k) => P[k].rounds[0].rate); const r3 = seeds.map((k) => P[k].rounds[2].rate);
  const f2 = (v) => v.toFixed(2); const f3 = (v) => v.toFixed(3);
  const W99 = M.envs.wall['99'];
  const ms = (i) => mean(seeds.map((k) => P[k].round1_cem[i].success_rate));

  // H1 pilot summary (copied from outputs/runs/h1_pilot/<tag>/summary.json); slide 6 falls back without it
  const PILOT = require('./pilot_data')(ASSETS); // pooled over seeds when available
  const pct = (v) => `${Math.round(v * 100)}%`;
  const bestScore = () => {
    const cands = ['mc_dropout', 'act_perturb', 'obs_perturb', 'knn'];
    return cands.reduce((b, k) => (PILOT.auroc_stratified[k].auroc > PILOT.auroc_stratified[b].auroc ? k : b), cands[0]);
  };
  const SCORE_NAME = { mc_dropout: 'MC-dropout', act_perturb: 'action perturbation', obs_perturb: 'image perturbation', knn: 'distance to training data' };
  // One honest sentence on the pilot, derived from the numbers (used on slide 7).
  function pilotSentence() {
    const A = PILOT.auroc_stratified; const b = bestScore(); const r = A[b];
    const triv = A.dist_start.auroc; const rnd = A.random.auroc;
    const beatsRandom = r.auroc_ci[0] > 0.5; const beatsTrivial = r.auroc_ci[0] > triv;
    const verdict = beatsTrivial ? 'beats chance and the trivial baseline' : beatsRandom ? 'beats chance but not yet the trivial "distance moved" baseline (' + triv.toFixed(2) + ')' : 'does not yet beat chance';
    return `Best untrained score: ${SCORE_NAME[b]}, AUROC ${r.auroc.toFixed(2)} [${r.auroc_ci[0].toFixed(2)}–${r.auroc_ci[1].toFixed(2)}] vs random ${rnd.toFixed(2)}: it ${verdict} (${PILOT.seeds} seed${PILOT.seeds > 1 ? 's' : ''}, ${PILOT.setup.episodes} episodes). Next: more sampling contexts and calibration, then H4 in the closed loop.`;
  }
  function evalStatus() {
    const W = M.envs.wall; const nW = Object.keys(W).length; const pm = Object.keys(M.envs.point_maze || {}).length ? 'PointMaze 1' : 'PointMaze smoke';
    return `Push-T 3 seeds, Wall ${nW}, ${pm}, H1 pilot`;
  }
  function pilotTiles() {
    const g = PILOT.offline_gate; const b = bestScore();
    const W = M.envs.wall; const wSeeds = Object.keys(W).filter((k) => W[k].rounds.length >= 2);
    const wR = Math.min(3, ...wSeeds.map((k) => W[k].rounds.length)); // same round for every seed
    const wRate = mean(wSeeds.map((k) => W[k].rounds[wR - 1].rate));
    const PM = M.envs.point_maze && M.envs.point_maze['99'];
    const plain = g['plain (no gate)'].success; const gated = g['gate: ' + b].success; const oracle = g['oracle (true error)'].success;
    const gateNote = Math.abs(oracle - plain) < 0.05 ? 'even the oracle gate gives ' + pct(oracle) + ', so only the closed loop (H4) can show a gain' : 'oracle gate ' + pct(oracle) + ', random gate ' + pct(g['random gate'].success);
    return [
      ['3.8×', 'faster per 300-candidate rollout (26.2 s → 6.9 s); CEM\'s top 30 and its update unchanged'],
      [`${pct(plain)} → ${pct(gated)}`, `pilot, offline: chosen plan succeeds, plain → ${SCORE_NAME[b]} gate; ${gateNote}`],
      [wRate.toFixed(2), `Wall success after round ${wR}, mean of ${wSeeds.length} seed${wSeeds.length > 1 ? 's' : ''} (published 0.96)`],
      PM ? [PM.rounds[PM.rounds.length - 1].rate.toFixed(2), `PointMaze success after round ${PM.rounds.length}, 1 seed (published 0.98)`]
        : ['≈ 3.4 min', 'per 25-step plan on the RTX 5060: not real-time yet'],
    ];
  }

  // ================================================================ 1. Title
  titleSlide(ctx, {
    notes: {
      script: SCRIPT[0],
      time: '30 s',
      say: 'We are [TEAM MEMBERS], guided by [GUIDE NAME]. Our project is SCoPe. A robot can plan by imagining the result of candidate actions inside a learned world model and picking the plan whose imagined result looks closest to the goal. SCoPe adds one check: before acting, ask whether the imagined future is something the model can be trusted on, and refuse plans that leave that trusted region. In seven slides: the problem, existing work and our difference, the RL formulation, the architecture, the evidence so far, and the plan.',
    },
  });

  // ================================================================ 2. Problem, statement, research question
  {
    const s = add('2 · Problem', '2 · PROBLEM BACKGROUND AND STATEMENT', 'A world model can imagine a success that never happens');
    L.chips(s, ['MEASURED', 'PUBLISHED']);
    const ix = 2.1; const ih = 2.4; const iw = ih * 1892 / 452; const iy = 1.88; const colW = iw / 8;
    L.text(s, 'sim step', { x: MX, y: 1.6, w: 1.3, h: 0.26, fontSize: 11, color: K.muted, italic: true });
    ['0', '5', '10', '15', '20', '25', '75', 'goal'].forEach((t, i) => L.text(s, t, { x: ix + i * colW, y: 1.6, w: colW, h: 0.26, fontSize: 11, bold: i === 7, color: K.muted, align: 'center' }));
    s.addImage({ path: path.join(ASSETS, 'rollout_failure_seed101_ep0.png'), x: ix, y: iy, w: iw, h: ih, altText: 'Push-T seed 101 episode 0: real simulator frames (top) versus the world model decoded imagination (bottom) for the same actions; the imagined T reaches the goal pose, the real one barely moves.' });
    L.text(s, [{ text: 'Real simulator', options: { bold: true, color: K.ink, breakLine: true } }, { text: 'what happened', options: { color: K.sub } }], { x: MX, y: iy + 0.3, w: 1.42, h: 0.6, fontSize: 12.5 });
    L.text(s, [{ text: 'Model\'s imagination', options: { bold: true, color: K.ink, breakLine: true } }, { text: 'decoded latents', options: { color: K.sub } }], { x: MX, y: iy + ih / 2 + 0.25, w: 1.42, h: 0.62, fontSize: 12.5 });
    const by = iy + ih + 0.07;
    L.path(s, [[ix + 0.05, by - 0.05], [ix + 0.05, by], [ix + 6 * colW - 0.05, by], [ix + 6 * colW - 0.05, by - 0.05]], { color: K.faint, w: 1, head: false });
    L.text(s, 'MPC round 1: the 25-step plan CEM selected', { x: ix, y: by + 0.02, w: 6 * colW, h: 0.24, fontSize: 10.5, color: K.sub, align: 'center' });
    L.text(s, 'after round 3', { x: ix + 6 * colW, y: by + 0.02, w: colW, h: 0.24, fontSize: 10.5, color: K.sub, align: 'center' });
    L.text(s, 'Push-T · seed 101 · episode 0 · our run with the released DINO-WM checkpoint. In imagination the T turns to the goal pose; in the simulator the same actions barely move it.',
      { x: MX, y: by + 0.3, w: CW, h: 0.24, fontSize: 10.5, color: K.muted, italic: true });
    // bottom: why it matters | problem statement | research question
    const py = 4.98; const ph = 1.87;
    capsLabel(s, 'WHY IT MATTERS', MX, py, 4.0);
    const stats = [
      ['80% vs 15%', 'zero-shot real-arm pick-and-place: V-JEPA 2-AC latent planning vs the Octo policy ' + cite(2)],
      ['70% vs 0%', 'hierarchical vs flat latent planning on real pick-and-place ' + cite(15)],
      ['26% → 34%', 'collisions after adding an uncertainty penalty to MPC ' + cite(18)],
    ];
    stats.forEach((st, i) => {
      const y = py + 0.3 + i * 0.52;
      L.text(s, st[0], { x: MX, y, w: 1.42, h: 0.5, fontSize: 16, bold: true, color: K.ink, valign: 'middle' });
      L.text(s, st[1], { x: MX + 1.47, y, w: 2.6, h: 0.5, fontSize: 10.5, color: K.sub, valign: 'middle' });
    });
    L.rect(s, { x: 4.85, y: py, w: 3.95, h: ph, radius: 0.06, fill: K.blueTint, line: null });
    capsLabel(s, 'PROBLEM STATEMENT', 5.02, py + 0.08, 3.6, K.blueDark);
    L.text(s, [
      { text: 'Latent planners pick the plan whose imagined future looks closest to the goal, with no check that the imagination is reliable; errors compound over the horizon and become real actions. ', options: { color: K.ink } },
      { text: 'Proposed: ', options: { bold: true, color: K.blueDark } },
      { text: 'score every imagined step, reject plans that leave the trusted region, fall back safely, without retraining the world model.', options: { color: K.ink } },
    ], { x: 5.02, y: py + 0.36, w: 3.65, h: ph - 0.42, fontSize: 11.5 });
    L.rect(s, { x: 9.0, y: py, w: 3.733, h: ph, radius: 0.06, fill: K.white, line: K.ink, lineW: 1 });
    capsLabel(s, 'RESEARCH QUESTION', 9.17, py + 0.08, 3.4, K.ink);
    L.text(s, [
      { text: 'Can an uncertainty score on imagined JEPA latents flag unreliable rollouts well enough that rejecting them improves real planning success, without rejecting most good plans?', options: { color: K.ink, bold: true, breakLine: true } },
      { text: 'Scope: DINO-WM checkpoints on Push-T, Wall and PointMaze (simulated), frozen encoder, one 8 GB GPU; no real robot.', options: { color: K.sub, fontSize: 10.5 } },
    ], { x: 9.17, y: py + 0.36, w: 3.42, h: ph - 0.42, fontSize: 11.5, paraSpaceAfter: 4 });
    L.notes(s, {
      script: SCRIPT[1],
      time: '90 s',
      say: 'This is one episode from our own reproduction run. Top row: what really happened in the Push-T simulator. Bottom row: what the world model imagined for exactly the same actions, decoded back into pictures. In imagination the T-block turns toward the goal within 25 steps, so the planner chose this plan; in reality it barely moves, and the episode was still unsolved after three replanning rounds. Why it matters: latent planning now works on real robots, 80% against 15% for a policy baseline, but long horizons break it, and the obvious fix, penalising uncertainty, made collisions more frequent in one study. Our problem statement and research question are on the right: can a score on the imagined latents flag unreliable rollouts well enough that rejecting them improves success, without throwing away good plans?',
      takeaway: 'The planner acts on imagined futures with no reliability check; we have a logged case where that fails, and the question is whether a trust check can fix it.',
      visual: 'Columns are simulator steps 0–25 (the first plan, executed open-loop), step 75, and the goal image. Compare top and bottom in each column: they agree at step 0 and diverge from step 10.',
      why: 'Leading with a real failure from our own logs makes the problem concrete and shows the pipeline already runs.',
      careful: 'One illustrative failure, not a failure rate. The step-75 column replays all executed actions open-loop from the start. The three published numbers come from different robots and tasks and are not comparable with each other; [15] and [2] are preprints and [18] a workshop paper. Nothing SCoPe-specific has been measured yet.',
      q: 'Why not just train a better world model?',
      a: 'A better model reduces errors but cannot remove them, especially off its training data, so a planner still needs to know when to distrust a prediction. We keep the released model frozen so that any change in success comes from the trust check.',
      sources: 'Run: outputs/runs/phase0/pusht/20261010_090828 (seed 101). Published: [2] V-JEPA 2, [15] HWM, [18] Learning from World Feedback.',
    });
  }

  // ================================================================ 3. Existing work and our difference
  {
    const s = add('3 · Existing work and gap', '3 · EXISTING WORK, RESEARCH GAP AND OUR DIFFERENCE', 'Existing work and our difference: a decision-time trust check');
    L.chips(s, ['PUBLISHED', 'PROPOSED']);
    const fam = (name, refs) => ({ text: [{ text: name + ' ', options: { bold: true, color: K.ink } }, { text: refs, options: { bold: true, color: K.orangeDark } }], options: { border: rule(), valign: 'top' } });
    const rows = [
      [head('Family and studies'), head('How model error is handled'), head('Reported result'), head('Gap for SCoPe')],
      [fam('Uncertainty-aware model-based RL', cite(6, '8–11')), cell('ensembles, short or adaptive rollouts, reward penalties, HALT states'), cell('PETS: model-free return with 8× / 125× fewer samples than SAC / PPO'), cell('acts in training on low-dimensional states; never vetoes a plan')],
      [fam('Latent safety filter', cite(16)), cell('epistemic uncertainty + conformal threshold veto unsafe actions'), cell('vision-based Franka arm, simulation and hardware'), cell('avoids failure sets with a learned safety value; not goal reaching')],
      [fam('Reward-based latent agents', cite(7, 12, 13)), cell('latent world model with CEM, actor-critic or MPPI'), cell('DreamerV3: 150+ tasks; TD-MPC2: 104 tasks'), cell('need a reward; every imagined rollout is trusted')],
      [fam('JEPA latent planners', cite(1, 14)), cell('frozen features + predictor; CEM-MPC to a goal image, reward-free'), cell('DINO-WM success 0.90 / 0.96 / 0.98 (Push-T / Wall / PointMaze)'), cell([{ text: 'no reliability check. ', options: {} }, { text: 'DINO-WM is our base.', options: { bold: true, color: K.blueDark } }])],
      [fam('Real-robot latent planners', cite(2, 15)), cell('action-conditioned predictor; hierarchical MPC'), cell('pick-and-place 80% vs 15% (Octo); 70% vs 0% (flat)'), cell('target scale and horizon, not reliability')],
      [fam('Counter-evidence', cite('17–21')), cell('analyses of uncertainty and latent reliability'), cell('disagreement misses compounding error; penalties raised collisions 26% → 34%'), cell('a trust score must be tested against real error first (H1)')],
    ];
    s.addTable(rows, { x: MX, y: 1.62, w: CW, colW: [2.75, 3.25, 3.25, 2.883], fontFace: 'Calibri', fontSize: 11, rowH: [0.32, 0.5, 0.5, 0.42, 0.5, 0.42, 0.5], margin: [0.04, 0.07, 0.04, 0.07] });
    capsLabel(s, 'OUR DIFFERENCE: ONE CHANGE INSIDE THE PLANNER', MX, 5.15, 6, K.blueDark);
    const steps = [['Observe', 0], ['Encode', 0], ['Sample 300 plans', 0], ['Imagine 5 steps', 0], ['Score trust u_k', 1], ['Gate: all u_k ≤ τ', 1], ['Cost on accepted', 0], ['Execute, replan', 0]];
    const sw = 1.36; const sg = 0.17; const sy = 5.45;
    steps.forEach((st, i) => {
      const x = MX + i * (sw + sg);
      L.rect(s, { x, y: sy, w: sw, h: 0.5, radius: 0.08, fill: st[1] ? K.violetTint : K.panel2, line: st[1] ? K.violet : K.line, lineW: st[1] ? 1.5 : 0.75, dash: st[1] ? 'dash' : 'solid' });
      L.text(s, st[0], { x: x + 0.04, y: sy, w: sw - 0.08, h: 0.5, fontSize: 11.5, bold: !!st[1], color: st[1] ? K.violet : K.ink, align: 'center', valign: 'middle' });
      if (i < steps.length - 1) L.arrow(s, x + sw, sy + 0.25, x + sw + sg, sy + 0.25, { color: K.faint, w: 1 });
    });
    L.text(s, [{ text: 'Dashed violet = new (planned); too few pass → resample → shorter horizon → safe action → stop and flag. ', options: { color: K.violet } },
      { text: 'DINO-WM today runs the same loop without these two steps. The closest work ' + cite(16) + ' vetoes actions to avoid failures; SCoPe vetoes goal-reaching plans and first tests the score against real error.', options: { color: K.body } }],
    { x: MX, y: 6.05, w: CW, h: 0.8, fontSize: 11.5 });
    L.notes(s, {
      script: SCRIPT[2],
      time: '90 s',
      say: 'Two literatures meet here. Model-based RL has long guarded against model error: ensembles, short or adaptive rollouts, uncertainty penalties, halt states. But it does so while training a policy on small state vectors, and it never refuses a plan at decision time. The closest decision-time work, the latent safety filter, vetoes unsafe actions rather than goal-reaching plans. The latent planners we build on, DINO-WM and V-JEPA 2-AC, work zero-shot from images and even on real arms, but trust every imagined rollout equally. And recent work warns that uncertainty can miss compounding error or even make things worse, so we treat any trust score as a hypothesis. Our difference is one change inside the planner, the two violet steps: score each imagined step and gate the candidates before the cost decides.',
      takeaway: 'The idea of distrusting a model is established; a decision-time veto on imagined JEPA latents, validated against real error, is the narrow gap we test.',
      visual: 'Table: one row per family, references in orange, our gap in the last column. Bottom: the planner loop, where only the violet steps are new.',
      why: 'Grouping studies by family keeps the comparison readable on one slide; the full 13-study comparison is in the extended deck.',
      careful: 'Do not say "no one has done this". Say we did not find a study that gates CEM candidates on frozen-encoder JEPA latents against real error. PETS numbers are from its abstract; the safety-filter abstract gives qualitative results only; counter-evidence papers are 2026 preprints or workshop papers except Biased Dreams (RLC 2026).',
      q: 'Isn\'t this just MOReL\'s halt state at planning time?',
      a: 'The spirit is similar and we cite it. The differences: MOReL cuts off unknown state-actions while training a policy on low-dimensional states; we veto candidate plans per imagined step at decision time, on 196×384 patch-token latents of a frozen encoder, and we first test whether the score tracks real error.',
    });
  }

  // ================================================================ 4. RL formulation, algorithm, data
  {
    const s = add('4 · MDP, algorithm, data', '4 · MDP FORMULATION, ALGORITHM, DATA AND SIMULATION', 'RL formulation: a latent-space MDP solved by CEM-based MPC');
    L.chips(s, ['PUBLISHED', 'PROPOSED']);
    const rows = [
      [head('Element'), head('Our definition (Push-T unless stated)')],
      [cell('State / observation', { bold: true, color: K.ink }), cell('224×224 image + agent position; planning state = frozen DINOv2 ' + cite(3) + ' patch tokens (196 × 384), 3-frame history')],
      [cell('Action', { bold: true, color: K.ink }), cell('2-D target for the agent (PD-tracked), planned as 10-D chunks of 5 simulator steps; horizon H = 5')],
      [cell('Reward / cost', { bold: true, color: K.ink }), cell('no environment reward: cost = latent distance of the last imagined step to the goal image')],
      [cell('Transition', { bold: true, color: K.ink }), cell('real: 2-D contact physics (pymunk); imagined: ViT predictor f_θ')],
      [cell('Episode', { bold: true, color: K.ink }), cell('one start/goal pair; MPC rounds of 25 simulator steps, at most 3 rounds')],
      [cell('Termination', { bold: true, color: K.ink }), cell('success when ‖Δposition‖ < 20 and |Δθ| < π/9 (Wall < 4.5, PointMaze < 0.5)')],
      [cell('Policy, discount', { bold: true, color: K.ink }), cell('π(o_t, g) = first 5 chunks of the best CEM plan, then replan; γ = 1 (terminal cost)')],
    ];
    s.addTable(rows, { x: MX, y: 1.62, w: 6.35, colW: [1.55, 4.8], fontFace: 'Calibri', fontSize: 11, rowH: [0.3, 0.5, 0.5, 0.5, 0.32, 0.32, 0.5, 0.5], margin: [0.04, 0.07, 0.04, 0.07] });
    const rx = 7.2; const rw = 12.733 - rx;
    L.rect(s, { x: rx, y: 1.62, w: rw, h: 1.88, radius: 0.06, fill: K.panel2, line: K.hair });
    capsLabel(s, 'ALGORITHM: CEM-BASED MPC (DINO-WM\'S PLANNER)', rx + 0.15, 1.68, rw - 0.3, K.ink);
    L.text(s, [
      { text: '300 sampled plans, refit to the top 30, 30 iterations; execute 5 chunks, replan', options: { bullet: { indent: 12 }, breakLine: true } },
      { text: 'vs PPO / SAC: need a reward and online interaction; our data are offline and reward-free', options: { bullet: { indent: 12 }, breakLine: true } },
      { text: 'vs gradient planning: Push-T 0.28, against 0.86 (one CEM plan) and 0.90 (MPC) ' + cite(1), options: { bullet: { indent: 12 }, breakLine: true } },
      { text: 'fits SCoPe: an explicit candidate set to filter; cost ≈ 3.4 min per plan on our GPU', options: { bullet: { indent: 12 } } },
    ], { x: rx + 0.15, y: 1.94, w: rw - 0.3, h: 1.52, fontSize: 11, color: K.body, paraSpaceAfter: 2 });
    L.rect(s, { x: rx, y: 3.6, w: rw, h: 1.34, radius: 0.06, fill: K.panel2, line: K.hair });
    capsLabel(s, 'DATA AND SIMULATION (DINO-WM RELEASE ' + cite(26) + ')', rx + 0.15, 3.66, rw - 0.3, K.ink);
    L.text(s, [
      { text: 'Push-T: pymunk 2-D physics ' + cite(24) + ', 18.5k offline samples · Wall: 2-D room with a door, 1,920 trajectories · PointMaze: MuJoCo 2.1 ' + cite(25) + ', 2,000 trajectories', options: { breakLine: true } },
      { text: 'Simulated and reward-free; evaluation pairs come from the validation split or freshly sampled states; seeds 99–101 × 50 pairs.', options: { color: K.sub } },
    ], { x: rx + 0.15, y: 3.93, w: rw - 0.3, h: 0.98, fontSize: 11, color: K.body, paraSpaceAfter: 3 });
    L.rect(s, { x: MX, y: 5.1, w: CW, h: 0.95, radius: 0.06, fill: K.white, line: K.line });
    L.text(s, [
      { text: 'minimise over a_t … a_{t+4}:   c_g = MSE_{visual}(ẑ_{t+5}, z_g) + α · MSE_{proprio}(ẑ_{t+5}, z_g)', options: { breakLine: true } },
      { text: 'subject to (SCoPe):   u_k ≤ τ for every imagined step k = 1 … 5;   too few candidates pass → fallback ladder', options: { color: K.violet } },
    ], { x: MX + 0.2, y: 5.12, w: CW - 0.4, h: 0.91, fontSize: 15, fontFace: 'Cambria Math', color: K.ink, valign: 'middle', lineSpacingMultiple: 1.15 });
    L.text(s, [
      { text: 'Why RL: ', options: { bold: true, color: K.ink } },
      { text: 'a push takes effect steps later and success is judged only after the plan, so actions are chosen as a sequence (model-based RL at decision time). ', options: { color: K.body } },
      { text: 'Reward hacking ', options: { bold: true, color: K.redDark } },
      { text: 'here means exploiting model errors, so success is always judged by the simulator. α = 1 (Push-T, Wall) or 0 (PointMaze), upstream values.', options: { color: K.body } },
    ], { x: MX, y: 6.15, w: CW, h: 0.7, fontSize: 11.5 });
    L.notes(s, {
      script: SCRIPT[3],
      time: '90 s',
      say: 'Formally, the task is a goal-conditioned partially observed MDP: the true state, the T pose and the agent, is only seen through a camera. The planner works in a latent MDP instead: the frozen DINOv2 encoder turns each image into 196 patch tokens, and the learned predictor maps the last three latents and an action chunk to the next latent. The table maps every MDP element to what the code does. There is no hand-designed reward: the cost is the latent distance of the final imagined step to the goal image, and SCoPe adds a constraint, shown in violet, not a new reward. The algorithm is DINO-WM\'s own: CEM-based MPC. Policy-gradient methods need a reward and online interaction we do not have, and gradient-based planning reaches only 0.28 on Push-T. CEM also keeps an explicit set of candidates, which is exactly what our gate filters. The data are DINO-WM\'s simulated, reward-free release.',
      takeaway: 'Every MDP element is pinned to the code we run; SCoPe changes the constraint, not the reward or the algorithm.',
      visual: 'Left: the MDP table. Right: algorithm choice and data. Bottom: the optimisation problem, with the SCoPe constraint in violet.',
      why: 'Keeping DINO-WM\'s cost, algorithm and data means our baseline equals the published one and any change in success can be attributed to the gate.',
      careful: 'γ = 1 is fine because the horizon is 5 steps and the cost is terminal; long horizons come from replanning. The 0.28 / 0.86 / 0.90 Push-T numbers are published by DINO-WM; ≈ 3.4 min per plan is our measurement (about 6.8 s per 300-candidate iteration × 30). τ will be calibrated on held-out decision points, never on test episodes.',
      q: 'Why is this RL and not supervised learning?',
      a: 'Supervised next-latent prediction trains the world model, but acting requires searching over action sequences against a long-horizon objective, because a push takes effect later and success is checked only at the end. That search, planning with a learned model, is model-based RL at decision time.',
    });
  }

  // ================================================================ 5. System architecture
  viewA(ctx, {
    section: '5 · System architecture',
    overline: '5 · END-TO-END SYSTEM DESIGN AND ARCHITECTURE',
    title: 'System architecture: online agent and offline learning loop',
    notes: {
      script: SCRIPT[4],
      careful: 'Only the grey and green boxes run today. The trust module has interfaces (TrustScorer, TrustGate) but no implementation; the store and calibration are designed but not built. The agent-environment loop, data-flow and proposed deployment views are in the extended deck (slides 20–22): on a robot the same loop would add an action filter, trust telemetry and an operator channel, and it is not real-time today (about 3.4 minutes per plan).',
    },
  });

  // ================================================================ 6. Evidence so far
  {
    const s = add('6 · Evidence, progress, next steps', '6 · NOVEL COMPONENTS, DEMONSTRATION, PROGRESS AND NEXT STEPS', PILOT ? 'Evidence so far: baseline reproduced, and a first trust-score pilot' : 'Evidence so far: DINO-WM reproduced on our 8 GB GPU, 3.8× faster');
    L.chips(s, ['MEASURED', 'PUBLISHED']);
    // dot plot: Push-T reproduction vs paper
    const x0 = 2.75; const x1 = 6.35; const v0 = 0.7; const v1 = 1.0;
    const X = (v) => x0 + (v - v0) / (v1 - v0) * (x1 - x0);
    const top = 1.98; const bot = 4.42;
    [0.7, 0.8, 0.9, 1.0].forEach((v) => {
      L.arrow(s, X(v), top, X(v), bot, { color: K.hair, w: 0.75, head: false });
      L.text(s, v.toFixed(1), { x: X(v) - 0.3, y: bot + 0.03, w: 0.6, h: 0.22, fontSize: 10.5, color: K.muted, align: 'center' });
    });
    L.text(s, 'Push-T success rate (50 start/goal pairs per seed)', { x: x0 - 0.3, y: bot + 0.26, w: x1 - x0 + 0.6, h: 0.24, fontSize: 10.5, color: K.muted, align: 'center' });
    L.ellipse(s, { x: x0, y: 1.67, w: 0.13, h: 0.13, fill: K.faint, line: null });
    L.text(s, 'seed', { x: x0 + 0.18, y: 1.61, w: 0.45, h: 0.24, fontSize: 10.5, color: K.sub, valign: 'middle' });
    L.arrow(s, x0 + 0.7, 1.73, x0 + 1.0, 1.73, { color: K.blue, w: 3, head: false });
    L.text(s, 'mean ± 1 SD', { x: x0 + 1.06, y: 1.61, w: 1.0, h: 0.24, fontSize: 10.5, color: K.sub, valign: 'middle' });
    L.text(s, '◆', { x: x0 + 2.1, y: 1.6, w: 0.2, h: 0.26, fontSize: 12, color: K.orange, valign: 'middle', align: 'center' });
    L.text(s, 'published ' + cite(1), { x: x0 + 2.3, y: 1.61, w: 1.3, h: 0.24, fontSize: 10.5, color: K.sub, valign: 'middle' });
    const rowsD = [
      { label: 'One CEM plan', sub: 'MPC round 1', vals: r1, pub: 0.86, pubLabel: '0.86 published', yc: 2.72 },
      { label: 'With replanning', sub: 'after round 3', vals: r3, pub: 0.90, pubLabel: '0.90 published', yc: 3.82 },
    ];
    rowsD.forEach((r) => {
      L.text(s, [{ text: r.label, options: { bold: true, color: K.ink, breakLine: true } }, { text: r.sub, options: { color: K.sub, breakLine: true } }, { text: 'seeds: ' + r.vals.map(f2).join(' / '), options: { color: K.muted, fontSize: 10 } }],
        { x: MX, y: r.yc - 0.45, w: 1.95, h: 0.9, fontSize: 12, valign: 'middle' });
      r.vals.forEach((v, i) => L.ellipse(s, { x: X(v) - 0.065, y: r.yc - 0.4 + i * 0.1, w: 0.13, h: 0.13, fill: K.faint, line: 'FFFFFF', lineW: 0.75 }));
      const m = mean(r.vals); const d = sd(r.vals);
      L.arrow(s, X(m - d), r.yc, X(m + d), r.yc, { color: K.blue, w: 3, head: false });
      L.ellipse(s, { x: X(m) - 0.09, y: r.yc - 0.09, w: 0.18, h: 0.18, fill: K.blue, line: 'FFFFFF', lineW: 1 });
      L.text(s, `${f3(m)} ± ${f3(d)}`, { x: X(m - d) - 1.25, y: r.yc - 0.13, w: 1.18, h: 0.26, fontSize: 12, bold: true, color: K.ink, align: 'right', valign: 'middle' });
      L.text(s, '◆', { x: X(r.pub) - 0.11, y: r.yc + 0.16, w: 0.22, h: 0.26, fontSize: 13, color: K.orange, align: 'center', valign: 'middle' });
      L.text(s, r.pubLabel, { x: X(r.pub) + 0.12, y: r.yc + 0.17, w: 1.3, h: 0.24, fontSize: 10.5, color: K.orangeDark, valign: 'middle' });
    });
    if (PILOT) {
      // H1 pilot: AUROC of each trust score for "real latent error in the top 10%", with 95% CI
      const ax0 = 9.05; const ax1 = 12.45; const a0 = 0.3; const a1 = 1.0;
      const AX = (v) => ax0 + (Math.min(Math.max(v, a0), a1) - a0) / (a1 - a0) * (ax1 - ax0);
      L.text(s, 'H1 pilot: does a trust score flag the imagined steps with the largest real error?', { x: 6.8, y: 1.6, w: 5.93, h: 0.28, fontSize: 12, bold: true, color: K.ink });
      L.text(s, `AUROC with 95% interval · ${PILOT.setup.episodes} Push-T decision points, ${PILOT.seeds} seed${PILOT.seeds > 1 ? 's' : ''} · ${PILOT.setup.pairs.toLocaleString('en-US')} imagined steps checked against the simulator`,
        { x: 6.8, y: 1.88, w: 5.93, h: 0.42, fontSize: 10.5, color: K.sub });
      const order = [['mc_dropout', 'MC-dropout'], ['act_perturb', 'Action perturbation'], ['obs_perturb', 'Image perturbation'], ['knn', 'Distance to training data'],
        ['cost', 'Imagined cost'], ['dist_start', 'Distance moved (trivial)'], ['random', 'Random (control)']];
      const ry0 = 2.52; const rh2 = 0.33; const gbot = ry0 + order.length * rh2;
      [0.5, 0.7, 0.9].forEach((v) => {
        L.arrow(s, AX(v), ry0 - 0.08, AX(v), gbot, { color: v === 0.5 ? K.faint : K.hair, w: v === 0.5 ? 1.25 : 0.75, dash: v === 0.5 ? 'dash' : 'solid', head: false });
        L.text(s, v === 0.5 ? '0.5 = chance' : v.toFixed(1), { x: AX(v) - 0.5, y: gbot + 0.03, w: 1.0, h: 0.22, fontSize: 10, color: K.muted, align: 'center' });
      });
      order.forEach(([key, name], i) => {
        const r = PILOT.auroc_stratified[key]; if (!r) return;
        const y = ry0 + i * rh2 + rh2 / 2; const ctrl = key === 'random' || key === 'dist_start';
        L.text(s, [{ text: name + '  ', options: { color: ctrl ? K.sub : K.ink } }, { text: r.auroc.toFixed(2), options: { bold: true, color: ctrl ? K.sub : K.ink } }],
          { x: 6.8, y: y - 0.14, w: 2.2, h: 0.28, fontSize: 11, align: 'right', valign: 'middle' });
        L.arrow(s, AX(r.auroc_ci[0]), y, AX(r.auroc_ci[1]), y, { color: ctrl ? K.faint : K.blue, w: 2, head: false });
        L.ellipse(s, { x: AX(r.auroc) - 0.075, y: y - 0.075, w: 0.15, h: 0.15, fill: ctrl ? K.muted : K.blue, line: 'FFFFFF', lineW: 0.75 });
      });
    } else {
    // CEM convergence chart (native)
    const it = P['99'].round1_cem.map((x) => String(x.iteration));
    const series = [
      ...seeds.map((k) => ({ name: `Seed ${k}`, labels: it, values: P[k].round1_cem.map((x) => x.success_rate) })),
      { name: 'Mean of 3 seeds', labels: it, values: it.map((_, i) => +ms(i).toFixed(3)) },
      { name: 'Published: one CEM plan, 0.86', labels: it, values: it.map(() => 0.86) },
    ];
    s.addChart(pres.charts.LINE, series, {
      x: 6.8, y: 1.6, w: 5.933, h: 3.3, chartColors: ['A3A9B3', 'A3A9B3', 'A3A9B3', K.blue, K.orange],
      lineDataSymbol: 'none', lineSize: 2.5, showLegend: true, legendPos: 'b', legendFontSize: 10, legendFontFace: '+mn-lt', legendColor: K.sub,
      catAxisLabelColor: K.muted, valAxisLabelColor: K.muted, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt',
      catAxisLabelFrequency: '5', catGridLine: { style: 'none' }, valGridLine: { color: 'E5E7EB', size: 0.5 }, catAxisLineColor: 'C3C2B7',
      valAxisMinVal: 0, valAxisMaxVal: 1, valAxisMajorUnit: 0.2, valAxisLabelFormatCode: '0.0',
      showCatAxisTitle: true, catAxisTitle: 'CEM iteration (MPC round 1)', catAxisTitleColor: K.muted, catAxisTitleFontSize: 10, catAxisTitleFontFace: '+mn-lt',
      showTitle: true, title: 'Success of CEM\'s current plan, per iteration', titleFontSize: 12, titleColor: K.ink, titleFontFace: '+mn-lt',
    });
    }
    const tiles = PILOT ? pilotTiles() : [
      ['3.8×', 'faster per 300-candidate rollout (26.2 s → 6.9 s); CEM\'s top 30 and its update unchanged'],
      [`${f3(ms(21))} = ${f3(ms(29))}`, 'mean success at CEM iteration 22 and 30: quality saturates early'],
      [`${f2(W99.rounds[0].rate)} → ${f2(W99.rounds[1].rate)}`, 'Wall, one seed, rounds 1 → 2 (published 0.74 / 0.96); PointMaze: smoke test only'],
      ['≈ 3.4 min', 'per 25-step plan on the RTX 5060: not real-time yet'],
    ];
    tiles.forEach((t, i) => {
      const x = MX + i * (2.92 + 0.151); const y = 5.12;
      L.rect(s, { x, y, w: 2.92, h: 1.73, radius: 0.06, fill: i === 0 ? K.blueTint : K.panel2, line: null });
      L.text(s, t[0], { x: x + 0.18, y: y + 0.12, w: 2.6, h: 0.58, fontSize: 24, bold: true, color: K.ink, valign: 'middle' });
      L.text(s, t[1], { x: x + 0.18, y: y + 0.74, w: 2.58, h: 0.92, fontSize: 11, color: K.sub });
    });
    L.notes(s, PILOT ? {
      script: SCRIPT[5],
      time: '105 s',
      takeaway: 'The baseline behaves as published on our hardware, and in a first pilot an untrained MC-dropout score ranks the worst imagined steps clearly above chance and above the trivial baseline.',
      visual: 'Left: Push-T dot plot, success 0.7–1.0, grey seeds, blue mean ± SD, orange published. Right: AUROC per trust score with 95% bootstrap interval over episodes; dashed line 0.5 = chance; grey rows are the controls. Tiles: speed-up, offline gate replay, Wall and PointMaze.',
      why: 'H1 is the go / no-go question: without a score that tracks real error, a gate is just a random filter.',
      careful: `Pilot = ${PILOT.seeds} seed${PILOT.seeds > 1 ? 's' : ''}, ${PILOT.setup.episodes} episodes in total${PILOT.byRun ? ' (MC-dropout AUROC per seed: ' + Object.values(PILOT.byRun).map((v) => v.mc_dropout.toFixed(2)).join(', ') + ')' : ''}, ${PILOT.setup.recorded_per_episode} candidates per episode taken from CEM iterations 1, 5 and 10 (48 / 48 / 96) of a ${PILOT.setup.cem_iters}-iteration first plan, each executed open-loop in the simulator. Label: real latent error in the top 10% for its step; AUROC is computed within each step and averaged, so horizon length cannot explain it. Scores are untrained. The offline gate replay picks the best-imagined candidate after rejecting the 30% least trusted; plain ${pct(PILOT.offline_gate['plain (no gate)'].success)}, oracle ${pct(PILOT.offline_gate['oracle (true error)'].success)}: at 40 episodes one episode is 2.5 points, so differences of 5–7 points are noise. Wall is compared at the same round for every seed (3 seeds).`,
      q: 'If MC-dropout predicts error so well, why does the offline gate not help?',
      a: 'Because among CEM\'s final candidates the one it picks is rarely a high-error one: even the oracle gate, which knows the true error, does not change success offline. Error prediction (H1) is necessary but not sufficient; whether rejecting changes what the robot does over several replanning rounds is H4, which needs the closed loop.',
      sources: 'data/h1_pilot_summary.json (scripts/h1_pilot.py, outputs/runs/h1_pilot/pilot40); data/phase0_metrics.json; docs/experiments/h1_pilot_trust_scores.md.',
    } : {
      script: SCRIPT[5],
      time: '90 s',
      say: 'What we have shown so far. Left: our reproduction of DINO-WM on Push-T. Grey dots are the three seeds of 50 episodes each, blue is the mean with one standard deviation, orange the published value. After a single CEM plan we get 0.873 against the paper\'s 0.86; with replanning, 0.900 against 0.90. Right: inside the first plan, the success of CEM\'s current plan climbs from 0.05 to 0.76 in ten iterations and stops improving around iteration 22. Bottom: our runtime patches made each rollout 3.8 times faster without changing which candidates CEM keeps; Wall has one seed so far; and one plan still takes about 3.4 minutes, so this is not real-time. As a live demo, a five-episode smoke test runs in about four minutes.',
      takeaway: 'The baseline SCoPe builds on behaves as published on our hardware, and we know where its compute goes.',
      visual: 'Dot plot axis is success rate 0.7–1.0. Chart: thin grey seeds, blue mean, dashed orange the published single-plan result. Tiles: the four numbers to remember.',
      why: 'A trust gate can only be judged against a correct baseline, so reproduction came first.',
      careful: 'Three seeds is a small sample; at 50 episodes the binomial standard error is about 0.04. Mapping round 1 to the paper\'s CEM row is our reading (one CEM plan, same settings); the paper does not state its replanning budget. The per-iteration success is evaluation-only information. Wall round 3 was lost when WSL shut down; Wall\'s round-1 gap needs a second seed. Live demo command (WSL, repo root): bash scripts/reproduce_dino_wm.sh pusht 5 planner.max_iter=2 planner.sub_planner.opt_steps=3.',
      q: 'Seed 101 is at 0.82 after round 1. Is something wrong?',
      a: 'Probably not: with 50 episodes the standard error is about 0.04, so 0.82 is about two standard errors below 0.90, which happens across different start/goal pairs. We report the spread rather than the best seed.',
      sources: 'data/phase0_metrics.json (parsed from the run logs); docs/experiments/phase0_dino_wm_reproduction.md; published values from DINO-WM [1].',
    });
  }

  // ================================================================ 7. Novel components, progress, next steps
  {
    const s = add('6 · Evidence, progress, next steps', '6 · NOVEL COMPONENTS, DEMONSTRATION, PROGRESS AND NEXT STEPS', PILOT ? 'Progress and next steps: baseline done, first trust-score pilot in' : 'Progress and next steps: baseline done, the trust test comes next');
    L.chips(s, ['TARGET']);
    capsLabel(s, 'NOVEL COMPONENTS', MX, 1.62, 5);
    const comps = [
      ['C1', 'Error-labelled dataset of imagined vs real latents', PILOT ? 'PILOT' : 'PLANNED', 'P1'],
      ['C2', 'Calibration test of ≥ 3 trust scores, e.g. ensembles ' + cite(22) + ', MC-dropout ' + cite(23), PILOT ? 'PILOT' : 'PLANNED', 'P2'],
      ['C3', 'Gated CEM-MPC with the fallback ladder', 'PLANNED', 'P3'],
      ['C4', 'Backbone-agnostic interfaces; 8 GB reproduction recipe', 'BUILT', ''],
    ];
    comps.forEach((c, i) => {
      const y = 1.92 + i * 0.4;
      L.text(s, [{ text: c[0] + '  ', options: { bold: true, color: K.blue } }, { text: c[1], options: { color: K.ink } }], { x: MX, y, w: 5.1, h: 0.34, fontSize: 11.5, valign: 'middle' });
      L.tag(s, c[2], 5.75, y + 0.06, { w: 0.82 });
      if (c[3]) L.text(s, c[3], { x: 6.6, y, w: 0.35, h: 0.34, fontSize: 10.5, color: K.muted, valign: 'middle' });
    });
    const px = 7.2; const pw = 12.733 - px;
    L.rect(s, { x: px, y: 1.62, w: pw, h: 1.86, radius: 0.06, fill: K.panel2, line: K.hair });
    capsLabel(s, 'PROGRESS: 10 REVIEW WORK PACKAGES', px + 0.15, 1.68, pw - 0.3, K.ink);
    L.text(s, [
      { text: '4 done: ', options: { bold: true, color: K.aquaDark } }, { text: 'requirements, literature review, environment and data pipeline, MDP formulation', options: { breakLine: true } },
      { text: '4 partial: ', options: { bold: true, color: '8A5A00' } }, { text: PILOT ? 'implementation (baseline runs and the pilot error logger; gate not built), evaluation (' + evalStatus() + '), visualisation, documentation' : 'implementation (baseline runs, gate not built), evaluation (Push-T 3 seeds, Wall 1, PointMaze smoke), visualisation, documentation', options: { breakLine: true } },
      { text: '2 not started: ', options: { bold: true, color: K.sub } }, { text: 'scorer training, final validation. No percentage claimed: the remaining packages hold most of the research effort.', options: {} },
    ], { x: px + 0.15, y: 1.96, w: pw - 0.3, h: 1.48, fontSize: 11, color: K.body, paraSpaceAfter: 3 });
    // roadmap
    capsLabel(s, 'ROADMAP (PROPOSED, RELATIVE WEEKS)', MX, 3.62, 6);
    const gx = 4.75; const gw = 12.15 - gx; const wk = gw / 12; const gy = 4.2; const rh = 0.3;
    for (let w = 0; w < 12; w++) {
      L.text(s, 'W' + (w + 1), { x: gx + w * wk, y: 3.9, w: wk, h: 0.26, fontSize: 10, bold: true, color: K.muted, align: 'center' });
      if (w > 0) L.arrow(s, gx + w * wk, gy, gx + w * wk, gy + 4 * rh, { color: K.hair, w: 0.5, head: false });
    }
    const tasks = [
      ['P1 · adapter and error logger → labelled dataset', 1, 3, K.violet, 'M1'],
      ['P2 · offline test of H1–H3 (go / no-go)', 4, 6, K.violet, 'M2'],
      ['P3 · closed loop: oracle, random, then SCoPe gate (H4)', 6, 9, K.violet, 'M3'],
      ['Robustness, Wall and PointMaze; write-up', 9, 12, K.blue, 'M4'],
    ];
    tasks.forEach((t, i) => {
      const y = gy + i * rh;
      if (i % 2 === 0) L.rect(s, { x: MX, y, w: 12.15 - MX, h: rh, fill: K.panel2, line: null });
      L.text(s, t[0], { x: MX + 0.08, y, w: gx - MX - 0.12, h: rh, fontSize: 10.5, color: K.ink, valign: 'middle' });
      L.rect(s, { x: gx + (t[1] - 1) * wk + 0.03, y: y + 0.06, w: (t[2] - t[1] + 1) * wk - 0.06, h: rh - 0.12, radius: 0.3, fill: t[3], line: null });
      L.text(s, '◆ ' + t[4], { x: gx + t[2] * wk - 0.02, y, w: 0.5, h: rh, fontSize: 10, bold: true, color: K.ink, valign: 'middle' });
    });
    L.arrow(s, gx + 6 * wk, gy - 0.04, gx + 6 * wk, gy + 4 * rh + 0.04, { color: K.red, w: 1.75, dash: 'dash', head: false });
    // bottom: what we will test | go / no-go | done when
    const boxes = [
      PILOT ? ['PILOT RESULT → NEXT', pilotSentence(), K.amberTint, '8A5A00']
        : ['WHAT WE WILL TEST', 'H1: does u_k track real latent error (AUROC, Spearman ρ, ECE)? H2/H3: false rejection and acceptance vs a random gate. H4: success vs plain MPC, soft penalty, random and oracle gates.', K.panel2, K.ink],
      ['GO / NO-GO (END OF W6)', 'Build the closed loop only if a score beats the random and distance-to-start baselines on H1 (non-overlapping 95% CIs); otherwise report the negative result with the oracle-gate ceiling.', K.redTint, K.redDark],
      ['DONE WHEN', 'H1–H3 reported for ≥ 3 scores with bootstrap CIs; H4 on the same 50 pairs × 3 seeds as the baseline; every number regenerated from logs by script.', K.blueTint, K.blueDark],
    ];
    boxes.forEach((b, i) => {
      const x = MX + i * (3.913 + 0.197); const y = 5.58;
      L.rect(s, { x, y, w: 3.913, h: 1.27, radius: 0.06, fill: b[2], line: null });
      capsLabel(s, b[0], x + 0.15, y + 0.06, 3.6, b[3]);
      L.text(s, b[1], { x: x + 0.15, y: y + 0.32, w: 3.62, h: 0.92, fontSize: 10.5, color: K.ink });
    });
    L.notes(s, {
      script: SCRIPT[6],
      time: '90 s',
      say: 'Where we stand and what comes next. Our novel components: the dataset of imagined versus real latents, the calibration test of trust scores, and the gated planner with its fallback ladder are planned; the interfaces and the 8 GB reproduction recipe are built. Of the ten review work packages, four are done, four partial and two not started; we do not quote a percentage because the remaining packages hold most of the research effort. The roadmap has three gated phases. First the logger and the labelled dataset; then the offline test of the trust scores, with a go/no-go decision at week six: we only build the closed loop if a score clearly beats random and trivial baselines. Then the closed-loop experiment against plain MPC, a soft penalty, a random gate and an oracle gate. Thank you; we are happy to take questions.',
      takeaway: 'The baseline is reproduced and the experiment that tests SCoPe is fully specified, with an early, cheap test of the riskiest assumption.',
      visual: 'Top: novel components with status, and progress. Middle: roadmap in relative weeks; the red dashed line is the go/no-go decision. Bottom: hypotheses, the decision rule and the completion criteria.',
      why: 'Testing H1 offline before building the closed loop avoids weeks of engineering on a score that does not work.',
      careful: 'The schedule is proposed and relative; align it with the real dates. Finishing the Wall and PointMaze baselines runs overnight in weeks 1–2; the V-JEPA 2-AC backbone is a stretch goal. Do not claim any SCoPe result yet.',
      q: 'What if no trust score works?',
      a: 'Then the result is still useful: we would show on JEPA latents with real error labels which scores fail and by how much, and the oracle gate would tell us whether a better score would help at all. Both are reportable findings for the final review.',
    });
  }

  // ================================================================ 8. References
  {
    const s = add('References', 'REFERENCES', 'References');
    const LABEL = {
      1: 'Zhou et al. 2025 · DINO-WM · ICML', 2: 'Assran et al. 2025 · V-JEPA 2 · preprint', 3: 'Oquab et al. 2024 · DINOv2 · TMLR',
      4: 'Assran et al. 2023 · I-JEPA · ICCV', 5: 'LeCun 2022 · autonomous machine intelligence · position paper', 6: 'Chua et al. 2018 · PETS · NeurIPS',
      7: 'Hafner et al. 2019 · PlaNet · ICML', 8: 'Janner et al. 2019 · MBPO · NeurIPS', 9: 'Yu et al. 2020 · MOPO · NeurIPS',
      10: 'Kidambi et al. 2020 · MOReL · NeurIPS', 11: 'Frauenknecht et al. 2024 · MACURA · preprint', 12: 'Hafner et al. 2025 · DreamerV3 · Nature',
      13: 'Hansen et al. 2024 · TD-MPC2 · ICLR', 14: 'Sobal et al. 2025 · PLDM · NeurIPS', 15: 'Zhang et al. 2026 · HWM · preprint',
      16: 'Seo et al. 2025 · latent safety filters · CoRL', 17: 'Berger et al. 2026 · Biased Dreams · RLC', 18: 'Wang 2026 · learning from world feedback · workshop',
      19: 'An et al. 2026 · ACPC · preprint', 20: 'Hu et al. 2026 · representation geometry · preprint', 21: 'Lee & Zhang 2026 · Beyond Task Success · preprint',
      22: 'Lakshminarayanan et al. 2017 · deep ensembles · NIPS', 23: 'Gal & Ghahramani 2016 · MC dropout · ICML', 24: 'Chi et al. 2023 · Diffusion Policy (Push-T) · RSS',
      25: 'Fu et al. 2020 · D4RL (PointMaze) · preprint', 26: 'DINO-WM code (MIT) @ 0a9492f and OSF data',
    };
    const col = (items, x) => L.text(s, items.flatMap((r, i) => [
      { text: `[${r.n}] `, options: { bold: true, color: K.orangeDark } },
      { text: LABEL[r.n] + '  ', options: { color: K.ink } },
      { text: r.url.replace(/^https?:\/\//, ''), options: { color: K.blue, hyperlink: { url: r.url }, breakLine: i < items.length - 1 } },
    ]), { x, y: 1.62, w: 6.0, h: 4.75, fontSize: 11, paraSpaceAfter: 6, math: false });
    col(ctx.REFS.slice(0, 13), MX);
    col(ctx.REFS.slice(13), 6.75);
    L.text(s, 'Full entries with authors, venues and verified links: references.md and the companion doc. The 38-slide extended deck holds the detailed comparison, the three further architecture views and the appendix.',
      { x: MX, y: 6.45, w: CW, h: 0.4, fontSize: 10.5, italic: true, color: K.muted });
    L.notes(s, {
      script: SCRIPT[7],
      say: 'Numbered references used on the slides; full bibliographic entries are in references.md and the companion doc.',
      takeaway: 'Every citation on the slides resolves to a stable link.',
      careful: 'Preprints: [2, 11, 15, 19, 20, 21, 25]; workshop paper: [18]; position paper: [5]. Links were checked in October 2026.',
    });
  }
};

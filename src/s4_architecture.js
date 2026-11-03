'use strict';
// Area 5: system design. Four coordinated views with one visual language:
// solid arrows = online (inference-time), dashed = offline (training-time); every box carries
// a status tag (REUSED, REUSED + PATCHED, BUILT, INTERFACE BUILT, PLANNED, PROPOSED).
const { MX, CW } = require('./lib');

const SEC = '5 · System architecture';
const OVER = '5 · END-TO-END SYSTEM DESIGN AND ARCHITECTURE';

function helpers(ctx) {
  const { L, K } = ctx;
  const lab = (s, t, x, y, w, o = {}) => L.text(s, t, Object.assign({ x, y, w, h: 0.22, fontSize: 9.5, color: K.sub, align: 'center', valign: 'middle' }, o));
  const step = (s, n, x, y, o = {}) => L.num(s, n, x, y, Object.assign({ d: 0.24, size: 9.5, fill: K.blue }, o));

  // Legend shared by the architecture views.
  const legend = (s, y, items) => {
    let x = MX;
    L.arrow(s, x, y + 0.13, x + 0.45, y + 0.13, { color: K.sub, w: 1.25 });
    L.text(s, 'online, inference-time', { x: x + 0.52, y, w: 1.55, h: 0.26, fontSize: 10, color: K.sub, valign: 'middle' });
    x += 2.1;
    L.arrow(s, x, y + 0.13, x + 0.45, y + 0.13, { color: K.sub, w: 1.25, dash: 'dash' });
    L.text(s, 'offline, training-time', { x: x + 0.52, y, w: 1.5, h: 0.26, fontSize: 10, color: K.sub, valign: 'middle' });
    x += 2.1;
    (items || ['REUSED', 'PATCHED', 'BUILT', 'PARTIAL', 'PLANNED']).forEach((st) => { x += L.tag(s, st, x, y + 0.02) + 0.12; });
  };
  return { lab, step, legend };
}

// View A: end-to-end. o = { section, overline, title, notes } overrides for reuse in other decks.
function viewA(ctx, o = {}) {
  const { L, K, add } = ctx;
  const { lab, step, legend } = helpers(ctx);
  {
    const s = add(o.section || SEC, o.overline || OVER, o.title || 'End-to-end architecture: online agent and offline learning loop');
    // Band 1: offline / training-time
    L.band(s, { x: MX, y: 1.56, w: CW, h: 1.1, label: 'OFFLINE · TRAINING-TIME', labelW: 2.8 });
    L.comp(s, { x: 0.75, y: 1.88, w: 1.75, h: 0.7, status: 'REUSED', title: 'Data + training', body: 'OSF datasets; trained upstream' });
    L.comp(s, { x: 2.7, y: 1.88, w: 1.85, h: 0.7, status: 'REUSED', title: 'Checkpoints', body: 'encoder, predictor, decoder' });
    L.comp(s, { x: 4.85, y: 1.88, w: 3.4, h: 0.7, status: 'PLANNED', title: 'Error-labelled latent store (P1)', body: 'imagined vs real latents per candidate; .npz on F:' });
    L.comp(s, { x: 9.1, y: 1.88, w: 3.45, h: 0.7, status: 'PLANNED', title: 'Trust calibration (P2)', body: 'fit 5 candidate scorers; choose τ on held-out points' });
    L.arrow(s, 2.5, 2.23, 2.7, 2.23, { dash: 'dash' });
    L.arrow(s, 8.25, 2.23, 9.1, 2.23, { dash: 'dash' });
    lab(s, 'labels', 8.3, 1.99, 0.75);

    // Band 2: the agent (online)
    L.band(s, { x: MX, y: 3.0, w: CW, h: 1.75, fill: K.white, line: K.faint, label: 'ONLINE · INFERENCE-TIME', labelW: 2.6, labelColor: K.ink });
    L.comp(s, { x: 0.8, y: 3.35, w: 3.2, h: 1.25, status: 'REUSED', title: 'World model · frozen', body: ['encode(o) → z: DINOv2 ViT-S/14, 196 × 384 tokens', 'rollout(z, a) → ẑ: ViT predictor, 3-frame history', 'decoder: visualisation only'] });
    L.comp(s, { x: 4.75, y: 3.35, w: 3.6, h: 1.25, status: 'PATCHED', title: 'CEM-MPC planner', body: ['sample 300 plans × 5 steps; cost = distance of ẑ₅ to the goal latent', 'refit to the top 30, 30 iterations (Push-T)', 'execute 5 chunks, replan from a real observation'] });
    L.comp(s, { x: 9.1, y: 3.35, w: 3.45, h: 1.25, status: 'PARTIAL', title: 'Trust module · new', body: ['TrustScorer: u_k per imagined step (B × H)', 'TrustGate: reject a plan if any u_k > τ', 'fallback ladder; logs which rung fired'] });
    L.arrow(s, 4.75, 3.76, 4.0, 3.76);
    lab(s, 'o, a', 4.03, 3.51, 0.69);
    L.arrow(s, 4.0, 4.2, 4.75, 4.2);
    lab(s, 'z, ẑ', 4.03, 4.24, 0.69);
    L.arrow(s, 8.35, 3.76, 9.1, 3.76);
    lab(s, 'ẑ, costs', 8.37, 3.51, 0.71);
    L.arrow(s, 9.1, 4.2, 8.35, 4.2);
    lab(s, 'accept mask', 8.36, 4.24, 0.73, { fontSize: 9 });

    // Band 3: environment, evaluation, configuration
    L.band(s, { x: MX, y: 5.12, w: CW, h: 1.38, label: 'ENVIRONMENT · EVALUATION · CONFIGURATION', labelW: 3.9 });
    L.comp(s, { x: 0.75, y: 5.52, w: 3.25, h: 0.88, status: 'BUILT', title: 'Configuration and tracking', body: ['Hydra configs · SCOPE_* runtime switches', 'seeds 99/100/101 · upstream pinned @0a9492f'] });
    L.comp(s, { x: 4.75, y: 5.52, w: 3.6, h: 0.88, status: 'REUSED', title: 'Simulator (environment)', body: ['Push-T: pymunk · Wall: 2-D · PointMaze: MuJoCo 2.1', 'reset(state) · step(a) · render 224 × 224'] });
    L.comp(s, { x: 9.1, y: 5.52, w: 1.6, h: 0.88, status: 'REUSED', title: 'Success check', body: 'eval_state; evaluator only' });
    L.comp(s, { x: 10.9, y: 5.52, w: 1.65, h: 0.88, status: 'BUILT', title: 'Logs → metrics', body: 'logs, plots → JSON → report' });
    L.arrow(s, 8.35, 5.96, 9.1, 5.96);
    lab(s, 'state s', 8.37, 6.0, 0.71, { fill: null });
    L.arrow(s, 10.7, 5.96, 10.9, 5.96);

    // Cross-band flows
    L.arrow(s, 6.0, 4.6, 6.0, 5.52, { color: K.ink, w: 1.5 });
    L.text(s, 'actions a_t … a_{t+4}', { x: 4.2, y: 4.86, w: 1.72, h: 0.22, fontSize: 9.5, color: K.ink, align: 'right', valign: 'middle' });
    L.arrow(s, 7.1, 5.52, 7.1, 4.6, { color: K.ink, w: 1.5 });
    L.text(s, 'next image + proprio', { x: 7.18, y: 4.86, w: 1.75, h: 0.22, fontSize: 9.5, color: K.ink, valign: 'middle' });
    L.arrow(s, 3.0, 2.58, 3.0, 3.35, { dash: 'dash' });
    L.text(s, 'frozen weights', { x: 3.07, y: 2.72, w: 1.1, h: 0.22, fontSize: 9.5, color: K.sub, valign: 'middle' });
    L.arrow(s, 6.55, 3.35, 6.55, 2.58, { dash: 'dash' });
    L.text(s, 'ẑ and real latents (logging)', { x: 6.62, y: 2.72, w: 1.9, h: 0.22, fontSize: 9.5, color: K.sub, valign: 'middle' });
    L.arrow(s, 10.8, 2.58, 10.8, 3.35, { dash: 'dash' });
    L.text(s, 'τ, scorer parameters', { x: 10.87, y: 2.72, w: 1.6, h: 0.22, fontSize: 9.5, color: K.sub, valign: 'middle' });
    // reading order
    step(s, 1, 7.24, 5.1); step(s, 2, 4.25, 3.86); step(s, 3, 8.6, 3.86); step(s, 4, 5.68, 5.1); step(s, 5, 8.6, 5.62);
    step(s, 6, 6.22, 2.82, { fill: K.violet }); step(s, 7, 10.47, 2.82, { fill: K.violet });
    legend(s, 6.6);
    L.notes(s, Object.assign({
      time: '90 s',
      say: 'This is the whole system on one page, in three layers. The middle layer is the agent that runs at decision time: the frozen DINO-WM world model, the CEM-MPC planner, and our new trust module. Follow the blue numbers. One: the simulator sends the next image and proprioception to the planner. Two: the planner asks the world model to encode it and to roll out 300 candidate action plans. Three: the imagined latents go to the trust module, which returns an accept mask. Four: the planner executes five action chunks in the simulator. Five: the simulator\'s true state goes to the success check, which only the evaluator sees. The top layer is offline. The world model and its checkpoints come from the DINO-WM authors. Six, in violet: during Phase 1 the planner\'s imagined latents and the matching real latents are logged into an error-labelled store. Seven: Phase 2 calibrates the scorers and the threshold τ from that store and loads them into the trust module. That offline loop is how SCoPe "learns".',
      takeaway: 'The agent is the planner plus a frozen world model plus a trust module; learning happens offline, in calibrating the trust module from logged imagined-versus-real errors.',
      visual: 'Solid arrows run at decision time, dashed arrows offline. Tags on each box say what exists: grey REUSED is upstream code, green is ours and working, amber means only the interface exists, violet dashed is planned.',
      why: 'Separating offline calibration from the online loop means the online planner never learns from test episodes, and the world model never changes, so any change in success is due to the trust module.',
      careful: 'Only the grey and green boxes run today. The trust module has interfaces (TrustScorer, TrustGate) but no implementation; the store and calibration are designed (docs/design) but not built. The success check is part of the evaluator; upstream also uses it to stop replanning solved episodes.',
      q: 'Where would a reward enter this architecture?',
      a: 'Nowhere online: the planner minimises its own latent cost to the goal image, and the simulator\'s success flag only reaches the evaluator. If we later wanted a learned reward or value (as in TD-MPC2), it would sit next to the world model and add a term to the cost.',
    }, o.notes || {}));
  }
}

// View B: agent-environment interaction loop.
function viewB(ctx, o = {}) {
  const { L, K, add } = ctx;
  {
    const s = add(o.section || SEC, o.overline || OVER, o.title || 'Agent–environment loop: the planner acts, the simulator transitions');
    L.band(s, { x: MX, y: 1.62, w: 7.55, h: 5.05, label: 'AGENT · CHOOSES THE ACTIONS', labelW: 4, labelColor: K.ink });
    const steps = [
      ['Observe and encode', 'o_t and the goal image o_g → z_t, z_g (frozen DINOv2)', 0],
      ['Sample', '300 action sequences, 5 chunks × 10-D, from N(μ, σ)', 0],
      ['Imagine', 'predictor rolls each forward: ẑ_{t+1} … ẑ_{t+5}', 0],
      ['Score trust', 'u_k for every imagined step of every candidate', 1],
      ['Gate', 'reject a candidate if any u_k > τ', 1],
      ['Select', 'cost = distance of ẑ_{t+5} to z_g; refit μ, σ to the top 30', 0],
      ['Execute', 'first 5 chunks of the best plan, or the fallback action', 0],
    ];
    const rowY = (i) => 2.0 + i * 0.64;
    steps.forEach((st, i) => {
      const y = rowY(i);
      L.num(s, i + 1, 1.35, y + 0.11, { d: 0.34, size: 12, fill: st[2] ? K.violet : K.ink });
      L.rect(s, { x: 1.85, y, w: 3.95, h: 0.56, radius: 0.06, fill: st[2] ? K.violetTint : K.white, line: st[2] ? K.violet : K.line, dash: st[2] ? 'dash' : 'solid', lineW: st[2] ? 1.25 : 0.75 });
      L.text(s, [{ text: st[0] + (st[2] ? ' (new)' : ''), options: { bold: true, color: st[2] ? K.violet : K.ink, breakLine: true } }, { text: st[1], options: { color: K.body } }],
        { x: 1.95, y: y + 0.02, w: 3.8, h: 0.52, fontSize: 11.5, valign: 'middle' });
    });
    // CEM iteration loop: step 6 back to step 2
    const c2 = rowY(1) + 0.28; const c6 = rowY(5) + 0.28;
    L.path(s, [[1.35, c6], [0.95, c6], [0.95, c2], [1.35, c2]], { color: K.blue, w: 1.5 });
    L.text(s, 'repeat 2–6: 30 iterations', { x: 0.78 - 1.25, y: (c2 + c6) / 2 - 0.13, w: 2.5, h: 0.26, fontSize: 10.5, bold: true, color: K.blueDark, align: 'center', rotate: 270 });
    // fallback branch from the gate
    const y5 = rowY(4);
    L.arrow(s, 5.8, y5 + 0.28, 6.05, y5 + 0.28, { color: K.violet, dash: 'dash' });
    L.comp(s, { x: 6.05, y: y5 - 0.3, w: 1.95, h: 1.12, status: 'PLANNED', title: 'Fallback ladder', body: ['1  resample wider', '2  shorter horizon', '3  safe action', '4  stop and flag'], bodySize: 10.5 });
    L.text(s, 'when too few pass', { x: 6.05, y: y5 + 0.85, w: 1.95, h: 0.22, fontSize: 9.5, italic: true, color: K.violet, align: 'center' });
    // environment
    L.band(s, { x: 8.55, y: 1.62, w: 4.183, h: 2.0, label: 'ENVIRONMENT · PRODUCES TRANSITIONS', labelW: 3.9, labelColor: K.ink });
    L.comp(s, { x: 8.75, y: 2.02, w: 3.8, h: 1.4, status: 'REUSED', title: 'Simulator', body: ['s_{t+1} ~ P(· | s_t, a_t): rigid-body physics (pymunk for Push-T), PD-tracked agent', 'renders o: 224 × 224 RGB + proprio', '5 simulator steps per action chunk'] });
    // observation back to step 1
    const r1 = rowY(0) + 0.28;
    L.arrow(s, 8.75, r1, 5.8, r1, { color: K.ink, w: 1.75 });
    L.text(s, 'next observation o_{t+25}: image + proprio', { x: 5.9, y: r1 - 0.3, w: 2.8, h: 0.24, fontSize: 10.5, bold: true, color: K.ink, align: 'center' });
    // actions to the environment
    const r7 = rowY(6) + 0.28;
    L.path(s, [[5.8, r7], [9.3, r7], [9.3, 3.42]], { color: K.ink, w: 1.75 });
    L.text(s, 'actions a_t … a_{t+4}: 5 chunks × 5 sim steps', { x: 5.9, y: r7 - 0.3, w: 3.3, h: 0.24, fontSize: 10.5, bold: true, color: K.ink, align: 'center' });
    // evaluator and reward callout
    L.comp(s, { x: 9.75, y: 4.05, w: 2.983, h: 1.12, status: 'REUSED', title: 'Evaluator (outside the agent)', body: 'success = eval_state(goal, s) after each round → logs, metrics' });
    L.arrow(s, 11.4, 3.42, 11.4, 4.05, { dash: 'dash' });
    L.text(s, 'true state s', { x: 11.47, y: 3.62, w: 1.2, h: 0.22, fontSize: 9.5, color: K.sub, valign: 'middle' });
    L.rect(s, { x: 9.55, y: 5.62, w: 3.183, h: 1.05, radius: 0.06, fill: K.amberTint, line: K.amber });
    L.text(s, [{ text: 'Where is the reward? ', options: { bold: true, color: '8A5A00' } },
      { text: 'None flows to the agent. It scores plans with its own cost (latent distance to the goal); the success flag reaches only the evaluator.', options: { color: K.ink } }],
    { x: 9.67, y: 5.62, w: 2.95, h: 1.05, fontSize: 11, valign: 'middle' });
    L.notes(s, Object.assign({
      time: '75 s',
      say: 'This view answers three questions the brief asks: who chooses actions, who produces transitions, and how rewards reach the agent. The agent, on the left, chooses actions in seven steps: observe and encode, sample 300 plans, imagine each one, score trust, gate, select the best by cost, and execute. Steps 2 to 6 repeat 30 times; that is CEM. The violet steps are new in SCoPe, and the gate has a fallback ladder. The environment, on the right, produces transitions: the simulator applies the five action chunks with its physics and returns a new image. And the reward: none flows back. The agent scores plans with its own cost, and the success flag goes only to the evaluator.',
      takeaway: 'The planner is the decision-maker, the simulator is the only source of real transitions, and success is never used as a training signal.',
      visual: 'Read the numbered steps top to bottom; the blue loop on the left is CEM\'s 30 iterations. Thick black arrows cross the agent–environment boundary. The dashed arrow to the evaluator carries privileged information the agent never sees.',
      why: 'Making the absence of an online reward explicit avoids a common misunderstanding: this is planning with a learned model, not policy-gradient RL.',
      careful: 'Steps 4 and 5 and the fallback ladder are planned, not implemented. Today the loop runs without them (that is the baseline). "o_{t+25}" is the observation after 5 chunks × 5 simulator steps on Push-T.',
      q: 'What happens if every candidate fails the gate?',
      a: 'The fallback ladder fires in order: resample with a wider distribution, then halve the horizon so less is imagined, then take a safe action (no-op), and finally stop and flag for a human. We log which rung fired, and the rate at which each fires is part of the H4 results.',
    }, o.notes || {}));
  }
}

// Extended deck: all five architecture slides in order.
module.exports = function architecture(ctx) {
  const { L, K, add, cite } = ctx;
  const { lab } = helpers(ctx);
  viewA(ctx);
  viewB(ctx);

  // ---------------------------------------------------------------- 21. View C: data flow and pipeline
  {
    const s = add(SEC, OVER, 'Data flow: from archives to reported numbers, with storage boundaries');
    // Swimlanes with rotated labels in a left gutter, so the lanes' top edges stay free for arrows.
    const lane = (y, h, label, color, planned) => {
      L.rect(s, { x: MX, y, w: CW, h, radius: 0.04, fill: planned ? K.white : K.panel2, line: planned ? K.violet : K.hair, lineW: 0.75, dash: planned ? 'dash' : 'solid' });
      L.text(s, label, { x: 0.76 - h / 2, y: y + h / 2 - 0.14, w: h, h: 0.28, fontSize: 10, bold: true, color, align: 'center', valign: 'middle', charSpacing: 1.2, rotate: 270 });
    };
    lane(1.6, 2.15, 'PHASE 0 · BUILT, RUN', K.aquaDark, false);
    lane(4.15, 2.2, 'PHASES 1–3 · PLANNED', K.violet, true);
    const bw = 2.625; const xs = [1.02, 4.005, 6.99, 9.975];
    const A = [
      ['BUILT', '1 · Acquire', ['OSF archives (.zip): size cap and SHA-256 before unpacking', 'active data on E:, cold archives on F:', 'download_dino_wm_assets.sh']],
      ['REUSED', '2 · Prepare', ['upstream loaders normalise actions and proprio', '90 / 10 train / validation split, seeded', 'start/goal pairs from validation data or sampled states']],
      ['PATCHED', '3 · Plan and act', ['plan_dino_wm.py: patched CEM-MPC with the simulator', 'writes .log, logs.json, rollout .png / .mp4 per run folder']],
      ['BUILT', '4 · Measure', ['summarize_phase0.py, extract_metrics.py', '→ phase0_metrics.json → report tables and every chart in this deck']],
    ];
    A.forEach((a, i) => {
      L.comp(s, { x: xs[i], y: 1.84, w: bw, h: 1.6, status: a[0], title: a[1], body: a[2], titleSize: 12.5, bodySize: 10.5 });
      if (i < 3) L.arrow(s, xs[i] + bw, 2.64, xs[i + 1], 2.64, { color: K.ink, w: 1.5 });
    });
    const B = [
      ['PLANNED', 'P1 · Log errors', ['at each decision point: candidates, ẑ, costs', 'real rollouts by reset-and-execute for elites + a random subsample', '.npz shards (fp16) on F:, JSON index on E:']],
      ['PLANNED', 'P2 · Fit and calibrate', ['cache encoder features of training-split frames', 'ensemble heads, kNN index; calibration seeds → τ, λ']],
      ['PLANNED', 'P3 · Gated runs', ['same seeds, start/goal pairs and CEM budget as Phase 0', 'logs add u_k, accept rate, fallback rung']],
      ['PLANNED', 'Report H1–H4', ['tables and figures with bootstrap 95% CIs', 'every number traceable to a log line']],
    ];
    B.forEach((b, i) => {
      L.comp(s, { x: xs[i], y: 4.42, w: bw, h: 1.6, status: b[0], title: b[1], body: b[2], titleSize: 12.5, bodySize: 10.5 });
      if (i < 3) L.arrow(s, xs[i] + bw, 5.22, xs[i + 1], 5.22, { color: K.violet, w: 1.5, dash: 'dash' });
    });
    // planner hooks feed the logger; gated runs reuse the simulator and pairs
    L.path(s, [[xs[2] + 0.6, 3.44], [xs[2] + 0.6, 3.95], [xs[0] + 1.3, 3.95], [xs[0] + 1.3, 4.42]], { color: K.violet, dash: 'dash', w: 1.25 });
    L.text(s, 'logging hooks inside the planner', { x: xs[0] + 2.6, y: 3.84, w: 2.3, h: 0.22, fontSize: 9.5, color: K.violet, align: 'center', valign: 'middle', fill: { color: K.white } });
    L.arrow(s, xs[2] + 1.6, 4.42, xs[2] + 1.6, 3.44, { color: K.violet, dash: 'dash', w: 1.25 });
    L.text(s, 'same simulator, seeds and pairs', { x: xs[2] + 1.67, y: 3.84, w: 2.1, h: 0.22, fontSize: 9.5, color: K.violet, valign: 'middle' });
    L.text(s, [
      { text: 'Storage: ', options: { bold: true, color: K.ink } },
      { text: 'E: holds code, active data, logs and summaries (about 18 GB free); F: holds archives, caches and latent shards. Upstream data is size-checked before unpacking (Wall unpacks to 55 GB, so only its 192 validation episodes are kept).', options: { color: K.body } },
    ], { x: MX, y: 6.5, w: CW, h: 0.4, fontSize: 11, valign: 'middle' });
    L.notes(s, {
      time: '60 s',
      say: 'This view follows the data. Top lane, what exists: we download the authors\' archives with a size cap and checksum, unpack active data to E: and keep cold archives on F:. Upstream loaders normalise the data and make the seeded train/validation split; evaluation pairs come from validation data or freshly sampled states. Our patched runner plans and acts and writes logs and plots, and two scripts turn the logs into the JSON behind every chart in this deck. Bottom lane, what is planned: the logger hooks into the planner and records imagined latents plus real rollouts, the scorers are fitted on cached features with calibration seeds, the gated runs reuse exactly the same simulator, seeds and start/goal pairs, and the report computes confidence intervals.',
      takeaway: 'Every reported number is traceable from an archive through a run folder and a log line to a chart; the planned phases reuse the same pipeline.',
      visual: 'Green-labelled lane on top is built; violet dashed lane below is planned. Violet dashed arrows show how the planned lane plugs into the existing planner and simulator.',
      why: 'Separate drives because the datasets are large (Wall unpacks to 55 GB, PointMaze to 29 GB) and the main drive filled up once during setup; size checks now run before unpacking.',
      careful: 'Latent shard sizes: one frame is 196 × 384 floats (about 0.3 MB in fp32), so we store fp16 and subsample candidates. The "about 18 GB free" figure is from the last check on 13 Oct and changes as runs accumulate.',
      q: 'How do you make sure results are reproducible?',
      a: 'Pinned upstream commit (0a9492f), pinned library versions, checksummed data, fixed seeds per run, the exact command and environment switches logged at the top of each run, and scripts that regenerate every table from the logs.',
    });
  }

  // ---------------------------------------------------------------- 22. View D: deployment / inference
  {
    const s = add(SEC, OVER, 'Deployment view (proposed): what inference on a robot would need');
    L.chips(s, ['PROPOSED', 'MEASURED']);
    const bx = [0.75, 3.75, 6.75, 9.75]; const bw = 2.6; const ty = 1.95; const by = 3.55; const bh = 0.95;
    L.comp(s, { x: bx[0], y: ty, w: bw, h: bh, status: 'PROPOSED', title: 'Camera or renderer', body: 'today: the simulator\'s renderer' });
    L.comp(s, { x: bx[1], y: ty, w: bw, h: bh, status: 'REUSED', title: 'Frame buffer', body: 'last 3 frames, 224 × 224, + proprio' });
    L.comp(s, { x: bx[2], y: ty, w: bw, h: bh, status: 'REUSED', title: 'Encoder (GPU)', body: 'DINOv2 ViT-S/14 → z_t; goal encoded once' });
    L.comp(s, { x: bx[3], y: ty, w: 2.98, h: bh, status: 'PARTIAL', title: 'SCoPe planner (GPU)', body: 'CEM-MPC (patched, runs) + trust gate (planned)' });
    L.comp(s, { x: bx[3], y: by, w: 2.98, h: bh, status: 'PROPOSED', title: 'Action filter', body: 'clip to action bounds; rate limit' });
    L.comp(s, { x: bx[2], y: by, w: bw, h: bh, status: 'REUSED', title: 'Low-level controller', body: 'PD tracking of the commanded target' });
    L.comp(s, { x: bx[1], y: by, w: bw, h: bh, status: 'REUSED', title: 'Robot or simulator', body: 'today: Push-T, Wall, PointMaze simulators' });
    for (let i = 0; i < 3; i++) L.arrow(s, bx[i] + bw, ty + bh / 2, bx[i + 1], ty + bh / 2, { color: K.ink, w: 1.5 });
    L.arrow(s, bx[3] + 1.49, ty + bh, bx[3] + 1.49, by, { color: K.ink, w: 1.5 });
    L.arrow(s, bx[3], by + bh / 2, bx[2] + bw, by + bh / 2, { color: K.ink, w: 1.5 });
    L.arrow(s, bx[2], by + bh / 2, bx[1] + bw, by + bh / 2, { color: K.ink, w: 1.5 });
    L.path(s, [[bx[1], by + bh / 2], [bx[0] + 1.3, by + bh / 2], [bx[0] + 1.3, ty + bh]], { color: K.ink, w: 1.5 });
    lab(s, 'camera sees the scene', bx[0] + 1.4, by + bh / 2 - 0.27, 1.55, { fontSize: 10, fill: null });
    lab(s, 'planned actions', bx[3] + 1.57, ty + bh + 0.18, 1.3, { fontSize: 10, align: 'left', fill: null });
    // monitoring row
    L.comp(s, { x: 9.75, y: 5.0, w: 2.98, h: 0.95, status: 'PROPOSED', title: 'Trust telemetry', body: 'u_k, accept rate, fallback rung → logs, dashboard' });
    L.comp(s, { x: 6.75, y: 5.0, w: 2.45, h: 0.95, status: 'PROPOSED', title: 'Operator channel', body: 'stop-and-flag alert; resume or abort' });
    L.path(s, [[bx[3] + 2.98, ty + bh / 2], [12.92, ty + bh / 2], [12.92, 5.47], [12.73, 5.47]], { color: K.sub, w: 1.25 });
    L.arrow(s, 9.75, 5.47, 9.2, 5.47, { color: K.sub, w: 1.25 });
    lab(s, 'alerts', 9.2, 5.2, 0.55, { fontSize: 9.5, fill: null });
    lab(s, 'trust signals', 11.55, 4.6, 1.3, { fontSize: 9.5, align: 'right', fill: null });
    // latency panel (measured)
    L.rect(s, { x: MX, y: 4.95, w: 5.85, h: 1.9, radius: 0.06, fill: K.blueTint, line: null });
    L.text(s, 'LATENCY TODAY (RTX 5060 LAPTOP GPU, 8 GB)', { x: MX + 0.2, y: 5.03, w: 5.4, h: 0.26, fontSize: 10.5, bold: true, color: K.blueDark, charSpacing: 1 });
    L.text(s, [
      { text: '6.9 s', options: { bold: true, fontSize: 22, color: K.ink } }, { text: '  per 300-candidate rollout (TF32)', options: { color: K.body, breakLine: true } },
      { text: '≈ 3.4 min', options: { bold: true, fontSize: 22, color: K.ink } }, { text: '  per 25-step plan (30 CEM iterations, one episode)', options: { color: K.body, breakLine: true } },
      { text: 'Too slow for real-time control. Levers: fewer iterations (Push-T success plateaus by about iteration 22), fewer samples, a faster GPU. V-JEPA 2-AC reports about 16 s per action on its hardware ' + cite(2) + '.', options: { color: K.sub, fontSize: 11 } },
    ], { x: MX + 0.2, y: 5.3, w: 5.45, h: 1.5, fontSize: 12.5, valign: 'top' });
    L.text(s, 'Runs today, in simulation: renderer → frame buffer → encoder → CEM-MPC → the simulator\'s PD controller. Everything tagged PROPOSED is design only.',
      { x: 6.75, y: 6.12, w: 5.98, h: 0.7, fontSize: 11, italic: true, color: K.muted });
    L.notes(s, {
      time: '45 s',
      say: 'Deployment is out of scope for this project, but the brief asks how a trained planner would run, so this is the proposed inference view. The loop is the same as in simulation: camera, a buffer of the last three frames, the encoder, the SCoPe planner, then an action filter that clips and rate-limits commands, a low-level controller, and the robot. Two things would be new: telemetry of the trust signal, and an operator channel that receives stop-and-flag events. The blue panel is the honest part: today one plan takes about three and a half minutes on our laptop GPU, so this is not real-time.',
      takeaway: 'The inference path already runs in simulation; deployment would need roughly two orders of magnitude faster planning plus a human-in-the-loop channel for stop-and-flag.',
      visual: 'The ring of boxes is the control loop; tags show what runs today. The monitoring row is proposed. The blue panel is measured latency.',
      why: 'Showing measured latency next to the proposal keeps the deployment claim honest.',
      careful: '6.9 s is the benchmark time per 300-candidate rollout. "≈ 3.4 min per plan" comes from the full runs: about 340 s per CEM iteration for 50 episodes, i.e. about 6.8 s per episode-iteration, times 30 iterations. The 16 s per action for V-JEPA 2-AC is on different hardware and a different task.',
      q: 'How could this ever run in real time?',
      a: 'Three levers we can measure: fewer CEM iterations (our curves flatten by about iteration 22 of 30), fewer samples or a shorter horizon, and a faster GPU or batching. Amortising the planner into a policy is another route but out of scope. The trust gate itself is cheap compared with the rollouts it filters, depending on the scorer.',
    });
  }

  // ---------------------------------------------------------------- 23. Implementation stack
  {
    const s = add(SEC, OVER, 'Implementation status: what exists today and what is planned');
    const rule = () => [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: K.hair }, { type: 'none' }];
    const head = (t) => ({ text: t, options: { bold: true, color: K.ink, fill: { color: K.panel }, border: rule() } });
    const c = (t, o = {}) => ({ text: t, options: Object.assign({ color: K.body, border: rule(), valign: 'middle' }, o) });
    const st = (k) => {
      const m = { BUILT: [K.aquaDark, 'BUILT'], REUSED: [K.sub, 'REUSED'], PLANNED: [K.violet, 'PLANNED'], PARTIAL: ['8A5A00', 'INTERFACES'], STRETCH: [K.muted, 'STRETCH'] }[k];
      return c(m[1], { bold: true, color: m[0], fontSize: 11 });
    };
    const rows = [
      [head('Layer'), head('Component (actual tools and modules)'), head('Status'), head('Evidence in the repository')],
      [c('Compute', { bold: true, color: K.ink }), c('RTX 5060 Laptop GPU (8 GB) · WSL2 Ubuntu · Python 3.10 · PyTorch 2.7.1 + CUDA 12.8'), st('BUILT'), c('setup_wsl.sh, requirements.txt')],
      [c('World model', { bold: true, color: K.ink }), c('DINO-WM @ 0a9492f (git submodule) + released checkpoints, SHA-256-checked'), st('REUSED'), c('external/dino_wm')],
      [c('Simulators', { bold: true, color: K.ink }), c('pymunk (Push-T) · custom 2-D (Wall) · MuJoCo 2.1 + mujoco-py (PointMaze)'), st('REUSED'), c('Phase 0 run folders')],
      [c('Runtime patches', { bold: true, color: K.ink }), c('fused attention · encoder dedup · chunked rollouts · TF32 · no-grad encode · serial simulators'), st('BUILT'), c('dino_wm_patches.py')],
      [c('Interfaces', { bold: true, color: K.ink }), c('LatentWorldModel · LatentRollout · TrustScorer · TrustGate · GateDecision'), st('PARTIAL'), c('*/interface.py')],
      [c('Experiment ops', { bold: true, color: K.ink }), c('per-env run scripts · detached launcher · log summariser · metrics extractor'), st('BUILT'), c('scripts/')],
      [c('DINO-WM adapter', { bold: true, color: K.ink }), c('implements LatentWorldModel; encodes each observation once for all 300 candidates'), st('PLANNED'), c('Phase 1')],
      [c('Error logger', { bold: true, color: K.ink }), c('imagined vs real latents per candidate → .npz shards + JSON index'), st('PLANNED'), c('design doc §2, Phase 1')],
      [c('Trust scorers', { bold: true, color: K.ink }), c('ensemble · MC-dropout · kNN latent density · self-consistency · cost margin'), st('PLANNED'), c('design doc §3, Phase 2')],
      [c('Gated control loop', { bold: true, color: K.ink }), c('step-wise MPC with gate and fallback (upstream MPC runs all 5 actions)'), st('PLANNED'), c('design doc §5, Phase 3')],
      [c('Second backbone', { bold: true, color: K.ink }), c('V-JEPA 2-AC adapter behind the same interface'), st('STRETCH'), c('—')],
    ];
    s.addTable(rows, { x: MX, y: 1.62, w: CW, colW: [1.75, 6.55, 1.25, 2.583], fontFace: 'Calibri', fontSize: 11.5, rowH: 0.4, margin: [0.04, 0.08, 0.04, 0.08] });
    L.text(s, 'Built = our code, working and used in the Phase 0 runs. Interfaces = typed contracts only, no implementation yet. Unit tests are not written yet (tests/ is empty).',
      { x: MX, y: 6.55, w: CW, h: 0.3, fontSize: 11, italic: true, color: K.muted });
    L.notes(s, {
      time: '45 s',
      say: 'This is the implementation status, row by row, with where to find each piece. What works: the environment and GPU stack, the upstream world model and simulators, our runtime patches that made planning fit and run fast on 8 GB, the typed interfaces, and the experiment tooling. What does not exist yet: the adapter, the logger, the scorers and the gated loop. One design finding is in the gated-loop row: upstream MPC executes all five planned actions before replanning, so SCoPe needs its own step-wise loop rather than a wrapper.',
      takeaway: 'Infrastructure and baseline are built; the SCoPe-specific modules are designed with interfaces in place but not implemented.',
      visual: 'Status column: green = ours and working, grey = reused upstream, amber = interfaces only, violet = planned.',
      why: 'We built the interfaces before the modules so that DINO-WM and V-JEPA 2-AC can be swapped without touching the planner or the trust code.',
      careful: 'There are no unit tests yet; say so if asked. The runtime patches are monkey-patches applied at launch, not edits to the upstream repository.',
      q: 'Why patch upstream at runtime instead of forking it?',
      a: 'So the upstream code stays pinned and untouched, every change is in one file we own, and each patch can be switched off by an environment variable to check that it does not change results (the fidelity benchmark on slide 28 does exactly that).',
    });
  }
};

module.exports.viewA = viewA;
module.exports.viewB = viewB;

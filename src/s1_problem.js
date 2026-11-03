'use strict';
// Area 1 (title & team) and area 2 (problem background, statement, questions).
const path = require('path');
const { W, MX, CW } = require('./lib');

// Title slide; o.notes overrides individual note fields when another deck reuses it.
function titleSlide(ctx, o = {}) {
  const { L, K, add } = ctx;
  const S = L.S;
  {
    const s = add('1 · Title and team', 'REINFORCEMENT LEARNING · MID-REVIEW',
      'SCoPe: Trust-Region Latent Planning with JEPA World Models', 'TITLE_DARK');
    s.addText('Plan in a learned world model, but act only on imagined futures the model can vouch for.', { placeholder: 'subtitle' });

    L.text(s, 'TEAM', { x: 0.7, y: 5.05, w: 3.4, h: 0.25, fontSize: 10.5, bold: true, color: K.darkMuted, charSpacing: 1.5 });
    L.text(s, '[TEAM MEMBERS]', { x: 0.7, y: 5.3, w: 3.4, h: 0.35, fontSize: 16, color: 'FFFFFF' });
    L.text(s, 'GUIDE', { x: 4.3, y: 5.05, w: 3.4, h: 0.25, fontSize: 10.5, bold: true, color: K.darkMuted, charSpacing: 1.5 });
    L.text(s, '[GUIDE NAME]', { x: 4.3, y: 5.3, w: 3.4, h: 0.35, fontSize: 16, color: 'FFFFFF' });
    L.text(s, '[DEPARTMENT] · [INSTITUTION] · [REVIEW DATE]', { x: 0.7, y: 5.8, w: 7.4, h: 0.32, fontSize: 14, color: K.darkText });
    L.rect(s, { x: 0.7, y: 6.35, w: 7.0, h: 0.42, radius: 0.5, fill: K.dark2, line: K.dark3 });
    L.text(s, [
      { text: 'RL area  ', options: { bold: true, color: '6DA7EC' } },
      { text: 'model-based RL · planning with a learned latent world model (MPC)', options: { color: K.darkText } },
    ], { x: 0.88, y: 6.35, w: 6.7, h: 0.42, fontSize: 12.5, valign: 'middle' });

    // Motif: candidate plans from the current latent; only those that stay inside the
    // region where the model is trusted are kept. Drawn natively, coordinates in inches.
    const X0 = 8.6; const Y0 = 1.3; const BW = 4.3; const BH = 4.2;
    L.ellipse(s, { x: 8.85, y: 1.55, w: 3.9, h: 3.55, fill: K.dark2, line: K.dark3 });
    L.text(s, 'trusted region of latent space', { x: 9.3, y: 1.78, w: 3.0, h: 0.3, fontSize: 11, italic: true, color: K.darkMuted, align: 'center' });
    const curve = (p0, c1, c2, p1, line) => s.addShape(S.CUSTOM_GEOMETRY, {
      x: X0, y: Y0, w: BW, h: BH, fill: { type: 'none' }, line,
      points: [
        { x: p0[0] - X0, y: p0[1] - Y0, moveTo: true },
        { x: p1[0] - X0, y: p1[1] - Y0, curve: { type: 'cubic', x1: c1[0] - X0, y1: c1[1] - Y0, x2: c2[0] - X0, y2: c2[1] - Y0 } },
      ],
    });
    const St = [9.5, 4.2]; const G = [11.92, 2.78];
    const acc = () => ({ color: '6DA7EC', width: 2.25 });
    const rej = () => ({ color: '64748B', width: 1.5, dashType: 'dash' });
    curve(St, [10.2, 4.1], [11.0, 2.9], [11.88, 2.82], acc());
    curve(St, [9.9, 3.3], [11.0, 2.45], [11.9, 2.7], acc());
    curve(St, [10.6, 4.5], [11.6, 3.6], [11.86, 2.92], acc());
    curve(St, [10.5, 4.75], [11.8, 4.5], [12.62, 4.95], rej());
    curve(St, [9.2, 3.2], [8.75, 2.3], [8.95, 1.42], rej());
    L.text(s, '×', { x: 12.5, y: 4.78, w: 0.3, h: 0.32, fontSize: 18, bold: true, color: 'E66767', align: 'center', valign: 'middle' });
    L.text(s, '×', { x: 8.8, y: 1.22, w: 0.3, h: 0.32, fontSize: 18, bold: true, color: 'E66767', align: 'center', valign: 'middle' });
    L.ellipse(s, { x: St[0] - 0.09, y: St[1] - 0.09, w: 0.18, h: 0.18, fill: 'FFFFFF', line: null });
    L.ellipse(s, { x: G[0] - 0.17, y: G[1] - 0.17, w: 0.34, h: 0.34, fill: null, line: 'FFFFFF', lineW: 2 });
    L.text(s, 'now: z_t', { x: 9.0, y: 4.32, w: 1.2, h: 0.28, fontSize: 11, color: K.darkText });
    L.text(s, 'goal: z_g', { x: 11.55, y: 2.25, w: 1.2, h: 0.28, fontSize: 11, color: K.darkText });
    // legend
    L.arrow(s, 8.9, 5.55, 9.35, 5.55, { color: '6DA7EC', w: 2.25, head: false });
    L.text(s, 'accepted: every imagined step has u_k ≤ τ', { x: 9.45, y: 5.42, w: 3.4, h: 0.26, fontSize: 11, color: K.darkText });
    L.arrow(s, 8.9, 5.9, 9.35, 5.9, { color: '64748B', w: 1.5, dash: 'dash', head: false });
    L.text(s, 'rejected: leaves the trusted region', { x: 9.45, y: 5.77, w: 3.4, h: 0.26, fontSize: 11, color: K.darkText });

    L.notes(s, Object.assign({
      time: '30 s',
      say: 'We are [TEAM MEMBERS], guided by [GUIDE NAME]. Our project is SCoPe. A robot can plan by imagining the result of candidate actions inside a learned world model and picking the plan whose imagined result looks closest to the goal. SCoPe adds one check: before acting, ask whether the imagined future is something the model can actually be trusted on, and refuse plans that leave that trusted region.',
      takeaway: 'SCoPe = latent-space planning (model-based RL) plus a decision-time trust check on imagined rollouts.',
      visual: 'The picture on the right is a schematic, not data. The white dot is the current latent state, the ring is the goal. Blue curves are candidate plans whose every imagined step stays in the region the model is trusted on; grey dashed ones leave it and are rejected.',
      why: '"Trust region" here means a region of latent space where the world model\'s predictions are reliable. It is not the TRPO policy trust region; say this early, because RL reviewers will hear "trust region" and think of TRPO.',
      careful: 'Nothing on this slide is a result. The schematic illustrates the idea only.',
      q: 'Is this TRPO-style trust-region optimisation?',
      a: 'No. TRPO limits how far a policy update moves. Our trust region is the part of the world model\'s latent space where its predictions match reality; we restrict planning to candidates whose imagined steps stay inside it.',
    }, o.notes || {}));
  }
}

module.exports = function problem(ctx) {
  const { pres, L, K, add, cite, ASSETS } = ctx;
  const S = L.S;
  titleSlide(ctx);

  // ---------------------------------------------------------------- 2. Agenda
  {
    const s = add('1 · Title and team', 'OVERVIEW', 'The review covers the six required areas; every number is labelled');
    const areas = [
      ['Title and team', 'Project, team, guide, RL problem area', 'Slide 1'],
      ['Problem background and statement', 'A failure we measured, why it matters, the research question', 'Slides 3–6'],
      ['Existing work, gap and our difference', '13 studies compared, counter-evidence, gap and positioning', 'Slides 7–12'],
      ['MDP, algorithm, data and simulation', 'Formulation, objective, CEM-MPC choice, simulators, protocol', 'Slides 13–18'],
      ['System design and architecture', 'End-to-end, agent–environment, data-flow and deployment views', 'Slides 19–23'],
      ['Novelty, demo, progress, next steps', 'Measured results, contribution matrix, progress, roadmap', 'Slides 24–33'],
    ];
    const cw = 3.85; const ch = 1.72; const gx = 0.29; const gy = 0.2;
    areas.forEach((a, i) => {
      const x = MX + (i % 3) * (cw + gx); const y = 1.68 + Math.floor(i / 3) * (ch + gy);
      L.rect(s, { x, y, w: cw, h: ch, radius: 0.06, fill: K.panel2, line: K.hair });
      L.num(s, i + 1, x + 0.2, y + 0.2, { d: 0.46, size: 16 });
      L.text(s, a[0], { x: x + 0.8, y: y + 0.18, w: cw - 0.95, h: 0.55, fontSize: 16, bold: true, color: K.ink, valign: 'middle' });
      L.text(s, a[1], { x: x + 0.2, y: y + 0.82, w: cw - 0.4, h: 0.5, fontSize: 13, color: K.sub });
      L.text(s, a[2], { x: x + 0.2, y: y + ch - 0.4, w: cw - 0.4, h: 0.28, fontSize: 12, bold: true, color: K.blue });
    });
    const ev = [
      ['MEASURED', 'From our own runs; parsed from the logs by script (data/phase0_metrics.json)'],
      ['PUBLISHED', 'Reported by a cited paper [n]; not re-measured by us'],
      ['ILLUSTRATIVE', 'Layout of a planned chart; contains no data'],
      ['TARGET', 'A planned objective that has not been achieved'],
    ];
    L.text(s, 'EVIDENCE LABELS', { x: MX, y: 5.62, w: 4, h: 0.26, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.5 });
    ev.forEach((e, i) => {
      const x = MX + (i % 2) * 6.1; const y = 5.95 + Math.floor(i / 2) * 0.45;
      L.chip(s, e[0], x, y);
      L.text(s, e[1], { x: x + 1.55, y, w: 4.45, h: 0.28, fontSize: 12.5, color: K.body, valign: 'middle' });
    });
    L.notes(s, {
      time: '20 s',
      say: 'The review brief lists six required areas. The deck follows them in order, and the slide ranges are shown on each card. One convention matters for the whole talk: every number is labelled. Measured means it came out of our own logs. Published means a paper reported it and we have not re-measured it. Illustrative means a chart layout with no data in it. Target means something we plan to achieve.',
      takeaway: 'All six required areas are covered, and measured results are never mixed with published numbers or plans.',
      visual: 'Six cards = six required areas, with slide ranges. The chips at the bottom appear in the top-right corner of later slides.',
      why: 'The brief asks that measured, published, illustrative and target values are never confused; labelling every slide makes that checkable.',
      careful: 'If asked about a number, check its chip before answering.',
      q: 'Which results are actually yours?',
      a: 'Only the ones marked MEASURED: the Phase 0 reproduction of DINO-WM on Push-T (three seeds), the Wall and PointMaze runs, the speed and fidelity benchmark, the logged failure example, and a one-seed H1 pilot of the trust scores (MC-dropout AUROC 0.87). Gating itself has not been tested yet.',
    });
  }

  // ---------------------------------------------------------------- 3. Problem in one minute
  {
    const s = add('2 · Problem', '2 · PROBLEM BACKGROUND AND STATEMENT', 'A world model can imagine a success that never happens');
    L.chips(s, ['MEASURED']);
    const ix = 2.0; const iw = 10.73; const ih = iw * 452 / 1892; const iy = 1.95; const colW = iw / 8;
    L.text(s, 'sim step', { x: MX, y: 1.64, w: 1.3, h: 0.26, fontSize: 11, color: K.muted, italic: true });
    ['0', '5', '10', '15', '20', '25', '75', 'goal'].forEach((t, i) => {
      L.text(s, t, { x: ix + i * colW, y: 1.64, w: colW, h: 0.26, fontSize: 11, bold: i === 7, color: K.muted, align: 'center' });
    });
    s.addImage({ path: path.join(ASSETS, 'rollout_failure_seed101_ep0.png'), x: ix, y: iy, w: iw, h: ih, altText: 'Push-T seed 101 episode 0: real simulator frames (top) versus the world model decoded imagination (bottom) for the same actions; the imagined T reaches the goal pose, the real one barely moves.' });
    L.text(s, [{ text: 'Real simulator', options: { bold: true, color: K.ink, breakLine: true } }, { text: 'what happened', options: { color: K.sub } }],
      { x: MX, y: iy + 0.35, w: 1.35, h: 0.6, fontSize: 13 });
    L.text(s, [{ text: 'Model\'s imagination', options: { bold: true, color: K.ink, breakLine: true } }, { text: 'decoded latents', options: { color: K.sub } }],
      { x: MX, y: iy + ih / 2 + 0.33, w: 1.38, h: 0.62, fontSize: 13 });
    // bracket under the first six columns (MPC round 1)
    const by = iy + ih + 0.1;
    L.path(s, [[ix + 0.05, by - 0.06], [ix + 0.05, by], [ix + 6 * colW - 0.05, by], [ix + 6 * colW - 0.05, by - 0.06]], { color: K.faint, w: 1, head: false });
    L.text(s, 'MPC round 1: the 25-step plan CEM selected', { x: ix, y: by + 0.03, w: 6 * colW, h: 0.26, fontSize: 11, color: K.sub, align: 'center' });
    L.text(s, 'after round 3', { x: ix + 6 * colW, y: by + 0.03, w: colW, h: 0.26, fontSize: 11, color: K.sub, align: 'center' });
    L.text(s, 'Push-T · seed 101 · episode 0 · DINO-WM released checkpoint, upstream planner settings. The decoder is used only to visualise latents; planning happens in latent space.',
      { x: MX, y: by + 0.36, w: CW, h: 0.26, fontSize: 10.5, color: K.muted, italic: true });
    const cols = [
      ['Imagined', 'Of 300 candidate plans, CEM kept the one whose imagined end state was closest to the goal: the T turns toward the goal pose.'],
      ['Real', 'In the simulator the same actions barely move the T. The episode was still unsolved after three replanning rounds.'],
      ['Missing', 'Nothing in the planner asks whether an imagined future is reliable. Every rollout is trusted equally, right or wrong.'],
    ];
    const cy = 5.2; const cwd = 3.92;
    cols.forEach((c, i) => {
      const x = MX + i * (cwd + 0.19);
      L.num(s, i + 1, x, cy + 0.02, { d: 0.3, size: 11 });
      L.text(s, c[0], { x: x + 0.4, y: cy, w: cwd - 0.4, h: 0.34, fontSize: 14, bold: true, color: K.ink, valign: 'middle' });
      L.text(s, c[1], { x, y: cy + 0.38, w: cwd, h: 0.72, fontSize: 12.5, color: K.body });
    });
    L.rect(s, { x: MX, y: 6.33, w: CW, h: 0.52, radius: 0.08, fill: K.blueTint, line: null });
    L.text(s, [{ text: 'SCoPe\'s question: ', options: { bold: true, color: K.blueDark } },
      { text: 'can we detect unreliable imagined rollouts and refuse to act on them, before they reach the real system?', options: { color: K.ink } }],
    { x: MX + 0.2, y: 6.33, w: CW - 0.4, h: 0.52, fontSize: 16, valign: 'middle' });
    L.notes(s, {
      time: '60 s',
      say: 'This is one episode from our own reproduction run. Top row: what really happened in the Push-T simulator. Bottom row: what the world model imagined for exactly the same actions, decoded back into pictures. In imagination the T-block turns toward the goal pose within 25 steps, so the planner chose this plan. In reality the same actions barely move it, and the episode was still unsolved after three replanning rounds. The planner had no way to know its imagination was wrong here. That missing check is our project.',
      takeaway: 'The planner acts on imagined futures without any reliability check, and we have a logged case where that fails.',
      visual: 'Columns are simulator steps 0, 5, ..., 25 (the first plan, executed open-loop), then step 75 (after three rounds), then the goal image. Read each column top versus bottom: they agree at step 0 and diverge from step 10 on. The grey shading of the top row and the darker goal column come from DINO-WM\'s own plotting code.',
      why: 'We lead with a real failure from our logs rather than a hypothetical; it makes the problem concrete and shows the pipeline already works on our machine.',
      careful: 'This is one illustrative failure, not a failure rate. Columns 0–5 are exactly the round-1 plan as imagined from the real start state. The step-75 column replays all executed actions open-loop from the start, which is not what the planner saw in rounds 2 and 3 (it replanned from real observations). We have not yet shown that any trust score would have flagged this episode; that is hypothesis H1.',
      q: 'How do you know the bottom row is what the planner believed?',
      a: 'DINO-WM\'s evaluator rolls the world model forward on the executed action sequence from the same start observation and decodes the predicted latents. For the first 25 steps that is the plan CEM selected in round 1. Source: run log seed101_20261010_090821.log and its plot output.',
      sources: 'outputs/runs/phase0/pusht/20261010_090828 (seed 101); asset docs/mid_review/assets/rollout_failure_seed101_ep0.png cropped from the full rollout plot.',
    });
  }

  // ---------------------------------------------------------------- 4. Why it matters
  {
    const s = add('2 · Problem', '2 · PROBLEM BACKGROUND AND STATEMENT', 'Learned world models now plan real tasks, so their silent errors matter');
    L.chips(s, ['PUBLISHED']);
    const cards = [
      ['80% vs 15%', 'Zero-shot pick-and-place (cup) on a real Franka arm: V-JEPA 2-AC planning with CEM in latent space vs the Octo policy baseline; world model trained on under 62 h of unlabelled robot video ' + cite(2) + '.'],
      ['70% vs 0%', 'Hierarchical latent planning (HWM) vs single-level planning on real pick-and-place; compounding prediction error over long horizons is the bottleneck ' + cite(15) + '.'],
      ['26% → 34%', 'Collision rate after adding a dynamics-uncertainty penalty to MPC in a navigation study, with uncertainty–risk correlation r < 0.15: the obvious fix can backfire ' + cite(18) + '.'],
    ];
    cards.forEach((c, i) => {
      const y = 1.68 + i * 1.66;
      L.rect(s, { x: MX, y, w: 6.0, h: 1.5, radius: 0.06, fill: K.panel2, line: K.hair });
      L.text(s, c[0], { x: MX + 0.25, y: y + 0.12, w: 5.5, h: 0.55, fontSize: 28, bold: true, color: K.ink, valign: 'middle' });
      L.text(s, c[1], { x: MX + 0.25, y: y + 0.68, w: 5.55, h: 0.78, fontSize: 12.5, color: K.sub });
    });
    const pts = [
      ['Errors become actions', 'A planner that exploits a model error executes it. On a robot that is a collision or a dropped object, not a lower score.'],
      ['Safeguards sit at training time', 'Model-based RL truncates or penalises uncertain model rollouts while learning a policy ' + cite('8–11') + '. The published latent planners rank candidate plans by predicted cost alone ' + cite(1, 2) + '.'],
      ['Knowing when not to trust the model', 'lets a system re-plan, slow down or hand over instead of acting on a guess: a prerequisite for deployment.'],
    ];
    L.text(s, 'WHY IT MATTERS', { x: 7.0, y: 1.7, w: 5.7, h: 0.28, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.5 });
    pts.forEach((p, i) => {
      const y = 2.1 + i * 1.5;
      L.num(s, i + 1, 7.0, y + 0.03, { d: 0.34, size: 12, fill: K.blue });
      L.text(s, p[0], { x: 7.5, y, w: 5.2, h: 0.4, fontSize: 17, bold: true, color: K.ink, valign: 'middle' });
      L.text(s, p[1], { x: 7.5, y: y + 0.42, w: 5.2, h: 0.95, fontSize: 14, color: K.body });
    });
    L.notes(s, {
      time: '60 s',
      say: 'Why should anyone care? First, latent world-model planning is no longer a toy: V-JEPA 2-AC picked and placed a cup on a real arm in 80% of trials zero-shot, against 15% for a policy baseline. Second, the limit is prediction error that compounds over the horizon: a hierarchical planner went from 0 to 70% on real pick-and-place mainly by shortening what each model has to predict. Third, the obvious fix, penalising uncertainty, is not automatically right: one recent study saw collisions go up, from 26 to 34%. So the question of when to trust an imagined future is open and practical.',
      takeaway: 'Latent planners work well enough to be deployed, their errors turn directly into actions, and current safeguards were designed for training-time use.',
      visual: 'Left: three published numbers, each from a different paper (the chip says PUBLISHED). Right: the three consequences we draw from them.',
      why: 'We picked one result that shows promise, one that shows the error limit, and one that warns against naive uncertainty use, so the motivation is balanced.',
      careful: 'These numbers come from different robots, tasks and protocols; they are not comparable to each other or to our Push-T numbers. The World Feedback paper is a single-author workshop paper on navigation; quote it as a warning, not as settled fact. HWM is a preprint.',
      q: 'If uncertainty penalties made things worse in [18], why would your trust gate work?',
      a: 'It may not, which is why H1 tests whether our scores track real error before we gate anything, and H4 includes an oracle gate that uses the true error. If even the oracle gate does not help, we learn that gating is not the bottleneck. A hard reject at decision time is also different from adding a penalty to the cost, and we run the penalty as a control.',
      sources: '[2] V-JEPA 2 (arXiv 2506.09985); [15] HWM (arXiv 2604.03208); [18] Learning from World Feedback (arXiv 2607.16591); [8–11] MBPO, MOPO, MOReL, MACURA.',
    });
  }

  // ---------------------------------------------------------------- 5. Problem statement
  {
    const s = add('2 · Problem', '2 · PROBLEM BACKGROUND AND STATEMENT', 'Problem statement: plan only on imagined futures the model can vouch for');
    const boxes = [
      ['Real-world challenge', 'Robots that plan by imagining outcomes in a learned world model act on predictions that can be confidently wrong (slide 3).', K.panel2],
      ['Existing limitation', 'Latent planners (DINO-WM, V-JEPA 2-AC) rank candidate plans by predicted cost alone. MBRL\'s uncertainty tools were built for low-dimensional states and training-time rollouts.', K.panel2],
      ['Sequential challenge', 'An action\'s effect shows up steps later. Errors compound over the 5-step (25 simulator-step) horizon, and the whole plan runs before any feedback arrives.', K.panel2],
      ['Proposed approach', 'Score every imagined step (u_k). Reject candidate plans that leave the trusted region (any u_k > τ). Fall back: resample, shorter horizon, safe action, stop and flag.', K.blueTint],
      ['Measurable objective', 'Calibration of u against real latent error (AUROC, Spearman ρ, ECE); false rejection and false acceptance rates; success per MPC round against plain MPC, random and oracle gates.', K.panel2],
      ['Scope and constraints', 'In: DINO-WM checkpoints on Push-T, Wall and PointMaze (simulated), frozen encoder, one 8 GB GPU. Out: real robots, retraining the world model, reward learning.', K.panel2],
    ];
    const cw = 3.85; const ch = 2.38;
    boxes.forEach((b, i) => {
      const x = MX + (i % 3) * (cw + 0.29); const y = 1.68 + Math.floor(i / 3) * (ch + 0.2);
      L.rect(s, { x, y, w: cw, h: ch, radius: 0.06, fill: b[2], line: b[2] === K.blueTint ? K.blue : K.hair });
      L.text(s, b[0].toUpperCase(), { x: x + 0.22, y: y + 0.18, w: cw - 0.44, h: 0.28, fontSize: 11.5, bold: true, color: b[2] === K.blueTint ? K.blueDark : K.muted, charSpacing: 1.2 });
      L.text(s, b[1], { x: x + 0.22, y: y + 0.55, w: cw - 0.44, h: ch - 0.7, fontSize: 15, color: K.ink });
    });
    L.notes(s, {
      time: '60 s',
      say: 'Here is the problem in the structure the brief asks for. The challenge: planners act on predictions that can be confidently wrong. The limitation: current latent planners have no reliability check, and the uncertainty tools from model-based RL were designed for low-dimensional states and for training a policy, not for vetting a plan at decision time. Why it is sequential: an action\'s effect appears later and the planner commits to five action chunks before it sees the result. Our approach, highlighted in blue: score each imagined step, reject plans that leave the trusted region, and fall back in a fixed order. We measure calibration, the two kinds of gate error, and task success. Scope: simulation only, the released DINO-WM models, one laptop GPU.',
      takeaway: 'One sentence: we test whether rejecting imagined rollouts that a trust score flags as unreliable makes latent planning succeed more often, without throwing away good plans.',
      visual: 'Six boxes, read left to right, top to bottom. Blue is our proposal; grey is context.',
      why: 'We kept the scope narrow (released checkpoints, simulated tasks) so that the experiment is feasible on one 8 GB GPU and so that any effect can be attributed to the gate, not to a retrained model.',
      careful: 'Say "proposed" for the approach; none of it is implemented beyond interfaces. The 25-step horizon is Push-T (5 planning steps × frameskip 5).',
      q: 'Why not just train a better world model?',
      a: 'A better model reduces errors but never removes them, especially off the training distribution. A planner still needs to know when its model is unreliable. Our question is complementary and does not require retraining.',
    });
  }

  // ---------------------------------------------------------------- 6. Research question and hypotheses
  {
    const s = add('2 · Problem', '2 · PROBLEM BACKGROUND AND STATEMENT', 'One research question, tested as four falsifiable hypotheses');
    L.rect(s, { x: MX, y: 1.66, w: CW, h: 1.02, radius: 0.06, fill: K.blueTint, line: null });
    L.text(s, 'PRIMARY RESEARCH QUESTION', { x: MX + 0.25, y: 1.74, w: 6, h: 0.26, fontSize: 11, bold: true, color: K.blueDark, charSpacing: 1.5 });
    L.text(s, 'Can an uncertainty score on imagined JEPA latents flag unreliable rollouts well enough that rejecting them improves real planning success, without rejecting most good plans?',
      { x: MX + 0.25, y: 2.0, w: CW - 0.5, h: 0.64, fontSize: 18, color: K.ink, valign: 'middle' });
    const hs = [
      ['H1', 'Calibration', 'Does u_k rank imagined steps by their real latent error?', 'AUROC / AUPRC for top-10% error; Spearman ρ; ECE', 'random score; distance to start latent'],
      ['H2', 'False rejection', 'How often does the gate refuse plans that would have worked?', 'FRR = P(reject | real success)', 'random gate at equal rejection rate'],
      ['H3', 'False acceptance', 'How often does the gate accept plans that fail?', 'FAR = P(accept | real failure)', 'random gate at equal rejection rate'],
      ['H4', 'Closed-loop benefit', 'Does gating raise success per MPC round?', 'success rate per round; compute per episode', 'plain MPC, soft penalty, random and oracle gates'],
    ];
    const hw = 2.9; const hy = 2.88; const hh = 2.42;
    hs.forEach((h, i) => {
      const x = MX + i * (hw + 0.177);
      L.rect(s, { x, y: hy, w: hw, h: hh, radius: 0.06, fill: K.white, line: K.line });
      L.text(s, [{ text: h[0] + '  ', options: { color: K.blue } }, { text: h[1], options: { color: K.ink } }], { x: x + 0.18, y: hy + 0.14, w: hw - 0.3, h: 0.34, fontSize: 16, bold: true });
      L.text(s, h[2], { x: x + 0.18, y: hy + 0.52, w: hw - 0.33, h: 0.72, fontSize: 13, color: K.body });
      L.text(s, [{ text: 'Metric  ', options: { bold: true, color: K.muted } }, { text: h[3], options: { color: K.body } }], { x: x + 0.18, y: hy + 1.28, w: hw - 0.33, h: 0.55, fontSize: 11.5 });
      L.text(s, [{ text: 'Control  ', options: { bold: true, color: K.muted } }, { text: h[4], options: { color: K.body } }], { x: x + 0.18, y: hy + 1.84, w: hw - 0.33, h: 0.5, fontSize: 11.5 });
    });
    L.text(s, 'OBJECTIVES', { x: MX, y: 5.5, w: 3, h: 0.26, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.5 });
    const os = [
      ['O0', 'Reproduce DINO-WM planning on our GPU', 'BUILT', 'done for Push-T'],
      ['O1', 'Log imagined vs real latents (error labels)', 'PLANNED', 'Phase 1'],
      ['O2', 'Test ≥ 3 scores offline (H1–H3)', 'PLANNED', 'Phase 2'],
      ['O3', 'Gate the closed loop (H4)', 'PLANNED', 'Phase 3'],
      ['O4', 'Second backbone (V-JEPA 2-AC)', 'STRETCH', 'stretch'],
    ];
    const ow = 2.33;
    os.forEach((o, i) => {
      const x = MX + i * (ow + 0.12); const y = 5.82;
      L.rect(s, { x, y, w: ow, h: 0.72, radius: 0.06, fill: K.panel2, line: K.hair });
      L.text(s, [{ text: o[0] + '  ', options: { bold: true, color: K.ink } }, { text: o[1], options: { color: K.body } }], { x: x + 0.12, y: y + 0.06, w: ow - 0.24, h: 0.42, fontSize: 11.5 });
      L.text(s, o[3], { x: x + 0.12, y: y + 0.46, w: ow - 0.24, h: 0.22, fontSize: 10.5, bold: true, color: o[2] === 'BUILT' ? K.aquaDark : (o[2] === 'STRETCH' ? K.muted : K.violet) });
    });
    L.text(s, 'Expected benefits, not results yet: fewer confidently wrong actions, an explicit stop-and-flag signal, and less compute spent on plans the model cannot evaluate.',
      { x: MX, y: 6.6, w: CW, h: 0.28, fontSize: 11.5, italic: true, color: K.muted });
    L.notes(s, {
      time: '60 s',
      say: 'The research question has two halves: does a score flag unreliable rollouts, and does acting on it help without throwing away good plans. We split it into four hypotheses that can each fail on their own. H1: does the score track real error? H2 and H3: the two kinds of gate mistakes, judged against a random gate that rejects just as often. H4: does gating improve real success, with an oracle gate as the ceiling. The objectives below map to project phases; only O0, the reproduction, is done.',
      takeaway: 'Each hypothesis has a metric and a control, so a negative result is informative rather than a dead end.',
      visual: 'Top: the question. Middle: four hypotheses with metric and control. Bottom: objectives with their phase; green means done, violet means planned.',
      why: 'The random gate at the same rejection rate separates "rejecting the right candidates" from "rejecting anything at all" (fewer candidates can change CEM by itself). The oracle gate, which uses the true error, tells us whether gating can help even with a perfect score.',
      careful: 'O0 is done for Push-T (3 seeds) and PointMaze (1 seed, 1.00 after replanning); Wall has three seeds (0.95 after round 3; one plan 0.52 against the published 0.74). The benefits line is an expectation, not a finding.',
      q: 'What counts as "top-10% error" and why that threshold?',
      a: 'It is a convention to turn a continuous error into a binary "unreliable" label for AUROC/AUPRC; we also report Spearman correlation on the raw error so the result does not hinge on the threshold, and we will show the reliability curve across all deciles.',
    });
  }
};

module.exports.titleSlide = titleSlide;

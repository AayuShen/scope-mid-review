'use strict';
// Area 3: existing work, counter-evidence, research gap, positioning, proposed approach.
const { MX, CW } = require('./lib');

module.exports = function literature(ctx) {
  const { L, K, add, cite } = ctx;
  const SEC = '3 · Existing work and gap';
  const OVER = '3 · EXISTING WORK, RESEARCH GAP AND OUR DIFFERENCE';

  const rule = () => [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: K.hair }, { type: 'none' }];
  const head = (t) => ({ text: t, options: { bold: true, color: K.ink, fill: { color: K.panel }, fontSize: 11.5, border: rule() } });
  const cell = (t, o = {}) => ({ text: L.mr(t), options: Object.assign({ color: K.body, fontSize: 11.5, border: rule(), valign: 'top' }, o) });
  const study = (name, ref, by) => ({
    text: [
      { text: name + ' ', options: { bold: true, color: K.ink } },
      { text: ref, options: { color: K.orangeDark, bold: true, breakLine: true } },
      { text: by, options: { color: K.muted, fontSize: 10.5 } },
    ],
    options: { border: rule(), valign: 'top', fontSize: 11.5 },
  });
  const table = (s, rows, colW, y, rowH) => s.addTable(rows, {
    x: MX, y, w: CW, colW, fontFace: 'Calibri', fontSize: 11.5, color: K.body, rowH, margin: [0.05, 0.08, 0.05, 0.08], valign: 'top',
  });

  // ---------------------------------------------------------------- 7. Uncertainty-aware MBRL
  {
    const s = add(SEC, OVER, 'Model-based RL already guards against model error, mostly in training');
    L.chips(s, ['PUBLISHED']);
    const rows = [
      [head('Study'), head('How model error is handled'), head('Setting'), head('Reported finding'), head('Limitation for SCoPe')],
      [study('PETS', cite(6), 'Chua et al., NeurIPS 2018'), cell('Probabilistic ensemble; trajectory sampling inside CEM-MPC'), cell('MuJoCo, low-dimensional state'), cell('Model-free asymptotic return with 8× / 125× fewer samples than SAC / PPO (half-cheetah)'), cell('Uncertainty is propagated, never used to refuse a plan')],
      [study('MBPO', cite(8), 'Janner et al., NeurIPS 2019'), cell('Short model rollouts branched from real data'), cell('MuJoCo'), cell('More sample-efficient than prior MBRL; matches the best model-free asymptotes'), cell('One global rollout length; trains a policy')],
      [study('MOPO', cite(9), 'Yu et al., NeurIPS 2020'), cell('Reward penalised by model uncertainty'), cell('Offline benchmarks (D4RL)'), cell('Beats prior offline model-free and model-based baselines'), cell('Soft penalty in training; becomes our soft-penalty control')],
      [study('MOReL', cite(10), 'Kidambi et al., NeurIPS 2020'), cell('Pessimistic MDP: unknown state-actions lead to an absorbing HALT state'), cell('Offline benchmarks (D4RL)'), cell('Matches or exceeds offline state of the art at publication'), cell('Hard cut-off, but at training time and in state space')],
      [study('MACURA', cite(11), 'Frauenknecht et al., 2024 (preprint)'), cell('Rollout length adapted to local model uncertainty: "where to trust"'), cell('MuJoCo'), cell('Better data efficiency than prior deep MBRL'), cell('Training-time rollouts on proprioceptive state')],
      [study('Latent safety filter', cite(16), 'Seo et al., CoRL 2025'), cell('Epistemic uncertainty with a conformal threshold marks OOD latents unsafe; reachability filter'), cell('Vision-based Franka arm, sim and hardware'), cell('Pre-emptively detects unsafe OOD scenarios (qualitative in the abstract)'), cell('Avoids failure sets with a learned safety value; not goal-reaching plans')],
    ];
    table(s, rows, [2.05, 2.85, 1.8, 2.95, 2.483], 1.68, [0.36, 0.62, 0.62, 0.62, 0.62, 0.62, 0.78]);
    L.rect(s, { x: MX, y: 6.12, w: CW, h: 0.72, radius: 0.06, fill: K.panel2, line: K.hair });
    L.text(s, [
      { text: 'What we take: ', options: { bold: true, color: K.ink } },
      { text: 'ensembles and MC-dropout as candidate scores ' + cite(6, 22, 23) + '; the soft penalty as a control ' + cite(9) + '; the hard "unknown region" cut-off ' + cite(10, 11) + '; conformal calibration of the threshold ' + cite(16) + '.', options: { color: K.body } },
    ], { x: MX + 0.2, y: 6.12, w: CW - 0.4, h: 0.72, fontSize: 13.5, valign: 'middle' });
    L.notes(s, {
      time: '75 s',
      say: 'Model-based RL has worried about model error for a long time. PETS uses an ensemble and propagates its uncertainty through planning. MBPO limits how far it trusts the model by keeping rollouts short. MOPO subtracts an uncertainty penalty from the reward; MOReL sends unknown state-actions to an absorbing halt state. MACURA adapts rollout length to local uncertainty, literally "where to trust the model". Closest to us, the latent safety filter uses uncertainty in a learned latent space to veto unsafe actions. The common thread in the first five: the safeguard acts while training a policy, on low-dimensional states.',
      takeaway: 'The idea of not trusting a model where it is uncertain is established; what is not established is a decision-time veto on imagined latents of a frozen-encoder JEPA world model, tested against real error.',
      visual: 'One row per study; orange numbers are references. The last column is how each one falls short for our setting, and the bottom box lists what we borrow.',
      why: 'We cite the strongest prior work first so the panel sees we are not claiming the idea of uncertainty-aware model use as new.',
      careful: 'PETS numbers are from its abstract (half-cheetah). MACURA is an arXiv preprint (no venue listed). The latent safety filter abstract gives qualitative results only; do not quote numbers for it. MOReL\'s HALT state is from the paper body.',
      q: 'Isn\'t SCoPe just MOReL\'s HALT state at planning time?',
      a: 'The spirit is similar, and we say so. The differences: MOReL applies the cut-off while training a policy in a pessimistic MDP over low-dimensional states; we apply it per imagined step at decision time inside CEM, over 196×384 patch-token latents of a frozen encoder, and we first test whether the score tracks real error at all.',
    });
  }

  // ---------------------------------------------------------------- 8. Latent world-model planners
  {
    const s = add(SEC, OVER, 'Latent planners scale, yet rank every imagined plan as equally reliable');
    L.chips(s, ['PUBLISHED']);
    const rows = [
      [head('Study'), head('World model and planner'), head('Setting'), head('Reported finding'), head('Reliability check at decision time')],
      [study('PlaNet', cite(7), 'Hafner et al., ICML 2019'), cell('RSSM learned from pixels; CEM in latent space'), cell('DeepMind Control, pixels'), cell('Far fewer episodes than strong model-free agents, similar final return'), cell('None: every imagined rollout is trusted')],
      [study('DreamerV3', cite(12), 'Hafner et al., Nature 2025'), cell('RSSM; actor-critic trained in imagination'), cell('150+ tasks; Minecraft diamonds from scratch'), cell('One fixed configuration across domains'), cell('None; needs reward')],
      [study('TD-MPC2', cite(13), 'Hansen et al., ICLR 2024'), cell('Decoder-free latent model; MPPI with a learned value'), cell('104 continuous-control tasks'), cell('One 317M-parameter agent across 80 tasks'), cell('None; needs reward')],
      [study('DINO-WM', cite(1), 'Zhou et al., ICML 2025'), cell('Frozen DINOv2 patch features + ViT predictor; CEM-MPC to a goal image'), cell('6 environments incl. PointMaze, Wall, Push-T; offline, reward-free'), cell('MPC success 0.98 / 0.96 / 0.90 on PointMaze / Wall / Push-T'), cell([{ text: 'None: its CEM returns every plan as valid. ', options: {} }, { text: 'Our base model.', options: { bold: true, color: K.blueDark } }])],
      [study('PLDM', cite(14), 'Sobal et al., NeurIPS 2025'), cell('JEPA latent dynamics, used for planning'), cell('Navigation; offline data of varying quality'), cell('Generalises to unseen layouts better than model-free offline RL'), cell('None')],
      [study('V-JEPA 2-AC', cite(2), 'Assran et al., 2025 (preprint)'), cell('Action-conditioned predictor on frozen V-JEPA 2; CEM energy minimisation'), cell('Real Franka arm, zero-shot'), cell('Pick-and-place 80% (cup) vs Octo 15%; about 16 s per action'), cell([{ text: 'None. ', options: {} }, { text: 'Our second backbone (stretch).', options: { bold: true, color: K.blueDark } }])],
      [study('HWM', cite(15), 'Zhang et al., 2026 (preprint)'), cell('Multi-scale latent models; hierarchical MPC'), cell('Real Franka; simulated push and maze'), cell('70% vs 0% (single level) on real pick-and-place; up to 3× less planning compute'), cell('None; tackles horizon, not reliability')],
    ];
    table(s, rows, [2.05, 2.85, 2.1, 2.85, 2.283], 1.68, [0.36, 0.6, 0.6, 0.6, 0.62, 0.6, 0.62, 0.62]);
    L.text(s, [
      { text: 'Pattern: ', options: { bold: true, color: K.ink } },
      { text: 'strong planners, reward-free goal reaching in the JEPA family, and no decision-time reliability signal in any of them. That is the gap we test (slide 10).', options: { color: K.body } },
    ], { x: MX, y: 6.42, w: CW, h: 0.42, fontSize: 13.5, valign: 'middle' });
    L.notes(s, {
      time: '75 s',
      say: 'The second family learns world models from images and plans in their latent space. PlaNet started latent CEM planning from pixels. DreamerV3 and TD-MPC2 scale to more than a hundred tasks but need a reward. The JEPA line, DINO-WM, PLDM, V-JEPA 2-AC and HWM, plans to a goal image without reward, and works on a real arm. In the last column you see that none of them checks whether an imagined rollout is reliable before using it. DINO-WM\'s CEM literally returns every plan as valid; we read that in its code.',
      takeaway: 'We build on DINO-WM (and later V-JEPA 2-AC) because they plan reward-free to a goal image, and because their planners have no reliability check we could compare against.',
      visual: 'Rows are ordered roughly by time. Blue bold marks the two backbones we use.',
      why: 'DINO-WM has released checkpoints, datasets and code that fit our compute, and published numbers we can reproduce exactly; V-JEPA 2-AC is the larger, real-robot variant of the same idea.',
      careful: 'Numbers come from different tasks and protocols; do not compare across rows. V-JEPA 2-AC and HWM are preprints. "About 16 s per action" is V-JEPA 2-AC\'s reported planning time on its own hardware. TD-MPC2 also has a pixel variant; the table lists its main state-based results.',
      q: 'DreamerV3 handles 150 tasks. Why not use it?',
      a: 'It needs a reward signal and learns a policy in imagination; our setting is reward-free planning to a goal image from offline data, which is what the JEPA planners do. Its imagined rollouts are also used without a reliability check, so the question we ask applies there too, but it is not our testbed.',
    });
  }

  // ---------------------------------------------------------------- 9. Counter-evidence
  {
    const s = add(SEC, OVER, 'Recent work warns that model uncertainty may miss the errors that matter');
    L.chips(s, ['PUBLISHED']);
    const cards = [
      ['Uncertainty can shrink while error grows', 'Biased Dreams ' + cite(17) + ' · RLC 2026',
        'In Dreamer\'s RSSM, ensemble disagreement tracks local error but not compounding error; rollouts drift into well-supported "attractor" regions where uncertainty looks low.',
        'test scores against real multi-step error at every imagined step (H1), not one-step disagreement.'],
      ['Uncertainty penalties can raise risk', 'Learning from World Feedback ' + cite(18) + ' · ICML 2026 workshop',
        'A dynamics-uncertainty penalty raised collisions from 26% to 34%; uncertainty–risk correlation r < 0.15; outcome-based signals cut collisions to 1–14%.',
        'include an oracle gate and a soft-penalty control, and report negative results.'],
      ['Latent distance is not task distance', 'Representation geometry ' + cite(20) + ' · preprint 2026',
        'Collapse-free JEPA latents need not reflect task-relevant distances, so latent planning costs can misjudge closeness to the goal.',
        'log two labels per candidate: latent error and task consequence.'],
      ['Internal shifts do not predict outcomes', 'Beyond Task Success ' + cite(21) + ' and ACPC ' + cite(19) + ' · preprints 2026',
        'Stage-wise analysis: the ranking of degradations by representation shift does not match their ranking by physical outcome. ACPC diagnoses JEPA models via perturbation consistency.',
        'judge every score at the outcome stage; ACPC-style consistency is a candidate score.'],
    ];
    const cw = 5.97; const ch = 2.12;
    cards.forEach((c, i) => {
      const x = MX + (i % 2) * (cw + 0.19); const y = 1.68 + Math.floor(i / 2) * (ch + 0.17);
      L.rect(s, { x, y, w: cw, h: ch, radius: 0.06, fill: K.white, line: K.line });
      L.text(s, c[0], { x: x + 0.22, y: y + 0.13, w: cw - 0.44, h: 0.34, fontSize: 16, bold: true, color: K.ink });
      L.text(s, c[1], { x: x + 0.22, y: y + 0.47, w: cw - 0.44, h: 0.26, fontSize: 11, color: K.orangeDark, bold: true });
      L.text(s, c[2], { x: x + 0.22, y: y + 0.76, w: cw - 0.44, h: 0.78, fontSize: 12.5, color: K.body });
      L.text(s, [{ text: 'SCoPe response: ', options: { bold: true, color: K.blueDark } }, { text: c[3], options: { color: K.ink } }],
        { x: x + 0.22, y: y + 1.55, w: cw - 0.44, h: 0.5, fontSize: 12.5 });
    });
    L.rect(s, { x: MX, y: 6.3, w: CW, h: 0.55, radius: 0.08, fill: K.blueTint, line: null });
    L.text(s, [{ text: 'Our position: ', options: { bold: true, color: K.blueDark } },
      { text: 'a trust score is a hypothesis to falsify. Calibration first (H1), then closed-loop benefit (H4) with an oracle gate as the ceiling.', options: { color: K.ink } }],
    { x: MX + 0.2, y: 6.3, w: CW - 0.4, h: 0.55, fontSize: 15, valign: 'middle' });
    L.notes(s, {
      time: '60 s',
      say: 'The brief asks for research that challenges our approach, and there is real evidence against naive uncertainty. In Dreamer\'s latent model, ensemble disagreement misses compounding error because rollouts drift into regions where the ensemble agrees. A navigation study found uncertainty penalties made collisions more frequent. A JEPA paper shows latent distances need not match task distances, which affects our cost and our error label. And a stage-wise study shows internal representation shifts do not predict outcomes in order. Each card says how we respond in the design.',
      takeaway: 'We expect some trust scores to fail; the experiment is designed so that failure is detected and reported, not hidden.',
      visual: 'Four cards: finding, source, what it says, and our design response in blue.',
      why: 'Including counter-evidence protects the project from over-claiming and directly shaped H1, the oracle gate and the two-label design.',
      careful: 'Three of these are 2026 preprints and one is a workshop paper; present them as warnings, not consensus. The 26%→34% and r < 0.15 numbers are from the World Feedback abstract (navigation, lidar). Biased Dreams studies RSSM, not JEPA, so transfer to our models is itself an open question.',
      q: 'Given this evidence, what if no score works?',
      a: 'Then the result is still useful: we would show, on JEPA latents with real error labels, which scores fail and by how much, and the oracle gate would tell us whether a better score would help at all. Both are reportable findings for the final review.',
    });
  }

  // ---------------------------------------------------------------- 10. Research gap diagram
  {
    const s = add(SEC, OVER, 'The gap: rejecting unreliable imagined latents at decision time');
    const cols = [
      ['EXISTING APPROACHES', 0.6, 2.2], ['DEMONSTRATED STRENGTHS', 3.05, 2.3], ['REMAINING LIMITATION', 5.6, 2.5],
      ['OUR INTERVENTION', 8.4, 2.05], ['HOW WE MEASURE IT', 10.7, 2.033],
    ];
    cols.forEach((c) => L.text(s, c[0], { x: c[1], y: 1.66, w: c[2], h: 0.3, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.2 }));
    const rowsY = [2.08, 4.08]; const rh = 1.78;
    const rowsTxt = [
      [['Uncertainty-aware model-based RL', 'PETS, MBPO, MOPO, MOReL, MACURA ' + cite(6, '8–11')],
        'Ensembles, short or adaptive rollouts and penalties curb model exploitation; sample-efficient and safer offline.',
        'Built for low-dimensional states and training-time rollouts. Disagreement can miss compounding latent error ' + cite(17) + '; penalties can raise risk ' + cite(18) + '.'],
      [['Latent world-model planners', 'DINO-WM, V-JEPA 2-AC, PLDM, HWM ' + cite(1, 2, 14, 15)],
        'Reward-free, zero-shot planning to a goal image from offline data; real-robot success.',
        'Every imagined rollout is treated as equally reliable. Confident failures like slide 3 go unflagged.'],
    ];
    rowsTxt.forEach((r, i) => {
      const y = rowsY[i];
      L.rect(s, { x: 0.6, y, w: 2.2, h: rh, radius: 0.06, fill: K.panel2, line: K.line });
      L.text(s, [{ text: r[0][0], options: { bold: true, color: K.ink, breakLine: true } }, { text: r[0][1], options: { color: K.sub, fontSize: 11.5 } }],
        { x: 0.75, y: y + 0.12, w: 1.95, h: rh - 0.2, fontSize: 14 });
      L.rect(s, { x: 3.05, y, w: 2.3, h: rh, radius: 0.06, fill: K.aquaTint, line: K.aqua });
      L.text(s, r[1], { x: 3.2, y: y + 0.12, w: 2.0, h: rh - 0.2, fontSize: 12.5, color: K.ink });
      L.rect(s, { x: 5.6, y, w: 2.5, h: rh, radius: 0.06, fill: K.redTint, line: K.red });
      L.text(s, r[2], { x: 5.75, y: y + 0.12, w: 2.2, h: rh - 0.2, fontSize: 12.5, color: K.ink });
      L.arrow(s, 2.8, y + rh / 2, 3.05, y + rh / 2, { color: K.sub });
      L.arrow(s, 5.35, y + rh / 2, 5.6, y + rh / 2, { color: K.sub });
    });
    const iy = rowsY[0]; const ih = rowsY[1] + rh - rowsY[0];
    L.path(s, [[8.1, rowsY[0] + rh / 2], [8.25, rowsY[0] + rh / 2], [8.25, iy + ih / 2], [8.4, iy + ih / 2]], { color: K.sub });
    L.path(s, [[8.1, rowsY[1] + rh / 2], [8.25, rowsY[1] + rh / 2], [8.25, iy + ih / 2]], { color: K.sub, head: false });
    L.rect(s, { x: 8.4, y: iy, w: 2.05, h: ih, radius: 0.06, fill: K.blueTint, line: K.blue, lineW: 1.5 });
    L.text(s, [
      { text: 'Per-step trust score u_k on imagined latents', options: { breakLine: true } },
      { text: ' ', options: { fontSize: 6, breakLine: true } },
      { text: 'Hard gate inside CEM-MPC: reject a plan if any u_k > τ', options: { breakLine: true } },
      { text: ' ', options: { fontSize: 6, breakLine: true } },
      { text: 'Fallback ladder when too few plans pass', options: { breakLine: true } },
      { text: ' ', options: { fontSize: 6, breakLine: true } },
      { text: 'No retraining of the world model', options: {} },
    ], { x: 8.55, y: iy + 0.15, w: 1.8, h: ih - 0.3, fontSize: 13, color: K.ink, valign: 'middle' });
    L.arrow(s, 10.45, iy + ih / 2, 10.7, iy + ih / 2, { color: K.sub });
    L.rect(s, { x: 10.7, y: iy, w: 2.033, h: ih, radius: 0.06, fill: K.white, line: K.ink, lineW: 1.25 });
    L.text(s, [
      { text: 'H1 ', options: { bold: true, color: K.blue } }, { text: 'AUROC, Spearman ρ, ECE against real latent error', options: { breakLine: true } },
      { text: ' ', options: { fontSize: 6, breakLine: true } },
      { text: 'H2–H3 ', options: { bold: true, color: K.blue } }, { text: 'false rejection and acceptance vs a random gate', options: { breakLine: true } },
      { text: ' ', options: { fontSize: 6, breakLine: true } },
      { text: 'H4 ', options: { bold: true, color: K.blue } }, { text: 'success per MPC round vs plain MPC, soft penalty, random and oracle gates', options: {} },
    ], { x: 10.85, y: iy + 0.15, w: 1.75, h: ih - 0.3, fontSize: 12.5, color: K.ink, valign: 'middle' });
    L.text(s, [
      { text: 'Contribution type: ', options: { bold: true, color: K.ink } },
      { text: 'an empirical test plus an integration (a gate inside an existing planner). Not a new world model and not a new RL algorithm.', options: { color: K.body } },
    ], { x: MX, y: 6.15, w: CW, h: 0.6, fontSize: 14, valign: 'middle' });
    L.notes(s, {
      time: '60 s',
      say: 'Putting the two families together. Uncertainty-aware model-based RL knows how to distrust a model, but it does so while training, on small state vectors, and recent work shows its signals can miss compounding latent error. Latent JEPA planners work zero-shot from images, but treat every imagined rollout as equally reliable. Our intervention sits where they meet: score each imagined step, reject plans that fail the score, fall back if too few remain, all without retraining the world model. The last column is how we will know whether it worked.',
      takeaway: 'The gap is narrow and testable: a decision-time veto on imagined JEPA latents, validated against what the simulator actually does.',
      visual: 'Read each row left to right: approach, what it does well (green), what it leaves open (red). Both rows feed our intervention (blue), which is judged by the hypotheses on the right.',
      why: 'We frame the contribution as an empirical test and an integration because that is what it is; claiming a new algorithm would not survive the literature on the previous slides.',
      careful: 'Do not say "no one has done this". Say we did not find a study that gates CEM candidates on frozen-encoder JEPA latents against real error; the closest is the latent safety filter [16], which vetoes actions for safety, not plans for goal reaching.',
      q: 'Is this a research contribution or engineering?',
      a: 'Both, and we separate them. The engineering is the gate, the fallback and the logging. The research contribution is the measurement: whether any decision-time trust score on these latents tracks real error and improves success, with random and oracle controls. A clear negative answer would also be a contribution.',
    });
  }

  // ---------------------------------------------------------------- 11. Positioning matrix
  {
    const s = add(SEC, OVER, 'Where SCoPe sits: latent planning plus a decision-time trust check');
    L.chips(s, ['PUBLISHED', 'PROPOSED']);
    const gx = 2.75; const gw = (12.733 - gx - 0.2) / 3;
    const colsHdr = ['Model uncertainty not used', 'Uncertainty used at training time', 'Uncertainty used at decision time (can veto actions)'];
    colsHdr.forEach((t, i) => {
      L.rect(s, { x: gx + i * (gw + 0.1), y: 1.68, w: gw, h: 0.62, radius: 0.05, fill: K.panel, line: null });
      L.text(s, t, { x: gx + i * (gw + 0.1) + 0.12, y: 1.68, w: gw - 0.24, h: 0.62, fontSize: 13, bold: true, color: K.ink, valign: 'middle', align: 'center' });
    });
    const rowsHdr = [['Low-dimensional state models', 2.42, 1.62], ['Image-based latent world models', 4.16, 2.06]];
    rowsHdr.forEach((r) => {
      L.rect(s, { x: MX, y: r[1], w: 2.03, h: r[2], radius: 0.05, fill: K.panel, line: null });
      L.text(s, r[0], { x: MX + 0.12, y: r[1], w: 1.8, h: r[2], fontSize: 13, bold: true, color: K.ink, valign: 'middle' });
      for (let i = 0; i < 3; i++) L.rect(s, { x: gx + i * (gw + 0.1), y: r[1], w: gw, h: r[2], radius: 0.05, fill: K.white, line: K.hair });
    });
    const pill = (t, x, y, o = {}) => {
      const w = o.w || (0.3 + t.length * 0.08);
      L.rect(s, { x, y, w, h: 0.36, radius: 0.5, fill: o.fill || K.panel2, line: o.line || K.line, lineW: o.lineW || 0.75, dash: o.dash || 'solid' });
      L.text(s, t, { x, y, w, h: 0.36, fontSize: 12, bold: !!o.bold, color: o.color || K.body, align: 'center', valign: 'middle' });
      return w;
    };
    const flow = (items, x0, y0, wmax) => {
      let x = x0; let y = y0;
      items.forEach((t) => {
        const w = 0.3 + t.length * 0.08;
        if (x + w > x0 + wmax) { x = x0; y += 0.46; }
        pill(t, x, y);
        x += w + 0.1;
      });
    };
    L.text(s, '(not our focus)', { x: gx + 0.15, y: 2.42 + 0.62, w: gw - 0.3, h: 0.3, fontSize: 12, italic: true, color: K.faint, align: 'center' });
    flow(['MBPO [8]', 'MOPO [9]', 'MOReL [10]', 'MACURA [11]'], gx + (gw + 0.1) + 0.15, 2.58, gw - 0.3);
    pill('PETS [6]', gx + 2 * (gw + 0.1) + 0.15, 2.58);
    L.text(s, 'propagates uncertainty through MPC; no veto', { x: gx + 2 * (gw + 0.1) + 0.15, y: 3.04, w: gw - 0.3, h: 0.5, fontSize: 11, italic: true, color: K.sub });
    flow(['PlaNet [7]', 'DreamerV3 [12]', 'TD-MPC2 [13]', 'DINO-WM [1]', 'PLDM [14]', 'V-JEPA 2-AC [2]', 'HWM [15]'], gx + 0.15, 4.3, gw - 0.3);
    L.text(s, 'analysed, not used for control: ensemble RSSMs in Biased Dreams [17]', { x: gx + (gw + 0.1) + 0.15, y: 4.35, w: gw - 0.3, h: 0.7, fontSize: 11.5, italic: true, color: K.sub });
    const cx = gx + 2 * (gw + 0.1) + 0.15;
    pill('Latent safety filter [16]', cx, 4.3);
    L.text(s, 'vetoes unsafe actions via a learned reachability value', { x: cx, y: 4.72, w: gw - 0.3, h: 0.45, fontSize: 11, italic: true, color: K.sub });
    pill('SCoPe (proposed)', cx, 5.3, { fill: K.violetTint, line: K.violet, lineW: 1.5, dash: 'dash', bold: true, color: K.violet });
    L.text(s, 'vetoes candidate plans while reaching a goal image', { x: cx, y: 5.72, w: gw - 0.3, h: 0.45, fontSize: 11, italic: true, color: K.sub });
    L.text(s, [
      { text: 'Closest neighbour: ', options: { bold: true, color: K.ink } },
      { text: 'the latent safety filter ' + cite(16) + ' also acts on latent uncertainty at decision time, but to avoid failure sets. SCoPe filters goal-reaching plans and first tests the score against real error.', options: { color: K.body } },
    ], { x: MX, y: 6.36, w: CW, h: 0.5, fontSize: 13, valign: 'middle' });
    L.notes(s, {
      time: '45 s',
      say: 'This matrix places each method by two questions: does the model work from images in a learned latent space, and where, if anywhere, does model uncertainty act? Most model-based RL that uses uncertainty sits top-middle: state-based, training time. All the image-based latent planners sit bottom-left: no uncertainty at all. The bottom-right cell, image latents with a decision-time veto, holds one existing method, the latent safety filter, and our proposal. The difference from the safety filter is the purpose: it avoids failure sets with a learned reachability value; we filter candidate plans while reaching a goal image.',
      takeaway: 'SCoPe occupies a sparsely populated cell, next to one close neighbour that we acknowledge explicitly.',
      visual: 'Rows: kind of world model. Columns: when uncertainty is used. The dashed violet pill is our proposal, not a result.',
      why: 'A two-by-three matrix is easier to defend than a large feature table, because each placement depends on one checkable fact per paper.',
      careful: 'PETS is placed at decision time because its trajectory sampling propagates ensemble uncertainty inside MPC, but it never vetoes a plan. TD-MPC2 also runs from pixels in some experiments; it uses no uncertainty either way, so its cell does not change.',
      q: 'Why not compare against the latent safety filter directly?',
      a: 'It needs a learned safety value function and a definition of failure sets, which our goal-reaching tasks do not have. We borrow its conformal threshold calibration instead, and compare against controls that isolate the effect of the gate (random and oracle gates, soft penalty).',
    });
  }

  // ---------------------------------------------------------------- 12. Proposed approach and contributions
  {
    const s = add(SEC, OVER, 'SCoPe\'s one change: check whether each imagined future is trustworthy');
    const stepW = 1.36; const gap = 0.17;
    const rowSteps = (y, steps, label, accent) => {
      L.text(s, label, { x: MX, y: y - 0.36, w: 6, h: 0.3, fontSize: 12, bold: true, color: accent ? K.blueDark : K.muted, charSpacing: 1 });
      steps.forEach((st, i) => {
        const x = MX + i * (stepW + gap);
        const isNew = st[1];
        L.rect(s, { x, y, w: stepW, h: 0.62, radius: 0.08, fill: isNew ? K.violetTint : K.panel2, line: isNew ? K.violet : K.line, lineW: isNew ? 1.5 : 0.75, dash: isNew ? 'dash' : 'solid' });
        L.text(s, st[0], { x: x + 0.05, y, w: stepW - 0.1, h: 0.62, fontSize: 12, bold: isNew, color: isNew ? K.violet : K.ink, align: 'center', valign: 'middle' });
        if (i < steps.length - 1) L.arrow(s, x + stepW, y + 0.31, x + stepW + gap, y + 0.31, { color: K.faint, w: 1 });
      });
    };
    rowSteps(2.02, [['Observe', 0], ['Encode', 0], ['Sample 300 plans', 0], ['Imagine 5 steps', 0], ['Cost to goal', 0], ['Keep top 30', 0], ['Execute 5 actions', 0], ['Replan', 0]], 'DINO-WM TODAY (CEM-MPC)', false);
    rowSteps(3.17, [['Observe', 0], ['Encode', 0], ['Sample plans', 0], ['Imagine 5 steps', 0], ['Score trust u_k', 1], ['Gate: all u_k ≤ τ', 1], ['Cost on accepted', 0], ['Execute accepted', 0]], 'SCoPe (PROPOSED)', true);
    const gxs = MX + 5 * (stepW + gap) + stepW / 2;
    L.arrow(s, gxs, 3.79, gxs, 4.05, { color: K.violet, dash: 'dash' });
    L.rect(s, { x: gxs - 2.2, y: 4.05, w: 4.4, h: 0.42, radius: 0.08, fill: K.white, line: K.violet, dash: 'dash' });
    L.text(s, [{ text: 'too few pass → ', options: { color: K.violet, bold: true } }, { text: 'resample → shorter horizon → safe action → stop and flag', options: { color: K.ink } }],
      { x: gxs - 2.15, y: 4.05, w: 4.3, h: 0.42, fontSize: 11.5, align: 'center', valign: 'middle' });
    L.text(s, 'Dashed violet = new in SCoPe (planned). Imagined latents are never used as the start of the next plan; every replan starts from a real observation.',
      { x: MX, y: 4.58, w: CW, h: 0.28, fontSize: 11, italic: true, color: K.muted });
    const cs = [
      ['C1', 'Error-labelled dataset', 'Imagined vs real latents per candidate; latent error and task consequence; 4 sampling contexts', 'PLANNED', 'Phase 1'],
      ['C2', 'Trust-score calibration', '≥ 3 scores on frozen-encoder JEPA latents against real error, with random and trivial controls (H1–H3)', 'PLANNED', 'Phase 2'],
      ['C3', 'Gated planner + fallback', 'Compared with plain MPC, soft penalty, random and oracle gates on identical start/goal pairs (H4)', 'PLANNED', 'Phase 3'],
      ['C4', 'Interfaces, 8 GB recipe', 'Backbone-agnostic contracts; DINO-WM planning 3.8× faster with identical CEM decisions', 'BUILT', 'done'],
    ];
    const cw = 2.92;
    cs.forEach((c, i) => {
      const x = MX + i * (cw + 0.157); const y = 5.0;
      L.rect(s, { x, y, w: cw, h: 1.85, radius: 0.06, fill: K.white, line: c[3] === 'BUILT' ? K.aqua : K.line });
      L.text(s, [{ text: c[0] + '  ', options: { color: K.blue } }, { text: c[1], options: { color: K.ink } }], { x: x + 0.15, y: y + 0.1, w: cw - 0.3, h: 0.3, fontSize: 13.5, bold: true });
      L.text(s, c[2], { x: x + 0.15, y: y + 0.45, w: cw - 0.3, h: 0.98, fontSize: 12, color: K.body });
      L.tag(s, c[3], x + 0.15, y + 1.5);
      L.text(s, c[4], { x: x + 1.1, y: y + 1.5, w: 1.5, h: 0.22, fontSize: 10.5, color: K.muted, valign: 'middle' });
    });
    L.notes(s, {
      time: '60 s',
      say: 'Here is SCoPe in one picture. The top row is DINO-WM\'s planner today: observe, encode, sample 300 action plans, imagine each for five steps, score by distance to the goal, keep the best 30, repeat, then execute five actions and replan. SCoPe inserts two steps, in violet: score how trustworthy each imagined step is, and reject any plan that has an untrusted step. If too few plans survive, a fixed fallback ladder kicks in, ending in stop-and-flag. The four contributions below: a dataset of imagined versus real latents, a calibration test of trust scores, the gated planner evaluated against strong controls, and the infrastructure that already exists.',
      takeaway: 'SCoPe changes one decision inside an existing planner; that keeps the comparison clean.',
      visual: 'Compare the two rows column by column; only the violet boxes differ. The fallback ladder hangs off the gate.',
      why: 'Changing only the candidate filter means any difference in success can be attributed to the gate. Replanning from real observations (never from imagined latents) prevents errors compounding across plans.',
      careful: 'C1–C3 are planned. Only C4 exists. The fallback minimum ("too few") and τ will be calibrated on held-out decision points, not chosen by hand.',
      q: 'Doesn\'t rejecting candidates just make CEM worse by shrinking its sample?',
      a: 'It can, which is exactly why H4 has a random gate at the same rejection rate. If SCoPe beats the random gate, the benefit comes from which plans are rejected, not from rejecting per se. Resampling is the first fallback step to keep the elite set full.',
    });
  }
};

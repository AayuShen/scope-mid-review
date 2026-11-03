'use strict';
// Area 4: why RL, MDP formulation, objective, algorithm choice, data and simulators, protocol.
const path = require('path');
const { MX, CW } = require('./lib');

module.exports = function method(ctx) {
  const { L, K, add, cite, ASSETS } = ctx;
  const SEC = '4 · MDP, algorithm, data';
  const OVER = '4 · MDP FORMULATION, ALGORITHM, DATA AND SIMULATION';
  const rule = () => [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: K.hair }, { type: 'none' }];
  const head = (t, o = {}) => ({ text: t, options: Object.assign({ bold: true, color: K.ink, fill: { color: K.panel }, border: rule() }, o) });
  const cell = (t, o = {}) => ({ text: L.mr(t), options: Object.assign({ color: K.body, border: rule(), valign: 'top' }, o) });

  // Crop one tile of the success strip (rollout_success_seed100_ep3.png: 7 columns, 2 rows).
  const tile = (s, col, row, x, y, size) => {
    const fullW = size * 7 * (1654 / 7) / 236.3; // keep native aspect: each tile ≈ 236 × 226 px
    const scale = fullW / 1654;
    const fullH = 452 * scale;
    s.addImage({ path: path.join(ASSETS, 'rollout_success_seed100_ep3.png'), x, y, w: fullW, h: fullH,
      sizing: { type: 'crop', x: col * 236.3 * scale, y: row * 226 * scale, w: 236.3 * scale, h: 226 * scale },
      altText: `Push-T seed 100 episode 3, ${row === 0 ? 'simulator' : 'imagined'} frame ${col}` });
    return { w: 236.3 * scale, h: 226 * scale };
  };

  // ---------------------------------------------------------------- 13. Why RL and why planning
  {
    const s = add(SEC, OVER, 'Sequential decisions: we plan with a learned model, not a trained policy');
    L.chips(s, ['MEASURED', 'PUBLISHED']);
    L.text(s, 'DELAYED CONSEQUENCES IN PUSH-T', { x: MX, y: 1.68, w: 5.6, h: 0.26, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.5 });
    const frames = [[0, 'step 0', 'agent moves toward the T'], [3, 'step 15', 'contact: push rotates and slides it'], [5, 'step 25', 'judged only here'], [6, 'goal', 'pose within 20 px and 20°']];
    frames.forEach((f, i) => {
      const x = MX + i * 1.45; const y = 2.02;
      tile(s, f[0], 0, x, y, 1.3);
      L.text(s, f[1], { x, y: y + 1.3, w: 1.3, h: 0.26, fontSize: 12, bold: true, color: K.ink, align: 'center' });
      L.text(s, f[2], { x: x - 0.05, y: y + 1.55, w: 1.4, h: 0.45, fontSize: 10.5, color: K.sub, align: 'center' });
      if (i < 3) L.arrow(s, x + 1.31, y + 0.65, x + 1.44, y + 0.65, { color: K.faint, w: 1 });
    });
    L.text(s, 'Push-T seed 100, episode 3 (simulator frames from our run). Success is checked once, after the 25-step plan; no intermediate reward guides the choice of each push.',
      { x: MX, y: 4.1, w: 5.75, h: 0.5, fontSize: 11, italic: true, color: K.muted });
    L.rect(s, { x: MX, y: 4.72, w: 5.75, h: 2.1, radius: 0.06, fill: K.blueTint, line: null });
    L.text(s, [
      { text: 'Why this is RL: ', options: { bold: true, color: K.blueDark } },
      { text: 'an agent chooses actions to optimise a long-horizon objective under (learned) dynamics, and each action changes what is reachable next. ', options: { color: K.ink } },
      { text: 'Which kind: ', options: { bold: true, color: K.blueDark } },
      { text: 'model-based RL at decision time. The dynamics model is learned offline from reward-free data; the "policy" is the planner (MPC) re-solved at every step.', options: { color: K.ink } },
    ], { x: MX + 0.2, y: 4.8, w: 5.35, h: 1.95, fontSize: 14, valign: 'middle' });
    const rows = [
      [head('Approach'), head('What it needs'), head('Fit for our setting')],
      [cell('Behaviour cloning', { bold: true, color: K.ink }), cell('goal-directed demonstrations'), cell('copies demonstrations; a new goal image needs new demos')],
      [cell('Hand-written controller', { bold: true, color: K.ink }), cell('state estimation and tuned contact rules'), cell('per-task engineering; no image goals')],
      [cell('Model-free RL (PPO, SAC)', { bold: true, color: K.ink }), cell('a reward and many online interactions'), cell('our data has no reward and is offline')],
      [cell('Offline RL', { bold: true, color: K.ink }), cell('reward labels in the dataset'), cell('reward-free data; one goal per policy')],
      [cell('Planning with a learned world model (MPC)', { bold: true, color: K.blueDark, fill: { color: K.blueTint } }), cell('offline trajectories and a goal image', { fill: { color: K.blueTint } }), cell('reward-free, zero-shot to new goals, replans from feedback: DINO-WM Push-T 0.90 ' + cite(1), { fill: { color: K.blueTint }, color: K.ink })],
    ];
    s.addTable(rows, { x: 6.65, y: 1.68, w: 6.083, colW: [1.95, 1.85, 2.283], fontFace: 'Calibri', fontSize: 12, rowH: [0.36, 0.72, 0.72, 0.72, 0.72, 0.95], margin: [0.06, 0.08, 0.06, 0.08] });
    L.text(s, 'The planning approach is the one DINO-WM and V-JEPA 2-AC use ' + cite(1, 2) + '; SCoPe changes how candidate plans are filtered, not the learning paradigm.',
      { x: 6.65, y: 6.05, w: 6.083, h: 0.75, fontSize: 12.5, color: K.sub, italic: true });
    L.notes(s, {
      time: '60 s',
      say: 'Is this really reinforcement learning? Look at Push-T. The agent pushes from the side, the block rotates some steps later, and success is only checked at the end of the plan, when the T must sit within 20 pixels and 20 degrees of the goal. A one-step greedy choice cannot know which push sets up the right final pose; you have to reason over the sequence. That is the RL problem. Among RL families, ours is model-based: a dynamics model learned offline, used at decision time by a planner that is re-solved at every step. The table shows why the alternatives do not fit: no demonstrations for a new goal, no reward, no online budget.',
      takeaway: 'We are doing model-based RL at decision time (planning with a learned model), which is the paradigm the JEPA world-model papers use; our change is inside the planner.',
      visual: 'Left: four real frames from one of our episodes, from start to goal. Right: alternatives with what they need; the blue row is our choice.',
      why: 'The data we have (offline, reward-free, random or noisy trajectories) and the task specification (a goal image) rule out reward-based and demonstration-based methods.',
      careful: 'The frames are from our measured run (seed 100, episode 3, a success). The 0.90 is DINO-WM\'s published MPC number. "Policy" for an MPC planner means the mapping from observation and goal to the executed actions.',
      q: 'Why not supervised learning: predict the next frame and pick the best action?',
      a: 'That is half of what we do: the world model is trained by supervised next-latent prediction. But choosing actions requires searching over sequences of actions against a long-horizon objective, because the effect of a push shows up later. The search is the RL part.',
    });
  }

  // ---------------------------------------------------------------- 14. MDP formulation
  {
    const s = add(SEC, OVER, 'A goal-conditioned POMDP, planned as an MDP in latent space');
    L.chips(s, ['MEASURED']);
    L.rect(s, { x: MX, y: 1.68, w: 4.55, h: 5.17, radius: 0.06, fill: K.panel2, line: K.hair });
    L.text(s, [
      { text: 'Real system (partially observed)', options: { bold: true, color: K.ink, breakLine: true } },
      { text: 'state s: agent x, y; block x, y, θ; velocities', options: { breakLine: true } },
      { text: 'observation o = 224×224 RGB image + proprio', options: { breakLine: true } },
      { text: 's′ ~ P(s′ | s, a): pymunk physics, unknown to us', options: { breakLine: true } },
      { text: ' ', options: { fontSize: 8, breakLine: true } },
      { text: 'Latent MDP used for planning', options: { bold: true, color: K.ink, breakLine: true } },
      { text: 'M = (Z, A, f_θ, c_g, γ = 1, H = 5)', options: { fontFace: 'Cambria Math', color: K.blueDark, breakLine: true } },
      { text: 'z = enc(o): 196 patch tokens × 384 dims', options: { breakLine: true } },
      { text: 'ẑ_{k+1} = f_θ(z_{k−2..k}, a_k): ViT predictor, 3-frame history', options: { breakLine: true } },
      { text: 'a_k: 2-D action × 5 sim steps = 10-D chunk', options: { breakLine: true } },
      { text: 'c_g: terminal latent distance to goal (next slide)', options: { breakLine: true } },
      { text: ' ', options: { fontSize: 8, breakLine: true } },
      { text: 'Policy and return', options: { bold: true, color: K.ink, breakLine: true } },
      { text: 'π(o_t, g): first 5 chunks of argmin over CEM plans of c_g, then replan (MPC)', options: { breakLine: true } },
      { text: 'Return = −c_g of the final imagined step; γ = 1 on a 5-step horizon', options: {} },
    ], { x: MX + 0.2, y: 1.8, w: 4.2, h: 4.95, fontSize: 12.5, color: K.body, lineSpacingMultiple: 1.0 });
    const rows = [
      [head('Element'), head('Project-specific definition'), head('Push-T example')],
      [cell('State / observation', { bold: true, color: K.ink }), cell('Image + proprio (agent position); latent z from the frozen DINOv2 ViT-S/14 encoder ' + cite(3)), cell('T pose and agent visible in a 224×224 frame')],
      [cell('Action', { bold: true, color: K.ink }), cell('2-D relative target for the agent, tracked by a PD controller; planned in 10-D chunks (frameskip 5), normalised'), cell('push up-left by a few pixels per step')],
      [cell('Reward / cost', { bold: true, color: K.ink }), cell('No environment reward during planning; cost = latent distance of the last imagined step to the goal'), cell('goal = dataset state 25 steps ahead')],
      [cell('Transition', { bold: true, color: K.ink }), cell('Real: 2-D physics with contacts and friction. Imagined: ViT predictor (6 layers, 16 heads)'), cell('T rotates when pushed off-centre')],
      [cell('Episode', { bold: true, color: K.ink }), cell('One start/goal pair; MPC rounds of 25 sim steps, at most 3 rounds in our runs'), cell('≤ 75 sim steps')],
      [cell('Termination', { bold: true, color: K.ink }), cell('Success: ‖Δ(agent, block position)‖ < 20 and |Δθ| < π/9, checked after each round; else stop at the round cap'), cell('Wall: Δpos < 4.5; PointMaze: < 0.5')],
      [cell('Initial states', { bold: true, color: K.ink }), cell('50 start/goal pairs per seed from the validation split (Push-T) or sampled states (Wall, PointMaze)'), cell('seeds 99, 100, 101')],
    ];
    s.addTable(rows, { x: 5.35, y: 1.68, w: 7.383, colW: [1.6, 3.9, 1.883], fontFace: 'Calibri', fontSize: 12, rowH: [0.36, 0.66, 0.66, 0.62, 0.62, 0.56, 0.78, 0.62], margin: [0.05, 0.08, 0.05, 0.08] });
    L.text(s, 'Values read from the DINO-WM code and configs we run (commit 0a9492f): plan_pusht.yaml, pusht_wrapper.eval_state.',
      { x: 5.35, y: 6.58, w: 7.383, h: 0.26, fontSize: 10.5, italic: true, color: K.muted });
    L.notes(s, {
      time: '75 s',
      say: 'Formally the real task is a goal-conditioned POMDP: the true state, the T\'s pose and the agent\'s position and velocities, is only seen through a camera image. The planner works in a latent MDP instead: the frozen DINOv2 encoder turns each image into 196 patch tokens of 384 numbers, and the learned predictor maps the last three latents and an action chunk to the next latent. The cost is the latent distance of the final imagined step to the goal image\'s latent, with no discount over the short 5-step horizon. The policy is MPC: run CEM, execute the first five chunks, observe, replan. The table maps each MDP element to what the code actually does.',
      takeaway: 'Every element of the MDP is pinned to the code we run, not to a generic template.',
      visual: 'Left panel: the maths. Right table: element, our definition, and a Push-T example; the last column notes Wall and PointMaze where they differ.',
      why: 'Treating the latent dynamics as an MDP is an assumption: with a 3-frame history the latent is approximately Markov, but not exactly. That approximation error is part of what a trust score should catch.',
      careful: 'The action is a relative target position for the agent (scaled by 100 in the simulator), applied for 5 simulator steps per chunk. Success uses the 4 position coordinates jointly (L2 < 20) plus the angle. The simulator\'s own Push-T coverage reward exists but is not used by DINO-WM or by us.',
      q: 'Why is γ = 1 acceptable?',
      a: 'The horizon is only 5 planning steps and the cost is terminal (only the last imagined step counts), so discounting would change nothing. Long-horizon behaviour comes from replanning (MPC), not from a discounted infinite-horizon return.',
    });
  }

  // ---------------------------------------------------------------- 15. Objective / reward design
  {
    const s = add(SEC, OVER, 'Objective: a latent goal-distance cost, plus a trust constraint');
    L.chips(s, ['MEASURED', 'PROPOSED']);
    L.rect(s, { x: MX, y: 1.68, w: CW, h: 1.12, radius: 0.06, fill: K.panel2, line: K.hair });
    L.text(s, [
      { text: 'minimise over a_t … a_{t+4}:    c_g = MSE_{visual}(ẑ_{t+5}, z_g) + α · MSE_{proprio}(ẑ_{t+5}, z_g)', options: { breakLine: true } },
      { text: 'subject to (SCoPe):    u_k ≤ τ for every imagined step k = 1 … 5;   too few candidates pass → fallback ladder', options: { color: K.violet } },
    ], { x: MX + 0.25, y: 1.72, w: CW - 0.5, h: 1.04, fontSize: 18, fontFace: 'Cambria Math', color: K.ink, valign: 'middle', lineSpacingMultiple: 1.2 });
    const comps = [
      ['Visual term', 'BUILT', 'Mean squared distance between predicted and goal DINOv2 patch tokens (N = 196 × 384).',
        'The goal is given as an image; no reward model is needed.', 'Pulls the imagined scene toward the goal scene.', 'Feature units, no physical unit.',
        'Latent distance may not equal task distance ' + cite(20) + '; the planner can exploit predictor errors (slide 3).'],
      ['Proprio term (α)', 'BUILT', 'Squared distance between predicted and goal proprio embeddings (agent position).',
        'Disambiguates where the agent is.', 'Pulls the agent toward its goal position.', 'α = 1 for Push-T and Wall, 0 for PointMaze: upstream values, not tuned by us.',
        'May favour the agent\'s position over the block\'s pose.'],
      ['Trust constraint', 'PLANNED', 'Every imagined step must have u_k ≤ τ, where u_k is the trust score (higher = less trusted).',
        'Do not optimise over predictions the model cannot vouch for.', 'Removes candidates; fallback if too few remain.', 'τ = a quantile of u on held-out decision points, never on test episodes.',
        'Over-rejection (H2) or false confidence (H3).'],
    ];
    const cw = 3.92;
    comps.forEach((c, i) => {
      const x = MX + i * (cw + 0.187); const y = 3.0;
      const planned = c[1] === 'PLANNED';
      L.rect(s, { x, y, w: cw, h: 3.18, radius: 0.06, fill: K.white, line: planned ? K.violet : K.line, dash: planned ? 'dash' : 'solid', lineW: planned ? 1.25 : 0.75 });
      L.text(s, c[0], { x: x + 0.18, y: y + 0.12, w: 2.4, h: 0.32, fontSize: 15, bold: true, color: K.ink });
      L.tag(s, c[1], x + cw - 1.0, y + 0.16, { w: 0.82 });
      const lines = [['Meaning', c[2]], ['Why', c[3]], ['Effect', c[4]], ['Scale', c[5]], ['Risk', c[6]]];
      L.text(s, lines.flatMap((l, j) => [
        { text: l[0] + '  ', options: { bold: true, color: K.muted } },
        { text: l[1], options: { color: K.body, breakLine: j < lines.length - 1 } },
      ]), { x: x + 0.18, y: y + 0.5, w: cw - 0.36, h: 2.62, fontSize: 11.5, paraSpaceAfter: 3 });
    });
    L.rect(s, { x: MX, y: 6.3, w: CW, h: 0.55, radius: 0.08, fill: K.redTint, line: null });
    L.text(s, [{ text: 'Reward hacking here = model exploitation: ', options: { bold: true, color: K.redDark } },
      { text: 'CEM finds actions whose imagined latent matches the goal while the real one does not. Validation is always the simulator\'s success test, never the cost.', options: { color: K.ink } }],
    { x: MX + 0.2, y: 6.3, w: CW - 0.4, h: 0.55, fontSize: 13.5, valign: 'middle' });
    L.notes(s, {
      time: '60 s',
      say: 'There is no hand-designed reward in this project. The planner minimises the distance between the final imagined latent and the goal image\'s latent, plus a small term for the agent\'s own position. SCoPe does not change this cost. It adds a constraint: every imagined step must pass the trust threshold, otherwise the candidate is not eligible. Each card explains a term: what it means, why it is there, its scale, and how it can go wrong. The red box is the important part: in this setting, reward hacking means the planner exploiting errors in the world model, exactly what slide 3 showed. So we never judge success by the cost; we always use the simulator\'s success test.',
      takeaway: 'The objective is inherited and transparent; SCoPe\'s change is a constraint on which imagined futures may be optimised over.',
      visual: 'Top: the optimisation problem, with the SCoPe constraint in violet. Cards: the two existing cost terms and the new constraint.',
      why: 'Keeping DINO-WM\'s cost unchanged means our results remain comparable to the published numbers and any change in success comes from the constraint.',
      careful: 'α values are upstream defaults (Push-T 1, Wall 1, PointMaze 0); we did not tune them. Cost uses only the last predicted step ("mode: last" in the config). τ and the minimum number of accepted candidates are not chosen yet; they will be calibrated on held-out data.',
      q: 'How will you choose τ without tuning on the test set?',
      a: 'τ is a quantile of the trust score measured on held-out decision points from separate seeds, chosen to hit a target rejection rate or a target false-acceptance rate. The test start/goal pairs are never used. We report results for several τ values as a trade-off curve.',
    });
  }

  // ---------------------------------------------------------------- 16. Algorithm selection
  {
    const s = add(SEC, OVER, 'Algorithm: CEM-based MPC, chosen over gradient planning and policies');
    L.chips(s, ['PUBLISHED']);
    const rows = [
      [head('Criterion'), head('CEM-MPC (chosen)', { color: K.blueDark, fill: { color: K.blueTint } }), head('Gradient-descent planning'), head('Policy learning (PPO, SAC; Dreamer)')],
      [cell('What is optimised', { bold: true, color: K.ink }), cell('300 sampled action sequences; refit mean and std to the top 30 each iteration', { fill: { color: K.blueTint } }), cell('one action sequence by backprop through the predictor'), cell('policy network weights from reward')],
      [cell('Learning type', { bold: true, color: K.ink }), cell('none at test time: zero-shot planning on an offline-trained model', { fill: { color: K.blueTint } }), cell('none at test time'), cell('on-policy (PPO), off-policy (SAC), in imagination (Dreamer)')],
      [cell('Actions', { bold: true, color: K.ink }), cell('continuous, 5 × 10-D chunks', { fill: { color: K.blueTint } }), cell('continuous'), cell('continuous (PPO also discrete)')],
      [cell('Needs', { bold: true, color: K.ink }), cell('a goal image only', { fill: { color: K.blueTint } }), cell('a goal image; differentiable model'), cell('a reward and many environment steps')],
      [cell('Push-T, published ' + cite(1), { bold: true, color: K.ink }), cell('0.86 single plan; 0.90 with replanning', { fill: { color: K.blueTint }, bold: true, color: K.ink }), cell('0.28'), cell('not comparable: needs reward')],
      [cell('Fit for a trust gate', { bold: true, color: K.ink }), cell('explicit candidate set: reject before choosing elites', { fill: { color: K.blueTint } }), cell('one trajectory, nothing to reject'), cell('a gate would need a model anyway')],
      [cell('Main limitation', { bold: true, color: K.ink }), cell('decision-time compute (≈ 3.4 min per plan on our GPU); exploits model error', { fill: { color: K.blueTint } }), cell('local minima; adversarial action gradients'), cell('reward design; retraining per goal')],
    ];
    s.addTable(rows, { x: MX, y: 1.68, w: CW, colW: [2.1, 3.6, 3.0, 3.433], fontFace: 'Calibri', fontSize: 12.5, rowH: [0.38, 0.62, 0.62, 0.42, 0.42, 0.45, 0.55, 0.62], margin: [0.05, 0.1, 0.05, 0.1] });
    L.rect(s, { x: MX, y: 6.0, w: CW, h: 0.85, radius: 0.06, fill: K.panel2, line: K.hair });
    L.text(s, [
      { text: 'Decision: ', options: { bold: true, color: K.ink } },
      { text: 'keep DINO-WM\'s CEM-MPC (horizon 5, 300 samples, top 30, 30 iterations on Push-T) so our baseline equals the published one. MPPI, used by TD-MPC2 ' + cite(13) + ', is a weighted variant of the same sampling idea; the gate would apply unchanged. The algorithm is not our hypothesis, so no selection experiment is needed.', options: { color: K.body } },
    ], { x: MX + 0.2, y: 6.0, w: CW - 0.4, h: 0.85, fontSize: 13, valign: 'middle' });
    L.notes(s, {
      time: '60 s',
      say: 'We compared the planner with two realistic alternatives. Gradient planning backpropagates through the world model; DINO-WM reports it reaches only 0.28 on Push-T against 0.86 to 0.90 for CEM. Policy learning, PPO, SAC or Dreamer-style, needs a reward we do not have and retraining per goal. CEM also has a property that matters for us: it keeps an explicit set of candidate plans, so a trust gate can simply remove the untrusted ones before the elites are chosen. Its drawbacks are compute at decision time and, again, that it exploits model error.',
      takeaway: 'CEM-MPC is chosen because it matches the published baseline, needs only a goal image, and gives the gate an explicit set of candidates to filter.',
      visual: 'Columns are the options; the blue column is ours. The published row comes from DINO-WM\'s own planner comparison on Push-T.',
      why: 'Keeping the upstream planner and settings means our baseline is DINO-WM itself, and Phase 0 shows we reproduce it.',
      careful: '0.86 (CEM, single plan) and 0.28 (gradient descent) are from DINO-WM\'s planner comparison table; 0.90 is its MPC result. "≈ 3.4 min per plan" is our measurement: about 6.8 s per 300-candidate CEM iteration for one episode × 30 iterations on the RTX 5060. CEM is on- vs off-policy agnostic: it learns nothing at test time.',
      q: 'Is CEM not just random search? Why is that RL?',
      a: 'CEM is a sampling-based optimiser: it iteratively refits a Gaussian over action sequences to the best samples. Used inside MPC with a learned dynamics model, it is the standard decision-time planner in model-based RL (PETS, PlaNet, DINO-WM). The learning is in the world model; the planning is how the agent acts.',
    });
  }

  // ---------------------------------------------------------------- 17. Data and simulators
  {
    const s = add(SEC, OVER, 'Data and simulation: three simulated tasks, reward-free offline data');
    L.chips(s, ['MEASURED', 'PUBLISHED']);
    const rows = [
      [head('Task'), head('Simulator'), head('Offline data (published size)'), head('Start / goal for evaluation'), head('Success test'), head('Status here')],
      [cell('Push-T', { bold: true, color: K.ink }), cell('pymunk 2-D physics; task from Diffusion Policy ' + cite(24)), cell('18.5k samples of noisy pushing trajectories ' + cite(1)), cell('validation-trajectory state 25 steps ahead'), cell('Δpos < 20 and |Δθ| < π/9'), cell('full runs, 3 seeds', { bold: true, color: K.aquaDark })],
      [cell('Wall', { bold: true, color: K.ink }), cell('custom 2-D room with a door ' + cite(1)), cell('1,920 trajectories × 50 steps'), cell('random reachable states, seeded'), cell('Δpos < 4.5'), cell('2+ seeds, 3 rounds', { bold: true, color: K.aquaDark })],
      [cell('PointMaze', { bold: true, color: K.ink }), cell('MuJoCo 2.1 via mujoco-py (D4RL maze ' + cite(25) + ')'), cell('2,000 random trajectories'), cell('random reachable states, seeded'), cell('Δpos < 0.5'), cell('full run, 1 seed', { bold: true, color: K.aquaDark })],
    ];
    s.addTable(rows, { x: MX, y: 1.68, w: CW, colW: [1.25, 2.55, 2.35, 2.35, 1.75, 1.883], fontFace: 'Calibri', fontSize: 12.5, rowH: [0.38, 0.66, 0.5, 0.58], margin: [0.05, 0.08, 0.05, 0.08] });
    const panels = [
      ['Source and licence', 'DINO-WM code (MIT licence) pinned at commit 0a9492f; datasets and checkpoints from the authors\' OSF project ' + cite(26) + '. Archives are size-capped and SHA-256-checked before unpacking; the data licence is not stated on OSF.'],
      ['Processing and state', 'Frames resized to 224 × 224 and normalised as upstream; actions and proprio normalised with dataset statistics; latent state = frozen DINOv2 patch tokens + proprio embedding, 3-frame history.'],
      ['Splits and leakage', 'Upstream 90 / 10 train / validation split (seeded). The world model was trained on the train split; evaluation pairs come from validation trajectories or freshly sampled states.'],
      ['What this data is not', 'Simulated, synthetic play data. No result here implies real-robot performance; real-world transfer is out of scope and would need V-JEPA 2-AC-style real data.'],
    ];
    const pw = 2.93;
    panels.forEach((p, i) => {
      const x = MX + i * (pw + 0.137); const y = 3.95;
      L.rect(s, { x, y, w: pw, h: 2.88, radius: 0.06, fill: i === 3 ? K.redTint : K.panel2, line: i === 3 ? K.red : K.hair });
      L.text(s, p[0], { x: x + 0.16, y: y + 0.12, w: pw - 0.32, h: 0.3, fontSize: 14, bold: true, color: i === 3 ? K.redDark : K.ink });
      L.text(s, p[1], { x: x + 0.16, y: y + 0.5, w: pw - 0.32, h: 2.3, fontSize: 12, color: K.body });
    });
    L.notes(s, {
      time: '60 s',
      say: 'All data comes from DINO-WM\'s public release, and all three tasks are simulated. Push-T is a 2-D physics pushing task; Wall is a 2-D room with a door; PointMaze is a MuJoCo maze. The offline datasets contain no reward, only observations and actions. For evaluation, start and goal pairs come from validation trajectories or freshly sampled states, never from the data the world model was trained on. The last box is a deliberate caveat: none of this says anything about real robots.',
      takeaway: 'Data provenance, processing, splits and limits are explicit; the evaluation cannot leak training trajectories.',
      visual: 'Table: one row per task. Panels: source and licence, processing, splits, and what the data is not (red).',
      why: 'We use the authors\' exact data, checkpoints and evaluation protocol so that differences can only come from our changes or from hardware and library versions.',
      careful: 'Dataset sizes are as published by DINO-WM. For Wall we keep only the 192 validation episodes locally (the archive unpacks to 55 GB); we regenerate upstream\'s seeded split to select them. PointMaze unpacked to 29 GB. The OSF page does not state a data licence; the code is MIT.',
      q: 'Is the simulator realistic enough for your claims?',
      a: 'For the claims we make, yes: we only claim things about planning with this world model in these simulators. Push-T has real contact physics but is 2-D. We do not claim real-world validity; moving to V-JEPA 2-AC with real robot video is the path to that and is a stretch goal.',
    });
  }

  // ---------------------------------------------------------------- 18. Training and evaluation methodology
  {
    const s = add(SEC, OVER, 'Protocol: what is trained, optimised and evaluated, without leakage');
    const loop = [
      ['Initialise', 'seed s; 50 start/goal pairs'],
      ['Observe', 'image + proprio; encode'],
      ['Plan', 'CEM in the latent model (30 iterations)'],
      ['Act', 'execute 5 action chunks'],
      ['Next observation', 'no reward is returned'],
      ['Evaluate', 'simulator success test, evaluator only'],
      ['Replan or stop', 'until success or round cap (3)'],
      ['Aggregate', 'success per round, per seed'],
    ];
    const bw = 1.4; const gap = 0.133; const y0 = 1.95;
    L.text(s, 'EVALUATION LOOP (EVERY METHOD, IDENTICAL SETTINGS)', { x: MX, y: 1.66, w: 8, h: 0.26, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.2 });
    loop.forEach((l, i) => {
      const x = MX + i * (bw + gap);
      const key = i === 2;
      L.rect(s, { x, y: y0, w: bw, h: 1.0, radius: 0.08, fill: key ? K.blueTint : K.panel2, line: key ? K.blue : K.line });
      L.text(s, [{ text: l[0], options: { bold: true, color: K.ink, breakLine: true } }, { text: l[1], options: { color: K.sub, fontSize: 10.5 } }],
        { x: x + 0.07, y: y0 + 0.06, w: bw - 0.14, h: 0.9, fontSize: 12.5, align: 'center', valign: 'middle' });
      if (i < loop.length - 1) L.arrow(s, x + bw, y0 + 0.5, x + bw + gap, y0 + 0.5, { color: K.faint, w: 1 });
    });
    // replan loop-back from "Replan or stop" to "Observe"
    const xr = MX + 6 * (bw + gap) + bw / 2; const xo = MX + 1 * (bw + gap) + bw / 2;
    L.path(s, [[xr, y0 + 1.0], [xr, y0 + 1.25], [xo, y0 + 1.25], [xo, y0 + 1.0]], { color: K.blue, w: 1.25 });
    L.label(s, 'not solved: replan from the real observation', (xo + xr) / 2 - 2.0, y0 + 1.13, 4.0, { text: { color: K.blueDark, fontSize: 10.5 } });
    const cols = [
      ['TRAINED (offline, before planning)', [
        ['World model', 'by the DINO-WM authors; we reuse it frozen'],
        ['Trust scorers', 'Phase 2: ensemble heads on cached encoder features, kNN index; MC-dropout and self-consistency need no training'],
      ]],
      ['OPTIMISED (at decision time)', [
        ['Action sequences', 'CEM refits a Gaussian over 300 candidates per iteration; no weights change'],
        ['Stopping', '30 CEM iterations (early stop only if every episode already succeeds); at most 3 MPC rounds'],
      ]],
      ['EVALUATED', [
        ['Phase 0', 'success per round vs published (done for Push-T)'],
        ['Phases 2–3', 'H1–H3 offline on logged decision points; H4 in the closed loop'],
      ]],
    ];
    const cw = 3.92;
    cols.forEach((c, i) => {
      const x = MX + i * (cw + 0.187); const y = 3.55;
      L.text(s, c[0], { x, y, w: cw, h: 0.26, fontSize: 11, bold: true, color: K.muted, charSpacing: 1.2 });
      L.text(s, c[1].flatMap((r, j) => [
        { text: r[0] + ': ', options: { bold: true, color: K.ink } },
        { text: r[1], options: { color: K.body, breakLine: j < c[1].length - 1 } },
      ]), { x, y: y + 0.32, w: cw, h: 1.5, fontSize: 12.5, paraSpaceAfter: 6 });
    });
    L.rect(s, { x: MX, y: 5.45, w: CW, h: 1.4, radius: 0.06, fill: K.white, line: K.ink, lineW: 1 });
    L.text(s, 'LEAKAGE CONTROLS', { x: MX + 0.2, y: 5.53, w: 4, h: 0.26, fontSize: 11, bold: true, color: K.ink, charSpacing: 1.2 });
    L.text(s, [
      { text: 'Evaluation pairs never come from the world model\'s training split.', options: { bullet: { indent: 14 }, breakLine: true } },
      { text: 'τ, λ and scorer parameters are fit on decision points from separate calibration seeds; test episodes are never used for tuning.', options: { bullet: { indent: 14 }, breakLine: true } },
      { text: 'Every method sees the same seeds, start/goal pairs and CEM budget; the success flag reaches only the evaluator and upstream\'s stop rule, applied to all methods alike.', options: { bullet: { indent: 14 } } },
    ], { x: MX + 0.2, y: 5.82, w: CW - 0.4, h: 1.0, fontSize: 12.5, color: K.body, paraSpaceAfter: 2 });
    L.notes(s, {
      time: '75 s',
      say: 'This is the protocol, adapted from the usual RL training loop to what we actually do. There is no policy optimisation loop here. Each evaluation run initialises a seed and 50 start/goal pairs, observes, plans with CEM inside the model, executes five chunks, and gets a new observation but no reward. The evaluator checks success; unsolved episodes replan from the real observation, up to three rounds. What is trained? Only the world model, by its authors, and later our trust scorers. What is optimised at decision time? Action sequences. What is evaluated? Success per round now, and the four hypotheses later. The bottom box lists how we prevent leakage.',
      takeaway: 'Training, decision-time optimisation and evaluation are separate, and the thresholds that make the gate work are never tuned on test episodes.',
      visual: 'Top: the evaluation loop with the replan arrow in blue. Middle: trained / optimised / evaluated. Bottom: leakage controls.',
      why: 'The brief\'s generic loop (observation, policy, reward, update) does not match a planner; showing our real loop avoids implying that we train a policy online.',
      careful: 'Upstream MPC uses the simulator\'s success flag to stop replanning episodes that are already solved; we keep that rule for every method so comparisons stay fair, but it is a privileged signal and we say so. Our round cap of 3 is our choice: the paper does not state its replanning budget.',
      q: 'If training does not converge, what happens?',
      a: 'There is no RL training loop to diverge: the world model is fixed. The trainable pieces are small (ensemble heads, kNN index). If they fit poorly, H1 will show weak calibration, which is itself the result; the planner still works without the gate.',
    });
  }
};

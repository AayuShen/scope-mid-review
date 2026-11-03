"""Extract the measured Phase 0 numbers used by the mid-review deck from the run logs.

Every value plotted in the deck comes from this file's output (data/phase0_metrics.json),
so each chart can be traced back to a log line. Standard library only.

  python3 docs/mid_review/src/extract_metrics.py
"""

import json
import re
import statistics
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RUNS = REPO / "outputs" / "runs" / "phase0"
OUT = Path(__file__).resolve().parents[1] / "data" / "phase0_metrics.json"

LOGS = {
    "pusht": {99: "pusht/full_20261010_005356.log",
              100: "pusht/seed100_20261010_053933.log",
              101: "pusht/seed101_20261010_090821.log"},
    "wall": {99: "wall/full_wall_20261010_135226.log",
             100: "wall/wall_seed100_*.log",
             101: "wall/wall_seed101_*.log"},
    "point_maze": {99: "point_maze/point_maze_20261103_*.log"},  # first full run (50 episodes)
}


def resolve(rel):
    """A log path, or the newest match of a glob pattern; None if nothing matches yet."""
    if "*" not in rel:
        return RUNS / rel if (RUNS / rel).exists() else None
    matches = sorted(RUNS.glob(rel))
    return matches[-1] if matches else None

SUCCESS = re.compile(r"self\.is_success:\s*\[([^\]]*)\]")
RATE = re.compile(r"^Success rate:\s*([0-9.]+)", re.M)
DIST = re.compile(r"'state_dist': array\(\[([^\]]*)\]")
STEP = re.compile(r"\[scope\] CEM step (\d+)/(\d+): (\d+) s")


EVAL = re.compile(r"MPC iter (\d+) Eval -+\s*\nSuccess rate:\s*([0-9.]+)")


def per_round(text):
    rounds = []
    for m in SUCCESS.finditer(text):
        flags = [t == "True" for t in m.group(1).split()]
        rounds.append({"solved": sum(flags), "episodes": len(flags), "rate": sum(flags) / len(flags)})
    # The per-episode flags of a round print only when the next one starts, so a run cut off after
    # its last evaluation has one more round in its "MPC iter k Eval" lines.
    evals = EVAL.findall(text)
    if rounds and len(evals) == len(rounds) + 1:
        n = rounds[-1]["episodes"]; rate = float(evals[-1][1])
        rounds.append({"solved": round(rate * n), "episodes": n, "rate": rate})
    return rounds


def round1_cem_curve(text):
    """Success rate and mean final state distance of CEM's current mean plan after each
    iteration of round 1 (all 50 episodes planned; nothing skipped yet)."""
    end = text.find("MPC iter 0 Eval")
    block = text[:end] if end > 0 else text
    rates = [float(x) for x in RATE.findall(block)]
    dists = [statistics.mean(float(v) for v in d.replace("\n", " ").split(",") if v.strip())
             for d in DIST.findall(block)]
    secs = [int(m.group(3)) for m in STEP.finditer(block)]
    n = min(len(rates), len(dists))
    return [{"iteration": i + 1, "success_rate": rates[i], "mean_state_dist": round(dists[i], 2),
             "seconds": secs[i] if i < len(secs) else None} for i in range(n)]


def main():
    out = {"source": "outputs/runs/phase0/*/ logs, parsed by docs/mid_review/src/extract_metrics.py",
           "status": "Measured", "envs": {}}
    for env, seeds in LOGS.items():
        out["envs"][env] = {}
        for seed, rel in seeds.items():
            path = resolve(rel)
            if path is None:
                continue
            text = path.read_text(errors="replace")
            if not per_round(text):  # run started but no MPC round finished yet
                continue
            out["envs"][env][str(seed)] = {
                "log": str(path.relative_to(RUNS)),
                "rounds": per_round(text),
                "round1_cem": round1_cem_curve(text),
                "finished": "[phase0] finished with exit code 0" in text,
            }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1))
    for env, seeds in out["envs"].items():
        for seed, r in seeds.items():
            rr = ", ".join(f"{x['solved']}/{x['episodes']}" for x in r["rounds"])
            c = r["round1_cem"]
            print(f"{env} seed {seed}: rounds [{rr}] | round-1 CEM points {len(c)}"
                  f" | first {c[0] if c else None} | last {c[-1] if c else None}")


if __name__ == "__main__":
    main()

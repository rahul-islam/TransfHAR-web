import type { MeanSd, Paper } from "../data/types";

interface Entry {
  name: string;
  note: string;
  values: number[]; // Everyday tasks, Gestures, Latte steps
  ours?: boolean;
}

// Full-split balanced accuracy on the three held-out benchmarks, all taken from paper.json.
function entries(p: Paper): Entry[] {
  const s = p.fewshot.series;
  const [scratch, finetune, frozen] = p.regimes.rows; // columns: SAMoSA, PrISM latte, UTD-MHAD
  const reorder = (v: MeanSd[]) => [v[0][0], v[2][0], v[1][0]];
  const full = (k: keyof typeof s) => s[k].threeAxis.Full?.[0] ?? NaN;
  return [
    { name: "TransfHAR", note: "frozen encoder + linear probe", values: reorder(frozen.values), ours: true },
    { name: "TransfHAR, fine-tuned", note: "same model, all weights trained", values: reorder(finetune.values) },
    { name: "Supervised baseline", note: "task-specific, 9-axis on two tasks", values: [s.samosa.baseline, s.utd.baseline, s.prism.baseline] },
    { name: "TransfHAR, accelerometer only", note: "3-axis", values: [full("samosa"), full("utd"), full("prism")] },
    { name: "Same model, no pretraining", note: "trained from scratch", values: reorder(scratch.values) },
  ];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const SCALE = 60;

export function Leaderboard({ paper }: { paper: Paper }) {
  const rows = entries(paper)
    .map((e) => ({ ...e, avg: mean(e.values) }))
    .sort((a, b) => b.avg - a.avg);
  return (
    <div className="sec" id="leaderboard">
      <h2 className="h2">Leaderboard</h2>
      <p className="sub">
        Balanced accuracy on activities the model never saw during pretraining, full training split. Every row except
        the baseline uses the same encoder architecture.
      </p>
      <div className="lb">
        <div className="lrow head">
          <span>#</span>
          <span>Model</span>
          <span className="num hide">Everyday tasks</span>
          <span className="num hide">Gestures</span>
          <span className="num hide">Latte steps</span>
          <span className="num">Average</span>
        </div>
        {rows.map((r, i) => (
          <div className={`lrow ${r.ours ? "ours" : ""}`} key={r.name}>
            <span className="rank">{i + 1}</span>
            <span>
              {r.name}
              <span className="tag">{r.note}</span>
            </span>
            {r.values.map((v, j) => (
              <span className="num hide" key={j}>{v.toFixed(1)}</span>
            ))}
            <span className="avg">
              <span className="abar hide">
                <span className={`afill ${r.ours ? "ours" : ""}`} style={{ width: `${(r.avg / SCALE) * 100}%` }} />
              </span>
              <span className="num">{r.avg.toFixed(1)}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="fine" style={{ marginTop: 16 }}>
        Everyday tasks = SAMoSA (27 classes), Gestures = UTD-MHAD (21), Latte steps = PrISM-Tracker latte-making (19).
        Mean of five seeds.
      </p>
    </div>
  );
}

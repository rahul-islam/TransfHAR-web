import type { Paper } from "../data/types";

const BENCHMARKS = [
  ["samosa", "Everyday tasks"],
  ["utd", "Gestures"],
  ["prism", "Latte steps"],
] as const;

const SCALE = 80; // benchmark bars share a 0–80% axis so their gaps are comparable

export function Results({ paper }: { paper: Paper }) {
  const series = paper.fewshot.series;
  const study = paper.userStudy.fewshot;
  const fiveShot = study.sixAxis["5"]?.[0];
  return (
    <div className="sec">
      <h2 className="h2">Better than fully supervised, with fewer sensors</h2>
      <p className="sub">
        On three benchmarks it never saw during training, TransfHAR beats each dataset's published supervised system.
        Those use 9-axis input on two of the three; TransfHAR uses 6. In a study where 10 people picked their own
        activities, five examples per activity were enough for {fiveShot}% accuracy.
      </p>
      <div className="charts">
        <div className="chart">
          <div className="ctitle">Unseen benchmarks</div>
          <div className="fine">Balanced accuracy, %</div>
          <div className="bars">
            {BENCHMARKS.map(([id, label]) => {
              const base = series[id].baseline;
              const ours = series[id].sixAxis.Full?.[0] ?? 0;
              return (
                <div className="grp" key={id}>
                  <div className="pair">
                    <div className="bcol">
                      <div className="bnum dim">{base.toFixed(1)}</div>
                      <div className="bar b0" style={{ height: `${(base / SCALE) * 100}%` }} />
                    </div>
                    <div className="bcol">
                      <div className="bnum">{ours.toFixed(1)}</div>
                      <div className="bar b1" style={{ height: `${(ours / SCALE) * 100}%` }} />
                    </div>
                  </div>
                  <div className="glabel">{label}</div>
                </div>
              );
            })}
          </div>
          <div className="legend">
            <span><i className="sw" style={{ background: "var(--bar0)" }} />Supervised baseline</span>
            <span><i className="sw" style={{ background: "var(--ink)" }} />TransfHAR</span>
          </div>
        </div>
        <div className="chart">
          <div className="ctitle">Activities people chose themselves</div>
          <div className="fine">Balanced accuracy vs. examples per activity, 10 participants</div>
          <div className="bars">
            {study.ks.map((k) => {
              const v = study.sixAxis[k]?.[0] ?? 0;
              const label = k === "Full" ? "1 minute" : `${k} example${k === "1" ? "" : "s"}`;
              return (
                <div className="grp" key={k}>
                  <div className="pair">
                    <div className="bcol wide">
                      <div className="bnum">{v.toFixed(1)}</div>
                      <div className="bar b1" style={{ height: `${v}%` }} />
                    </div>
                  </div>
                  <div className="glabel">{label}</div>
                </div>
              );
            })}
          </div>
          <div className="legend">
            <span>One example = 2.56 seconds of motion</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { SiteData } from "./useData";

export type SourceKey = "study" | "samosa" | "utd" | "prism_latte";

// Plain-language group names; the benchmark name is kept for the method line.
export const SOURCES: Record<SourceKey, { label: string; long: string; benchmark: string }> = {
  study: { label: "User-defined", long: "Defined by a study participant", benchmark: "User study" },
  samosa: { label: "Everyday tasks", long: "Everyday task", benchmark: "SAMoSA benchmark" },
  utd: { label: "Gestures", long: "Gesture or sports move", benchmark: "UTD-MHAD benchmark" },
  prism_latte: { label: "Latte steps", long: "Latte-making step", benchmark: "PrISM-Tracker latte benchmark" },
};

export interface Confusion {
  name: string;
  id: string;
  p: number; // % of this activity's windows predicted as `name`
}

/** One place an activity was evaluated: a participant's 7-class probe or a benchmark's full split. */
export interface Instance {
  context: string; // "P3 (right wrist)" or "" for benchmarks
  acc: number; // per-class accuracy (recall), %
  confusedAs: Confusion[];
}

export interface Activity {
  id: string;
  name: string;
  source: SourceKey;
  instances: Instance[];
  acc: number; // rounded mean over instances
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function buildActivities({ paper, confusions }: SiteData): Activity[] {
  const byId = new Map<string, Activity>();
  const { participants, perClassAccuracy } = paper.userStudy;
  const hand = Object.fromEntries(participants.map((p) => [p.id, p.hand]));

  for (const [key, { classes, matrix }] of Object.entries(confusions)) {
    const isStudy = key.startsWith("P");
    const names = classes;
    const ids = names.map((n) => (isStudy ? `study:${slug(n)}` : `${key}:${slug(n)}`));
    names.forEach((name, i) => {
      const row = matrix[i];
      const inst: Instance = {
        context: isStudy ? `${key} (${hand[key] === "L" ? "left" : "right"} wrist)` : "",
        // Figure 13 is the paper's per-class accuracy for the study; the matrix diagonal for benchmarks.
        acc: isStudy ? (perClassAccuracy[key] as number[])[i] : Math.round(row[i] * 100),
        confusedAs: row
          .map((p, j) => ({ name: names[j], id: ids[j], p: Math.round(p * 100) }))
          .filter((c, j) => j !== i && c.p >= 2)
          .sort((a, b) => b.p - a.p),
      };
      let act = byId.get(ids[i]);
      if (!act) {
        act = { id: ids[i], name, source: isStudy ? "study" : (key as SourceKey), instances: [], acc: 0 };
        byId.set(ids[i], act);
      }
      act.instances.push(inst);
    });
  }
  for (const a of byId.values()) {
    a.acc = Math.round(a.instances.reduce((s, i) => s + i.acc, 0) / a.instances.length);
  }
  return [...byId.values()];
}

/** Top confusions across every place the activity was tested (max per target). */
export function topConfusions(a: Activity, n = 4): Confusion[] {
  const best = new Map<string, Confusion>();
  for (const inst of a.instances) {
    for (const c of inst.confusedAs.slice(0, 3)) {
      if ((best.get(c.id)?.p ?? -1) < c.p) best.set(c.id, c);
    }
  }
  return [...best.values()].sort((x, y) => y.p - x.p).slice(0, n);
}

export function verdict(acc: number): { label: string; tone: "good" | "mid" | "bad" } {
  if (acc >= 85) return { label: "Reliably recognized", tone: "good" };
  if (acc >= 60) return { label: "Usually recognized", tone: "mid" };
  return { label: "Often confused", tone: "bad" };
}

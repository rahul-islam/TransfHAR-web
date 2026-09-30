export type MeanSd = [number, number | null];
export type KPoints = Partial<Record<string, MeanSd>>;

export interface Dataset {
  id: string;
  name: string;
  subjects: number;
  hours: string;
  placement: string;
  hz: number;
  axes: string;
  classes: string;
  role: "Pretrain" | "Probe";
  level?: "L3" | "L4";
  confusion?: string;
  description?: string;
}

export interface Level {
  level: "L1" | "L2" | "L3" | "L4";
  name: string;
  hours: number;
  share: number;
  signal: string;
  examples: string;
  role: string;
}

export interface FewShotSeries {
  label: string;
  sixAxis: KPoints;
  threeAxis: KPoints;
  baseline: number;
  baselineNote: string;
}

export interface ResultTable {
  note: string;
  columns: string[];
  rows: { name: string; values: MeanSd[]; ours?: boolean }[];
}

export interface Paper {
  meta: {
    title: string;
    short: string;
    venue: string;
    doi: string;
    authors: { name: string; affiliation: string }[];
    links: { pdf: string; code: string; doi: string };
    tagline: string;
    abstract: string;
    bibtex: string;
  };
  headline: { value: string; unit: string; label: string }[];
  system: {
    encoder: string;
    params: string;
    gflops: string;
    sizeMB: string;
    latencyMs: string;
    refresh: string;
    window: string;
    tokensPerChannel: number;
    maskRatio: number;
    probeTrainMs: Record<string, number>;
    probeParamsPerClass: number;
    device: string;
  };
  taxonomy: Level[];
  datasets: Dataset[];
  fewshot: { note: string; ks: string[]; series: Record<string, FewShotSeries> };
  prismProcedures: { name: string; steps: number; baseline: number; threeAxis: number; sixAxis: number }[];
  regimes: ResultTable;
  windows: ResultTable;
  userStudy: {
    design: string;
    fewshot: {
      ks: string[];
      sixAxis: KPoints;
      threeAxis: KPoints;
      macroF1Full: { sixAxis: MeanSd; threeAxis: MeanSd };
    };
    vocabulary: { note: string; sixAxis: Record<string, number>; threeAxis: Record<string, number> };
    handedness: { R: MeanSd; L: MeanSd };
    participants: { id: string; hand: "L" | "R" }[];
    perClassAccuracy: Record<string, number[] | string> & { note: string };
  };
  purity: {
    note: string;
    separable: [string, number][];
    entangled: [string, number][];
    separableMean: number;
    entangledMean: number;
  };
  activityBank: { category: string; items: string[] }[];
  findings: { title: string; body: string; link: string }[];
}

export type Confusions = Record<string, { classes: string[]; matrix: number[][] }>;

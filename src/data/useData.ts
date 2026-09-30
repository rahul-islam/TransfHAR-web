import { useEffect, useState } from "react";
import type { Confusions, Paper } from "./types";

export interface SiteData {
  paper: Paper;
  confusions: Confusions;
}

type State = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; data: SiteData };

const url = (file: string) => `${import.meta.env.BASE_URL}data/${file}`;

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(url(file));
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// Everything on the page renders from these JSON files, so updating results means
// editing public/data/*.json (or rerunning scripts/extract_confusions.py), not code.
export function useData(): State {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    Promise.all([getJson<Paper>("paper.json"), getJson<Confusions>("confusions.json")])
      .then(([paper, confusions]) => setState({ status: "ready", data: { paper, confusions } }))
      .catch((e: unknown) => setState({ status: "error", error: String(e) }));
  }, []);
  return state;
}

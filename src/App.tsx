import { useEffect, useMemo, useState } from "react";
import { buildActivities } from "./data/activities";
import { useData, type SiteData } from "./data/useData";
import { ActivityExplorer } from "./sections/ActivityExplorer";
import { Hero } from "./sections/Hero";
import { Leaderboard } from "./sections/Leaderboard";
import { Results } from "./sections/Results";

function Citation({ bibtex }: { bibtex: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="sec">
      <h2 className="h2" style={{ fontSize: 28 }}>Citation</h2>
      <pre className="cite">{bibtex}</pre>
      <button
        className="chip copy"
        onClick={() =>
          navigator.clipboard?.writeText(bibtex).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
        }
      >
        {copied ? "Copied" : "Copy BibTeX"}
      </button>
    </div>
  );
}

function Page({ data }: { data: SiteData }) {
  const { paper } = data;
  const activities = useMemo(() => buildActivities(data), [data]);
  // Deep links (#activities?activity=…) should land on the section once it exists.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "instant" }));
  }, []);
  return (
    <div className="page">
      <nav className="top">
        <a className="logo" href="#">TransfHAR</a>
        <div className="navl">
          <a href="#activities">Activities</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href={`${import.meta.env.BASE_URL}${paper.meta.links.pdf}`} target="_blank" rel="noreferrer">Paper</a>
        </div>
      </nav>
      <Hero paper={paper} />
      <Results paper={paper} />
      <ActivityExplorer activities={activities} />
      <Leaderboard paper={paper} />
      <Citation bibtex={paper.meta.bibtex} />
      <footer className="foot">
        <span>{paper.meta.authors.map((a) => a.name).join(", ")} · Northwestern, CMU, Google</span>
        <a href={paper.meta.links.doi}>{paper.meta.venue.split(" · ")[0]} · doi:{paper.meta.doi}</a>
      </footer>
    </div>
  );
}

export function App() {
  const state = useData();
  if (state.status === "loading") return <div className="status">Loading…</div>;
  if (state.status === "error") return <div className="status">Couldn't load results: {state.error}</div>;
  return <Page data={state.data} />;
}

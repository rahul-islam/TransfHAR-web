import type { Paper } from "../data/types";

export function Hero({ paper }: { paper: Paper }) {
  const { links } = paper.meta;
  return (
    <div className="hero">
      <div className="eyebrow rise">Research · UIST 2026</div>
      <h1 className="h1 rise d1">Teach your watch any activity in five tries</h1>
      <p className="lead rise d2">
        TransfHAR learns how wrists move from thousands of hours of unlabeled data. Show it a new activity a few times
        and it recognizes it, beating systems trained on full labeled datasets.
      </p>
      <div className="btns rise d3">
        <a className="pill dark" href={`${import.meta.env.BASE_URL}${links.pdf}`} target="_blank" rel="noreferrer">
          Read the paper
        </a>
        <a className="pill light" href={links.code} target="_blank" rel="noreferrer">
          View code
        </a>
      </div>
    </div>
  );
}

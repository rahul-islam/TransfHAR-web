import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SOURCES, topConfusions, verdict, type Activity, type SourceKey } from "../data/activities";
import { useParam } from "../state/url";

const DEFAULT = "study:stirring-coffee";
const FILTERS: [SourceKey | "all", string][] = [
  ["all", "All"],
  ["study", SOURCES.study.label],
  ["samosa", SOURCES.samosa.label],
  ["utd", SOURCES.utd.label],
  ["prism_latte", SOURCES.prism_latte.label],
];
type Sort = "best" | "worst" | "az";
const SORTS: [Sort, string][] = [
  ["best", "Best first"],
  ["worst", "Worst first"],
  ["az", "A–Z"],
];

const MOBILE = "(max-width: 860px)";
function useIsMobile(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(MOBILE);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(MOBILE).matches,
  );
}

const byAccuracy = (x: Activity, y: Activity) => y.acc - x.acc || x.name.localeCompare(y.name);

function method(a: Activity): string {
  return a.source === "study"
    ? `User study, ${a.instances.map((i) => i.context).join(", ")}. Per-class accuracy from a personal 7-activity linear probe on the frozen 6-axis encoder, trained on one 1-minute session and tested on two others (paper Fig. 13, 15).`
    : `${SOURCES[a.source].benchmark}. Per-class recall, frozen 6-axis encoder + linear probe, full training split (paper Fig. 14).`;
}

interface Browse {
  query: string;
  setQuery: (q: string) => void;
  filter: SourceKey | "all";
  setFilter: (f: SourceKey | "all") => void;
  sort: Sort;
  setSort: (s: Sort) => void;
  rows: Activity[];
}

function useBrowse(activities: Activity[]): Browse {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SourceKey | "all">("all");
  const [sort, setSort] = useState<Sort>("best");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const xs = activities.filter((a) => (filter === "all" || a.source === filter) && (!q || a.name.toLowerCase().includes(q)));
    if (sort === "az") return xs.sort((x, y) => x.name.localeCompare(y.name));
    return xs.sort(sort === "best" ? byAccuracy : (x, y) => -byAccuracy(x, y));
  }, [activities, query, filter, sort]);
  return { query, setQuery, filter, setFilter, sort, setSort, rows };
}

function Controls({ b, compactSort, autoFocus }: { b: Browse; compactSort?: boolean; autoFocus?: boolean }) {
  const count = `${b.rows.length} ${b.rows.length === 1 ? "activity" : "activities"}`;
  return (
    <>
      <input
        className="search"
        placeholder="Search, e.g. coffee, wave, typing"
        value={b.query}
        onChange={(e) => b.setQuery(e.target.value)}
        aria-label="Search activities"
        autoFocus={autoFocus}
      />
      <div className={`chips ${compactSort ? "scroll" : ""}`}>
        {FILTERS.map(([k, label]) => (
          <button key={k} className={`chip ${b.filter === k ? "on" : ""}`} onClick={() => b.setFilter(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="between">
        <div className="fine">{count}</div>
        {compactSort ? (
          <button
            className="sortbtn"
            onClick={() => b.setSort(SORTS[(SORTS.findIndex(([k]) => k === b.sort) + 1) % SORTS.length][0])}
          >
            {SORTS.find(([k]) => k === b.sort)![1]}
          </button>
        ) : (
          <div className="chips">
            {SORTS.map(([k, label]) => (
              <button key={k} className={`chip ${b.sort === k ? "on" : ""}`} onClick={() => b.setSort(k)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function List({ b, selected, onPick, ranks }: { b: Browse; selected: string; onPick: (id: string) => void; ranks?: boolean }) {
  return (
    <div className="list">
      {b.rows.map((r, i) => (
        <button key={r.id} className={`item ${ranks ? "" : "norank"} ${r.id === selected ? "on" : ""}`} onClick={() => onPick(r.id)}>
          {ranks && <span className="rank">{b.sort === "az" ? "" : i + 1}</span>}
          <span className="iname">{r.name}</span>
          <span className="ibar"><span className="ifill" style={{ width: `${r.acc}%` }} /></span>
          <span className="ipct">{r.acc}%</span>
        </button>
      ))}
      {b.rows.length === 0 && <div className="empty">No activity matches that search.</div>}
    </div>
  );
}

function Detail({ a, onPick, showTitle }: { a: Activity; onPick: (id: string) => void; showTitle: boolean }) {
  const v = verdict(a.acc);
  const conf = topConfusions(a);
  return (
    <div className="panel detail" aria-live="polite">
      {showTitle && (
        <div>
          <div className="cat">{SOURCES[a.source].long}</div>
          <h3 className="dname">{a.name}</h3>
        </div>
      )}
      <div className="bigwrap">
        <div className="big">
          <div className="bigpct">
            {a.acc}
            <small>%</small>
          </div>
          <span className={`verdict ${v.tone}`}>
            <i className="dot" />
            {v.label}
          </span>
        </div>
      </div>

      {a.instances.length > 1 && (
        <div>
          <div className="klabel">Chosen by {a.instances.length} participants</div>
          {a.instances.map((t) => (
            <div className="row" key={t.context}>
              <span>{t.context}</span>
              <span className="rbar"><span className="rfill" style={{ width: `${t.acc}%` }} /></span>
              <span className="rpct">{t.acc}%</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="klabel">{conf.length ? "Most often mistaken for" : "Mistakes"}</div>
        {conf.map((c) => (
          <div className="row" key={c.id}>
            <button className="linkbtn" onClick={() => onPick(c.id)}>{c.name}</button>
            <span className="rbar"><span className="rfill bad" style={{ width: `${Math.min(100, c.p * 2)}%` }} /></span>
            <span className="rpct">{c.p}%</span>
          </div>
        ))}
        {conf.length === 0 && <p className="plain small">Never mistaken for another activity in testing.</p>}
      </div>

      <div className="method fine">{method(a)}</div>
    </div>
  );
}

/** Mobile: a bottom sheet with search, filters and the full list; picking closes it. */
function Sheet({ b, selected, onPick, onClose }: { b: Browse; selected: string; onPick: (id: string) => void; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label="Choose an activity">
      <div className="scrim" onClick={onClose} />
      <div className="sheet">
        <div className="grab" />
        <div className="sh-head">
          <div className="sh-t">Choose an activity</div>
          <button className="close" onClick={onClose}>Done</button>
        </div>
        <div className="controls sh-ctl">
          <Controls b={b} compactSort />
        </div>
        <List b={b} selected={selected} onPick={onPick} />
      </div>
    </div>
  );
}

export function ActivityExplorer({ activities }: { activities: Activity[] }) {
  // The selected activity lives in the URL so a result can be shared as a link.
  const [sel, setSel] = useParam("activity");
  const [sheet, setSheet] = useState(false);
  const closeSheet = useCallback(() => setSheet(false), []);
  const b = useBrowse(activities);
  const mobile = useIsMobile();
  const pickerRef = useRef<HTMLButtonElement>(null);
  const byId = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);
  const ranked = useMemo(() => [...activities].sort(byAccuracy), [activities]);

  const a = byId.get(sel ?? DEFAULT) ?? byId.get(DEFAULT) ?? activities[0];
  const pos = ranked.findIndex((x) => x.id === a.id);
  const prev = ranked[(pos - 1 + ranked.length) % ranked.length];
  const next = ranked[(pos + 1) % ranked.length];

  // On mobile, keep the newly chosen result in view instead of wherever the tap happened.
  const pick = (id: string) => {
    setSel(id);
    if (mobile) {
      setSheet(false);
      const el = pickerRef.current;
      if (el && el.getBoundingClientRect().top < 0) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16 });
    }
  };

  return (
    <div className="sec" id="activities">
      <h2 className="h2">How well does it recognize…?</h2>
      <p className="sub">
        Pick any of {activities.length} activities: everyday tasks, gestures, latte-making steps, and the activities
        study participants defined for themselves.
      </p>

      {mobile ? (
        <div className="m-explore">
          <button ref={pickerRef} className="picker" onClick={() => setSheet(true)} aria-haspopup="dialog">
            <span className="pk-l">
              <span className="pk-k">{SOURCES[a.source].long}</span>
              <span className="pk-v">{a.name}</span>
            </span>
            <span className="pk-go">Change</span>
          </button>
          <div className="nav2">
            <button className="nbtn" onClick={() => pick(prev.id)} aria-label={`Previous: ${prev.name}`}>
              ← <span>{prev.name}</span>
            </button>
            <button className="nbtn" onClick={() => pick(next.id)} aria-label={`Next: ${next.name}`}>
              <span>{next.name}</span> →
            </button>
          </div>
          <Detail a={a} onPick={pick} showTitle={false} />
          {sheet && <Sheet b={b} selected={a.id} onPick={pick} onClose={closeSheet} />}
        </div>
      ) : (
        <div className="explore">
          <div className="panel">
            <div className="controls">
              <Controls b={b} />
            </div>
            <List b={b} selected={a.id} onPick={pick} ranks />
          </div>
          <Detail a={a} onPick={pick} showTitle />
        </div>
      )}
    </div>
  );
}

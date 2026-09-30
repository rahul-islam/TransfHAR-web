import { useCallback, useSyncExternalStore } from "react";

// Selections (activity, dataset, participant, level) live in the query string so any
// view can be shared as a link and survives reload.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}

export function setParams(updates: Record<string, string | null>, hash?: string) {
  const u = new URL(window.location.href);
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === "") u.searchParams.delete(k);
    else u.searchParams.set(k, v);
  }
  if (hash !== undefined) u.hash = hash;
  window.history.replaceState(null, "", u);
  notify();
}

export function useParam(name: string): [string | null, (v: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.search).get(name));
  const set = useCallback((v: string | null) => setParams({ [name]: v }), [name]);
  return [value, set];
}

// Select something and scroll to the section that shows it.
export function goTo(section: string, updates: Record<string, string | null> = {}) {
  setParams(updates, section);
  // Browsers don't animate smooth scrolling in background tabs, so jump instead there.
  const behavior = document.visibilityState === "visible" ? "smooth" : "instant";
  document.getElementById(section)?.scrollIntoView({ behavior, block: "start" });
}

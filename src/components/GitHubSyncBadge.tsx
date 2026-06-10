import { useCallback, useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

const REPO = "StellerMatch/dabot-treehouse";
const BRANCH = "main";
const POLL_MS = 60_000;
const STORAGE_KEY = "dabottree:ghDebug";

type CommitInfo = {
  sha: string;
  message: string;
  date: string;
  url: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function GitHubSyncBadge() {
  const search = useRouterState({ select: (s) => s.location.search });
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [commit, setCommit] = useState<CommitInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");
  const [error, setError] = useState<string>("");
  const [tick, setTick] = useState(0);

  // Mount + handle ?debug=1 / ?debug=0 toggle, persist via localStorage.
  useEffect(() => {
    setMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const debugParam = params.get("debug");
      if (debugParam === "1") localStorage.setItem(STORAGE_KEY, "1");
      else if (debugParam === "0") localStorage.removeItem(STORAGE_KEY);
      setEnabled(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setEnabled(false);
    }
  }, [search]);

  // Poll GitHub for the latest commit on main.
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommit = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/commits/${BRANCH}`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (signal?.aborted) return;
      setCommit({
        sha: data.sha,
        message: (data.commit?.message ?? "").split("\n")[0],
        date: data.commit?.author?.date ?? data.commit?.committer?.date ?? "",
        url: data.html_url,
      });
      setStatus("connected");
      setError("");
    } catch (e) {
      if (signal?.aborted) return;
      setStatus("error");
      setError(e instanceof Error ? e.message : "unknown");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const controller = new AbortController();
    fetchCommit(controller.signal);
    const id = setInterval(() => {
      fetchCommit();
    }, POLL_MS);
    // re-render every 30s so "Xs ago" stays fresh
    const tickId = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
      clearInterval(tickId);
    };
  }, [enabled, refreshTrigger]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCommit();
    setTick((t) => t + 1);
    setRefreshing(false);
  };

  if (!mounted || !enabled) return null;

  const dotColor =
    status === "connected"
      ? "bg-emerald-400"
      : status === "error"
        ? "bg-red-400"
        : "bg-amber-300";

  return (
    <div
      className="fixed bottom-3 left-3 z-[70] max-w-[320px] rounded-md border border-white/10 bg-black/80 px-3 py-2 font-mono text-[11px] text-white shadow-lg backdrop-blur-md"
      data-tick={tick}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
        <span className="font-semibold uppercase tracking-wider">
          GitHub · {status === "connected" ? "synced" : status === "error" ? "error" : "checking…"}
        </span>
      </div>
      <div className="mt-1 text-white/60">{REPO}@{BRANCH}</div>
      {commit && (
        <a
          href={commit.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block hover:underline"
          title={commit.message}
        >
          <span className="text-emerald-300">{commit.sha.slice(0, 7)}</span>{" "}
          <span className="text-white/80">
            {commit.message.length > 48 ? `${commit.message.slice(0, 48)}…` : commit.message}
          </span>
          <div className="text-white/50">{commit.date ? timeAgo(commit.date) : ""}</div>
        </a>
      )}
      {status === "error" && (
        <div className="mt-1 text-red-300">{error || "Failed to reach GitHub"}</div>
      )}
      <div className="mt-1 text-[10px] text-white/40">?debug=0 to hide</div>
    </div>
  );
}

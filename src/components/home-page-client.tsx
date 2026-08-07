"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAndMergeServerState,
  getDefaultTrackerState,
  normalizeTrackerState,
  readTrackerState,
  subscribeToTrackerState,
  type TrackerState,
} from "@/lib/tracker-store";
import { getVisibleCurrentTask } from "@/lib/tracker-flow";
import { timeAgo } from "@/lib/timeago";
import type { SiteConfigViewModel } from "@/lib/site-config";

type HomePageClientProps = {
  config: SiteConfigViewModel;
};

export default function HomePageClient({ config }: HomePageClientProps) {
  const [showAll, setShowAll] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [tracker, setTracker] = useState<TrackerState>(getDefaultTrackerState);
  const [showOriginal, setShowOriginal] = useState(false);
  const [flashCurrent, setFlashCurrent] = useState(false);
  const [flashNext, setFlashNext] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [probeMessage, setProbeMessage] = useState<string | null>(null);
  const [probeRunning, setProbeRunning] = useState(false);
  const trackerRef = useRef<TrackerState>(getDefaultTrackerState());

  const applyTrackerState = useCallback((nextState: TrackerState | null | undefined) => {
    const normalized = normalizeTrackerState(nextState ?? trackerRef.current);
    const previous = trackerRef.current;

    if (
      previous.currentTask !== normalized.currentTask ||
      previous.nextTask !== normalized.nextTask ||
      previous.currentSince !== normalized.currentSince ||
      previous.nextSince !== normalized.nextSince ||
      previous.currentTaskPrevious !== normalized.currentTaskPrevious ||
      previous.showOriginal !== normalized.showOriginal ||
      previous.statusMessage !== normalized.statusMessage ||
      previous.history.length !== normalized.history.length ||
      previous.history.some((item, index) => {
        const candidate = normalized.history[index];
        return !candidate || item.id !== candidate.id || item.text !== candidate.text || item.from !== candidate.from || item.until !== candidate.until;
      })
    ) {
      trackerRef.current = normalized;
      setTracker(normalized);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHydrated(true);
    }, 0);

    const loadSharedState = async () => {
      const shared = await fetchAndMergeServerState();
      applyTrackerState(shared ?? readTrackerState());

      if (typeof window !== 'undefined') {
        const response = await fetch('/api/state', { cache: 'no-store' });
        if (!response.ok) {
          try {
            const payload = await response.json();
            if (payload?.error) {
              setStorageError(String(payload.error));
            }
          } catch {
            setStorageError('Shared storage is unavailable.');
          }
        } else {
          setStorageError(null);
        }
      }
    };
    loadSharedState();

    const refreshInterval = window.setInterval(async () => {
      const shared = await fetchAndMergeServerState();
      applyTrackerState(shared ?? readTrackerState());
    }, 9000);

    let prevCurrent = '';
    let prevNext = '';
    const unsub = subscribeToTrackerState(() => {
      const nextState = readTrackerState();
      applyTrackerState(nextState);
      if (prevCurrent && nextState.currentSince && prevCurrent !== nextState.currentSince) {
        setFlashCurrent(true);
        window.setTimeout(() => setFlashCurrent(false), 700);
      }
      if (prevNext && nextState.nextSince && prevNext !== nextState.nextSince) {
        setFlashNext(true);
        window.setTimeout(() => setFlashNext(false), 700);
      }
      prevCurrent = nextState.currentSince || prevCurrent;
      prevNext = nextState.nextSince || prevNext;
    });

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(refreshInterval);
      unsub();
    };
  }, [applyTrackerState]);

  const canShowOriginal = Boolean(tracker.currentTaskPrevious && tracker.currentTaskPrevious !== tracker.currentTask);
  const effectiveShowOriginal = canShowOriginal && showOriginal;

  const runStorageProbe = useCallback(async () => {
    setProbeRunning(true);
    setProbeMessage(null);

    try {
      const response = await fetch('/api/state', { method: 'PATCH', cache: 'no-store' });
      const payload = await response.json();
      const message = typeof payload?.message === 'string' ? payload.message : 'Storage probe completed.';
      setProbeMessage(message);
      setStorageError(response.ok ? null : message);
    } catch {
      setProbeMessage('Storage probe failed to complete.');
      setStorageError('Storage probe failed to complete.');
    } finally {
      setProbeRunning(false);
    }
  }, []);

  const visibleItems = useMemo(() => {
    return showAll ? tracker.history : tracker.history.slice(0, 3);
  }, [showAll, tracker.history]);

  const visibleCurrentTask = useMemo(() => {
    return getVisibleCurrentTask({
      ...tracker,
      currentTaskPrevious: tracker.currentTaskPrevious || '',
      showOriginal: effectiveShowOriginal,
    });
  }, [effectiveShowOriginal, tracker]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.12),_transparent_32%),linear-gradient(135deg,_#0b0d10_0%,_#13161b_100%)] text-[#f4f1ea]">
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-12">
          <div className="animate-pulse rounded-[2rem] border border-white/10 bg-[#12151a]/90 p-8 sm:p-10 lg:p-12">
            <div className="h-4 w-24 rounded bg-slate-700" />
            <div className="mt-6 h-12 w-3/4 rounded bg-slate-700" />
            <div className="mt-4 h-4 w-full rounded bg-slate-800" />
            <div className="mt-3 h-4 w-2/3 rounded bg-slate-800" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.12),_transparent_32%),linear-gradient(135deg,_#0b0d10_0%,_#13161b_100%)] text-[#f4f1ea]">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-12">
        <header className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{config.appName}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{config.currentHeading}</h1>
          </div>
        </header>

        {storageError ? (
          <section className="mb-8 rounded-[1.5rem] border border-rose-500/40 bg-rose-500/10 p-5 text-sm text-rose-200">
            <p className="font-semibold uppercase tracking-[0.25em] text-rose-300">Storage error</p>
            <p className="mt-2">{storageError}</p>
          </section>
        ) : null}

        <section className="mb-8 rounded-[1.5rem] border border-cyan-400/20 bg-[#0f1115]/90 p-5 text-sm text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold uppercase tracking-[0.25em] text-cyan-300">Connection check</p>
              <p className="mt-2">Test the configured Redis or Upstash backend from this app.</p>
            </div>
            <button
              type="button"
              onClick={runStorageProbe}
              disabled={probeRunning}
              className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-medium text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {probeRunning ? 'Checking…' : 'Run probe'}
            </button>
          </div>
          {probeMessage ? <p className="mt-3 text-sm text-slate-400">{probeMessage}</p> : null}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#12151a]/90 p-8 shadow-2xl shadow-black/20 sm:p-10 lg:p-12">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-slate-400">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            Current
          </div>

          <div className="mt-6 space-y-5">
            <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
              {config.currentSentence} {visibleCurrentTask}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm ${flashCurrent ? 'text-cyan-200 animate-pulse' : 'text-slate-400'}`}>Since: {timeAgo(tracker.currentSince)}</p>
              {canShowOriginal ? (
                <button
                  type="button"
                  onClick={() => setShowOriginal((value) => !value)}
                  className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  {effectiveShowOriginal ? 'show reworded' : '(reworded)'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-[#0f1115] p-6 sm:p-7">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Doing next</p>
            <p className="mt-3 text-2xl font-medium text-slate-300 sm:text-3xl">{tracker.nextTask || 'Nothing queued yet.'}</p>
            <p className={`mt-2 text-sm ${flashNext ? 'text-cyan-200 animate-pulse' : 'text-slate-400'}`}>Since: {timeAgo(tracker.nextSince)}</p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">History</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-100">{config.historyHeading}</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/20"
            >
              {showAll ? 'Show less' : 'View more'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-[#12151a]/70 p-5 transition duration-200 hover:border-cyan-400/50 hover:bg-[#141821] hover:shadow-[0_0_0_1px_rgba(103,232,249,0.16)]"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">From: {timeAgo(item.from)}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Until: {item.until ? timeAgo(item.until) : '—'}</p>
                <h4 className="mt-3 text-lg font-semibold text-slate-100">{item.text}</h4>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

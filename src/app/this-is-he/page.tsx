'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { timeAgo } from '@/lib/timeago';
import { siteConfig } from '@/lib/site-config';
import { createQueuePushState, createRewordedCurrentTaskState } from '@/lib/tracker-flow';
import {
  fetchAndMergeServerState,
  getDefaultTrackerState,
  persistTrackerState,
  readTrackerState,
  subscribeToTrackerState,
  type TrackerState,
} from '@/lib/tracker-store';

const AUTH_CODE = siteConfig.authCode;
const AUTH_STORAGE_KEY = siteConfig.authStorageKey;
const SHARED_STATE_POLL_INTERVAL_MS = 9000;

export default function ThisIsHePage() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [tracker, setTracker] = useState<TrackerState>(getDefaultTrackerState);
  const [currentFlare, setCurrentFlare] = useState(false);
  const [nextFlare, setNextFlare] = useState(false);
  const [queueInputOpen, setQueueInputOpen] = useState(false);
  const [queueDraft, setQueueDraft] = useState('');
  const [currentDraft, setCurrentDraft] = useState('');
  const [currentEditUnlocked, setCurrentEditUnlocked] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const holdProgressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const timer = window.setTimeout(() => {
      setMounted(true);

      try {
        const session = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
        const stored = session ?? window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { authorized?: boolean; remember?: boolean };
          if (parsed.authorized) {
            setIsAuthenticated(true);
          }
          setRememberMe(Boolean(parsed.remember));
        }
      } catch {
        // ignore parse errors
      }

      const loadSharedState = async () => {
        const shared = await fetchAndMergeServerState();
        setTracker(shared ?? readTrackerState());
      };
      loadSharedState();
    }, 0);

    const refreshInterval = window.setInterval(async () => {
      const shared = await fetchAndMergeServerState();
      setTracker(shared ?? readTrackerState());
    }, SHARED_STATE_POLL_INTERVAL_MS);

    const unsubscribe = subscribeToTrackerState(() => {
      setTracker(readTrackerState());
    });

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(refreshInterval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
      if (holdProgressIntervalRef.current) {
        window.clearInterval(holdProgressIntervalRef.current);
      }
    };
  }, []);

  const updateTracker = (changes: Partial<TrackerState>) => {
    setTracker((previous) => {
      const nowIso = new Date().toISOString();
      const nextState = {
        ...previous,
        ...changes,
        history: changes.history ?? previous.history,
        currentSince: changes.currentTask !== undefined ? nowIso : previous.currentSince,
        nextSince: changes.nextTask !== undefined ? nowIso : previous.nextSince,
        currentTaskPrevious: changes.currentTask !== undefined ? '' : previous.currentTaskPrevious,
        showOriginal: changes.currentTask !== undefined ? false : previous.showOriginal,
      };
      persistTrackerState(nextState);
      // trigger small animations for changed fields
      if (changes.currentTask !== undefined) {
        setCurrentFlare(true);
        window.setTimeout(() => setCurrentFlare(false), 800);
      }
      if (changes.nextTask !== undefined) {
        setNextFlare(true);
        window.setTimeout(() => setNextFlare(false), 800);
      }
      return nextState;
    });
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();

    if (blockedUntil && Date.now() < blockedUntil) {
      setAuthError('Too many attempts — try again shortly.');
      return;
    }

    if (authCode === AUTH_CODE) {
      setIsAuthenticated(true);
      setAuthError('');

      if (typeof window !== 'undefined') {
        const payload = JSON.stringify({ authorized: true, remember: rememberMe });
        if (rememberMe) {
          window.localStorage.setItem(AUTH_STORAGE_KEY, payload);
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        } else {
          window.sessionStorage.setItem(AUTH_STORAGE_KEY, payload);
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
      setFailedAttempts(0);
      return;
    }

    const attempts = failedAttempts + 1;
    setFailedAttempts(attempts);
    if (attempts >= 5) {
      const blockFor = 30_000; // 30s
      const until = Date.now() + blockFor;
      setBlockedUntil(until);
      setFailedAttempts(0);
      setAuthError('Too many attempts — locked for 30 seconds.');
    } else {
      setAuthError('Incorrect code.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthCode('');
    setRememberMe(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const moveToCurrent = () => {
    if (!tracker.nextTask.trim()) return;
    const timestampIso = new Date().toISOString();

    updateTracker({
      currentTask: tracker.nextTask.trim(),
      nextTask: '',
      history: [{ id: Date.now(), text: tracker.currentTask, from: tracker.currentSince || '', until: timestampIso }, ...tracker.history].slice(0, 20),
      currentSince: timestampIso,
      nextSince: '',
    });
  };

  const handleQueueArrowPointerDown = () => {
    longPressTriggeredRef.current = false;
    setHoldProgress(0);
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    if (holdProgressIntervalRef.current) {
      window.clearInterval(holdProgressIntervalRef.current);
    }

    let progress = 0;
    holdProgressIntervalRef.current = window.setInterval(() => {
      progress += 1;
      setHoldProgress(Math.min(progress, 100));
    }, 25);

    longPressTimerRef.current = window.setTimeout(() => {
      if (holdProgressIntervalRef.current) {
        window.clearInterval(holdProgressIntervalRef.current);
        holdProgressIntervalRef.current = null;
      }
      longPressTriggeredRef.current = true;
      setHoldProgress(100);
      setCurrentEditUnlocked(true);
      setQueueInputOpen(false);
      setCurrentDraft(tracker.currentTask);
    }, 900);
  };

  const handleQueueArrowPointerUp = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (holdProgressIntervalRef.current) {
      window.clearInterval(holdProgressIntervalRef.current);
      holdProgressIntervalRef.current = null;
    }
    if (!longPressTriggeredRef.current) {
      setHoldProgress(0);
    }
  };

  const handleQueueArrowClick = () => {
    if (longPressTriggeredRef.current) {
      return;
    }
    setQueueInputOpen((value) => !value);
    setCurrentEditUnlocked(false);
    setCurrentDraft(tracker.currentTask);
  };

  const pushToQueue = () => {
    const nextTaskValue = queueDraft.trim();
    if (!nextTaskValue) return;

    setTracker((previous) => {
      const nextState = createQueuePushState(
        {
          ...previous,
          history: previous.history,
        },
        nextTaskValue,
      );
      persistTrackerState(nextState);
      return nextState;
    });
    setQueueDraft('');
    setQueueInputOpen(false);
  };

  const saveCurrentTaskEdit = (mode: 'changing' | 'reworded') => {
    const trimmed = currentDraft.trim();
    if (!trimmed) return;

    setTracker((previous) => {
      const nextState =
        mode === 'reworded'
          ? createRewordedCurrentTaskState(
              {
                ...previous,
                history: previous.history,
              },
              trimmed,
            )
          : {
              ...previous,
              currentTask: trimmed,
              currentTaskPrevious: '',
              showOriginal: false,
              currentSince: new Date().toISOString(),
            };
      persistTrackerState(nextState);
      return nextState;
    });
    setCurrentDraft('');
    setCurrentEditUnlocked(false);
  };

  const replaceBoth = () => {
    if (!tracker.nextTask.trim()) return;

    const nowIso = new Date().toISOString();
    updateTracker({
      currentTask: tracker.nextTask.trim(),
      nextTask: '',
      history: [{ id: Date.now(), text: tracker.currentTask, from: tracker.currentSince || '', until: nowIso }, ...tracker.history].slice(0, 20),
      currentSince: nowIso,
      nextSince: '',
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.12),_transparent_32%),linear-gradient(135deg,_#0b0d10_0%,_#13161b_100%)] text-[#f4f1ea]">
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-12">
          <div className="animate-pulse rounded-[2rem] border border-white/10 bg-[#12151a]/90 p-8 sm:p-10">
            <div className="h-4 w-24 rounded bg-slate-700" />
            <div className="mt-6 h-10 w-2/3 rounded bg-slate-700" />
            <div className="mt-4 h-4 w-full rounded bg-slate-800" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.12),_transparent_32%),linear-gradient(135deg,_#0b0d10_0%,_#13161b_100%)] text-[#f4f1ea]">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-12">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{siteConfig.appName}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {siteConfig.updateHeading}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-700/70 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/50 hover:text-white"
            >
              Back to live view
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Log out
              </button>
            )}
          </div>
        </header>

        {!isAuthenticated ? (
          <section className="rounded-[2rem] border border-white/10 bg-[#12151a]/90 p-8 shadow-2xl shadow-black/20 sm:p-10">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Authentication</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">{siteConfig.authHeading}</h2>
              <p className="mt-3 text-lg leading-8 text-slate-400">
                Enter your four-digit code to sign in. Choose &quot;Remember&quot; only on personal devices.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 max-w-md space-y-4 rounded-2xl border border-slate-800 bg-[#0f1115] p-6">
              <label className="block text-sm font-medium text-slate-300" htmlFor="auth-code">
                4-digit code
              </label>
              <input
                id="auth-code"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={authCode}
                onChange={(event) => setAuthCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-lg text-white outline-none ring-0 focus:border-cyan-400"
                placeholder="----"
              />

              <label className="flex items-center gap-3 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />
                Remember me on this device
              </label>

              {authError ? <p className="text-sm text-rose-300">{authError}</p> : null}

              <button
                type="submit"
                className="w-full rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Sign in
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="rounded-[2rem] border border-white/10 bg-[#12151a]/90 p-8 shadow-2xl shadow-black/20 sm:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl w-full">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Current</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="block text-sm font-medium text-slate-300" htmlFor="current-task">
                      {siteConfig.currentLabel}
                    </label>
                    <button
                      type="button"
                      onMouseDown={handleQueueArrowPointerDown}
                      onMouseUp={handleQueueArrowPointerUp}
                      onMouseLeave={handleQueueArrowPointerUp}
                      onTouchStart={handleQueueArrowPointerDown}
                      onTouchEnd={handleQueueArrowPointerUp}
                      onTouchCancel={handleQueueArrowPointerUp}
                      onClick={handleQueueArrowClick}
                      className="relative overflow-hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
                      title="Click to queue a new current task or hold to unlock editing"
                    >
                      <span
                        className="absolute inset-0 rounded-full bg-cyan-400/20 transition-all duration-75"
                        style={{ width: `${holdProgress}%`, opacity: holdProgress > 0 ? 1 : 0 }}
                      />
                      <span className="relative">↗</span>
                    </button>
                  </div>
                  <input
                    id="current-task"
                    value={currentEditUnlocked ? currentDraft : tracker.currentTask}
                    readOnly={!currentEditUnlocked}
                    onChange={(event) => setCurrentDraft(event.target.value)}
                    className={`mt-3 w-full rounded-2xl border bg-[#0f1115] px-5 py-4 text-2xl font-medium text-white outline-none focus:border-cyan-400 ${currentFlare ? 'border-cyan-400/60 ring-1 ring-cyan-400/20' : 'border-slate-800'}`}
                    placeholder={siteConfig.currentPlaceholder}
                  />
                  {currentEditUnlocked ? (
                    <div className="mt-3 rounded-2xl border border-slate-800 bg-[#0f1115] p-4">
                      <p className="text-sm text-slate-400">Choose how to save this change.</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => saveCurrentTaskEdit('changing')}
                          className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                        >
                          Changing
                        </button>
                        <button
                          type="button"
                          onClick={() => saveCurrentTaskEdit('reworded')}
                          className="rounded-full border border-slate-700/70 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400/50 hover:text-white"
                        >
                          Reworded
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {queueInputOpen ? (
                    <div className="mt-3 rounded-2xl border border-slate-800 bg-[#0f1115] p-4">
                      <label className="block text-sm font-medium text-slate-300" htmlFor="queue-push">
                        New current task
                      </label>
                      <input
                        id="queue-push"
                        value={queueDraft}
                        onChange={(event) => setQueueDraft(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-lg text-slate-200 outline-none focus:border-cyan-400"
                        placeholder="What should become current next?"
                      />
                      <button
                        type="button"
                        onClick={pushToQueue}
                        className="mt-3 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                      >
                        Push to top of queue
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* status box removed for a simpler UI */}
              </div>

              <div className="mt-8 rounded-2xl border border-slate-800 bg-[#0f1115] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Doing next</p>
                    <label className="mt-3 block text-sm font-medium text-slate-300" htmlFor="next-task">
                      {siteConfig.nextLabel}
                    </label>
                    <input
                      id="next-task"
                      value={tracker.nextTask}
                      onChange={(event) => updateTracker({ nextTask: event.target.value })}
                      className={`mt-3 w-full rounded-2xl border bg-slate-950/70 px-5 py-4 text-lg text-slate-200 outline-none focus:border-cyan-400 ${nextFlare ? 'border-cyan-400/60 ring-1 ring-cyan-400/20' : 'border-slate-800'}`}
                      placeholder="What comes next?"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:min-w-[190px]">
                    <button
                      type="button"
                      onClick={moveToCurrent}
                      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      Move to current
                    </button>
                    <button
                      type="button"
                      onClick={replaceBoth}
                      className="rounded-full border border-slate-700/70 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/50 hover:text-white"
                    >
                      Replace both
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">History</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-100">Recent updates</h3>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {tracker.history.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#12151a]/70 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">From: {timeAgo(item.from)}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Until: {item.until ? timeAgo(item.until) : '—'}</p>
                    <p className="mt-3 text-lg font-semibold text-slate-100">{item.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

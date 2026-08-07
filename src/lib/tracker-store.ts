import { siteConfig } from '@/lib/site-config';

export type TrackerHistoryItem = {
  id: number;
  text: string;
  from: string; // ISO timestamp when this item became current
  until?: string; // ISO timestamp when this item stopped being current
};

export type TrackerState = {
  currentTask: string;
  nextTask: string;
  currentSince?: string;
  nextSince?: string;
  history: TrackerHistoryItem[];
  statusMessage: string;
  currentTaskPrevious?: string;
  showOriginal?: boolean;
};

const STORAGE_KEY = siteConfig.stateStorageKey;

const starterHistory: TrackerHistoryItem[] = [];

function normalizeHistory(history: unknown): TrackerHistoryItem[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.reduce<TrackerHistoryItem[]>((acc, item) => {
    if (!item || typeof item !== 'object') {
      return acc;
    }

    const record = item as Record<string, unknown>;
    const text = typeof record.text === 'string' ? record.text : '';
    const from = typeof record.from === 'string'
      ? record.from
      : typeof record.timestamp === 'string'
        ? record.timestamp
        : '';

    if (!text && !from) {
      return acc;
    }

    acc.push({
      id: typeof record.id === 'number' ? record.id : acc.length + 1,
      text,
      from,
      until: typeof record.until === 'string' ? record.until : undefined,
    });

    return acc;
  }, []);
}

export function getDefaultTrackerState(): TrackerState {
  return {
    currentTask: '',
    nextTask: '',
    currentSince: '',
    nextSince: '',
    history: starterHistory.map((item) => ({ ...item })),
    statusMessage: '',
    currentTaskPrevious: '',
    showOriginal: false,
  };
}

export function normalizeTrackerState(input: Partial<TrackerState> | null | undefined): TrackerState {
  const defaults = getDefaultTrackerState();

  return {
    currentTask: typeof input?.currentTask === 'string' ? input.currentTask : defaults.currentTask,
    nextTask: typeof input?.nextTask === 'string' ? input.nextTask : defaults.nextTask,
    currentSince: typeof input?.currentSince === 'string' ? input.currentSince : defaults.currentSince,
    nextSince: typeof input?.nextSince === 'string' ? input.nextSince : defaults.nextSince,
    history: normalizeHistory(input?.history),
    statusMessage: typeof input?.statusMessage === 'string' ? input.statusMessage : defaults.statusMessage,
    currentTaskPrevious: typeof input?.currentTaskPrevious === 'string' ? input.currentTaskPrevious : defaults.currentTaskPrevious,
    showOriginal: input?.showOriginal === true,
  };
}

export function readTrackerState(): TrackerState {
  if (typeof window === 'undefined') {
    return getDefaultTrackerState();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultTrackerState();
    }

    const parsed = JSON.parse(stored) as Partial<TrackerState>;
    return normalizeTrackerState(parsed);
  } catch {
    return getDefaultTrackerState();
  }
}

export function persistTrackerState(state: TrackerState): TrackerState {
  if (typeof window === 'undefined') {
    return state;
  }

  const normalized = normalizeTrackerState(state);
  const serialized = JSON.stringify(normalized);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(siteConfig.syncEventName));

  // Attempt to sync with server if available
  try {
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
    }).catch(() => undefined);
  } catch {
    // ignore
  }
  return normalized;
}

function parseTime(t?: string | null) {
  if (!t) return 0;
  const v = Date.parse(t);
  return Number.isFinite(v) ? v : 0;
}

function mergeTrackerStates(local: TrackerState, server: Partial<TrackerState>): TrackerState {
  const result: TrackerState = normalizeTrackerState(local);

  const serverState = normalizeTrackerState(server);

  // decide currentTask by latest timestamp
  if (serverState.currentSince && parseTime(serverState.currentSince) > parseTime(local.currentSince)) {
    result.currentTask = serverState.currentTask ?? result.currentTask;
    result.currentSince = serverState.currentSince;
  } else {
    result.currentTask = local.currentTask ?? result.currentTask;
    result.currentSince = local.currentSince ?? result.currentSince;
  }

  // decide nextTask by latest timestamp
  if (serverState.nextSince && parseTime(serverState.nextSince) > parseTime(local.nextSince)) {
    result.nextTask = serverState.nextTask ?? result.nextTask;
    result.nextSince = serverState.nextSince;
  } else {
    result.nextTask = local.nextTask ?? result.nextTask;
    result.nextSince = local.nextSince ?? result.nextSince;
  }

  // merge history (unique by id or timestamp+text)
  const combined = [] as TrackerHistoryItem[];
  const seen = new Set<string>();
  const pushUnique = (it: TrackerHistoryItem) => {
    const key = it.id ? `id:${it.id}` : `t:${it.from}|${it.text}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(it);
    }
  };

  serverState.history.forEach((item) => pushUnique(item));
  normalizeHistory(local.history).forEach((item) => pushUnique(item));

  combined.sort((a, b) => parseTime(b.from) - parseTime(a.from));
  result.history = combined.slice(0, 20);

  // prefer server status message if present
  result.statusMessage = serverState.statusMessage ?? local.statusMessage ?? result.statusMessage;
  result.currentTaskPrevious = serverState.currentTaskPrevious ?? local.currentTaskPrevious ?? result.currentTaskPrevious;
  result.showOriginal = serverState.showOriginal ?? local.showOriginal ?? result.showOriginal;

  return result;
}

export async function fetchAndMergeServerState(): Promise<TrackerState | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const serverState = json?.state as Partial<TrackerState> | undefined;
    if (!serverState) return null;

    const local = readTrackerState();
    const merged = mergeTrackerStates(local, serverState);
    persistTrackerState(merged);
    return merged;
  } catch {
    return null;
  }
}

export function subscribeToTrackerState(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  const onSync = () => {
    callback();
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(siteConfig.syncEventName, onSync);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(siteConfig.syncEventName, onSync);
  };
}

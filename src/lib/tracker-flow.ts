export type TrackerFlowState = {
  currentTask: string;
  nextTask: string;
  currentSince?: string;
  nextSince?: string;
  currentTaskPrevious?: string;
  showOriginal?: boolean;
  statusMessage: string;
  history: Array<{ id: number; text: string; from: string; until?: string }>;
};

const MAX_HISTORY_ITEMS = 20;

export function createQueuePushState(
  state: TrackerFlowState,
  newCurrentTask: string,
) {
  const timestampIso = new Date().toISOString();
  const historyItem = {
    id: Date.now(),
    text: state.currentTask,
    from: state.currentSince || '',
    until: timestampIso,
  };

  return {
    ...state,
    currentTask: newCurrentTask.trim(),
    currentSince: timestampIso,
    nextTask: state.nextTask,
    nextSince: state.nextSince,
    currentTaskPrevious: '',
    showOriginal: false,
    statusMessage: state.statusMessage || '',
    history: [historyItem, ...state.history].slice(0, MAX_HISTORY_ITEMS),
  };
}

export function createRewordedCurrentTaskState(
  state: TrackerFlowState,
  newCurrentTask: string,
) {
  const trimmed = newCurrentTask.trim();
  if (!trimmed) return state;

  return {
    ...state,
    currentTask: trimmed,
    currentSince: state.currentSince || '',
    currentTaskPrevious: state.currentTaskPrevious || state.currentTask,
    showOriginal: false,
    statusMessage: state.statusMessage || '',
  };
}

export function getVisibleCurrentTask(state: TrackerFlowState) {
  const hasActiveAlternate = Boolean(
    state.currentTaskPrevious && state.currentTaskPrevious !== state.currentTask,
  );

  if (state.showOriginal && hasActiveAlternate) {
    return state.currentTaskPrevious;
  }

  return state.currentTask;
}

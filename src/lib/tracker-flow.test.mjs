import test from 'node:test';
import assert from 'node:assert/strict';
import { createQueuePushState, createRewordedCurrentTaskState, getVisibleCurrentTask } from './tracker-flow.js';
import { normalizeTrackerState } from './tracker-store.js';

test('createQueuePushState moves the current task to history and keeps the planned next task unchanged', () => {
  const state = {
    currentTask: 'Finish the launch deck',
    nextTask: 'Ship the release',
    currentSince: '2026-01-01T00:00:00.000Z',
    currentTaskPrevious: '',
    history: [],
  };

  const nextState = createQueuePushState(state, 'Write the follow-up plan');

  assert.equal(nextState.currentTask, 'Write the follow-up plan');
  assert.equal(nextState.nextTask, 'Ship the release');
  assert.equal(nextState.history[0].text, 'Finish the launch deck');
  assert.equal(nextState.currentTaskPrevious, '');
});

test('createRewordedCurrentTaskState preserves since time and stores the prior wording', () => {
  const state = {
    currentTask: 'Review the PR',
    currentSince: '2026-01-01T00:00:00.000Z',
    currentTaskPrevious: '',
  };

  const nextState = createRewordedCurrentTaskState(state, 'Review the pull request');

  assert.equal(nextState.currentTask, 'Review the pull request');
  assert.equal(nextState.currentSince, '2026-01-01T00:00:00.000Z');
  assert.equal(nextState.currentTaskPrevious, 'Review the PR');
});

test('getVisibleCurrentTask swaps between reworded and original wording', () => {
  const visible = getVisibleCurrentTask({
    currentTask: 'Ship the release',
    currentTaskPrevious: 'Ship the update',
    showOriginal: true,
  });

  assert.equal(visible, 'Ship the update');
});

test('normalizeTrackerState fills in defaults while preserving existing history', () => {
  const normalized = normalizeTrackerState({
    currentTask: 'Ship the release',
    history: [{ id: 1, text: 'Draft the update', from: '2026-01-01T00:00:00.000Z' }],
  });

  assert.equal(normalized.currentTask, 'Ship the release');
  assert.equal(normalized.nextTask, '');
  assert.equal(normalized.history[0].text, 'Draft the update');
  assert.equal(normalized.showOriginal, false);
});

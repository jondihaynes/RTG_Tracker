import assert from 'node:assert/strict';
import test from 'node:test';
const trackerFlow = await import('../src/lib/tracker-flow.ts');
const {
  createQueuePushState,
  createRewordedCurrentTaskState,
  getVisibleCurrentTask,
} = trackerFlow;

test('createQueuePushState moves current task to history and keeps planned next task', () => {
  const state = {
    currentTask: 'Finish the launch deck',
    nextTask: 'Ship the release',
    currentSince: '2026-01-01T00:00:00.000Z',
    currentTaskPrevious: '',
    statusMessage: '',
    history: [],
  };

  const nextState = createQueuePushState(state, 'Write the follow-up plan');

  assert.equal(nextState.currentTask, 'Write the follow-up plan');
  assert.equal(nextState.nextTask, 'Ship the release');
  assert.equal(nextState.history[0].text, 'Finish the launch deck');
  assert.equal(nextState.currentTaskPrevious, '');
});

test('createRewordedCurrentTaskState preserves since time and stores prior wording', () => {
  const state = {
    currentTask: 'Review the PR',
    nextTask: '',
    currentSince: '2026-01-01T00:00:00.000Z',
    currentTaskPrevious: '',
    statusMessage: '',
    history: [],
  };

  const nextState = createRewordedCurrentTaskState(state, 'Review the pull request');

  assert.equal(nextState.currentTask, 'Review the pull request');
  assert.equal(nextState.currentSince, '2026-01-01T00:00:00.000Z');
  assert.equal(nextState.currentTaskPrevious, 'Review the PR');
});

test('getVisibleCurrentTask swaps between reworded and original wording', () => {
  const visible = getVisibleCurrentTask({
    currentTask: 'Ship the release',
    nextTask: '',
    statusMessage: '',
    history: [],
    currentTaskPrevious: 'Ship the update',
    showOriginal: true,
  });

  assert.equal(visible, 'Ship the update');
});
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSiteConfig } from './site-config';

test('createSiteConfig falls back to unprefixed environment variables', () => {
  const config = createSiteConfig({
    APP_NAME: 'Fallback app',
    OWNER_NAME: 'Fallback owner',
    PAGE_TITLE: 'Fallback title',
    PAGE_DESCRIPTION: 'Fallback description',
    STATE_STORAGE_KEY: 'fallback-state',
    AUTH_STORAGE_KEY: 'fallback-auth',
    SYNC_EVENT_NAME: 'fallback-sync',
    AUTH_CODE: '4321',
  } as Record<string, string | undefined>);

  assert.equal(config.appName, 'Fallback app');
  assert.equal(config.ownerName, 'Fallback owner');
  assert.equal(config.pageTitle, 'Fallback title');
  assert.equal(config.pageDescription, 'Fallback description');
  assert.equal(config.stateStorageKey, 'fallback-state');
  assert.equal(config.authStorageKey, 'fallback-auth');
  assert.equal(config.syncEventName, 'fallback-sync');
  assert.equal(config.authCode, '4321');
});

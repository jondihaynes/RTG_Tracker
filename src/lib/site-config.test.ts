import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSiteConfig } from './site-config.ts';

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

test('createSiteConfig loads values from .env when .env.local is not present', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtg-site-config-'));
  const envPath = path.join(tempDir, '.env');

  fs.writeFileSync(envPath, 'NEXT_PUBLIC_APP_NAME=From .env\nAPP_NAME=From .env fallback\n');

  const originalCwd = process.cwd();

  try {
    process.chdir(tempDir);
    const config = createSiteConfig();

    assert.equal(config.appName, 'From .env');
    assert.equal(config.ownerName, 'Your Name');
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('createSiteConfig prefers .env.local over .env', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtg-site-config-'));
  fs.writeFileSync(path.join(tempDir, '.env'), 'NEXT_PUBLIC_APP_NAME=From .env\n');
  fs.writeFileSync(path.join(tempDir, '.env.local'), 'NEXT_PUBLIC_APP_NAME=From .env.local\n');

  const originalCwd = process.cwd();

  try {
    process.chdir(tempDir);
    const config = createSiteConfig();

    assert.equal(config.appName, 'From .env.local');
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('createSiteConfig warns when a value falls back to the built-in default', () => {
  const warn = console.warn;
  const calls: string[] = [];

  console.warn = (message?: unknown) => {
    calls.push(String(message));
  };

  try {
    const config = createSiteConfig({} as Record<string, string | undefined>);
    assert.equal(config.appName, 'Ready to Go');
    assert.equal(calls.length > 0, true);
    assert.match(calls.join('\n'), /NEXT_PUBLIC_APP_NAME/);
  } finally {
    console.warn = warn;
  }
});

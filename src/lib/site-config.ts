const defaults = {
  appName: 'Ready to Go',
  ownerName: 'Your Name',
  pageTitle: 'Ready to Go Status',
  pageDescription: 'A clean live status page for your current focus, next task, and recent history.',
  stateStorageKey: 'ready-to-go-tracker-state',
  authStorageKey: 'ready-to-go-tracker-auth',
  syncEventName: 'ready-to-go-tracker-sync',
  authCode: '1111',
};

const readEnv = (key: string, fallback: string) => {
  const value = process.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
};

const config = {
  appName: readEnv('NEXT_PUBLIC_APP_NAME', defaults.appName),
  ownerName: readEnv('NEXT_PUBLIC_OWNER_NAME', defaults.ownerName),
  pageTitle: readEnv('NEXT_PUBLIC_PAGE_TITLE', defaults.pageTitle),
  pageDescription: readEnv('NEXT_PUBLIC_PAGE_DESCRIPTION', defaults.pageDescription),
  stateStorageKey: readEnv('NEXT_PUBLIC_STATE_STORAGE_KEY', defaults.stateStorageKey),
  authStorageKey: readEnv('NEXT_PUBLIC_AUTH_STORAGE_KEY', defaults.authStorageKey),
  syncEventName: readEnv('NEXT_PUBLIC_SYNC_EVENT_NAME', defaults.syncEventName),
  authCode: readEnv('NEXT_PUBLIC_AUTH_CODE', defaults.authCode),
};

export const siteConfig = {
  ...config,
  getCurrentHeading: (name = config.ownerName) => `What is ${name} doing?`,
  getCurrentSentence: (name = config.ownerName) => `${name} is currently`,
  getHistoryHeading: (name = config.ownerName) => `What ${name} was doing recently`,
  getUpdateHeading: (name = config.ownerName) => `Update what ${name} is doing now`,
  getAuthHeading: (name = config.ownerName) => `Sign in as ${name}`,
  getCurrentLabel: (name = config.ownerName) => `What ${name} is doing now`,
  getNextLabel: (name = config.ownerName) => `What ${name} is doing next`,
  getCurrentPlaceholder: (name = config.ownerName) => `What is ${name} doing right now?`,
};

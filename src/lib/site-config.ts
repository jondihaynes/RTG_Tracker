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

const warnOnFallback = (key: string, fallback: string) => {
  const hasNextPublic = typeof process.env[key] === 'string' && process.env[key]?.trim();
  const hasLegacy = typeof process.env[key.replace('NEXT_PUBLIC_', '')] === 'string' && process.env[key.replace('NEXT_PUBLIC_', '')]?.trim();

  if (!hasNextPublic && !hasLegacy) {
    console.warn(`[site-config] ${key} was not found in process.env; using default: ${fallback}`);
  }
};

const readEnv = (env: Record<string, string | undefined>, key: string, fallback: string) => {
  const value = env[key] ?? env[key.replace('NEXT_PUBLIC_', '')];
  const hasValue = typeof value === 'string' && value.trim();

  if (!hasValue) {
    warnOnFallback(key, fallback);
    return fallback;
  }

  return value.trim();
};

export const createSiteConfig = (env: Record<string, string | undefined> = process.env) => {
  const config = {
    appName: readEnv(env, 'NEXT_PUBLIC_APP_NAME', defaults.appName),
    ownerName: readEnv(env, 'NEXT_PUBLIC_OWNER_NAME', defaults.ownerName),
    pageTitle: readEnv(env, 'NEXT_PUBLIC_PAGE_TITLE', defaults.pageTitle),
    pageDescription: readEnv(env, 'NEXT_PUBLIC_PAGE_DESCRIPTION', defaults.pageDescription),
    stateStorageKey: readEnv(env, 'NEXT_PUBLIC_STATE_STORAGE_KEY', defaults.stateStorageKey),
    authStorageKey: readEnv(env, 'NEXT_PUBLIC_AUTH_STORAGE_KEY', defaults.authStorageKey),
    syncEventName: readEnv(env, 'NEXT_PUBLIC_SYNC_EVENT_NAME', defaults.syncEventName),
    authCode: readEnv(env, 'NEXT_PUBLIC_AUTH_CODE', defaults.authCode),
  };

  return {
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
};

export const siteConfig = createSiteConfig();

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

const warnOnFallback = (key: string, fallback: string, legacyKey?: string) => {
  const target = legacyKey ? `${key} or ${legacyKey}` : key;
  console.warn(`[site-config] ${target} was not found in environment; using default: ${fallback}`);
};

const readEnv = (
  env: Record<string, string | undefined>,
  nextPublicKey: string,
  legacyKey: string,
  fallback: string,
) => {
  const nextPublicValue = env[nextPublicKey] ?? process.env[nextPublicKey];
  const legacyValue = env[legacyKey] ?? process.env[legacyKey];

  if (typeof nextPublicValue === 'string' && nextPublicValue.trim()) {
    return nextPublicValue.trim();
  }

  if (typeof legacyValue === 'string' && legacyValue.trim()) {
    return legacyValue.trim();
  }

  warnOnFallback(nextPublicKey, fallback, legacyKey);
  return fallback;
};

export const createSiteConfig = (env: Record<string, string | undefined> = process.env) => {
  const config = {
    appName: readEnv(env, 'NEXT_PUBLIC_APP_NAME', 'APP_NAME', defaults.appName),
    ownerName: readEnv(env, 'NEXT_PUBLIC_OWNER_NAME', 'OWNER_NAME', defaults.ownerName),
    pageTitle: readEnv(env, 'NEXT_PUBLIC_PAGE_TITLE', 'PAGE_TITLE', defaults.pageTitle),
    pageDescription: readEnv(env, 'NEXT_PUBLIC_PAGE_DESCRIPTION', 'PAGE_DESCRIPTION', defaults.pageDescription),
    stateStorageKey: readEnv(env, 'NEXT_PUBLIC_STATE_STORAGE_KEY', 'STATE_STORAGE_KEY', defaults.stateStorageKey),
    authStorageKey: readEnv(env, 'NEXT_PUBLIC_AUTH_STORAGE_KEY', 'AUTH_STORAGE_KEY', defaults.authStorageKey),
    syncEventName: readEnv(env, 'NEXT_PUBLIC_SYNC_EVENT_NAME', 'SYNC_EVENT_NAME', defaults.syncEventName),
    authCode: readEnv(env, 'NEXT_PUBLIC_AUTH_CODE', 'AUTH_CODE', defaults.authCode),
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

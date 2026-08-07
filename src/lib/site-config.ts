export type SiteConfigViewModel = {
  appName: string;
  ownerName: string;
  pageTitle: string;
  pageDescription: string;
  stateStorageKey: string;
  authStorageKey: string;
  syncEventName: string;
  authCode: string;
  currentHeading: string;
  currentSentence: string;
  historyHeading: string;
  updateHeading: string;
  authHeading: string;
  currentLabel: string;
  nextLabel: string;
  currentPlaceholder: string;
};

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

const getTrimmedValue = (value: string | undefined) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return undefined;
};

// nextPublicValue/legacyValue must be passed in as literal `process.env.NEXT_PUBLIC_X` expressions
// at the call site so Next.js can statically inline them into client bundles.
const readEnv = (
  nextPublicValue: string | undefined,
  legacyValue: string | undefined,
  fallback: string,
  nextPublicKey: string,
  legacyKey: string,
) => {
  const trimmedNextPublicValue = getTrimmedValue(nextPublicValue);
  if (trimmedNextPublicValue) {
    return trimmedNextPublicValue;
  }

  const trimmedLegacyValue = getTrimmedValue(legacyValue);
  if (trimmedLegacyValue) {
    return trimmedLegacyValue;
  }

  warnOnFallback(nextPublicKey, fallback, legacyKey);
  return fallback;
};

export const createSiteConfig = (env: Record<string, string | undefined> = {}) => {
  const config = {
    appName: readEnv(
      env.NEXT_PUBLIC_APP_NAME ?? process.env.NEXT_PUBLIC_APP_NAME,
      env.APP_NAME ?? process.env.APP_NAME,
      defaults.appName,
      'NEXT_PUBLIC_APP_NAME',
      'APP_NAME',
    ),
    ownerName: readEnv(
      env.NEXT_PUBLIC_OWNER_NAME ?? process.env.NEXT_PUBLIC_OWNER_NAME,
      env.OWNER_NAME ?? process.env.OWNER_NAME,
      defaults.ownerName,
      'NEXT_PUBLIC_OWNER_NAME',
      'OWNER_NAME',
    ),
    pageTitle: readEnv(
      env.NEXT_PUBLIC_PAGE_TITLE ?? process.env.NEXT_PUBLIC_PAGE_TITLE,
      env.PAGE_TITLE ?? process.env.PAGE_TITLE,
      defaults.pageTitle,
      'NEXT_PUBLIC_PAGE_TITLE',
      'PAGE_TITLE',
    ),
    pageDescription: readEnv(
      env.NEXT_PUBLIC_PAGE_DESCRIPTION ?? process.env.NEXT_PUBLIC_PAGE_DESCRIPTION,
      env.PAGE_DESCRIPTION ?? process.env.PAGE_DESCRIPTION,
      defaults.pageDescription,
      'NEXT_PUBLIC_PAGE_DESCRIPTION',
      'PAGE_DESCRIPTION',
    ),
    stateStorageKey: readEnv(
      env.NEXT_PUBLIC_STATE_STORAGE_KEY ?? process.env.NEXT_PUBLIC_STATE_STORAGE_KEY,
      env.STATE_STORAGE_KEY ?? process.env.STATE_STORAGE_KEY,
      defaults.stateStorageKey,
      'NEXT_PUBLIC_STATE_STORAGE_KEY',
      'STATE_STORAGE_KEY',
    ),
    authStorageKey: readEnv(
      env.NEXT_PUBLIC_AUTH_STORAGE_KEY ?? process.env.NEXT_PUBLIC_AUTH_STORAGE_KEY,
      env.AUTH_STORAGE_KEY ?? process.env.AUTH_STORAGE_KEY,
      defaults.authStorageKey,
      'NEXT_PUBLIC_AUTH_STORAGE_KEY',
      'AUTH_STORAGE_KEY',
    ),
    syncEventName: readEnv(
      env.NEXT_PUBLIC_SYNC_EVENT_NAME ?? process.env.NEXT_PUBLIC_SYNC_EVENT_NAME,
      env.SYNC_EVENT_NAME ?? process.env.SYNC_EVENT_NAME,
      defaults.syncEventName,
      'NEXT_PUBLIC_SYNC_EVENT_NAME',
      'SYNC_EVENT_NAME',
    ),
    authCode: readEnv(
      env.NEXT_PUBLIC_AUTH_CODE ?? process.env.NEXT_PUBLIC_AUTH_CODE,
      env.AUTH_CODE ?? process.env.AUTH_CODE,
      defaults.authCode,
      'NEXT_PUBLIC_AUTH_CODE',
      'AUTH_CODE',
    ),
  };

  const viewModel: SiteConfigViewModel = {
    ...config,
    currentHeading: `What is ${config.ownerName} doing?`,
    currentSentence: `${config.ownerName} is currently`,
    historyHeading: `What ${config.ownerName} was doing recently`,
    updateHeading: `Update what ${config.ownerName} is doing now`,
    authHeading: `Sign in as ${config.ownerName}`,
    currentLabel: `What ${config.ownerName} is doing now`,
    nextLabel: `What ${config.ownerName} is doing next`,
    currentPlaceholder: `What is ${config.ownerName} doing right now?`,
  };

  return viewModel;
};

export const siteConfig = createSiteConfig();

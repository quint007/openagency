export const COOKIE_CONSENT_STORAGE_KEY = "open-agency-cookie-consent";
export const COOKIE_CONSENT_STORAGE_VERSION = 1;

export type CookieConsent = {
  essential: true;
  analytics: boolean;
  ads: boolean;
};

export type CookieConsentUpdate = Partial<Pick<CookieConsent, "analytics" | "ads">>;

export const DEFAULT_COOKIE_CONSENT: CookieConsent = {
  essential: true,
  analytics: false,
  ads: false,
};

type StoredCookieConsent = {
  readonly version: typeof COOKIE_CONSENT_STORAGE_VERSION;
  readonly consent: CookieConsent;
};

const consentListeners = new Set<() => void>();

function isCookieConsent(value: unknown): value is CookieConsent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    candidate.essential === true &&
    typeof candidate.analytics === "boolean" &&
    typeof candidate.ads === "boolean"
  );
}

function isStoredCookieConsent(value: unknown): value is StoredCookieConsent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return candidate.version === COOKIE_CONSENT_STORAGE_VERSION && isCookieConsent(candidate.consent);
}

export function parseStoredConsent(storedValue: string | null): CookieConsent | null {
  try {
    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (isCookieConsent(parsedValue)) {
      return DEFAULT_COOKIE_CONSENT;
    }

    if (isStoredCookieConsent(parsedValue)) {
      return parsedValue.consent;
    }

    return null;
  } catch {
    return null;
  }
}

export function serializeConsent(consent: CookieConsent): string {
  const storedConsent: StoredCookieConsent = {
    version: COOKIE_CONSENT_STORAGE_VERSION,
    consent,
  };

  return JSON.stringify(storedConsent);
}

export function getStoredConsentSnapshot(): string | null {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getServerConsentSnapshot(): null {
  return null;
}

export function subscribeToConsent(listener: () => void): () => void {
  consentListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === COOKIE_CONSENT_STORAGE_KEY) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    consentListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function persistConsent(consent: CookieConsent): boolean {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, serializeConsent(consent));
  } catch {
    return false;
  }

  for (const listener of consentListeners) {
    listener();
  }

  return true;
}

"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import type { CookieIntegrationConfig } from "./cookie-config";
import { cookieIntegrationConfig } from "./cookie-config";
import { reloadPage } from "./browser";

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

type CookieConsentContextValue = {
  acceptAll: () => void;
  acceptEssentialOnly: () => void;
  closePreferences: () => void;
  consent: CookieConsent;
  hasDecided: boolean;
  isHydrated: boolean;
  isPreferencesOpen: boolean;
  openPreferences: () => void;
  updateConsent: (updates: CookieConsentUpdate) => void;
};

type StoredCookieConsent = {
  readonly version: typeof COOKIE_CONSENT_STORAGE_VERSION;
  readonly consent: CookieConsent;
};

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);
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

function parseStoredConsent(storedValue: string | null): CookieConsent | null {
  try {
    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (isCookieConsent(parsedValue)) {
      return normalizeCookieConsent(parsedValue);
    }

    if (isStoredCookieConsent(parsedValue)) {
      return normalizeCookieConsent(parsedValue.consent);
    }

    return null;
  } catch {
    return null;
  }
}

function isStoredCookieConsent(value: unknown): value is StoredCookieConsent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return candidate.version === COOKIE_CONSENT_STORAGE_VERSION && isCookieConsent(candidate.consent);
}

export function normalizeCookieConsent(
  consent: CookieConsent,
  config: Pick<CookieIntegrationConfig, "hasAds" | "hasAnalytics"> = cookieIntegrationConfig,
): CookieConsent {
  return {
    essential: true,
    analytics: config.hasAnalytics && consent.analytics,
    ads: config.hasAds && consent.ads,
  };
}

function serializeConsent(consent: CookieConsent): string {
  const version = COOKIE_CONSENT_STORAGE_VERSION;
  const storedConsent: StoredCookieConsent = {
    version,
    consent,
  };

  return JSON.stringify(storedConsent);
}

function getStoredConsentSnapshot() {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerConsentSnapshot() {
  return null;
}

function subscribeToConsent(listener: () => void) {
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

function persistConsent(consent: CookieConsent) {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, serializeConsent(consent));
  } catch {
  }

  for (const listener of consentListeners) {
    listener();
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const storedConsentValue = useSyncExternalStore(
    subscribeToConsent,
    getStoredConsentSnapshot,
    getServerConsentSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [sessionConsent, setSessionConsent] = useState<CookieConsent | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const storedConsent = parseStoredConsent(storedConsentValue);
  const consent = sessionConsent ?? storedConsent ?? DEFAULT_COOKIE_CONSENT;
  const hasDecided = sessionConsent !== null || storedConsent !== null;

  const commitConsent = useCallback((nextConsent: CookieConsent) => {
    const normalizedConsent = normalizeCookieConsent(nextConsent);
    const previousConsent = sessionConsent ?? storedConsent ?? DEFAULT_COOKIE_CONSENT;
    const revokedOptionalConsent =
      (previousConsent.analytics && !normalizedConsent.analytics) ||
      (previousConsent.ads && !normalizedConsent.ads);

    setSessionConsent(normalizedConsent);
    setIsPreferencesOpen(false);
    persistConsent(normalizedConsent);

    if (revokedOptionalConsent) {
      reloadPage();
    }
  }, [sessionConsent, storedConsent]);

  useEffect(() => {
    if (!isHydrated || !storedConsentValue || !storedConsent) {
      return;
    }

    const canonicalValue = serializeConsent(storedConsent);

    if (storedConsentValue !== canonicalValue) {
      persistConsent(storedConsent);
    }
  }, [isHydrated, storedConsent, storedConsentValue]);

  const acceptAll = useCallback(() => {
    commitConsent({ essential: true, analytics: true, ads: true });
  }, [commitConsent]);

  const acceptEssentialOnly = useCallback(() => {
    commitConsent(DEFAULT_COOKIE_CONSENT);
  }, [commitConsent]);

  const updateConsent = useCallback(
    (updates: CookieConsentUpdate) => {
      commitConsent({ ...consent, ...updates, essential: true });
    },
    [commitConsent, consent],
  );

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  const contextValue = useMemo<CookieConsentContextValue>(
    () => ({
      acceptAll,
      acceptEssentialOnly,
      closePreferences,
      consent,
      hasDecided,
      isHydrated,
      isPreferencesOpen,
      openPreferences,
      updateConsent,
    }),
    [
      acceptAll,
      acceptEssentialOnly,
      closePreferences,
      consent,
      hasDecided,
      isHydrated,
      isPreferencesOpen,
      openPreferences,
      updateConsent,
    ],
  );

  return <CookieConsentContext.Provider value={contextValue}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }

  return context;
}

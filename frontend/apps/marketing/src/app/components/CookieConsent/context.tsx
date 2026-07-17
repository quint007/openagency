"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export const COOKIE_CONSENT_STORAGE_KEY = "open-agency-cookie-consent";

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
    return isCookieConsent(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
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
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
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
    setSessionConsent(nextConsent);
    setIsPreferencesOpen(false);
    persistConsent(nextConsent);
  }, []);

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

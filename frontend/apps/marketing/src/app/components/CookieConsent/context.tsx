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
import {
  DEFAULT_COOKIE_CONSENT,
  getServerConsentSnapshot,
  getStoredConsentSnapshot,
  parseStoredConsent,
  persistConsent,
  serializeConsent,
  subscribeToConsent,
  type CookieConsent,
  type CookieConsentUpdate,
} from "./storage";

export {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_STORAGE_VERSION,
  DEFAULT_COOKIE_CONSENT,
  type CookieConsent,
  type CookieConsentUpdate,
} from "./storage";

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

export function normalizeCookieConsent(
  consent: CookieConsent,
  config: Pick<CookieIntegrationConfig, "hasAds" | "hasAnalytics"> = cookieIntegrationConfig,
): CookieConsent {
  const analyticsForConfiguredIntegrations = config.hasAnalytics && consent.analytics;
  const adsForConfiguredIntegrations = config.hasAds && consent.ads;

  return {
    essential: true,
    analytics: analyticsForConfiguredIntegrations,
    ads: adsForConfiguredIntegrations,
  };
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
    const optionalConsentWasRevoked =
      (previousConsent.analytics && !normalizedConsent.analytics) ||
      (previousConsent.ads && !normalizedConsent.ads);

    setSessionConsent(normalizedConsent);
    setIsPreferencesOpen(false);
    const didPersist = persistConsent(normalizedConsent);

    if (didPersist && optionalConsentWasRevoked) {
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

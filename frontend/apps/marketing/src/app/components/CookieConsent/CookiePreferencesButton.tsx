"use client";

import { Button } from "@open-agency/ui";

import { useCookieConsent } from "./context";

export function CookiePreferencesButton() {
  const { openPreferences } = useCookieConsent();

  return (
    <Button type="button" variant="outline" className="min-h-11 px-5" onClick={openPreferences}>
      Open cookie settings
    </Button>
  );
}

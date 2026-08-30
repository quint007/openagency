"use client";

import { useEffect } from "react";

import "./globals.css";
import { StatusPage } from "./components/StatusPage";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)]">
          <StatusPage
            action={(
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_55%,transparent)] px-6 text-sm font-semibold text-[var(--brand-primary-light)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--brand-primary)_10%,transparent)]"
              >
                Reload interface
              </button>
            )}
            code="Critical error"
            description="The application shell could not finish loading. Try rebuilding the interface, or return home."
            title="Open Agency needs a reset."
          />
        </main>
      </body>
    </html>
  );
}

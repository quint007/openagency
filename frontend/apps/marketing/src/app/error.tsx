"use client";

import { useEffect } from "react";

import { MarketingPageFrame } from "./components/MarketingPageFrame";
import { StatusPage } from "./components/StatusPage";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MarketingPageFrame mainClassName="flex flex-1 flex-col">
      <StatusPage
        action={(
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_55%,transparent)] px-6 text-sm font-semibold text-[var(--brand-primary-light)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--brand-primary)_10%,transparent)]"
          >
            Try again
          </button>
        )}
        code="Runtime error"
        description="The page hit an unexpected problem. Retry the request, or return to a stable part of the site."
        title="The system lost the thread."
      />
    </MarketingPageFrame>
  );
}

"use client";

import { FeedbackProvider, useFeedback, useOptionalFeedback } from "./FeedbackProvider";

function FooterFeedbackButton() {
  const { openFeedback } = useFeedback();

  return (
    <button
      type="button"
      className="inline-flex items-center text-[var(--on-surface-variant)] transition-colors hover:text-[var(--on-surface)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
      onClick={openFeedback}
      aria-haspopup="dialog"
    >
      Share feedback
    </button>
  );
}

export function FooterFeedbackLink() {
  const context = useOptionalFeedback();

  if (context) {
    return <FooterFeedbackButton />;
  }

  return (
    <FeedbackProvider>
      <FooterFeedbackButton />
    </FeedbackProvider>
  );
}

"use client";

import { Comment } from "pixelarticons/react/Comment";
import { useEffect, useState } from "react";

import { useCookieConsent } from "../CookieConsent/context";
import { useFeedback } from "./FeedbackProvider";

export function FeedbackButton() {
  const { openFeedback } = useFeedback();
  const { hasDecided, isHydrated } = useCookieConsent();
  const [cookieBannerHeight, setCookieBannerHeight] = useState(0);

  useEffect(() => {
    if (!isHydrated || hasDecided) {
      return;
    }

    const cookieBanner = document.querySelector<HTMLElement>("[data-cookie-banner]");

    if (!cookieBanner) {
      return;
    }

    const updateOffset = () => {
      setCookieBannerHeight(cookieBanner.getBoundingClientRect().height);
    };
    const animationFrame = window.requestAnimationFrame(updateOffset);
    const resizeObserver = new ResizeObserver(updateOffset);
    resizeObserver.observe(cookieBanner);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [hasDecided, isHydrated]);

  const safeAreaStyle = cookieBannerHeight > 0 && isHydrated && !hasDecided
    ? { bottom: `calc(${cookieBannerHeight}px + 2rem)` }
    : undefined;

  return (
    <button
      type="button"
      className="fixed right-4 bottom-4 z-[61] hidden min-h-11 items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-highest)_96%,transparent)] px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--on-surface)] shadow-[0_12px_28px_color-mix(in_srgb,var(--brand-primary)_16%,transparent)] backdrop-blur-xl transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:border-[var(--brand-primary)] hover:bg-[var(--surface-container-high)] hover:text-[var(--brand-primary-light)] hover:shadow-[0_16px_36px_color-mix(in_srgb,var(--brand-primary)_24%,transparent)] focus-visible:border-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)] active:translate-y-px sm:inline-flex"
      onClick={openFeedback}
      aria-haspopup="dialog"
      aria-label="Share feedback"
      style={safeAreaStyle}
    >
      <Comment aria-hidden="true" className="size-4" />
      Share feedback
    </button>
  );
}

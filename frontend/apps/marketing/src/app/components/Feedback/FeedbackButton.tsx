"use client";

import { Comment } from "pixelarticons/react/Comment";
import { useEffect, useLayoutEffect, useState } from "react";

import { useCookieConsent } from "../CookieConsent/context";
import { useFeedback } from "./FeedbackProvider";

export function FeedbackButton() {
  const { openFeedback } = useFeedback();
  const { hasDecided, isHydrated } = useCookieConsent();
  const [cookieOverlayBottomOffset, setCookieOverlayBottomOffset] = useState(130);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateMenuState = () => {
      setIsMobileMenuOpen(document.body.dataset.mobileMenuOpen === "true");
    };

    updateMenuState();
    const mutationObserver = new MutationObserver(updateMenuState);
    mutationObserver.observe(document.body, { attributeFilter: ["data-mobile-menu-open"], attributes: true });

    return () => mutationObserver.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!isHydrated) {
      return;
    }

    const findCookieOverlay = () => {
      const visibleOverlays = Array.from(document.querySelectorAll<HTMLElement>(
        "[data-cookie-banner], [data-cookie-settings]",
      )).filter((element) => {
        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return styles.display !== "none" && styles.visibility !== "hidden" && rect.height > 0;
      });

      return visibleOverlays.find((element) => element.hasAttribute("data-cookie-settings")) ?? visibleOverlays[0];
    };
    const initialCookieOverlay = findCookieOverlay();

    const updateOffset = () => {
      const cookieOverlay = findCookieOverlay();
      const overlayBottomOffset = cookieOverlay
        ? window.innerHeight - cookieOverlay.getBoundingClientRect().top
        : 0;
      const button = document.querySelector<HTMLElement>('button[aria-label="Share feedback"]');
      const buttonRect = button?.getBoundingClientRect();
      const buttonHeight = buttonRect?.height ?? 0;
      const spacing = hasDecided ? 16 : 32;
      let bottomOffset = Math.max(overlayBottomOffset + spacing, 16);

      if (buttonHeight > 0) {
        const buttonBlockers = Array.from(document.querySelectorAll<HTMLElement>(
          "header, [data-cookie-banner], [data-cookie-settings], main a, main button, footer a, footer button",
        )).filter((element) => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);

          return element !== button && styles.display !== "none" && styles.visibility !== "hidden" &&
            styles.pointerEvents !== "none" && rect.bottom > 0 && rect.top < window.innerHeight &&
            rect.right > 0 && rect.left < window.innerWidth;
        });

        const blockerRects = buttonBlockers.map((blocker) => blocker.getBoundingClientRect());
        const minTop = 16;
        const maxTop = window.innerHeight - bottomOffset - buttonHeight;
        const candidateTops = [
          maxTop,
          ...blockerRects.flatMap((rect) => [rect.bottom + spacing, rect.top - spacing - buttonHeight]),
        ]
          .map((top) => Math.min(Math.max(top, minTop), maxTop))
          .filter((top, index, tops) => tops.indexOf(top) === index)
          .sort((first, second) => second - first);
        const slotTop = candidateTops.find((top) => {
          const candidateBottom = top + buttonHeight;

          return blockerRects.every((rect) =>
            top >= rect.bottom || candidateBottom <= rect.top ||
            buttonRect === undefined || buttonRect.left >= rect.right || buttonRect.right <= rect.left,
          );
        });

        if (slotTop !== undefined) {
          bottomOffset = window.innerHeight - slotTop - buttonHeight;
        }
      }

      setCookieOverlayBottomOffset((currentOffset) => currentOffset === bottomOffset ? currentOffset : bottomOffset);
      if (buttonRect && Math.abs(buttonRect.bottom - (window.innerHeight - bottomOffset)) > 0.5) {
        scheduleUpdate();
      }
    };
    let animationFrame: number | null = null;
    const scheduleUpdate = () => {
      if (animationFrame !== null) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        updateOffset();
      });
    };
    scheduleUpdate();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleUpdate);
    if (initialCookieOverlay && resizeObserver) {
      resizeObserver.observe(initialCookieOverlay);
    }
    const domObserver = new MutationObserver(scheduleUpdate);
    domObserver.observe(document.body, {
      attributeFilter: ["class", "data-cookie-banner", "data-cookie-settings"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    let isActive = true;
    document.fonts?.ready.then(() => {
      if (isActive) {
        scheduleUpdate();
      }
    });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });

    return () => {
      isActive = false;
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver?.disconnect();
      domObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
    };
  }, [hasDecided, isHydrated]);

  const effectiveBottomOffset = hasDecided ? Math.max(cookieOverlayBottomOffset, 130) : cookieOverlayBottomOffset;
  const safeAreaStyle = effectiveBottomOffset > 0 && isHydrated
    ? { bottom: `${effectiveBottomOffset}px` }
    : undefined;
  const visibilityClass = isMobileMenuOpen ? "hidden" : !isHydrated || !hasDecided ? "hidden sm:inline-flex" : "inline-flex";

  return (
    <button
      type="button"
      className={`${visibilityClass} fixed right-4 bottom-4 z-[49] min-h-11 items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-highest)_96%,transparent)] px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--on-surface)] shadow-[0_12px_28px_color-mix(in_srgb,var(--brand-primary)_16%,transparent)] backdrop-blur-xl transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:border-[var(--brand-primary)] hover:bg-[var(--surface-container-high)] hover:text-[var(--brand-primary-light)] hover:shadow-[0_16px_36px_color-mix(in_srgb,var(--brand-primary)_24%,transparent)] focus-visible:border-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--brand-primary)_30%,transparent)] active:translate-y-px sm:z-[61]`}
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

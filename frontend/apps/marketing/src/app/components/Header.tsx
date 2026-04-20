"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@open-agency/ui";
import { ArrowRight } from "pixelarticons/react/ArrowRight";
import { Cancel } from "pixelarticons/react/Cancel";
import { ExternalLink } from "pixelarticons/react/ExternalLink";
import { Menu } from "pixelarticons/react/Menu";
import styles from "../page.module.css";
import { homepageContent } from "../homepage-content";

type HeaderProps = {
  brand: ReactNode;
};

export function Header({ brand }: HeaderProps) {
  const { header } = homepageContent;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const shellClassName = "mx-auto flex w-full max-w-[100rem] items-center gap-4 px-4 sm:px-6 lg:px-8";

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? "border-[color:color-mix(in_srgb,var(--outline-variant)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className={`${shellClassName} justify-between py-4`}>
        <div className="flex min-w-0 items-center gap-6 lg:gap-10">
          <div className="shrink-0">{brand}</div>

          <nav
            className="hidden items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-high)_72%,transparent)] px-2 py-2 lg:flex"
            aria-label={header.navigationLabel}
          >
            {header.links.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`${styles.navLink} inline-flex items-center rounded-full px-4 py-2 text-sm transition-colors hover:bg-[color:color-mix(in_srgb,var(--brand-primary)_10%,transparent)]`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="https://github.com/open-agency"
            className="inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-4 py-2 text-sm text-[var(--on-surface-variant)] transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)] hover:text-[var(--on-surface)]"
          >
            <ExternalLink className="size-5" />
            Open source
          </a>

          <Button className="min-h-11 px-6" render={<a href={header.primaryCta.href} />} nativeButton={false}>
            {header.primaryCta.label}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-high)_72%,transparent)] text-[var(--on-surface)] lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="marketing-mobile-menu"
          aria-label={open ? "Close menu" : header.menuLabel}
        >
          {open ? <Cancel className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="marketing-mobile-menu"
          className="border-t border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-xl lg:hidden"
        >
          <div className={`${shellClassName} flex-col items-stretch gap-6 py-6`}>
            <nav className="flex flex-col gap-2" aria-label={header.mobileNavigationLabel}>
              {header.links.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-[color:color-mix(in_srgb,var(--outline-variant)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-high)_78%,transparent)] px-4 py-4 text-sm text-[var(--on-surface)]"
                  onClick={() => setOpen(false)}
                >
                  <span>{item.label}</span>
                  <ArrowRight className="size-5 text-[var(--brand-primary)]" />
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-3">
              <a
                href="https://github.com/open-agency"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-4 py-3 text-sm text-[var(--on-surface-variant)]"
              >
                <ExternalLink className="size-5" />
                Open source
              </a>

              <Button className="min-h-11 w-full px-6" render={<a href={header.primaryCta.href} />} nativeButton={false}>
                {header.primaryCta.label}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

"use client";

import { useRef, useState } from "react";
import { Button } from "@open-agency/ui";
import { ArrowLeft } from "pixelarticons/react/ArrowLeft";
import { ArrowRight } from "pixelarticons/react/ArrowRight";
import { BookOpen } from "pixelarticons/react/BookOpen";
import { Calendar } from "pixelarticons/react/Calendar";
import type { HomepageContent } from "../../homepage-content";
import styles from "../../page.module.css";

export type LatestGuideCard = {
  category: string;
  description: string;
  href: `/blog/${string}`;
  id: string;
  image: string;
  meta: string;
  title: string;
};

export type LatestGuidesSectionState =
  | {
      guides: LatestGuideCard[];
      kind: "ready";
    }
  | {
      kind: "empty" | "error";
    };

type LatestGuidesSectionProps = {
  content: HomepageContent["latestGuides"];
  state: LatestGuidesSectionState;
};

export function LatestGuidesSection({ content, state }: LatestGuidesSectionProps) {
  const guides = state.kind === "ready" ? state.guides : [];
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(guides.length > 1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  function updateScrollState() {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const cardWidth = viewport.firstElementChild?.firstElementChild?.clientWidth ?? 1;
    const index = Math.round(viewport.scrollLeft / (cardWidth + 20));

    setCanScrollPrev(viewport.scrollLeft > 8);
    setCanScrollNext(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 8);
    setSelectedIndex(Math.max(0, Math.min(guides.length - 1, index)));
  }

  function scrollByCard(direction: "prev" | "next") {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const amount = Math.round(viewport.clientWidth * 0.88) * (direction === "next" ? 1 : -1);

    viewport.scrollBy({ left: amount, behavior: "smooth" });
    window.setTimeout(updateScrollState, 250);
  }

  function scrollToCard(index: number) {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const card = viewport.querySelectorAll("article")[index];

    if (!(card instanceof HTMLElement)) {
      return;
    }

    viewport.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    window.setTimeout(updateScrollState, 250);
  }

  return (
    <section className="w-full" id="latest-guides" aria-labelledby="latest-guides-title">
      <div className={`${styles.sectionSurface} mx-auto flex w-full max-w-[100rem] flex-col gap-10 rounded-[2rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14`}>
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-[42rem] flex-col gap-4">
            <h2 className={styles.sectionTitle} id="latest-guides-title">
              {content.title}
            </h2>
            <p className={styles.sectionDescription}>{content.description}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button className="min-h-11 px-6" render={<a href={content.cta.href} />} nativeButton={false}>
              {content.cta.label}
              <ArrowRight data-icon="inline-end" />
            </Button>

            {state.kind === "ready" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] text-[var(--on-surface)] disabled:opacity-40"
                  onClick={() => scrollByCard("prev")}
                  disabled={!canScrollPrev}
                  aria-label="Previous post"
                >
                  <ArrowLeft className="size-5" />
                </button>

                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] text-[var(--on-surface)] disabled:opacity-40"
                  onClick={() => scrollByCard("next")}
                  disabled={!canScrollNext}
                  aria-label="Next post"
                >
                  <ArrowRight className="size-5" />
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {state.kind === "ready" ? (
          <>
            <div className="overflow-hidden" ref={viewportRef} onScroll={updateScrollState}>
              <div className="flex gap-5">
                {guides.map((post) => (
                  <article
                    key={post.id}
                    className="flex min-w-[18rem] shrink-0 basis-[86%] flex-col overflow-hidden rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] sm:basis-[62%] xl:basis-[32rem]"
                  >
                    <a href={post.href} className="flex h-full flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img src={post.image} alt={post.title} className="h-full w-full object-cover object-center" />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_12%,color-mix(in_srgb,var(--surface)_18%,transparent)_100%)]" />
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_25%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)] px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--brand-primary)] backdrop-blur-sm">
                          <BookOpen className="size-4" />
                          {post.category}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
                        <div className="flex items-center gap-3 text-sm text-[var(--on-surface-variant)]">
                          <Calendar className="size-4 text-[var(--brand-primary)]" />
                          <span>{post.meta}</span>
                        </div>

                        <div className="flex flex-col gap-4">
                          <h3 className="max-w-[18ch] text-[1.6rem] font-medium leading-tight tracking-[-0.04em] text-[var(--on-surface)]">
                            {post.title}
                          </h3>
                          <p className="text-base leading-8 text-[var(--on-surface-variant)]">{post.description}</p>
                        </div>

                        <span className="mt-auto inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                          Read article
                          <ArrowRight className="size-5" />
                        </span>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              {guides.map((post, index) => (
                <button
                  key={post.id}
                  type="button"
                  className={`h-2.5 rounded-full transition-all ${selectedIndex === index ? "w-8 bg-[var(--brand-primary)]" : "w-2.5 bg-[color:color-mix(in_srgb,var(--brand-primary)_22%,transparent)]"}`}
                  onClick={() => scrollToCard(index)}
                  aria-label={`Go to ${post.title}`}
                />
              ))}
            </div>
          </>
        ) : (
          <article className="flex flex-col gap-6 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] p-6 sm:p-7">
            <div className="flex flex-col gap-3">
              <h3 className="text-[1.6rem] font-medium leading-tight tracking-[-0.04em] text-[var(--on-surface)]">
                {state.kind === "empty" ? content.empty.title : content.error.title}
              </h3>
              <p className="max-w-[44rem] text-base leading-8 text-[var(--on-surface-variant)]">
                {state.kind === "empty" ? content.empty.body : content.error.body}
              </p>
            </div>

            <div>
              <Button
                className="min-h-11 px-6"
                render={<a href={state.kind === "empty" ? content.empty.cta.href : content.error.cta.href} />}
                nativeButton={false}
              >
                {state.kind === "empty" ? content.empty.cta.label : content.error.cta.label}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";

type StatusPageProps = {
  action?: ReactNode;
  code: string;
  description: string;
  title: string;
};

export function StatusPage({ action, code, description, title }: StatusPageProps) {
  return (
    <section className="relative flex min-h-[68vh] items-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,color-mix(in_srgb,var(--brand-primary)_18%,transparent),transparent_32rem)]"
      />
      <div className="relative mx-auto flex w-full max-w-[62rem] flex-col gap-8 rounded-[2rem] border border-[color:color-mix(in_srgb,var(--outline-variant)_50%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-container-lowest)_90%,transparent)] px-6 py-10 shadow-[0_2rem_6rem_color-mix(in_srgb,var(--brand-primary)_10%,transparent)] sm:px-10 sm:py-14 lg:px-14">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--on-surface-variant)]">
          <span className="rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-primary)_12%,transparent)] px-3 py-2 text-[var(--brand-primary-light)]">
            {code}
          </span>
          Open Agency system
        </div>
        <div className="flex max-w-[45rem] flex-col gap-5">
          <h1 className="max-w-[14ch] text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.9] tracking-[-0.065em] text-[var(--on-surface)] text-balance">
            {title}
          </h1>
          <p className="max-w-[38rem] text-base leading-8 text-[var(--on-surface-variant)] sm:text-lg">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {action}
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand-primary)] px-6 text-sm font-semibold text-[var(--on-primary)] transition-colors hover:bg-[var(--brand-primary-light)]"
          >
            Return home
          </Link>
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_55%,transparent)] px-6 text-sm text-[var(--on-surface-variant)] transition-colors hover:border-[color:color-mix(in_srgb,var(--brand-primary)_45%,transparent)] hover:text-[var(--on-surface)]"
          >
            Browse guides
          </Link>
        </div>
      </div>
    </section>
  );
}

// Temporary resource placeholder. Remove this component when the real content ships.
export function ComingSoonBadge() {
  return (
    <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[color:color-mix(in_srgb,var(--brand-primary)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-primary)_12%,transparent)] px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--brand-primary-light)] [font-family:var(--brand-font-heading)]">
      Coming soon
    </span>
  );
}

export function ComingSoonBanner() {
  return (
    <section className="px-4 sm:px-6 lg:px-8" aria-labelledby="coming-soon-title">
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--brand-primary)_30%,var(--outline-variant)_35%)] bg-[color:color-mix(in_srgb,var(--surface-container-low)_80%,transparent)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:rounded-[2rem] sm:px-8 sm:py-6">
        <div className="flex flex-col gap-4">
          <ComingSoonBadge />
          <div className="flex max-w-[44rem] flex-col gap-2">
            <h2 id="coming-soon-title" className="text-2xl font-semibold leading-tight text-[var(--on-surface)] sm:text-3xl [font-family:var(--brand-font-heading)]">
              Coming soon
            </h2>
            <p className="text-base leading-7 text-[var(--on-surface-variant)]">
              This section is being built. Check back for the first release.
            </p>
          </div>
        </div>
        <span className="text-sm uppercase tracking-[0.14em] text-[var(--brand-tertiary)] [font-family:var(--brand-font-heading)]">
          In progress
        </span>
      </div>
    </section>
  );
}

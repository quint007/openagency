import styles from "../page.module.css";

type BrandLockupProps = {
  markOnly?: boolean;
};

export function BrandLockup({ markOnly = false }: BrandLockupProps) {
  return (
    <div
      className={
        markOnly
          ? "inline-flex"
          : "inline-flex min-w-0 items-center gap-[var(--spacing-4)] max-[640px]:gap-[var(--spacing-3)]"
      }
      aria-label="Open Agency"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-11 shrink-0 text-[var(--brand-primary)]"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="2"
          width="36"
          height="36"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect x="17" y="5" width="6" height="6" fill="currentColor" />
        <rect x="29" y="17" width="6" height="6" fill="currentColor" />
        <rect x="17" y="29" width="6" height="6" fill="currentColor" />
        <rect x="5" y="17" width="6" height="6" fill="currentColor" />
        <rect x="16" y="16" width="8" height="8" fill="var(--brand-tertiary)" />
        <rect x="19" y="11" width="2" height="5" fill="currentColor" />
        <rect x="24" y="19" width="5" height="2" fill="currentColor" />
        <rect x="19" y="24" width="2" height="5" fill="currentColor" />
        <rect x="11" y="19" width="5" height="2" fill="currentColor" />
      </svg>
      {!markOnly ? (
        <div className="grid gap-[var(--spacing-1)]">
          <span className={styles.brandName}>
            OPEN AGENCY<span className={styles.brandDotIo}>.io</span>
          </span>
          <span className={`${styles.brandMeta} max-[640px]:hidden`}>
            The platform for AI knowledge
          </span>
        </div>
      ) : null}
    </div>
  );
}

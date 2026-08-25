"use client";

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import styles from './blog.module.css';

type BlogFiltersProps = {
  readonly selectedTag?: string | null;
  readonly tags: readonly string[];
};

type FilterChipProps = {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
};

function FilterChip({ active, label, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${active ? styles.chipActive : styles.chip} inline-flex min-h-10 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-4 py-2 text-sm transition-colors`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function BlogFilters({ selectedTag, tags }: BlogFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  function updateTag(value: string | null) {
    const nextParams = new URLSearchParams(query.toString());
    nextParams.delete('category');

    if (!value) {
      nextParams.delete('tag');
    } else if (nextParams.get('tag') === value) {
      nextParams.delete('tag');
    } else {
      nextParams.set('tag', value);
    }

    const nextQuery = nextParams.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  const hasActiveFilter = Boolean(selectedTag);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-labelledby="blog-filter-tags">
        <h2 id="blog-filter-tags" className={styles.metaText}>
          Filter by tag
        </h2>
        <div className="flex flex-wrap gap-3">
          <FilterChip active={!selectedTag} label="All tags" onClick={() => updateTag(null)} />
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              active={selectedTag === tag}
              label={`#${tag}`}
              onClick={() => updateTag(tag)}
            />
          ))}
        </div>
      </section>

      {hasActiveFilter ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push(pathname, { scroll: false })}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--outline-variant)_45%,transparent)] px-4 py-2 text-sm text-[var(--on-surface-variant)] transition-colors hover:border-[color:color-mix(in_srgb,var(--outline)_60%,transparent)] hover:text-[var(--on-surface)]"
          >
            Clear all filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

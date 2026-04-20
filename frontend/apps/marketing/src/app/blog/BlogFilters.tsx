"use client";

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import styles from './blog.module.css';

type BlogFiltersProps = {
  categories: string[];
  selectedCategory?: string | null;
  selectedTag?: string | null;
  tags: string[];
};

type FilterChipProps = {
  active: boolean;
  label: string;
  onClick: () => void;
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

export function BlogFilters({ categories, selectedCategory, selectedTag, tags }: BlogFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  function updateParam(name: 'category' | 'tag', value: string | null) {
    const nextParams = new URLSearchParams(query.toString());

    if (!value) {
      nextParams.delete(name);
    } else if (nextParams.get(name) === value) {
      nextParams.delete(name);
    } else {
      nextParams.set(name, value);
    }

    const nextQuery = nextParams.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-labelledby="blog-filter-categories">
        <h2 id="blog-filter-categories" className={styles.metaText}>
          Filter by category
        </h2>
        <div className="flex flex-wrap gap-3">
          <FilterChip active={!selectedCategory} label="All categories" onClick={() => updateParam('category', null)} />
          {categories.map((category) => (
            <FilterChip
              key={category}
              active={selectedCategory === category}
              label={category}
              onClick={() => updateParam('category', category)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="blog-filter-tags">
        <h2 id="blog-filter-tags" className={styles.metaText}>
          Filter by tag
        </h2>
        <div className="flex flex-wrap gap-3">
          <FilterChip active={!selectedTag} label="All tags" onClick={() => updateParam('tag', null)} />
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              active={selectedTag === tag}
              label={`#${tag}`}
              onClick={() => updateParam('tag', tag)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

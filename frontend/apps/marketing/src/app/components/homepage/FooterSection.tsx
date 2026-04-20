import { Separator } from "@open-agency/ui";
import { ExternalLink } from "pixelarticons/react/ExternalLink";
import { BrandLockup } from "../BrandLockup";
import { allowedFooterLinkHrefs, type HomepageContent, type HomepageFooterLinkHref } from "../../homepage-content";
import styles from "../../page.module.css";

type FooterSectionProps = {
  content: HomepageContent["footer"];
};

function getFooterTitleId(title: string) {
  return `footer-${title.toLowerCase().replace(/\s+/g, "-")}-title`;
}

const approvedFooterLinkHrefs = new Set<HomepageFooterLinkHref>(allowedFooterLinkHrefs);

function isApprovedFooterHref(href: string): href is HomepageFooterLinkHref {
  return approvedFooterLinkHrefs.has(href as HomepageFooterLinkHref);
}

export function FooterSection({ content }: FooterSectionProps) {
  const columns = content.columns
    .map((column) => ({
      ...column,
      links: column.links.filter((link) => isApprovedFooterHref(link.href)),
    }))
    .filter((column) => column.links.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-between xl:gap-16">
        <div className="flex max-w-[28rem] flex-1 flex-col gap-6">
          <BrandLockup />
          <p className={styles.footerLead}>{content.description}</p>
        </div>

        <div className="flex flex-1 flex-wrap gap-8 lg:justify-end lg:gap-12">
          {columns.map((column) => {
            const titleId = getFooterTitleId(column.title);

            return (
              <section key={column.title} className="flex min-w-[12rem] flex-1 basis-[12rem] flex-col gap-5" aria-labelledby={titleId}>
                <h2 className={styles.footerColumnTitle} id={titleId}>
                  {column.title}
                </h2>

                <ul className="flex flex-col gap-4">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a className="inline-flex items-center gap-2 text-[var(--on-surface-variant)] transition-colors hover:text-[var(--on-surface)]" href={link.href}>
                        {link.label}
                        {link.href.startsWith("https://") ? <ExternalLink className="size-4 text-[var(--brand-primary)]" /> : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <Separator className={styles.footerSeparator} />

      <p className={`${styles.footerCopyright} pt-8`}>{content.copyright}</p>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";

import { homepageContent } from "../homepage-content";
import styles from "../page.module.css";

import { FooterSection } from "./homepage/FooterSection";
import { Logo } from "@open-agency/ui";

type MarketingPageFrameProps = {
  children: ReactNode;
  mainClassName?: string;
};

export function MarketingPageFrame({
  children,
  mainClassName,
}: MarketingPageFrameProps) {
  return (
    <div className={`${styles.page} flex min-h-full w-full flex-col`}>
      <div className="mx-auto flex w-full max-w-[100rem] items-center gap-2 px-4 sm:px-6 lg:px-8 py-5">
        <Link href="/" className="shrink-0" aria-label="Open Agency home">
          <Logo variant="full" size="lg" />
        </Link>
      </div>
      <main className={mainClassName}>{children}</main>
      <footer className={styles.footer}>
        <FooterSection content={homepageContent.footer} />
      </footer>
    </div>
  );
}

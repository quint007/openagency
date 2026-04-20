import type { ReactNode } from 'react';

import { homepageContent } from '../homepage-content';
import styles from '../page.module.css';
import { BrandLockup } from './BrandLockup';
import { Header } from './Header';
import { FooterSection } from './homepage/FooterSection';

type MarketingPageFrameProps = {
  children: ReactNode;
  mainClassName?: string;
};

export function MarketingPageFrame({ children, mainClassName }: MarketingPageFrameProps) {
  return (
    <div className={`${styles.page} flex min-h-full w-full flex-col`}>
      <Header brand={<BrandLockup />} />
      <main className={mainClassName}>{children}</main>
      <footer className={styles.footer}>
        <FooterSection content={homepageContent.footer} />
      </footer>
    </div>
  );
}

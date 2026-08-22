import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { getSiteUrl } from '../lib/site';
import { CookieConsent } from './components/CookieConsent';
import { FeedbackButton, FeedbackProvider } from './components/Feedback';

export const metadata: Metadata = {
  title: {
    default: "Open Agency",
    template: "%s · Open Agency",
  },
  description: "Practical AI guides, tools, and workflow systems for people who build things.",
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: "/",
  },
  icons: {
    apple: "/icon.svg",
    shortcut: "/favicon.ico",
    icon: "/icon.svg",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    description: "Practical AI guides, tools, and workflow systems for people who build things.",
    siteName: "Open Agency",
    title: "Open Agency",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    description: "Practical AI guides, tools, and workflow systems for people who build things.",
    title: "Open Agency",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Script
        async
        crossOrigin="anonymous"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4790131778246365"
        strategy="lazyOnload"
      />
      <body>
        <CookieConsent>
          <FeedbackProvider>
            <FeedbackButton />
            {children}
          </FeedbackProvider>
        </CookieConsent>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

import { getSiteUrl } from '../lib/site';
import { CookieConsent } from './components/CookieConsent';
import { cookieIntegrationConfig } from './components/CookieConsent/cookie-config';
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
  ...(cookieIntegrationConfig.adsenseClientId
    ? {
        other: {
          "google-adsense-account": cookieIntegrationConfig.adsenseClientId,
        },
      }
    : {}),
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

import type { Metadata } from "next";
import "./globals.css";

import { getSiteUrl } from '../lib/site';

export const metadata: Metadata = {
  title: "Open Agency",
  description: "Brand OpenAgency marketing slice",
  metadataBase: new URL(getSiteUrl()),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

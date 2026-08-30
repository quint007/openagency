import type { Metadata } from "next";

import { MarketingPageFrame } from "./components/MarketingPageFrame";
import { StatusPage } from "./components/StatusPage";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Page not found",
};

export default function NotFoundPage() {
  return (
    <MarketingPageFrame mainClassName="flex flex-1 flex-col">
      <StatusPage
        code="404"
        description="This route does not exist, or the resource moved. Head back to the publication or browse the latest practical guides."
        title="Nothing is running here."
      />
    </MarketingPageFrame>
  );
}

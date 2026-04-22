"use client";

import { type ReactNode } from "react";

import { cn } from "../../lib/utils";

type GridBackgroundProps = {
  className?: string;
  children?: ReactNode;
};

function GridBackground({ className, children }: GridBackgroundProps) {
  return (
    <div className={cn("relative isolate size-full overflow-hidden", className)}>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          background: "var(--surface)",
          backgroundImage: `
            linear-gradient(to right, color-mix(in srgb, var(--outline-variant) 36%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--outline-variant) 36%, transparent) 1px, transparent 1px),
            radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--brand-primary) 18%, transparent) 0%, color-mix(in srgb, var(--brand-tertiary) 8%, transparent) 40%, transparent 70%)
          `,
          backgroundSize: "40px 40px, 40px 40px, 100% 100%",
        }}
      />

      {children ? <div className="absolute inset-0 z-10">{children}</div> : null}
    </div>
  );
}

export { GridBackground };

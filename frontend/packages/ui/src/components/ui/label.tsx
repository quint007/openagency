"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import type * as React from "react";

import { cn } from "../../lib/utils";

function Label({ className, ...props }: LabelPrimitive.LabelProps & React.RefAttributes<HTMLLabelElement>) {
  return (
    <LabelPrimitive.Label
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none text-on-surface [font-family:var(--brand-font-heading)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { Label };

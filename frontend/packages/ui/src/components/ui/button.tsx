"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-none border border-transparent bg-clip-padding whitespace-nowrap text-[0.72rem] font-medium uppercase tracking-[0.14em] [font-family:var(--brand-font-heading)] transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary shadow-[0_12px_28px_rgba(0,218,243,0.14)] hover:bg-brand-primary-light hover:text-on-primary hover:shadow-[0_16px_36px_rgba(0,218,243,0.2)]",
        outline:
          "border-2 border-brand-primary/20 bg-transparent text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary-light",
        secondary:
          "bg-surface-container-high text-on-surface shadow-[0_12px_28px_rgba(0,218,243,0.08)] hover:bg-surface-bright hover:text-on-surface hover:shadow-[0_16px_36px_rgba(0,218,243,0.12)]",
        ghost:
          "text-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary-light hover:underline hover:underline-offset-4",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_12px_28px_rgba(255,107,107,0.16)] hover:bg-destructive/85 hover:shadow-[0_16px_36px_rgba(255,107,107,0.22)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "h-auto border-none px-0 py-0 text-brand-primary underline-offset-6 hover:text-brand-primary-light hover:underline",
      },
      size: {
        default:
          "min-h-12 px-8 py-3.5 text-[0.72rem]",
        xs: "min-h-8 px-4 py-1.5 text-[0.65rem] [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-10 px-6 py-2.5 text-[0.68rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-14 px-10 py-4.5 text-[0.78rem]",
        icon: "size-10",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

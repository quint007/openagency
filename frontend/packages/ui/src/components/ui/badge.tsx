import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap border-2 border-transparent bg-clip-padding px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] [font-family:var(--brand-font-heading)] transition-[background-color,color,border-color,opacity] duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-brand-primary/20 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15",
        secondary:
          "border-outline-variant/20 bg-surface-container-high text-on-surface-variant hover:bg-surface-bright hover:text-on-surface",
        destructive:
          "border-brand-danger/20 bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/15",
        outline:
          "border-brand-tertiary/20 bg-brand-tertiary/10 text-brand-tertiary hover:bg-brand-tertiary/15",
        ghost: "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
        link: "border-none px-0 py-0 text-primary underline-offset-6 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }

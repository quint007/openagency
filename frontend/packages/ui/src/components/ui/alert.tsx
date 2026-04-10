import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const alertVariants = cva(
  "group/alert grid w-full gap-x-3 gap-y-2 px-4 py-4 text-on-surface shadow-[0_12px_28px_rgba(0,218,243,0.08)] [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:translate-y-0.5 [&>svg]:text-primary has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:[&>[data-slot=alert-title]]:col-start-2 has-[>svg]:[&>[data-slot=alert-description]]:col-start-2 has-[>svg]:[&>[data-slot=alert-action]]:col-start-2",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(180deg,var(--surface-container-lowest)_0%,color-mix(in_srgb,var(--brand-primary)_8%,var(--surface-container-low)_92%)_100%)]",
        destructive:
          "bg-[linear-gradient(180deg,var(--surface-container-lowest)_0%,color-mix(in_srgb,var(--brand-danger)_10%,var(--surface-container-low)_90%)_100%)] text-destructive [&>svg]:text-destructive shadow-[0_12px_28px_rgba(255,107,107,0.12)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "[font-family:var(--brand-font-heading)] text-sm leading-tight font-medium tracking-[0.08em] uppercase text-on-surface [&_a]:underline [&_a]:underline-offset-3 hover:[&_a]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm leading-6 text-on-surface-variant [&_a]:underline [&_a]:underline-offset-3 hover:[&_a]:text-primary [&_p:not(:last-child)]:mb-3 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-5",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("flex items-center gap-2 pt-1", className)}
      {...props}
    />
  )
}

export { Alert, AlertAction, AlertDescription, AlertTitle, alertVariants }

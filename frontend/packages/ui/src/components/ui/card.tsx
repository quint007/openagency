import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const cardVariants = cva(
  "group/card flex flex-col bg-surface-container text-on-surface transition-[background-color,box-shadow] duration-200 hover:bg-surface-variant",
  {
    variants: {
      variant: {
        default: "",
        elevated: "bg-surface-container-high shadow-[0_20px_40px_rgba(0,218,243,0.08)]",
        inset: "bg-surface-container-lowest",
        glow: "relative bg-surface-container shadow-[0_0_40px_rgba(0,218,243,0.12)] before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-brand-primary/5 before:to-transparent",
      },
      size: {
        default: "gap-8 p-8",
        sm: "gap-6 p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Card({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-size={size}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:gap-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "[font-family:var(--brand-font-heading)] text-lg leading-tight font-medium tracking-[-0.03em] text-on-surface",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-6 text-on-surface-variant", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("min-w-0 text-sm leading-6 text-on-surface-variant", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex flex-wrap items-center gap-3", className)}
      {...props}
    />
  )
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants }

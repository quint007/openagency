import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "../../lib/utils"

function Input({ className, type, ...props }: InputPrimitive.Props) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 border border-outline-variant/20 bg-input-background px-3 py-2 text-sm leading-6 text-on-surface [font-family:var(--brand-font-body)] outline-none transition-[border-color,box-shadow,background-color,color] duration-200 placeholder:text-on-surface-variant selection:bg-primary selection:text-primary-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 hover:border-brand-primary/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 file:inline-flex file:h-full file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-on-surface",
        className
      )}
      {...props}
    />
  )
}

export { Input }

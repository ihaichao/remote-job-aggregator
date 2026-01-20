import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border border-accent/30 bg-accent/5 text-accent",
        secondary:
          "bg-muted text-muted-foreground",
        outline:
          "border border-border text-foreground",
        category:
          "bg-accent/10 text-accent border border-accent/20",
        workType:
          "bg-purple-50 text-purple-700 border border-purple-200",
        tag:
          "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotPulse?: boolean
}

function Badge({ className, variant, dot, dotPulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span 
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            dotPulse && "animate-pulse"
          )} 
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

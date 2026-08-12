import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#0072BC]/15 text-[#0072BC] border border-[#0072BC]/30 dark:bg-[#0072BC]/30 dark:text-[#00A8FF]",
        secondary:
          "bg-[#003366] text-white hover:bg-[#00254a]",
        outline: "text-slate-700 border border-slate-200 dark:border-slate-800 dark:text-slate-200",
        destructive:
          "bg-rose-500/15 text-rose-700 border border-rose-500/30 dark:bg-rose-500/25 dark:text-rose-400",
        success:
          "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/25 dark:text-emerald-400",
        warning:
          "bg-[#E5A823]/15 text-[#b37f10] border border-[#E5A823]/40 dark:bg-[#E5A823]/25 dark:text-[#E5A823]",
        cyan:
          "bg-[#00A8FF]/15 text-[#0081c7] border border-[#00A8FF]/30 dark:bg-[#00A8FF]/25 dark:text-[#00A8FF]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

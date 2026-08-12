import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "navy" | "cyan" | "gold" | "emerald" | "amber" | "rose";
  trend?: string;
}

const colorVariants = {
  blue: {
    bg: "bg-[#0072BC]/10",
    text: "text-[#0072BC]",
    border: "border-[#0072BC]/20",
    accent: "bg-[#0072BC]",
  },
  navy: {
    bg: "bg-[#003366]/10",
    text: "text-[#003366]",
    border: "border-[#003366]/20",
    accent: "bg-[#003366]",
  },
  cyan: {
    bg: "bg-[#00A8FF]/10",
    text: "text-[#00A8FF]",
    border: "border-[#00A8FF]/20",
    accent: "bg-[#00A8FF]",
  },
  gold: {
    bg: "bg-[#E5A823]/10",
    text: "text-[#E5A823]",
    border: "border-[#E5A823]/20",
    accent: "bg-[#E5A823]",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    accent: "bg-emerald-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    accent: "bg-amber-500",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-500/20",
    accent: "bg-rose-500",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
}: StatCardProps) {
  const styles = colorVariants[color];

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className={cn("absolute top-0 left-0 right-0 h-1", styles.accent)} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
            styles.bg,
            styles.text,
            styles.border
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-700 dark:text-slate-300">{trend}</span>
        </div>
      )}
    </div>
  );
}

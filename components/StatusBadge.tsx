import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Wrench,
  Archive,
} from "lucide-react";

export type AssetStatus = "available" | "borrowed" | "maintenance" | "retired";
export type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "borrowed"
  | "returned"
  | "overdue"
  | "cancelled";

interface StatusBadgeProps {
  type: "asset" | "request";
  status: AssetStatus | RequestStatus | string;
  size?: "sm" | "md" | "lg";
}

const assetStatusConfig: Record<
  AssetStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  available: {
    label: "พร้อมใช้งาน",
    bg: "bg-white/95 backdrop-blur-md shadow-xs",
    text: "text-emerald-700 font-extrabold",
    border: "border-emerald-300/90",
    icon: CheckCircle2,
  },
  borrowed: {
    label: "ถูกยืมใช้งาน",
    bg: "bg-white/95 backdrop-blur-md shadow-xs",
    text: "text-[#0072BC] font-extrabold",
    border: "border-blue-300/90",
    icon: Clock,
  },
  maintenance: {
    label: "ส่งซ่อมบำรุง",
    bg: "bg-white/95 backdrop-blur-md shadow-xs",
    text: "text-amber-800 font-extrabold",
    border: "border-amber-400/90",
    icon: Wrench,
  },
  retired: {
    label: "จำหน่ายออก",
    bg: "bg-white/95 backdrop-blur-md shadow-xs",
    text: "text-slate-700 font-extrabold",
    border: "border-slate-300/90",
    icon: Archive,
  },
};

const requestStatusConfig: Record<
  RequestStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "รออนุมัติ",
    bg: "bg-amber-100/90",
    text: "text-amber-900 font-extrabold",
    border: "border-amber-300",
    icon: Clock,
  },
  approved: {
    label: "อนุมัติแล้ว",
    bg: "bg-blue-100/90",
    text: "text-blue-900 font-extrabold",
    border: "border-blue-300",
    icon: CheckCircle2,
  },
  rejected: {
    label: "ปฏิเสธคำขอ",
    bg: "bg-rose-100/90",
    text: "text-rose-900 font-extrabold",
    border: "border-rose-300",
    icon: XCircle,
  },
  borrowed: {
    label: "รับอุปกรณ์แล้ว",
    bg: "bg-indigo-100/90",
    text: "text-indigo-900 font-extrabold",
    border: "border-indigo-300",
    icon: Clock,
  },
  returned: {
    label: "คืนเรียบร้อย",
    bg: "bg-emerald-100/90",
    text: "text-emerald-900 font-extrabold",
    border: "border-emerald-300",
    icon: RotateCcw,
  },
  overdue: {
    label: "เกินกำหนดคืน",
    bg: "bg-red-200/90",
    text: "text-red-950 font-black",
    border: "border-red-400",
    icon: AlertTriangle,
  },
  cancelled: {
    label: "ยกเลิกคำขอ",
    bg: "bg-slate-100/90",
    text: "text-slate-800 font-extrabold",
    border: "border-slate-300",
    icon: XCircle,
  },
};

export default function StatusBadge({ type, status, size = "md" }: StatusBadgeProps) {
  const config =
    type === "asset"
      ? assetStatusConfig[status as AssetStatus] || assetStatusConfig.available
      : requestStatusConfig[status as RequestStatus] || requestStatusConfig.pending;

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs sm:text-sm gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border shadow-xs transition-colors",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size]
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

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
  PackageCheck,
  ShieldCheck,
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
    bg: "bg-emerald-50/90 hover:bg-emerald-100/90",
    text: "text-emerald-700 font-bold",
    border: "border-emerald-200/80",
    icon: CheckCircle2,
  },
  borrowed: {
    label: "ถูกยืมใช้งาน",
    bg: "bg-sky-50/90 hover:bg-sky-100/90",
    text: "text-sky-700 font-bold",
    border: "border-sky-200/80",
    icon: Clock,
  },
  maintenance: {
    label: "ส่งซ่อมบำรุง",
    bg: "bg-amber-50/90 hover:bg-amber-100/90",
    text: "text-amber-800 font-bold",
    border: "border-amber-200/80",
    icon: Wrench,
  },
  retired: {
    label: "จำหน่ายออก",
    bg: "bg-slate-100/90 hover:bg-slate-200/90",
    text: "text-slate-600 font-bold",
    border: "border-slate-200/80",
    icon: Archive,
  },
};

const requestStatusConfig: Record<
  RequestStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "รออนุมัติ",
    bg: "bg-amber-50/90 hover:bg-amber-100/90",
    text: "text-amber-800 font-bold",
    border: "border-amber-200/90",
    icon: Clock,
  },
  approved: {
    label: "อนุมัติแล้ว",
    bg: "bg-blue-50/90 hover:bg-blue-100/90",
    text: "text-[#0072BC] font-bold",
    border: "border-blue-200/90",
    icon: ShieldCheck,
  },
  rejected: {
    label: "ปฏิเสธคำขอ",
    bg: "bg-rose-50/90 hover:bg-rose-100/90",
    text: "text-rose-700 font-bold",
    border: "border-rose-200/90",
    icon: XCircle,
  },
  borrowed: {
    label: "รับอุปกรณ์แล้ว",
    bg: "bg-indigo-50/90 hover:bg-indigo-100/90",
    text: "text-indigo-700 font-bold",
    border: "border-indigo-200/90",
    icon: PackageCheck,
  },
  returned: {
    label: "คืนเรียบร้อย",
    bg: "bg-emerald-50/90 hover:bg-emerald-100/90",
    text: "text-emerald-700 font-bold",
    border: "border-emerald-200/90",
    icon: RotateCcw,
  },
  overdue: {
    label: "เกินกำหนดคืน",
    bg: "bg-red-50/90 hover:bg-red-100/90",
    text: "text-red-700 font-black",
    border: "border-red-300/90",
    icon: AlertTriangle,
  },
  cancelled: {
    label: "ยกเลิกคำขอ",
    bg: "bg-slate-100/90 hover:bg-slate-200/90",
    text: "text-slate-600 font-bold",
    border: "border-slate-200/80",
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
    sm: "px-2.5 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap shrink-0 rounded-full border shadow-2xs transition-colors select-none",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size]
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
}

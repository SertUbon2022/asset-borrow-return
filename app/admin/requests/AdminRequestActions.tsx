"use client";

import React, { useState } from "react";
import { updateBorrowRequestStatusAction } from "@/server/actions/borrow";
import { CheckCircle2, XCircle, RotateCcw, Loader2, AlertCircle } from "lucide-react";

interface AdminRequestActionsProps {
  requestId: number;
  currentStatus: string;
  initialAction?: string;
}

export default function AdminRequestActions({
  requestId,
  currentStatus,
}: AdminRequestActionsProps) {
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleStatusChange = async (
    newStatus: "approved" | "rejected" | "borrowed" | "returned" | "cancelled"
  ) => {
    // 1. Double check current client status before submitting
    if (currentStatus !== "pending" && (newStatus === "approved" || newStatus === "borrowed" || newStatus === "rejected")) {
      const statusText = currentStatus === "borrowed" || currentStatus === "approved" ? "ได้รับการอนุมัติแล้ว" : "ถูกปรับสถานะไปแล้ว";
      setActionMessage({
        type: "error",
        text: `คำขอนี้${statusText} (สถานะ: ${currentStatus}) ไม่สามารถทำซ้ำได้`,
      });
      return;
    }

    setLoading(true);
    setActionMessage(null);

    const res = await updateBorrowRequestStatusAction(requestId, newStatus);
    setLoading(false);

    if (res.success) {
      const successText =
        newStatus === "borrowed" || newStatus === "approved"
          ? "✅ อนุมัติคำขอยืมและส่งมอบอุปกรณ์เรียบร้อยแล้ว"
          : newStatus === "rejected"
          ? "❌ ปฏิเสธคำขอยืมเรียบร้อยแล้ว"
          : "✅ บันทึกรับคืนอุปกรณ์เรียบร้อยแล้ว";

      setActionMessage({ type: "success", text: successText });
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setActionMessage({ type: "error", text: res.message || "เกิดข้อผิดพลาดในการทำรายการ" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-[#0072BC] py-2 bg-blue-50 px-3 rounded-xl border border-blue-100 animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        กำลังตรวจสอบความปลอดภัยและทำรายการ...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {actionMessage && (
        <div
          className={`text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all shadow-xs ${
            actionMessage.type === "success"
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-rose-700 bg-rose-50 border-rose-200"
          }`}
        >
          {actionMessage.type === "error" && <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {currentStatus === "pending" ? (
          <>
            <button
              onClick={() => handleStatusChange("borrowed")}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              อนุมัติคำขอยืม
            </button>
            <button
              onClick={() => handleStatusChange("rejected")}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              ปฏิเสธคำขอ
            </button>
          </>
        ) : (currentStatus === "borrowed" || currentStatus === "approved") ? (
          <button
            onClick={() => handleStatusChange("returned")}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            บันทึกรับคืนครุภัณฑ์
          </button>
        ) : (
          <span className="text-xs text-slate-400 font-medium italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            {currentStatus === "returned"
              ? "✓ คืนอุปกรณ์เรียบร้อยแล้ว"
              : currentStatus === "rejected"
              ? "✕ ปฏิเสธคำขอแล้ว"
              : "คำขอยุติแล้ว"}
          </span>
        )}
      </div>
    </div>
  );
}

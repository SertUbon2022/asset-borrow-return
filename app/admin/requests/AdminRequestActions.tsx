"use client";

import React, { useState } from "react";
import { updateBorrowRequestStatusAction } from "@/server/actions/borrow";
import { CheckCircle2, XCircle, RotateCcw, Loader2 } from "lucide-react";

interface AdminRequestActionsProps {
  requestId: number;
  currentStatus: string;
}

export default function AdminRequestActions({
  requestId,
  currentStatus,
}: AdminRequestActionsProps) {
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleStatusChange = async (
    newStatus: "approved" | "rejected" | "borrowed" | "returned" | "cancelled"
  ) => {
    setLoading(true);
    setActionMessage(null);

    const res = await updateBorrowRequestStatusAction(requestId, newStatus);
    setLoading(false);

    if (res.success) {
      setActionMessage("ทำรายการสำเร็จ");
      setTimeout(() => setActionMessage(null), 2000);
    } else {
      setActionMessage(res.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#0072BC]" />
        กำลังทำรายการ...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {actionMessage && (
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-200">
          {actionMessage}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {currentStatus === "pending" && (
          <>
            <button
              onClick={() => handleStatusChange("borrowed")}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              อนุมัติคำขอยืม
            </button>
            <button
              onClick={() => handleStatusChange("rejected")}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <XCircle className="w-4 h-4" />
              ปฏิเสธคำขอ
            </button>
          </>
        )}

        {(currentStatus === "borrowed" || currentStatus === "approved") && (
          <button
            onClick={() => handleStatusChange("returned")}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            บันทึกรับคืนครุภัณฑ์
          </button>
        )}

        {(currentStatus === "returned" || currentStatus === "rejected" || currentStatus === "cancelled") && (
          <span className="text-xs text-slate-400 font-medium italic">
            รายการนี้เสร็จสิ้นแล้ว
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { createBorrowRequestAction } from "@/server/actions/borrow";
import { toggleAssetMaintenanceAction } from "@/server/actions/assets";
import StatusBadge from "@/components/StatusBadge";
import {
  PlusCircle,
  Loader2,
  Calendar,
  FileText,
  CheckCircle,
  History,
  Wrench,
  Clock,
  User,
  Building,
} from "lucide-react";

interface BorrowHistoryItem {
  id: number;
  request_date: Date | string;
  expected_return_date: Date | string;
  actual_return_date?: Date | string | null;
  duration_days?: number;
  status: string;
  purpose: string;
  user?: {
    name: string;
    department?: string | null;
  } | null;
}

interface AssetCardActionsProps {
  assetId: number;
  assetName: string;
  assetTag: string;
  status: string;
  currentUserRole?: "admin" | "user" | null;
  borrowHistory?: BorrowHistoryItem[];
}

export default function AssetCardActions({
  assetId,
  assetName,
  assetTag,
  status,
  currentUserRole,
  borrowHistory = [],
}: AssetCardActionsProps) {
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getFutureDateString = (daysCount: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysCount);
    return d.toISOString().split("T")[0];
  };

  const calculateDaysFromDate = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const [durationDays, setDurationDays] = useState<number>(7);
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(getFutureDateString(7));

  const handleDaysChange = (days: number) => {
    const validDays = Math.max(1, days);
    setDurationDays(validDays);
    setExpectedReturnDate(getFutureDateString(validDays));
  };

  const handleReturnDateChange = (dateStr: string) => {
    setExpectedReturnDate(dateStr);
    setDurationDays(calculateDaysFromDate(dateStr));
  };

  const handleOpenBorrowModal = () => {
    setDurationDays(7);
    setExpectedReturnDate(getFutureDateString(7));
    setBorrowModalOpen(true);
  };
  const [purpose, setPurpose] = useState("");
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await createBorrowRequestAction({
      assetId,
      expectedReturnDate,
      durationDays,
      purpose,
    });

    setLoading(false);

    if (res.success) {
      setMessage({ type: "success", text: res.message });
      setTimeout(() => {
        setBorrowModalOpen(false);
        setMessage(null);
      }, 1500);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const handleMaintenanceToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await toggleAssetMaintenanceAction(assetId, maintenanceReason);
    setLoading(false);

    if (res.success) {
      setMessage({ type: "success", text: res.message });
      setTimeout(() => {
        setMaintenanceModalOpen(false);
        setMessage(null);
      }, 1200);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const isAvailable = status === "available";
  const isMaintenance = status === "maintenance";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* 1. History Button (ดูประวัติ) */}
        <button
          type="button"
          onClick={() => setHistoryModalOpen(true)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          title="ดูประวัติการยืม-คืน"
        >
          <History className="w-3.5 h-3.5 text-[#0072BC]" />
          <span>ประวัติ ({borrowHistory.length})</span>
        </button>

        {/* 2. Admin Maintenance Button (ส่งซ่อม) */}
        {currentUserRole === "admin" && (
          <button
            type="button"
            onClick={() => setMaintenanceModalOpen(true)}
            disabled={status === "borrowed"}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
              isMaintenance
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "border border-slate-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-200 disabled:opacity-40"
            }`}
            title={isMaintenance ? "ยกเลิกการส่งซ่อม" : "แจ้งส่งซ่อมบำรุง"}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{isMaintenance ? "คืนสภาพ" : "ส่งซ่อม"}</span>
          </button>
        )}

        {/* 3. Borrow Request Button (ขอยืมครุภัณฑ์) */}
        <button
          type="button"
          onClick={() => isAvailable && handleOpenBorrowModal()}
          disabled={!isAvailable}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            isAvailable
              ? "bg-[#0072BC] text-white hover:bg-blue-700 shadow-xs cursor-pointer active:scale-95"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {isAvailable ? "ขอยืม" : "ไม่พร้อมยืม"}
        </button>
      </div>

      {/* --- MODAL 1: BORROW REQUEST MODAL --- */}
      {borrowModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#0072BC]" />
                ยื่นคำขอยืมครุภัณฑ์ไอที
              </h3>
              <button
                onClick={() => setBorrowModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs">
              <span className="text-slate-500 font-medium">รายการที่เลือก: </span>
              <strong className="text-[#0072BC]">{assetName}</strong> ({assetTag})
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  message.type === "success"
                    ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center gap-2"
                    : "bg-rose-500/15 text-rose-700 border border-rose-500/30"
                }`}
              >
                {message.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleBorrowSubmit} className="space-y-4 text-xs">
              {/* Field 1: จำนวนวันที่คืนอุปกรณ์ */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0072BC]" />
                    จำนวนวันที่คืนอุปกรณ์ (วัน) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">(กำหนดระยะเวลาการยืม)</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    required
                    value={durationDays}
                    onChange={(e) => handleDaysChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 font-bold focus:ring-2 focus:ring-[#0072BC] focus:outline-hidden"
                  />
                  <span className="font-bold text-slate-600 shrink-0">วัน</span>
                </div>

                {/* Quick selection pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold shrink-0">ระบุด่วน:</span>
                  {[
                    { days: 3, label: "3 วัน" },
                    { days: 7, label: "7 วัน (ค่าเริ่มต้น)" },
                    { days: 14, label: "14 วัน" },
                    { days: 30, label: "30 วัน" },
                  ].map((opt) => {
                    const isSelected = durationDays === opt.days;
                    return (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => handleDaysChange(opt.days)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0072BC] text-white border-[#0072BC] shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 2: วันที่กำหนดคืน */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0072BC]" />
                    กำหนดวันที่คืนจริง <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">(คำนวณจากจำนวนวัน)</span>
                </label>

                <input
                  type="date"
                  required
                  min={getFutureDateString(1)}
                  value={expectedReturnDate || getFutureDateString(7)}
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    if (e.currentTarget.showPicker) {
                      try {
                        e.currentTarget.showPicker();
                      } catch {
                        // ignore if not supported
                      }
                    }
                  }}
                  onChange={(e) => handleReturnDateChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 font-bold focus:ring-2 focus:ring-[#0072BC] focus:outline-hidden cursor-pointer select-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0072BC]" />
                  วัตถุประสงค์การใช้งาน/แผนกสังกัด <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="ระบุเหตุผลความจำเป็นและแผนกสังกัดสำหรับการยืมอุปกรณ์..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#0072BC] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBorrowModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#0072BC] text-white font-bold hover:bg-blue-700 shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังส่งข้อมูล...
                    </>
                  ) : (
                    "ยืนยันขอยืมครุภัณฑ์"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: BORROW HISTORY MODAL --- */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-[#0072BC]" />
                ประวัติการยืม-คืนอุปกรณ์ ({assetTag})
              </h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs font-extrabold text-[#003366]">
              {assetName}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1 text-xs">
              {borrowHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  ยังไม่มีประวัติการยืมอุปกรณ์นี้ในระบบ
                </div>
              ) : (
                borrowHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <User className="w-3.5 h-3.5 text-[#0072BC]" />
                        <span>{item.user?.name || "ผู้ใช้งานระบบ"}</span>
                      </div>
                      <StatusBadge type="request" status={item.status} size="sm" />
                    </div>

                    {item.user?.department && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{item.user.department}</span>
                      </div>
                    )}

                    <div className="text-slate-600 leading-relaxed bg-white p-2 rounded-xl border border-slate-100">
                      &quot;{item.purpose}&quot;
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 gap-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        ยื่นเมื่อ: {new Date(item.request_date).toLocaleDateString("th-TH")}
                      </span>
                      <span className="font-semibold text-slate-600">
                        กำหนดคืน: {new Date(item.expected_return_date).toLocaleDateString("th-TH")} ({item.duration_days || 7} วัน)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADMIN MAINTENANCE MODAL --- */}
      {maintenanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                {isMaintenance ? "ยืนยันนำอุปกรณ์กลับมาพร้อมใช้งาน" : "แจ้งส่งซ่อมบำรุงครุภัณฑ์"}
              </h3>
              <button
                onClick={() => setMaintenanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
              <span className="font-semibold">ครุภัณฑ์: </span>
              <strong>{assetName}</strong> ({assetTag})
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  message.type === "success"
                    ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center gap-2"
                    : "bg-rose-500/15 text-rose-700 border border-rose-500/30"
                }`}
              >
                {message.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleMaintenanceToggle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เหตุผล / บันทึกการส่งซ่อมบำรุง
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    isMaintenance
                      ? "ระบุรายละเอียดการซ่อมแซมเสร็จสิ้น..."
                      : "ระบุอาการชำรุด หรือสาเหตุการส่งซ่อมบำรุง..."
                  }
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#0072BC] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : isMaintenance ? (
                    "ยืนยันคืนสภาพพร้อมใช้งาน"
                  ) : (
                    "ยืนยันแจ้งส่งซ่อม"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

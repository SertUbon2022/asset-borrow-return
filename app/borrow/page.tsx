import React from "react";
import { getBorrowRequests } from "@/server/queries/borrow";
import StatusBadge from "@/components/StatusBadge";
import { ClipboardList, Calendar, Laptop, FileText, User, Clock } from "lucide-react";

export const revalidate = 0;

interface BorrowPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BorrowPage({ searchParams }: BorrowPageProps) {
  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status || "all";
  const requests = await getBorrowRequests(statusFilter);

  const filterTabs = [
    { label: "ทั้งหมด", value: "all" },
    { label: "รออนุมัติ", value: "pending" },
    { label: "อนุมัติแล้ว", value: "approved" },
    { label: "รับอุปกรณ์แล้ว", value: "borrowed" },
    { label: "คืนเรียบร้อย", value: "returned" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Page Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-[#0072BC]" />
            รายการคำขอยืม-คืน อุปกรณ์ไอที
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ติดตามสถานะคำขอยืม ตรวจสอบวันกำหนดคืน และประวัติการยืม-คืนอุปกรณ์ไอที
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#0072BC] text-xs font-bold border border-blue-100 shrink-0">
          จำนวนคำขอทั้งหมด {requests.length} รายการ
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {filterTabs.map((tab) => (
          <a
            key={tab.value}
            href={`/borrow?status=${tab.value}`}
            className={`px-4 py-2 rounded-xl border font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.value
                ? "bg-[#0072BC] text-white border-[#0072BC] shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Requests Cards */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/70 p-12 text-center text-slate-500 shadow-xl shadow-slate-200/30">
          <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-base text-slate-800">ไม่พบรายการคำขอยืมในสถานะนี้</p>
          <p className="text-xs text-slate-400 mt-1">สามารถยื่นคำขอยืมอุปกรณ์ได้ที่หน้าคลังอุปกรณ์ไอที</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xl shadow-slate-200/30 hover:border-[#0072BC]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    คำขอ #{req.id}
                  </span>
                  <StatusBadge type="request" status={req.status} size="md" />
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#0072BC] text-xs font-bold border border-blue-100">
                    <Clock className="w-3 h-3" />
                    {req.duration_days || 7} วัน
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#0072BC]" />
                  <h3 className="font-bold text-base text-slate-900">
                    {req.asset.name}{" "}
                    <span className="text-xs text-slate-400 font-mono">({req.asset.asset_tag})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>ผู้ยืม: <strong className="text-slate-700">{req.user.name}</strong> ({req.user.department || "กปภ."})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0072BC]" />
                    <span>
                      วันที่ยื่นขอ: <strong className="text-slate-700">{new Date(req.request_date).toLocaleDateString("th-TH")}</strong> |
                      กำหนดคืน: <strong className="text-slate-700">{new Date(req.expected_return_date).toLocaleDateString("th-TH")}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-slate-700">วัตถุประสงค์: </strong>
                    {req.purpose}
                  </span>
                </div>

                {req.admin_note && (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
                    <strong>หมายเหตุแอดมิน: </strong> {req.admin_note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

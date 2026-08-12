import React from "react";
import { getBorrowRequests } from "@/server/queries/borrow";
import StatusBadge from "@/components/StatusBadge";
import AdminRequestActions from "./AdminRequestActions";
import { ShieldCheck, Laptop, User, Calendar, FileText, Clock } from "lucide-react";

export const revalidate = 0;

interface AdminRequestsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status || "all";
  const requests = await getBorrowRequests(statusFilter);

  const filterTabs = [
    { label: "ทั้งหมด", value: "all" },
    { label: "รออนุมัติ", value: "pending" },
    { label: "อยู่ระหว่างยืมใช้งาน", value: "borrowed" },
    { label: "คืนเรียบร้อย", value: "returned" },
    { label: "ปฏิเสธคำขอ", value: "rejected" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Page Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-[#003366]" />
            ศูนย์อนุมัติและรับคืนครุภัณฑ์ (สำหรับเจ้าหน้าที่ IT)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            พิจารณาอนุมัติคำขอยืม ส่งมอบอุปกรณ์ และบันทึกรับคืนครุภัณฑ์ไอที การประปาส่วนภูมิภาค
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-[#D97706] text-xs font-bold border border-amber-100 shrink-0">
          คำขอในระบบ {requests.length} รายการ
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {filterTabs.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/requests?status=${tab.value}`}
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

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/70 p-12 text-center text-slate-500 shadow-xl shadow-slate-200/30">
          <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-base text-slate-800">ไม่พบคำขอยืมในสถานะนี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xl shadow-slate-200/30 hover:border-[#0072BC]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#0072BC] border border-blue-100">
                    คำขอ #{req.id}
                  </span>
                  <StatusBadge type="request" status={req.status} size="md" />
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    คืนอุปกรณ์ภายใน {req.duration_days || 7} วัน
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
                    <span>ผู้ยืม: <strong className="text-slate-800">{req.user.name}</strong> ({req.user.department || "กปภ."})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0072BC]" />
                    <span>
                      วันที่ยื่นขอ: <strong className="text-slate-700">{new Date(req.request_date).toLocaleDateString("th-TH")} เวลา {new Date(req.request_date).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.</strong> |
                      กำหนดคืน: <strong className="text-slate-700">{new Date(req.expected_return_date).toLocaleDateString("th-TH")}</strong>
                    </span>
                  </div>

                  {(req.status === "approved" || req.status === "borrowed" || req.status === "returned" || req.approved_by) && (
                    <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2 text-[#0072BC] bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-100 font-medium">
                      <ShieldCheck className="w-4 h-4 text-[#0072BC] shrink-0" />
                      <span>
                        ผู้อนุมัติคำขอ: <strong className="text-[#003366] font-extrabold">{req.approver?.name || "สมชาย รักษาดี (IT Admin 1)"}</strong>
                        <span className="ml-2 text-slate-500 font-normal">
                          • วันที่อนุมัติ: <strong className="text-slate-700 font-bold">{new Date(req.approved_at || req.updated_at).toLocaleDateString("th-TH")} เวลา {new Date(req.approved_at || req.updated_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.</strong>
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-slate-700">วัตถุประสงค์: </strong>
                    {req.purpose}
                  </span>
                </div>
              </div>

              {/* Admin Action Buttons */}
              <div className="pt-3 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-6 shrink-0">
                <AdminRequestActions requestId={req.id} currentStatus={req.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

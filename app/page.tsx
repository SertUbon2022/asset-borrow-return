import React from "react";
import Link from "next/link";
import { getDashboardStats, getTopDashboardStats } from "@/server/queries/assets";
import { getBorrowRequests, getCategories, getRecentActivityLogs } from "@/server/queries/borrow";
import { getAnnouncements } from "@/server/queries/announcements";
import { getCurrentUserSession } from "@/server/actions/auth";
import { db } from "@/db";
import { announcements, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import StatusBadge from "@/components/StatusBadge";
import HomeAnnouncementFeed from "@/components/HomeAnnouncementFeed";
import TopStatsGrid from "@/components/TopStatsGrid";
import {
  Laptop,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardList,
  Activity,
  Calendar,
  User,
} from "lucide-react";

export const revalidate = 0; // Fresh RSC data

export default async function DashboardPage() {
  const currentUser = await getCurrentUserSession();
  const stats = await getDashboardStats();
  const topStats = await getTopDashboardStats();
  const categoriesList = await getCategories();
  const recentRequests = await getBorrowRequests();
  const recentLogs = currentUser?.role === "admin" ? await getRecentActivityLogs(5) : [];
  let announcementsList = await getAnnouncements();

  // Auto-seed initial announcements if table is empty
  if (announcementsList.length === 0) {
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, "admin"),
    });
    const adminId = adminUser?.id || 1;

    await db.insert(announcements).values([
      {
        title: "กำหนดการตรวจสอบและตรวจนับพัสดุครุภัณฑ์ไอที ประจำปีงบประมาณ 2569",
        content: "ขอให้ทุกกอง/ฝ่ายดำเนินการตรวจสอบรายการครุภัณฑ์คอมพิวเตอร์และอุปกรณ์ต่อพ่วงในครอบครอง พร้อมยืนยันสถานะผ่านระบบ IT Asset Flow ภายในวันที่ 31 สิงหาคม 2569 เพื่อเตรียมความพร้อมสรุปรายงานพัสดุประจำปี",
        category: "important",
        is_pinned: true,
        created_by: adminId,
      },
      {
        title: "เพิ่มครุภัณฑ์โน้ตบุ๊กประสิทธิภาพสูง (High-Performance Laptop) สำหรับงานประมวลผล GIS และวิศวกรรม",
        content: "สำนักสารสนเทศได้ทำการจัดสรรคอมพิวเตอร์พกพาสเปกสูงเพิ่มเติม เพื่อสนับสนุนการปฏิบัติงานนอกสถานที่ของวิศวกรและผู้เชี่ยวชาญ กปภ. สามารถยื่นขอยืมใช้งานผ่านหน้าคลังอุปกรณ์ได้แล้ววันนี้",
        category: "update",
        is_pinned: false,
        created_by: adminId,
      },
      {
        title: "แนวทางการยื่นขอยืมอุปกรณ์คอมพิวเตอร์พกพานอกสถานที่และมาตรการคุ้มครองข้อมูลองค์กร กปภ.",
        content: "แจ้งพนักงานผู้ยื่นขอยืมอุปกรณ์พกพาทุกท่าน โปรดปฏิบัติตามแนวทางการดูแลรักษาสินทรัพย์และหลีกเลี่ยงการเชื่อมต่อเครือข่ายสาธารณะที่ไม่ปลอดภัยระหว่างนำอุปกรณ์ออกนอกสถานที่",
        category: "security",
        is_pinned: false,
        created_by: adminId,
      },
      {
        title: "กำหนดการปรับปรุงเซิร์ฟเวอร์สำรองข้อมูลประจำเดือน เพื่อเพิ่มความเสถียรของระบบ",
        content: "ระบบบริหารยืม-คืน ครุภัณฑ์จะเปิดให้บริการตามปกติ แต่จะมีการปิดปรับปรุงเซิร์ฟเวอร์ย่อยในวันศุกร์สัปดาห์หน้า เวลา 20:00 - 22:00 น.",
        category: "maintenance",
        is_pinned: false,
        created_by: adminId,
      },
    ]);

    announcementsList = await getAnnouncements();
  }

  const availableCount = stats.availableAssets;
  const borrowedCount = stats.borrowedAssets;
  const totalCount = stats.totalAssets || 1;
  const pendingCount = stats.pendingRequests;

  const availablePercent = Math.round((availableCount / totalCount) * 100);
  const borrowedPercent = Math.round((borrowedCount / totalCount) * 100);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Clean Top Header Bar */}
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-6 rounded-full bg-[#0072BC]" />
          ภาพรวมสถิติและสถานะอุปกรณ์ไอที
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          การประปาส่วนภูมิภาค (กปภ.) — PWA Enterprise IT Asset Flow
        </p>
      </div>

      {/* 2. Top Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">ครุภัณฑ์ในคลังทั้งหมด</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#0072BC]">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">รายการ</span>
          </div>
          <p className="text-[11px] text-slate-400">ครอบคลุม {categoriesList.length} หมวดหมู่</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">พร้อมใช้งาน (Available)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{availableCount}</span>
            <span className="text-xs text-emerald-600 font-bold">({availablePercent}%)</span>
          </div>
          <p className="text-[11px] text-slate-400">ยื่นขอยืมใช้งานได้ทันที</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">อยู่ระหว่างยืม (Borrowed)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-[#D97706]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{borrowedCount}</span>
            <span className="text-xs text-amber-600 font-bold">({borrowedPercent}%)</span>
          </div>
          <p className="text-[11px] text-slate-400">ส่งมอบแก่พนักงานใช้งาน</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">รอการอนุมัติ (Pending)</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600">{pendingCount}</span>
            <span className="text-xs text-slate-400 font-medium">คำขอ</span>
          </div>
          <p className="text-[11px] text-slate-400">รอดำเนินการโดยแอดมิน IT</p>
        </div>
      </div>

      {/* 3. Main Data Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Announcements Bulletin */}
        <div className="lg:col-span-8 space-y-6">
          <HomeAnnouncementFeed announcements={announcementsList} />
        </div>

        {/* Right Column (4 cols): Recent Requests & Recent Activity Feed */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Recent Requests Card */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xl shadow-slate-200/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#0072BC]" />
                รายการคำขอยืมล่าสุด
              </h2>
              <Link href="/borrow" className="text-xs text-[#0072BC] hover:underline font-bold">
                ดูทั้งหมด
              </Link>
            </div>

            {recentRequests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีคำขอยืมในระบบ</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 line-clamp-1">
                        {req.asset.name}
                      </span>
                      <StatusBadge type="request" status={req.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.user.name} ({req.user.department || "กปภ."})</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[#0072BC]" />
                      <span>กำหนดคืน: <strong className="text-slate-700">{new Date(req.expected_return_date).toLocaleDateString("th-TH")}</strong> ({req.duration_days || 7} วัน)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Activity Feed (Admin Only) */}
          {currentUser?.role === "admin" && (
            <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xl shadow-slate-200/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#E5A823]" />
                  บันทึกกิจกรรมล่าสุด (Logs)
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[#0072BC] mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-800 font-medium leading-snug">
                        {log.details}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-1">
                        โดย {log.user?.name || "ระบบ"} • {new Date(log.created_at).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 4. Top 5 Statistics Leaderboards */}
      <TopStatsGrid stats={topStats} />
    </div>
  );
}

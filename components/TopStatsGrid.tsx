"use client";

import React, { memo } from "react";
import {
  Trophy,
  Users,
  Wrench,
  Clock,
  Medal,
  Crown,
  Building,
} from "lucide-react";

interface TopBorrowedAsset {
  id: number;
  name: string;
  assetTag: string;
  categoryName: string;
  borrowCount: number;
}

interface TopBorrowerUser {
  id: number;
  name: string;
  department: string;
  borrowCount: number;
}

interface TopMaintenanceAsset {
  id: number;
  name: string;
  assetTag: string;
  categoryName: string;
  status: string;
  repairCount: number;
}

interface TopOldestAsset {
  id: number;
  name: string;
  assetTag: string;
  categoryName: string;
  registeredDate: string;
  ageDays: number;
}

interface TopStatsGridProps {
  stats: {
    topBorrowedAssets: TopBorrowedAsset[];
    topBorrowerUsers: TopBorrowerUser[];
    topMaintenanceAssets: TopMaintenanceAsset[];
    topOldestAssets: TopOldestAsset[];
  };
}

const RankBadge = memo(({ rank }: { rank: number }) => {
  switch (rank) {
    case 1:
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0 border border-amber-300">
          <Crown className="w-3.5 h-3.5" />
        </span>
      );
    case 2:
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center shadow-xs shrink-0 border border-slate-200">
          2
        </span>
      );
    case 3:
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700/30 text-amber-900 font-bold text-xs flex items-center justify-center shadow-xs shrink-0 border border-amber-600/30">
          3
        </span>
      );
    default:
      return (
        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-semibold text-xs flex items-center justify-center shrink-0">
          {rank}
        </span>
      );
  }
});
RankBadge.displayName = "RankBadge";

function formatAgeText(days: number) {
  if (days >= 365) {
    const years = (days / 365).toFixed(1);
    return `${years} ปี (${days} วัน)`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} เดือน (${days} วัน)`;
  }
  return `${days} วัน`;
}

export default function TopStatsGrid({ stats }: TopStatsGridProps) {
  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#E5A823]" />
          สถิติและอันดับการใช้งานพัสดุครุภัณฑ์ไอที (Top 5 Leaderboard)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: Top 5 Most Borrowed Assets */}
        <div className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xl shadow-slate-200/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
              <Medal className="w-4.5 h-4.5 text-[#0072BC]" />
              อุปกรณ์ถูกยืมมากสุด 5 อันดับแรก
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              สถิติการยืม
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.topBorrowedAssets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีข้อมูลการยืมครุภัณฑ์</p>
            ) : (
              stats.topBorrowedAssets.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-blue-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <RankBadge rank={idx + 1} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.assetTag} • {item.categoryName}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-[#0072BC] bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 shrink-0">
                    ยืม {item.borrowCount} ครั้ง
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD 2: Top 5 Most Frequent Borrower Users */}
        <div className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xl shadow-slate-200/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#0072BC]" />
              ผู้ใช้ที่ยืมมากที่สุด 5 อันดับแรก
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              ผู้ใช้บริการ
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.topBorrowerUsers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีข้อมูลผู้ใช้งานที่ยืม</p>
            ) : (
              stats.topBorrowerUsers.map((user, idx) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-blue-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <RankBadge rank={idx + 1} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" /> {user.department}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-[#0072BC] bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 shrink-0">
                    {user.borrowCount} รายการ
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD 3: Top 5 Most Repaired Assets */}
        <div className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xl shadow-slate-200/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
              <Wrench className="w-4.5 h-4.5 text-rose-500" />
              อุปกรณ์ส่งซ่อมบ่อยที่สุด 5 อันดับแรก
            </h3>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              การบำรุงรักษา
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.topMaintenanceAssets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">ไม่มีประวัติอุปกรณ์ส่งซ่อมบำรุง</p>
            ) : (
              stats.topMaintenanceAssets.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-rose-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <RankBadge rank={idx + 1} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.assetTag} • {item.categoryName}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100 shrink-0">
                    ส่งซ่อม {item.repairCount} ครั้ง
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD 4: Top 5 Oldest Assets in Inventory */}
        <div className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xl shadow-slate-200/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-amber-500" />
              อายุครุภัณฑ์ในคลัง 5 อันดับแรก
            </h3>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              วันที่ลงทะเบียน
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.topOldestAssets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">ไม่มีข้อมูลครุภัณฑ์ในคลัง</p>
            ) : (
              stats.topOldestAssets.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-amber-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <RankBadge rank={idx + 1} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.assetTag} • ลงทะเบียน {item.registeredDate}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
                    {formatAgeText(item.ageDays)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

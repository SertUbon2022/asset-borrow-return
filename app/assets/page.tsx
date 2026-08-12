import React from "react";
import Image from "next/image";
import { getAssets } from "@/server/queries/assets";
import { getCategories } from "@/server/queries/borrow";
import { getCurrentUserSession } from "@/server/actions/auth";
import StatusBadge from "@/components/StatusBadge";
import AssetCardActions from "./AssetCardActions";
import { Search, Laptop, Filter, Tag, MapPin, Hash, Image as ImageIcon } from "lucide-react";

export const revalidate = 0;

interface AssetsPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const categoryId = resolvedParams.category ? Number(resolvedParams.category) : undefined;

  const session = await getCurrentUserSession();
  const [assetsList, categoriesList] = await Promise.all([
    getAssets(query, categoryId),
    getCategories(),
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Page Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-[#0072BC]" />
            คลังอุปกรณ์และครุภัณฑ์ไอที กปภ.
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ค้นหา ตรวจสอบสถานะความพร้อม และยื่นคำขอยืมครุภัณฑ์ไอทีสำหรับการปฏิบัติงาน
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#0072BC] text-xs font-bold border border-blue-100 shrink-0">
          พบคืนทั้งหมด {assetsList.length} รายการ
        </div>
      </div>

      {/* Clean Search & Category Filter Card */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xl shadow-slate-200/30 space-y-4">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="ค้นหาชื่ออุปกรณ์, รหัสครุภัณฑ์, Serial Number หรือ รุ่น..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0072BC] bg-slate-50/70 text-slate-900 shadow-inner"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0072BC] text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            ค้นหาครุภัณฑ์
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1">
          <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> หมวดหมู่:
          </span>
          <a
            href="/assets"
            className={`px-3.5 py-1.5 rounded-xl border font-bold whitespace-nowrap transition-all ${
              !categoryId
                ? "bg-[#0072BC] text-white border-[#0072BC] shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            ทั้งหมด
          </a>
          {categoriesList.map((cat) => (
            <a
              key={cat.id}
              href={`/assets?category=${cat.id}`}
              className={`px-3.5 py-1.5 rounded-xl border font-bold whitespace-nowrap transition-all ${
                categoryId === cat.id
                  ? "bg-[#0072BC] text-white border-[#0072BC] shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      {/* Clean Asset Cards Grid */}
      {assetsList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/70 p-12 text-center text-slate-500 shadow-xl shadow-slate-200/30">
          <Laptop className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-base text-slate-800">ไม่พบครุภัณฑ์ที่ตรงตามเงื่อนไขค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assetsList.map((asset, index) => (
            <div
              key={asset.id}
              className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-xl shadow-slate-200/30 hover:border-[#0072BC]/40 transition-all flex flex-col justify-between group"
            >
              {/* Asset Image Banner */}
              <div className="relative h-44 w-full bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center">
                {asset.image_url ? (
                  <Image
                    src={asset.image_url}
                    alt={asset.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={index < 4}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50/80 via-slate-50 to-slate-100 flex flex-col items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                    <Laptop className="w-12 h-12 text-[#0072BC]/30 mb-1" />
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      รูปภาพครุภัณฑ์ กปภ.
                    </span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-xs text-[#0072BC] border border-blue-100 shadow-xs">
                    {asset.asset_tag}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge type="asset" status={asset.status} size="sm" />
                </div>
              </div>

              {/* Asset Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-[#003366] group-hover:text-[#0072BC] transition-colors leading-snug">
                    {asset.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {asset.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    {asset.model && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>รุ่น: <strong className="text-slate-700">{asset.model}</strong></span>
                      </div>
                    )}
                    {asset.serial_number && (
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>S/N: <strong className="text-slate-700">{asset.serial_number}</strong></span>
                      </div>
                    )}
                    {asset.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>สถานที่: <strong className="text-slate-700">{asset.location}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    {asset.category?.name || "ทั่วไป"}
                  </span>

                  <AssetCardActions
                    assetId={asset.id}
                    assetName={asset.name}
                    assetTag={asset.asset_tag}
                    status={asset.status}
                    currentUserRole={session?.role}
                    borrowHistory={asset.borrowRequests}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

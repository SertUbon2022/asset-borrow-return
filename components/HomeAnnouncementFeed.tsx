"use client";

import React, { useState, useMemo, memo, useCallback } from "react";
import Image from "next/image";
import { Announcement } from "@/db/schema";
import ImageLightboxModal from "@/components/ImageLightboxModal";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  Bell,
  Sparkles,
  ShieldAlert,
  Info,
  Images,
  Search,
  Pin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface HomeAnnouncementFeedProps {
  announcements: Announcement[];
}

/** Utility to parse stored JSON array of image URLs safely */
function parseImageUrls(jsonStr?: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Utility to format date strings to Thai locale standard with time */
function formatThaiDate(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    const dateStr = d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${dateStr} เวลา ${timeStr} น.`;
  } catch {
    return "";
  }
}

/** Sub-component: Category Badge */
const CategoryBadge = memo(({ category }: { category: string }) => {
  switch (category) {
    case "important":
      return (
        <Badge variant="destructive" className="gap-1 bg-rose-600 text-white font-bold">
          <ShieldAlert className="w-3 h-3" />
          ประกาศสำคัญ / ด่วนที่สุด
        </Badge>
      );
    case "update":
      return (
        <Badge variant="secondary" className="gap-1 bg-[#0072BC] text-white font-bold">
          <Sparkles className="w-3 h-3 text-[#E5A823]" />
          อัปเดตระบบ
        </Badge>
      );
    case "security":
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-700 bg-amber-50 font-bold">
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          ความปลอดภัยไอที
        </Badge>
      );
    case "maintenance":
      return (
        <Badge variant="outline" className="gap-1 border-slate-300 text-slate-700 bg-slate-100 font-bold">
          <Info className="w-3 h-3 text-slate-500" />
          บำรุงรักษา
        </Badge>
      );
    default:
      return <Badge variant="outline">{category}</Badge>;
  }
});
CategoryBadge.displayName = "CategoryBadge";

/** Sub-component: Announcement Card Item */
interface AnnouncementCardItemProps {
  item: Announcement;
  itemIndex: number;
  onOpenLightbox: (images: string[], index: number, title: string) => void;
}

const AnnouncementCardItem = memo(({ item, itemIndex, onOpenLightbox }: AnnouncementCardItemProps) => {
  const photos = useMemo(() => parseImageUrls(item.image_urls), [item.image_urls]);
  const formattedDate = useMemo(() => formatThaiDate(item.published_at), [item.published_at]);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all space-y-2.5 relative overflow-hidden group ${
        item.is_pinned
          ? "bg-gradient-to-r from-blue-50/90 via-white to-slate-50 border-blue-200/80 shadow-xs hover:border-[#0072BC]/40"
          : "bg-white border-slate-200/70 shadow-xs hover:border-slate-300"
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryBadge category={item.category} />
          {item.is_pinned && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E5A823] text-white flex items-center gap-1">
              <Pin className="w-2.5 h-2.5" /> ปักหมุด
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-medium">
            {formattedDate}
          </span>
        </div>

        {photos.length > 0 && (
          <button
            type="button"
            onClick={() => onOpenLightbox(photos, 0, item.title)}
            className="text-[10px] font-bold text-[#0072BC] hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-100 transition-all cursor-pointer"
          >
            <Images className="w-3 h-3 text-[#0072BC]" /> {photos.length} รูป (คลิกดูอัลบั้ม)
          </button>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="font-extrabold text-sm text-[#003366] group-hover:text-[#0072BC] transition-colors leading-snug">
          {item.title}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-3 mt-1 leading-relaxed whitespace-pre-wrap">
          {item.content}
        </p>
      </div>

      {/* Album Photo Gallery Thumbnails */}
      {photos.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {photos.map((photoUrl, pIdx) => (
              <button
                key={`${photoUrl}-${pIdx}`}
                type="button"
                onClick={() => onOpenLightbox(photos, pIdx, item.title)}
                className="relative h-18 w-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs group/img hover:scale-105 transition-all cursor-pointer"
                title="คลิกเพื่อขยายดูรูปภาพเต็ม"
              >
                <Image
                  src={photoUrl}
                  alt={`ภาพประกอบ #${pIdx + 1}`}
                  fill
                  className="object-cover"
                  priority={itemIndex === 0 && pIdx === 0}
                  unoptimized
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover/img:bg-slate-900/35 transition-colors flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100">
                  <Search className="w-4 h-4 drop-shadow-md" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
AnnouncementCardItem.displayName = "AnnouncementCardItem";

export default function HomeAnnouncementFeed({
  announcements = [],
}: HomeAnnouncementFeedProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState("");

  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  const handleOpenLightbox = useCallback((images: string[], index: number, title: string) => {
    if (images.length === 0) return;
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxTitle(title);
    setLightboxOpen(true);
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [announcements, selectedCategory, search]);

  const displayedAnnouncements = useMemo(() => {
    if (showAll) return filteredAnnouncements;
    return filteredAnnouncements.slice(0, 3);
  }, [filteredAnnouncements, showAll]);

  const categories = [
    { label: "ทั้งหมด", value: "all" },
    { label: "ประกาศสำคัญ", value: "important" },
    { label: "อัปเดตระบบ", value: "update" },
    { label: "ความปลอดภัยไอที", value: "security" },
    { label: "บำรุงรักษา", value: "maintenance" },
  ];

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#0072BC]" />
          ข่าวประชาสัมพันธ์ & ประกาศจากสำนักสารสนเทศ
        </h2>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0072BC]/10 text-[#0072BC] border border-[#0072BC]/20 flex items-center gap-1 shrink-0 self-start sm:self-auto">
          <Bell className="w-3 h-3 text-[#E5A823]" />
          ประกาศทั้งหมด ({announcements.length})
        </span>
      </div>

      {/* Filter Tabs & Search Bar */}
      {announcements.length > 3 && (
        <div className="space-y-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.value
                      ? "bg-[#0072BC] text-white border-[#0072BC] shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Mini Search */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาประกาศ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-[#0072BC] focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Announcements Feed List with Scrollable Container when expanded */}
      <div
        className={`space-y-3.5 transition-all ${
          showAll && filteredAnnouncements.length > 3
            ? "max-h-[600px] overflow-y-auto pr-1.5 scrollbar-thin"
            : ""
        }`}
      >
        {displayedAnnouncements.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/70 p-8 text-center text-slate-400">
            <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-600">ไม่พบประกาศข่าวประชาสัมพันธ์ที่ตรงกับการค้นหา</p>
          </div>
        ) : (
          displayedAnnouncements.map((item, index) => (
            <AnnouncementCardItem
              key={item.id}
              item={item}
              itemIndex={index}
              onOpenLightbox={handleOpenLightbox}
            />
          ))
        )}
      </div>

      {/* Expand / Collapse Control Button */}
      {filteredAnnouncements.length > 3 && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-white hover:bg-blue-50/70 text-[#0072BC] border border-blue-200/80 hover:border-blue-300 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer group active:scale-98"
          >
            {showAll ? (
              <>
                <span>ย่อแสดงเฉพาะ 3 ประกาศล่าสุด</span>
                <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              </>
            ) : (
              <>
                <span>ดูข่าวประชาสัมพันธ์ทั้งหมด ({filteredAnnouncements.length} รายการ)</span>
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}

      {/* LIGHTBOX GALLERY MODAL */}
      <ImageLightboxModal
        images={lightboxImages}
        initialIndex={lightboxIndex}
        title={lightboxTitle}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

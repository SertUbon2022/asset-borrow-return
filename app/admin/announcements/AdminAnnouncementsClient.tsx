"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Announcement } from "@/db/schema";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "@/server/actions/announcements";
import AlbumImageUploader from "@/components/AlbumImageUploader";
import ImageLightboxModal from "@/components/ImageLightboxModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Plus,
  Pin,
  Edit3,
  Trash2,
  Sparkles,
  ShieldAlert,
  Info,
  Search,
  Loader2,
  Calendar,
  UserCheck,
  Images,
} from "lucide-react";

interface ExtendedAnnouncement extends Announcement {
  author?: {
    id: number;
    name: string;
  } | null;
}

interface AdminAnnouncementsClientProps {
  initialAnnouncements: ExtendedAnnouncement[];
}

export default function AdminAnnouncementsClient({
  initialAnnouncements,
}: AdminAnnouncementsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExtendedAnnouncement | null>(null);
  const [deleteItem, setDeleteItem] = useState<ExtendedAnnouncement | null>(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState("");

  // Form States
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"important" | "update" | "security" | "maintenance">("important");
  const [isPinned, setIsPinned] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const parseImageUrls = (jsonStr?: string | null): string[] => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("important");
    setIsPinned(false);
    setImageUrls([]);
    setMessage(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (item: ExtendedAnnouncement) => {
    resetForm();
    setEditItem(item);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setIsPinned(item.is_pinned);
    setImageUrls(parseImageUrls(item.image_urls));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await createAnnouncementAction({
      title,
      content,
      category,
      isPinned,
      imageUrls,
    });

    setLoading(false);

    if (res.success) {
      setCreateDialogOpen(false);
      resetForm();
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setLoading(true);
    setMessage(null);

    const res = await updateAnnouncementAction(editItem.id, {
      title,
      content,
      category,
      isPinned,
      imageUrls,
    });

    setLoading(false);

    if (res.success) {
      setEditItem(null);
      resetForm();
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    setLoading(true);
    setMessage(null);

    const res = await deleteAnnouncementAction(deleteItem.id);
    setLoading(false);

    if (res.success) {
      setDeleteItem(null);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const handleOpenLightbox = (images: string[], index: number, annTitle: string) => {
    if (images.length === 0) return;
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxTitle(annTitle);
    setLightboxOpen(true);
  };

  const filteredAnnouncements = initialAnnouncements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
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
        return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#0072BC]" />
            ศูนย์จัดการข่าวประชาสัมพันธ์ (Admin Center)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            การประปาส่วนภูมิภาค (กปภ.) — เพิ่ม แก้ไข ลบ ปักหมุด และแนบอัลบั้มรูปภาพขึ้นหน้าแรก
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl shadow-md bg-[#0072BC] font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          สร้างข่าวประกาศใหม่
        </Button>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหาหัวข้อ หรือ เนื้อหาข่าว..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold shrink-0">หมวดหมู่:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0072BC]"
          >
            <option value="all">ทั้งหมด ({initialAnnouncements.length})</option>
            <option value="important">ประกาศสำคัญ / ด่วนที่สุด</option>
            <option value="update">อัปเดตระบบ</option>
            <option value="security">ความปลอดภัยไอที</option>
            <option value="maintenance">บำรุงรักษา</option>
          </select>
        </div>
      </div>

      {/* 3. Announcements List Cards */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/70 p-12 text-center text-slate-400 shadow-xl shadow-slate-200/30">
            <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-base text-slate-700">ยังไม่มีข่าวประชาสัมพันธ์ในระบบ</p>
            <p className="text-xs text-slate-400 mt-1">คลิกที่ปุ่ม &quot;สร้างข่าวประกาศใหม่&quot; เพื่อเริ่มต้นโพสต์ข่าว</p>
          </div>
        ) : (
          filteredAnnouncements.map((item) => {
            const photos = parseImageUrls(item.image_urls);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border p-5 shadow-xl shadow-slate-200/30 transition-all space-y-3 ${
                  item.is_pinned
                    ? "border-amber-300/80 bg-gradient-to-r from-amber-50/40 via-white to-slate-50"
                    : "border-slate-200/70"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(item.category)}
                    {item.is_pinned && (
                      <Badge className="bg-[#E5A823] text-white font-black gap-1">
                        <Pin className="w-3 h-3" />
                        ปักหมุดข่าว
                      </Badge>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0072BC]" />
                      เผยแพร่เมื่อ: {new Date(item.published_at).toLocaleDateString("th-TH")} เวลา {new Date(item.published_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-8 text-xs font-semibold text-[#0072BC] hover:bg-blue-50"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      แก้ไข
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setMessage(null);
                        setDeleteItem(item);
                      }}
                      className="h-8 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      ลบ
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-[#003366] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5 whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                {/* Album Photo Gallery Thumbnails */}
                {photos.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      <Images className="w-4 h-4 text-[#0072BC]" />
                      <span>อัลบั้มรูปภาพประกอบ ({photos.length} รูป):</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {photos.map((photoUrl, pIdx) => (
                        <button
                          key={`${photoUrl}-${pIdx}`}
                          type="button"
                          onClick={() => handleOpenLightbox(photos, pIdx, item.title)}
                          className="relative h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 hover:scale-105 transition-all shadow-xs cursor-pointer group"
                        >
                          <Image src={photoUrl} alt={`ภาพประกอบ #${pIdx + 1}`} fill className="object-cover" unoptimized />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
                            <Search className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    ผู้โพสต์: <strong>{item.author?.name || "เจ้าหน้าที่ IT Admin"}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#0072BC]" />
              สร้างข่าวประชาสัมพันธ์ใหม่
            </DialogTitle>
            <DialogDescription className="text-xs">
              กรอกข้อมูลข่าวประกาศ และแนบอัลบั้มรูปภาพเพื่อแสดงผลขึ้นหน้าแรกระบบ
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {message && (
                <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
                  {message.text}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  หัวข้อข่าวประกาศ <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="เช่น แจ้งปรับปรุงระบบเครือข่ายอินเทอร์เน็ตประจำปี..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    หมวดหมู่ข่าว <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "important" | "update" | "security" | "maintenance")}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-[#0072BC]"
                  >
                    <option value="important">ประกาศสำคัญ / ด่วนที่สุด</option>
                    <option value="update">อัปเดตระบบ</option>
                    <option value="security">ความปลอดภัยไอที</option>
                    <option value="maintenance">บำรุงรักษา</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0072BC] focus:ring-[#0072BC]"
                    />
                    <span>ปักหมุดไว้ที่บนสุดของหน้าหลัก</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  รายละเอียดข่าวประชาสัมพันธ์ <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  required
                  rows={4}
                  placeholder="กรอกรายละเอียดข่าวประกาศ คำแนะนำ หรือกำหนดการ..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Album Image Uploader */}
              <AlbumImageUploader value={imageUrls} onChange={setImageUrls} />
            </div>

            <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#0072BC] font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "เผยแพร่ข่าวประกาศ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#0072BC]" />
              แก้ไขข่าวประชาสัมพันธ์ #{editItem?.id}
            </DialogTitle>
            <DialogDescription className="text-xs">
              ปรับปรุงข้อความ เปลี่ยนรูปภาพ หรือเปลี่ยนสถานะปักหมุดข่าว
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {message && (
                <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
                  {message.text}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  หัวข้อข่าวประกาศ <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    หมวดหมู่ข่าว <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "important" | "update" | "security" | "maintenance")}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-[#0072BC]"
                  >
                    <option value="important">ประกาศสำคัญ / ด่วนที่สุด</option>
                    <option value="update">อัปเดตระบบ</option>
                    <option value="security">ความปลอดภัยไอที</option>
                    <option value="maintenance">บำรุงรักษา</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0072BC] focus:ring-[#0072BC]"
                    />
                    <span>ปักหมุดไว้ที่บนสุดของหน้าหลัก</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  รายละเอียดข่าวประชาสัมพันธ์ <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Album Image Uploader */}
              <AlbumImageUploader value={imageUrls} onChange={setImageUrls} />
            </div>

            <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditItem(null)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#0072BC] font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "บันทึกการแก้ไข"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5 text-rose-600" />
              ยืนยันการลบข่าวประกาศ
            </DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบข่าวประกาศ &quot;{deleteItem?.title}&quot;?
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
              {message.text}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteItem(null)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันการลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX MODAL */}
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

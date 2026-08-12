"use client";

import React, { useState } from "react";
import { Category } from "@/db/schema";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/server/actions/categories";
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
  Layers,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  Box,
  Laptop,
  Monitor,
  Tablet,
  Wifi,
  Headphones,
  Printer,
  HardDrive,
  AlertTriangle,
} from "lucide-react";

interface CategoryWithCount extends Category {
  assetCount: number;
}

interface AdminCategoriesClientProps {
  initialCategories: CategoryWithCount[];
}

const availableIcons = [
  { name: "laptop", label: "คอมพิวเตอร์ / โน้ตบุ๊ก", icon: Laptop },
  { name: "monitor", label: "จอภาพ / จอมอนิเตอร์", icon: Monitor },
  { name: "tablet", label: "แท็บเล็ต / สมาร์ตโฟน", icon: Tablet },
  { name: "wifi", label: "อุปกรณ์เครือข่าย / Network", icon: Wifi },
  { name: "headphones", label: "หูฟัง / Peripherals", icon: Headphones },
  { name: "printer", label: "เครื่องพิมพ์ / สแกนเนอร์", icon: Printer },
  { name: "hard-drive", label: "ไดรฟ์ / Storage", icon: HardDrive },
  { name: "box", label: "ทั่วไป / อื่นๆ", icon: Box },
];

export default function AdminCategoriesClient({
  initialCategories,
}: AdminCategoriesClientProps) {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CategoryWithCount | null>(null);
  const [deleteItem, setDeleteItem] = useState<CategoryWithCount | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("box");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const resetForm = () => {
    setName("");
    setIcon("box");
    setDescription("");
    setMessage(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (cat: CategoryWithCount) => {
    resetForm();
    setEditItem(cat);
    setName(cat.name);
    setIcon(cat.icon || "box");
    setDescription(cat.description || "");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await createCategoryAction({ name, icon, description });
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

    const res = await updateCategoryAction(editItem.id, { name, icon, description });
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
    const res = await deleteCategoryAction(deleteItem.id);
    setLoading(false);

    if (res.success) {
      setDeleteItem(null);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const filteredCategories = initialCategories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getCategoryIconComponent = (iconName: string) => {
    const found = availableIcons.find((i) => i.name === iconName);
    const IconComp = found ? found.icon : Box;
    return <IconComp className="w-5 h-5" />;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#0072BC]" />
            ศูนย์จัดการหมวดหมู่อุปกรณ์ (Category Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            การประปาส่วนภูมิภาค (กปภ.) — เพิ่ม แก้ไข และลบหมวดหมู่พัสดุครุภัณฑ์ไอที
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl shadow-md">
          <Plus className="w-4 h-4 mr-1.5" />
          สร้างหมวดหมู่ใหม่
        </Button>
      </div>

      {/* 2. Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหาชื่อหมวดหมู่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* 3. Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xl shadow-slate-200/30 space-y-3 flex flex-col justify-between hover:border-[#0072BC]/40 transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0072BC] border border-blue-100 shrink-0">
                  {getCategoryIconComponent(cat.icon)}
                </div>
                <Badge variant={cat.assetCount > 0 ? "default" : "outline"} className="text-[11px]">
                  {cat.assetCount} รายการในคลัง
                </Badge>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#003366] leading-snug">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {cat.description || "ไม่มีรายละเอียดคำอธิบายเพิ่มเติม"}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(cat)}
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
                  setDeleteItem(cat);
                }}
                className="h-8 text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                ลบ
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0072BC]" />
              สร้างหมวดหมู่อุปกรณ์ใหม่
            </DialogTitle>
            <DialogDescription>
              ระบุข้อมูลหมวดหมู่เพื่อจัดกลุ่มครุภัณฑ์ไอที กปภ.
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                ชื่อหมวดหมู่อุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="เช่น คอมพิวเตอร์โน้ตบุ๊ก, จอภาพ..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                ไอคอนประจำหมวดหมู่ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableIcons.map((item) => {
                  const IconComp = item.icon;
                  const selected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        selected
                          ? "border-[#0072BC] bg-blue-50 text-[#0072BC] font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                      <span className="text-[10px] line-clamp-1">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                คำอธิบายหมวดหมู่
              </label>
              <Textarea
                rows={3}
                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "สร้างหมวดหมู่"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#0072BC]" />
              แก้ไขหมวดหมู่อุปกรณ์ #{editItem?.id}
            </DialogTitle>
            <DialogDescription>
              อัปเดตชื่อ ไอคอน หรือคำอธิบายหมวดหมู่
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
              {message.text}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                ชื่อหมวดหมู่อุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                ไอคอนประจำหมวดหมู่ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableIcons.map((item) => {
                  const IconComp = item.icon;
                  const selected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        selected
                          ? "border-[#0072BC] bg-blue-50 text-[#0072BC] font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                      <span className="text-[10px] line-clamp-1">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                คำอธิบายหมวดหมู่
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditItem(null)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading}>
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
              ยืนยันการลบหมวดหมู่อุปกรณ์
            </DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ &quot;{deleteItem?.name}&quot;?
            </DialogDescription>
          </DialogHeader>

          {deleteItem && deleteItem.assetCount > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#E5A823] shrink-0 mt-0.5" />
              <span>
                <strong>คำเตือน:</strong> มีครุภัณฑ์ไอทีผูกอยู่ในหมวดหมู่นี้จำนวน <strong>{deleteItem.assetCount}</strong> รายการ ระบบจะป้องกันการลบจนกว่าครุภัณฑ์ทั้งหมดจะถูกลบหรือย้ายออก
              </span>
            </div>
          )}

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
              disabled={loading || (deleteItem ? deleteItem.assetCount > 0 : false)}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันการลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Asset, Category } from "@/db/schema";
import {
  createAssetAction,
  updateAssetAction,
  deleteAssetAction,
} from "@/server/actions/assets";
import StatusBadge from "@/components/StatusBadge";
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
import ImageUploader from "@/components/ImageUploader";
import {
  Laptop,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  MapPin,
  Barcode,
  Layers,
  AlertTriangle,
} from "lucide-react";

interface ExtendedAsset extends Asset {
  category?: Category | null;
  borrowRequests?: unknown[];
}

interface AdminAssetsClientProps {
  initialAssets: ExtendedAsset[];
  categoriesList: Category[];
}

export default function AdminAssetsClient({
  initialAssets,
  categoriesList,
}: AdminAssetsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExtendedAsset | null>(null);
  const [deleteItem, setDeleteItem] = useState<ExtendedAsset | null>(null);

  // Form States
  const [assetTag, setAssetTag] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number>(categoriesList[0]?.id || 1);
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState<"available" | "borrowed" | "maintenance" | "retired">("available");
  const [location, setLocation] = useState("คลังพัสดุ กปภ.");
  const [borrowDurationDays, setBorrowDurationDays] = useState<number>(7);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const resetForm = () => {
    setAssetTag("PWA-2026-001");
    setName("");
    setCategoryId(categoriesList[0]?.id || 1);
    setModel("");
    setSerialNumber("");
    setStatus("available");
    setLocation("คลังพัสดุ กปภ.");
    setBorrowDurationDays(7);
    setDescription("");
    setImageUrl("");
    setMessage(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (item: ExtendedAsset) => {
    resetForm();
    setEditItem(item);
    setAssetTag(item.asset_tag);
    setName(item.name);
    setCategoryId(item.category_id);
    setModel(item.model || "");
    setSerialNumber(item.serial_number || "");
    setStatus(item.status);
    setLocation(item.location || "คลังพัสดุ กปภ.");
    setBorrowDurationDays(item.borrow_duration_days || 7);
    setDescription(item.description || "");
    setImageUrl(item.image_url || "");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await createAssetAction({
      assetTag,
      name,
      categoryId,
      model,
      serialNumber,
      status,
      location,
      borrowDurationDays,
      description,
      imageUrl,
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

    const res = await updateAssetAction(editItem.id, {
      assetTag,
      name,
      categoryId,
      model,
      serialNumber,
      status,
      location,
      borrowDurationDays,
      description,
      imageUrl,
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

    const res = await deleteAssetAction(deleteItem.id);
    setLoading(false);

    if (res.success) {
      setDeleteItem(null);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const filteredAssets = initialAssets.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(search.toLowerCase())) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || item.category_id === Number(selectedCategory);

    const matchesStatus =
      selectedStatus === "all" || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Laptop className="w-6 h-6 text-[#0072BC]" />
            ศูนย์จัดการครุภัณฑ์ไอที (IT Asset Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            การประปาส่วนภูมิภาค (กปภ.) — เพิ่ม แก้ไข ลบ และเปลี่ยนสถานะพัสดุครุภัณฑ์ไอทีองค์กร
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl shadow-md">
          <Plus className="w-4 h-4 mr-1.5" />
          เพิ่มครุภัณฑ์ใหม่
        </Button>
      </div>

      {/* 2. Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหารหัส, ชื่ออุปกรณ์ หรือ S/N..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          >
            <option value="all">ทุกหมวดหมู่ ({initialAssets.length})</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="available">พร้อมใช้งาน (Available)</option>
            <option value="borrowed">ถูกยืมใช้งาน (Borrowed)</option>
            <option value="maintenance">ส่งซ่อมบำรุง (Maintenance)</option>
            <option value="retired">จำหน่ายออก (Retired)</option>
          </select>
        </div>
      </div>

      {/* 3. Assets Table */}
      <div className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-xl shadow-slate-200/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-[#003366] uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">รหัสครุภัณฑ์ / ชื่ออุปกรณ์</th>
                <th className="py-3.5 px-4">หมวดหมู่</th>
                <th className="py-3.5 px-4">รุ่น / Serial Number</th>
                <th className="py-3.5 px-4">สถานที่จัดเก็บ</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่พบครุภัณฑ์ไอทีตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredAssets.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                          {item.asset_tag}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-[#003366] mt-1">
                        {item.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <Badge variant="outline" className="gap-1 font-semibold">
                        <Layers className="w-3 h-3 text-[#0072BC]" />
                        {item.category?.name || "ทั่วไป"}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      <div>{item.model || "-"}</div>
                      <div className="text-[10px] text-slate-400">S/N: {item.serial_number || "-"}</div>
                      <div className="text-[10px] text-[#0072BC] font-sans font-medium mt-0.5">
                        คืนอุปกรณ์ภายใน {item.borrow_duration_days || 7} วัน
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-[#0072BC]" />
                        <span>{item.location || "คลังพัสดุ กปภ."}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge type="asset" status={item.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ASSET DIALOG */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Laptop className="w-5 h-5 text-[#0072BC]" />
              เพิ่มครุภัณฑ์ไอทีใหม่
            </DialogTitle>
            <DialogDescription className="text-xs">
              บันทึกข้อมูลอุปกรณ์คอมพิวเตอร์เข้าสู่คลังพัสดุ กปภ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {message && (
                <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-[#0072BC]" />
                    รหัสครุภัณฑ์ (Asset Tag) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="เช่น PWA-2026-001"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#0072BC]" />
                    หมวดหมู่อุปกรณ์ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-[#0072BC]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อครุภัณฑ์ / อุปกรณ์ <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="เช่น MacBook Pro 16 M3 Max, Dell XPS 15..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รุ่น (Model)</label>
                  <Input
                    placeholder="เช่น XPS 15 9530"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Serial Number (S/N)</label>
                  <Input
                    placeholder="ระบุ S/N ประจำเครื่อง..."
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะครุภัณฑ์ <span className="text-rose-500">*</span></label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "available" | "borrowed" | "maintenance" | "retired")}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-[#0072BC]"
                  >
                    <option value="available">พร้อมใช้งาน (Available)</option>
                    <option value="borrowed">ถูกยืมใช้งาน (Borrowed)</option>
                    <option value="maintenance">ส่งซ่อมบำรุง (Maintenance)</option>
                    <option value="retired">จำหน่ายออก (Retired)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานที่จัดเก็บ</label>
                  <Input
                    placeholder="เช่น คลังไอที ชั้น 4"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จำนวนวันที่คืนอุปกรณ์ (วัน) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  required
                  placeholder="เช่น 7 (จำนวนวันที่ต้องคืนหลังยืม)"
                  value={borrowDurationDays}
                  onChange={(e) => setBorrowDurationDays(Number(e.target.value) || 7)}
                />
              </div>

              <ImageUploader value={imageUrl} onChange={setImageUrl} />

              <div>
                <label className="block font-bold text-slate-700 mb-1">รายละเอียด/สเปกอุปกรณ์</label>
                <Textarea
                  rows={2}
                  placeholder="ระบุสเปก หรือหมายเหตุเพิ่มเติม..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "เพิ่มครุภัณฑ์"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT ASSET DIALOG */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Edit3 className="w-5 h-5 text-[#0072BC]" />
              แก้ไขครุภัณฑ์ไอที #{editItem?.id}
            </DialogTitle>
            <DialogDescription className="text-xs">
              อัปเดตข้อมูล สเปก หรือเปลี่ยนสถานะการใช้งาน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {message && (
                <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    รหัสครุภัณฑ์ (Asset Tag) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    หมวดหมู่อุปกรณ์ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-[#0072BC]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อครุภัณฑ์ / อุปกรณ์ <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รุ่น (Model)</label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Serial Number (S/N)</label>
                  <Input
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะครุภัณฑ์ <span className="text-rose-500">*</span></label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "available" | "borrowed" | "maintenance" | "retired")}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-[#0072BC]"
                  >
                    <option value="available">พร้อมใช้งาน (Available)</option>
                    <option value="borrowed">ถูกยืมใช้งาน (Borrowed)</option>
                    <option value="maintenance">ส่งซ่อมบำรุง (Maintenance)</option>
                    <option value="retired">จำหน่ายออก (Retired)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานที่จัดเก็บ</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จำนวนวันที่คืนอุปกรณ์ (วัน) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  required
                  placeholder="เช่น 7 (กำหนดจำนวนวันที่ต้องคืน)"
                  value={borrowDurationDays}
                  onChange={(e) => setBorrowDurationDays(Number(e.target.value) || 7)}
                />
              </div>

              <ImageUploader value={imageUrl} onChange={setImageUrl} />

              <div>
                <label className="block font-bold text-slate-700 mb-1">รายละเอียด/สเปกอุปกรณ์</label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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

      {/* DELETE ASSET CONFIRM DIALOG */}
      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5 text-rose-600" />
              ยืนยันการลบรายการครุภัณฑ์ไอที
            </DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบครุภัณฑ์ &quot;{deleteItem?.name}&quot; ({deleteItem?.asset_tag})?
            </DialogDescription>
          </DialogHeader>

          {deleteItem && deleteItem.status === "borrowed" && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>คำเตือน:</strong> อุปกรณ์นี้อยู่ในสถานะ <strong>&quot;ถูกยืมใช้งาน&quot;</strong> ระบบจะป้องกันการลบจนกว่าอุปกรณ์จะถูกส่งคืน
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
              disabled={loading || (deleteItem ? deleteItem.status === "borrowed" : false)}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันการลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

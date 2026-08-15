"use client";

import React, { useState } from "react";
import { User } from "@/db/schema";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/server/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Building,
  KeyRound,
} from "lucide-react";

interface AdminUsersClientProps {
  initialUsers: User[];
  currentUserId: number;
}

export default function AdminUsersClient({
  initialUsers,
  currentUserId,
}: AdminUsersClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [deleteItem, setDeleteItem] = useState<User | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("กปภ.");
  const [role, setRole] = useState<"user" | "admin">("user");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setDepartment("กปภ.");
    setRole("user");
    setMessage(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    resetForm();
    setEditItem(u);
    setEmail(u.email);
    setPassword("");
    setName(u.name);
    setDepartment(u.department || "กปภ.");
    setRole(u.role);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await createUserAction({
      email,
      password,
      name,
      department,
      role,
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

    const res = await updateUserAction(editItem.id, {
      email,
      password,
      name,
      department,
      role,
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

    const res = await deleteUserAction(deleteItem.id);
    setLoading(false);

    if (res.success) {
      setDeleteItem(null);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0072BC]" />
            ศูนย์จัดการผู้ใช้งานระบบ (User Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            การประปาส่วนภูมิภาค (กปภ.) — บริหารจัดการบัญชีผู้ใช้งาน สิทธิ์แอดมิน และหน่วยงาน
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl shadow-md">
          <UserPlus className="w-4 h-4 mr-1.5" />
          เพิ่มผู้ใช้งานใหม่
        </Button>
      </div>

      {/* 2. Filter & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหาจากชื่อ, อีเมล หรือสังกัด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold shrink-0">สิทธิ์การใช้งาน:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
          >
            <option value="all">ทั้งหมด ({initialUsers.length})</option>
            <option value="admin">เจ้าหน้าที่ IT Admin</option>
            <option value="user">พนักงานทั่วไป (User)</option>
          </select>
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-xl shadow-slate-200/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-[#003366] uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">ชื่อ-นามสกุลผู้ใช้งาน</th>
                <th className="py-3.5 px-4">อีเมล (Email)</th>
                <th className="py-3.5 px-4">สังกัด/ฝ่ายงาน</th>
                <th className="py-3.5 px-4">สิทธิ์ในระบบ</th>
                <th className="py-3.5 px-4">สถานะ LINE</th>
                <th className="py-3.5 px-4">วันที่ลงทะเบียน</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบผู้ใช้งานตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0072BC] flex items-center justify-center font-bold text-xs shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        {u.id === currentUserId && (
                          <span className="text-[10px] text-[#0072BC] font-semibold">
                            (บัญชีของคุณ)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {u.department || "กปภ."}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.role === "admin" ? (
                        <Badge variant="secondary" className="gap-1 bg-[#003366]">
                          <ShieldCheck className="w-3 h-3 text-[#E5A823]" />
                          IT Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          พนักงานทั่วไป
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.line_user_id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {u.line_display_name || "ผูกแล้ว"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-normal">
                          ยังไม่ได้ผูก
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString("th-TH")}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 text-xs font-semibold text-[#0072BC] hover:bg-blue-50"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          แก้ไข
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={u.id === currentUserId}
                          onClick={() => {
                            setMessage(null);
                            setDeleteItem(u);
                          }}
                          className="h-8 text-xs font-semibold disabled:opacity-40"
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

      {/* CREATE USER DIALOG */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#0072BC]" />
              เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ
            </DialogTitle>
            <DialogDescription>
              สร้างบัญชีสำหรับพนักงานกปภ. หรือเพิ่มสิทธิ์เจ้าหน้าที่ IT Admin
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#0072BC]" />
                อีเมลผู้ใช้งาน (PWA Email) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                required
                placeholder="เช่น user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#0072BC]" />
                รหัสผ่านเริ่มต้น <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                required
                placeholder="ระบุอย่างน้อย 6 ตัวอักษร..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-[#0072BC]" />
                ชื่อ-นามสกุล <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="เช่น นายสมชาย ใจดี"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#0072BC]" />
                สังกัด/ฝ่ายงาน/กอง
              </label>
              <Input
                placeholder="เช่น กองระบบสารสนเทศ, ฝ่ายเทคโนโลยี..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0072BC]" />
                สิทธิ์การใช้งานระบบ <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "user" | "admin")}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="user">พนักงานทั่วไป (ยื่นขอยืมอุปกรณ์ได้)</option>
                <option value="admin">เจ้าหน้าที่ IT Administrator (อนุมัติ/จัดการระบบ)</option>
              </select>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "เพิ่มผู้ใช้งาน"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#0072BC]" />
              แก้ไขข้อมูลผู้ใช้งาน #{editItem?.id}
            </DialogTitle>
            <DialogDescription>
              อัปเดตชื่อ อีเมล สังกัด หรือเปลี่ยนรหัสผ่านใหม่
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30">
              {message.text}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                อีเมลผู้ใช้งาน (PWA Email) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                เปลี่ยนรหัสผ่านใหม่ (ว่างไว้หากไม่ต้องการเปลี่ยน)
              </label>
              <Input
                type="password"
                placeholder="พิมพ์รหัสผ่านใหม่หากต้องการรีเซ็ต..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                สังกัด/ฝ่ายงาน/กอง
              </label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                สิทธิ์การใช้งานระบบ <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "user" | "admin")}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#0072BC]"
              >
                <option value="user">พนักงานทั่วไป (ยื่นขอยืมอุปกรณ์ได้)</option>
                <option value="admin">เจ้าหน้าที่ IT Administrator (อนุมัติ/จัดการระบบ)</option>
              </select>
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

      {/* DELETE USER DIALOG */}
      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5 text-rose-600" />
              ยืนยันการลบบัญชีผู้ใช้งาน
            </DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้งาน &quot;{deleteItem?.name}&quot; ({deleteItem?.email})? การลบนี้จะยกเลิก Session ทั้งหมดของผู้ใช้นี้ด้วย
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
    </div>
  );
}

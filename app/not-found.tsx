import React from "react";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-xl shadow-slate-200/40 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0072BC] border border-blue-100 flex items-center justify-center mx-auto shadow-sm">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-black text-[#003366] tracking-tight">404</span>
          <h1 className="text-lg font-extrabold text-slate-900">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบ หรือที่อยู่ URL ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-[#0072BC] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            กลับสู่แดชบอร์ดหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

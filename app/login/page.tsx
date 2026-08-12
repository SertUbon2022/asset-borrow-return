"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginAction } from "@/server/actions/auth";
import {
  Lock,
  Mail,
  UserCheck,
  ArrowRight,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  Laptop,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const res = await loginAction({ email, password });
    setLoading(false);

    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setErrorMessage(null);
    setEmail(demoEmail);
    setPassword("123456");

    const res = await loginAction({ email: demoEmail, password: "123456" });
    setLoading(false);

    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        
        {/* Left Side: PWA Brand Hero Panel */}
        <div className="lg:col-span-5 pwa-gradient-header text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Water Waves Decorative Circle */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#00A8FF]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Premium PWA Brand Emblem Container */}
            <div className="inline-flex items-center gap-3.5 p-3 rounded-2xl bg-white shadow-2xl border border-blue-100/80 group hover:scale-[1.02] transition-all duration-300">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center p-1 border border-slate-100">
                <Image
                  src="/pwa-login.svg"
                  alt="โลโก้ การประปาส่วนภูมิภาค"
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div className="text-left pr-2">
                <div className="text-[#003366] font-black text-sm leading-snug tracking-tight">
                  การประปาส่วนภูมิภาค
                </div>
                <div className="text-[#0072BC] font-extrabold text-[10px] tracking-wider uppercase">
                  Provincial Waterworks Authority
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-blue-100 font-semibold text-xs border border-white/20">
                PWA Enterprise Asset Flow
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                ระบบบริหารยืม-คืน ครุภัณฑ์ไอที
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-light leading-relaxed">
                การประปาส่วนภูมิภาค (กปภ.) — ระบบศูนย์กลางในการยื่นคำขอยืม
                ติดตามสถานะ และอนุมัติการใช้งานอุปกรณ์ไอทีองค์กร
              </p>
            </div>

            <div className="space-y-2.5 pt-4 text-xs font-medium border-t border-white/20">
              <div className="flex items-center gap-2 text-blue-50">
                <CheckCircle2 className="w-4 h-4 text-[#00A8FF] shrink-0" />
                <span>ยืนยันตัวตนผ่าน PostgreSQL Database Session</span>
              </div>
              <div className="flex items-center gap-2 text-blue-50">
                <CheckCircle2 className="w-4 h-4 text-[#E5A823] shrink-0" />
                <span>ควบคุมสิทธิ์ RBAC แยกแอดมินและพนักงาน</span>
              </div>
              <div className="flex items-center gap-2 text-blue-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ระบบความปลอดภัยสูง มาตรฐาน PWA CI</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 text-[11px] text-blue-200/80 font-light">
            © Provincial Waterworks Authority. All rights reserved.
          </div>
        </div>

        {/* Right Side: Login Form & Quick Demo Roles */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
          
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Laptop className="w-6 h-6 text-[#0072BC]" />
              เข้าสู่ระบบใช้งาน
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              โปรดระบุอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบบริหารยืม-คืน ครุภัณฑ์ไอที
            </p>
          </div>

          {/* Quick Demo Login Cards */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 space-y-2.5">
            <p className="text-xs font-bold text-[#0072BC] dark:text-[#00A8FF] flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#E5A823]" />
              เลือกสิทธิ์บัญชีเพื่อทดสอบระบบ (1-Click Login):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("admin@company.com")}
                className="p-2.5 rounded-xl bg-[#003366] hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-between transition-all shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E5A823]/20 flex items-center justify-center text-[#E5A823]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-xs">เจ้าหน้าที่ IT Admin</div>
                    <div className="text-[10px] text-blue-200 font-light">admin@company.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#E5A823] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("user@company.com")}
                className="p-2.5 rounded-xl bg-[#0072BC] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-between transition-all shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[#00A8FF]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-xs">พนักงานยืมอุปกรณ์</div>
                    <div className="text-[10px] text-blue-100 font-light">user@company.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Form */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0072BC]" />
                อีเมลผู้ใช้งาน (PWA Email) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น admin@company.com หรือ user@company.com"
                  className="w-full pl-3.5 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0072BC] focus:outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0072BC]" />
                รหัสผ่าน (Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ระบุรหัสผ่าน..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0072BC] focus:outline-hidden transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0072BC] hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังตรวจสอบความปลอดภัย...
                </>
              ) : (
                "เข้าสู่ระบบใช้งาน"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

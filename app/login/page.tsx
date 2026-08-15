"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/server/actions/auth";
import {
  verifyAndHandleLineAction,
  linkLineAndLoginAction,
} from "@/server/actions/line";
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
  MessageCircle,
  AlertTriangle,
} from "lucide-react";

interface LineDetectedProfile {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  idToken?: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect_to") || "/";
  const highlight = searchParams.get("highlight");
  const action = searchParams.get("action");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // LINE Auto-Login / Link States
  const [liffChecking, setLiffChecking] = useState(() => Boolean(process.env.NEXT_PUBLIC_LINE_LIFF_ID?.trim()));
  const [lineProfile, setLineProfile] = useState<LineDetectedProfile | null>(null);
  const [lineStatusNotice, setLineStatusNotice] = useState<string | null>(null);

  // Check LIFF when arriving on Login page
  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID?.trim();
    if (!liffId) {
      return;
    }

    const targetLiffId = liffId;
    let isMounted = true;

    async function checkLiffAuth() {
      try {
        const liffModule = await import("@line/liff");
        const liff = liffModule.default;

        await liff.init({ liffId: targetLiffId });

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          const idToken = liff.getIDToken() || undefined;
          if (!isMounted) return;

          // Verify with server action including cryptographic ID Token
          const result = await verifyAndHandleLineAction(
            profile.userId,
            profile.displayName,
            profile.pictureUrl,
            idToken
          );

          if (result.status === "authenticated") {
            // Already linked as Admin -> Auto Login!
            setLineStatusNotice(
              `ยินดีต้อนรับ ${result.user.name} (เข้าสู่ระบบอัตโนมัติผ่าน LINE)...`
            );
            const targetUrl = highlight
              ? `/admin/requests?highlight=${highlight}${action ? `&action=${action}` : ""}`
              : redirectTo;

            setTimeout(() => {
              router.push(targetUrl);
              router.refresh();
            }, 600);
            return;
          } else if (result.status === "needs_link") {
            // In group, but needs to link account
            setLineProfile({
              lineUserId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              idToken,
            });
            setLineStatusNotice(
              `ตรวจพบบัญชี LINE ของคุณในกลุ่ม กปภ. กรุณาเข้าสู่ระบบด้วยบัญชี IT Admin เพื่อผูกบัญชีอัตโนมัติ`
            );
          } else if (result.status === "not_in_group") {
            setErrorMessage(result.error);
          } else if (result.status === "unauthorized_role") {
            setErrorMessage(result.error);
          }
        }
      } catch (err) {
        console.error("LIFF check error:", err);
      } finally {
        if (isMounted) {
          setLiffChecking(false);
        }
      }
    }

    checkLiffAuth();

    return () => {
      isMounted = false;
    };
  }, [router, redirectTo, highlight, action]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // If LINE Profile is detected, perform linking + login simultaneously
    if (lineProfile?.lineUserId) {
      const res = await linkLineAndLoginAction({
        lineUserId: lineProfile.lineUserId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        idToken: lineProfile.idToken,
        email,
        password,
      });

      setLoading(false);

      if (res.success) {
        const targetUrl = highlight
          ? `/admin/requests?highlight=${highlight}${action ? `&action=${action}` : ""}`
          : redirectTo;
        router.push(targetUrl);
        router.refresh();
      } else {
        setErrorMessage(res.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบและผูกบัญชี LINE");
      }
      return;
    }

    // Standard Login
    const res = await loginAction({ email, password });
    setLoading(false);

    if (res.success) {
      const targetUrl = highlight
        ? `/admin/requests?highlight=${highlight}${action ? `&action=${action}` : ""}`
        : redirectTo;
      router.push(targetUrl);
      router.refresh();
    } else {
      setErrorMessage(res.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setErrorMessage(null);
    setEmail(demoEmail);
    setPassword("123456");

    if (lineProfile?.lineUserId) {
      const res = await linkLineAndLoginAction({
        lineUserId: lineProfile.lineUserId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        idToken: lineProfile.idToken,
        email: demoEmail,
        password: "123456",
      });

      setLoading(false);

      if (res.success) {
        const targetUrl = highlight
          ? `/admin/requests?highlight=${highlight}${action ? `&action=${action}` : ""}`
          : redirectTo;
        router.push(targetUrl);
        router.refresh();
      } else {
        setErrorMessage(res.error || "เกิดข้อผิดพลาดในการผูกบัญชี LINE");
      }
      return;
    }

    const res = await loginAction({ email: demoEmail, password: "123456" });
    setLoading(false);

    if (res.success) {
      const targetUrl = highlight
        ? `/admin/requests?highlight=${highlight}${action ? `&action=${action}` : ""}`
        : redirectTo;
      router.push(targetUrl);
      router.refresh();
    } else {
      setErrorMessage(res.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  if (liffChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0072BC]/10 text-[#0072BC] flex items-center justify-center animate-pulse">
          <MessageCircle className="w-6 h-6 fill-current" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-800 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#0072BC]" />
            กำลังตรวจสอบสิทธิ์สมาชิกกลุ่ม LINE...
          </p>
          <p className="text-xs text-slate-500">กรุณารอสักครู่ ระบบกำลังยืนยันความถูกต้อง</p>
        </div>
      </div>
    );
  }

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
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-5 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Laptop className="w-6 h-6 text-[#0072BC]" />
              เข้าสู่ระบบใช้งาน
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              โปรดระบุอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบบริหารยืม-คืน ครุภัณฑ์ไอที
            </p>
          </div>

          {/* LINE Detected Auto-Link Banner */}
          {lineProfile && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center gap-3">
                {lineProfile.pictureUrl ? (
                  <Image
                    src={lineProfile.pictureUrl}
                    alt="LINE Profile"
                    width={40}
                    height={40}
                    unoptimized
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#06C755] text-white font-bold flex items-center justify-center shrink-0">
                    {lineProfile.displayName?.charAt(0) || "L"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#06C755] fill-current" />
                    <span>ตรวจพบบัญชี LINE: <strong>{lineProfile.displayName}</strong></span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                    คุณอยู่ในกลุ่ม กปภ. แล้ว เข้าสู่ระบบด้านล่างเพื่อผูกบัญชีกับสิทธิ์ IT Admin อัตโนมัติ
                  </div>
                </div>
              </div>
            </div>
          )}

          {lineStatusNotice && !lineProfile && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#0072BC] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{lineStatusNotice}</span>
            </div>
          )}

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
                className="p-2.5 rounded-xl bg-[#003366] hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-between transition-all shadow-xs group cursor-pointer"
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
                className="p-2.5 rounded-xl bg-[#0072BC] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-between transition-all shadow-xs group cursor-pointer"
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

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
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
              ) : lineProfile ? (
                "ผูกบัญชี LINE และเข้าสู่ระบบ"
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0072BC]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

"use client";

import React, { useState, memo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { logoutAction } from "@/server/actions/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Laptop,
  ClipboardList,
  ShieldCheck,
  Megaphone,
  Layers,
  Users,
  ChevronDown,
  Menu,
  X,
  Settings2,
  LogIn,
  LogOut,
  MessageCircle,
  CheckCircle2,
  User as UserIcon,
  Loader2,
  Building2,
} from "lucide-react";
import LineAccountModal from "./LineAccountModal";

interface NavbarClientProps {
  currentUser: {
    id: number;
    email: string;
    name: string;
    department: string | null;
    role: "admin" | "user";
    lineUserId?: string | null;
    lineDisplayName?: string | null;
    linePictureUrl?: string | null;
  } | null;
}

const baseNavItems = [
  { label: "หน้าหลัก", href: "/", icon: LayoutDashboard },
  { label: "คลังอุปกรณ์ไอที", href: "/assets", icon: Laptop },
  { label: "รายการยืม-คืน", href: "/borrow", icon: ClipboardList },
];

const adminNavGroup = [
  {
    label: "ศูนย์อนุมัติคำขอยืม",
    subtitle: "อนุมัติ / ปฏิเสธ / ส่งมอบ / รับคืน",
    href: "/admin/requests",
    icon: ShieldCheck,
  },
  {
    label: "จัดการครุภัณฑ์ไอที",
    subtitle: "เพิ่ม / แก้ไข / ลบ พัสดุครุภัณฑ์ไอที",
    href: "/admin/assets",
    icon: Laptop,
  },
  {
    label: "จัดการหมวดหมู่อุปกรณ์",
    subtitle: "เพิ่ม / แก้ไข / ลบ หมวดหมู่พัสดุ",
    href: "/admin/categories",
    icon: Layers,
  },
  {
    label: "จัดการผู้ใช้งานระบบ",
    subtitle: "เพิ่ม / แก้ไข / ลบ สิทธิ์ผู้ใช้",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "จัดการข่าวประกาศ",
    subtitle: "เพิ่ม / แก้ไข / ลบ ข่าวประชาสัมพันธ์",
    href: "/admin/announcements",
    icon: Megaphone,
  },
];

const MobileMenuDrawer = memo(({
  pathname,
  currentUser,
  onClose,
  onOpenLineModal,
}: {
  pathname: string;
  currentUser: NavbarClientProps["currentUser"];
  onClose: () => void;
  onOpenLineModal: () => void;
}) => {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAction();
  };

  return (
    <div className="lg:hidden bg-[#002850] border-t border-blue-600/50 px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
      {/* Base Navigation Links */}
      <div className="space-y-1">
        {baseNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-[#0072BC] text-white font-bold shadow-xs"
                  : "text-blue-100 hover:bg-white/10"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-[#E5A823]" : "text-blue-300"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Admin Group */}
      {currentUser?.role === "admin" && (
        <div className="pt-2 border-t border-blue-700/60 space-y-1.5">
          <div className="text-[11px] font-bold text-[#E5A823] px-3.5 py-1 uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            ระบบบริหารแอดมิน (Admin Panel)
          </div>

          {adminNavGroup.map((subItem) => {
            const SubIcon = subItem.icon;
            const isSubActive = pathname === subItem.href;
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  isSubActive
                    ? "bg-[#0072BC] text-white border-l-4 border-[#E5A823]"
                    : "text-blue-100 bg-white/5 hover:bg-white/10"
                )}
              >
                <SubIcon className="w-4 h-4 text-[#E5A823] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{subItem.label}</div>
                  <div className="text-[10px] text-blue-200 font-normal truncate">{subItem.subtitle}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* User Section in Mobile Drawer */}
      {currentUser ? (
        <div className="pt-3 border-t border-blue-700/60 space-y-2.5">
          {/* User Profile Card */}
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E5A823] text-slate-900 font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-blue-200 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-300 shrink-0" />
                <span>{currentUser.department || "การประปาส่วนภูมิภาค"}</span>
              </div>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
              currentUser.role === "admin"
                ? "bg-[#E5A823]/20 text-[#E5A823] border border-[#E5A823]/40"
                : "bg-blue-400/20 text-blue-200 border border-blue-400/30"
            )}>
              {currentUser.role === "admin" ? "IT Admin" : "ผู้ใช้"}
            </span>
          </div>

          {/* Mobile LINE Account Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLineModal();
            }}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#06C755] fill-current" />
              <span>การเชื่อมต่อ LINE Group</span>
            </div>
            {currentUser.lineUserId ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-[#06C755]" /> ผูกแล้ว
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                ยังไม่ผูก
              </span>
            )}
          </button>

          {/* Mobile Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>ออกจากระบบ</span>
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-blue-700/60">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#E5A823] hover:bg-amber-500 text-slate-900 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบใช้งาน</span>
          </Link>
        </div>
      )}
    </div>
  );
});
MobileMenuDrawer.displayName = "MobileMenuDrawer";

export default function NavbarClient({ currentUser }: NavbarClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAction();
  };

  if (pathname === "/login") {
    return null;
  }

  const isAdminActive = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Main Navigation Bar */}
      <nav className="bg-[#0072BC] text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* 1. Left Section: Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group py-1 shrink-0">
              <div className="relative h-10 px-1.5 flex items-center justify-center group-hover:scale-105 transition-all overflow-hidden shrink-0">
                <Image
                  src="/pwasite.png"
                  alt="โลโก้ การประปาส่วนภูมิภาค"
                  width={150}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* 2. Center Section: Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {baseNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all whitespace-nowrap shrink-0",
                      isActive
                        ? "bg-white/20 text-white shadow-inner border-b-2 border-[#E5A823]"
                        : "text-blue-50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-[#E5A823]" : "text-blue-200"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Admin Management Dropdown */}
              {currentUser?.role === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all outline-none cursor-pointer whitespace-nowrap shrink-0",
                      isAdminActive
                        ? "bg-[#003366] text-white shadow-inner border-b-2 border-[#E5A823]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    <Settings2 className="w-4 h-4 text-[#E5A823] shrink-0" />
                    <span>ระบบบริหารแอดมิน</span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-200 opacity-80 shrink-0" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl bg-white border border-slate-200 rounded-2xl">
                    <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-[#0072BC] font-bold">
                      <Settings2 className="w-3.5 h-3.5 text-[#0072BC]" />
                      เมนูเจ้าหน้าที่ IT Administrator
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {adminNavGroup.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = pathname === subItem.href;
                      return (
                        <DropdownMenuItem key={subItem.href} asChild>
                          <Link
                            href={subItem.href}
                            className={cn(
                              "flex items-start gap-2.5 p-2.5 rounded-xl transition-all cursor-pointer",
                              isSubActive
                                ? "bg-blue-50 text-[#0072BC] font-bold"
                                : "hover:bg-slate-50 text-slate-800"
                            )}
                          >
                            <div className="p-1.5 rounded-lg bg-blue-100/60 text-[#0072BC] shrink-0 mt-0.5">
                              <SubIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold leading-snug">
                                {subItem.label}
                              </div>
                              <div className="text-[10px] text-slate-500 font-normal mt-0.5 leading-tight">
                                {subItem.subtitle}
                              </div>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* 3. Right Section: Unified User Profile Dropdown & Quick Actions */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {currentUser ? (
                <>
                  {/* Compact LINE Status Pill Button */}
                  <button
                    type="button"
                    onClick={() => setLineModalOpen(true)}
                    title={
                      currentUser.lineUserId
                        ? `ผูก LINE แล้ว (${currentUser.lineDisplayName || "LINE User"})`
                        : "คลิกเพื่อผูกบัญชี LINE"
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      currentUser.lineUserId
                        ? "bg-[#06C755]/20 hover:bg-[#06C755]/30 text-white border border-[#06C755]/40"
                        : "bg-white/10 hover:bg-white/20 text-white/90 border border-white/20"
                    )}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#06C755] fill-current shrink-0" />
                    <span className="text-[11px] font-bold">
                      {currentUser.lineUserId ? "LINE ผูกแล้ว" : "ผูก LINE"}
                    </span>
                  </button>

                  {/* Unified User Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs transition-all outline-none cursor-pointer shrink-0">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-[#E5A823] text-slate-900 font-extrabold flex items-center justify-center shrink-0 text-xs shadow-xs">
                          {currentUser.name.charAt(0)}
                        </div>
                        {currentUser.lineUserId && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#06C755] border-2 border-[#0072BC]" />
                        )}
                      </div>

                      <div className="text-left max-w-[110px] xl:max-w-[150px] min-w-0">
                        <div className="font-bold text-white text-xs truncate leading-tight">
                          {currentUser.name}
                        </div>
                        <div className="text-[9px] text-blue-200 truncate leading-tight">
                          {currentUser.role === "admin" ? "IT Admin" : currentUser.department || "พนักงาน"}
                        </div>
                      </div>

                      <ChevronDown className="w-3.5 h-3.5 text-blue-200 opacity-80 shrink-0 ml-0.5" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl bg-white border border-slate-200 rounded-2xl">
                      {/* User Info Header */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {currentUser.name}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                            currentUser.role === "admin"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          )}>
                            {currentUser.role === "admin" ? "IT Admin" : "ผู้ใช้ทั่วไป"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {currentUser.email}
                        </div>
                        {currentUser.department && (
                          <div className="text-[10px] text-slate-600 truncate flex items-center gap-1 pt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{currentUser.department}</span>
                          </div>
                        )}
                      </div>

                      {/* LINE Status Option */}
                      <DropdownMenuItem
                        onClick={() => setLineModalOpen(true)}
                        className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 text-xs font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-[#06C755] fill-current" />
                          <span>การเชื่อมต่อ LINE</span>
                        </div>
                        {currentUser.lineUserId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-[#06C755]" /> ผูกแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            ยังไม่ผูก
                          </span>
                        )}
                      </DropdownMenuItem>

                      {/* Borrow History Link */}
                      <DropdownMenuItem asChild>
                        <Link
                          href="/borrow"
                          className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 text-xs font-medium text-slate-700"
                        >
                          <ClipboardList className="w-4 h-4 text-[#0072BC]" />
                          <span>ประวัติคำขอยืม-คืนของฉัน</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Logout Option */}
                      <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer hover:bg-rose-50 text-xs font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                      >
                        {loggingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <LogOut className="w-4 h-4 text-rose-600" />
                        )}
                        <span>ออกจากระบบ</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Compact Quick Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    title="ออกจากระบบ"
                    className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {loggingOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E5A823] hover:bg-amber-500 text-slate-900 font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 text-slate-900" />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              )}
            </div>

            {/* 4. Mobile Menu Hamburger Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-white hover:bg-white/10 focus:outline-hidden cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <MobileMenuDrawer
            pathname={pathname}
            currentUser={currentUser}
            onClose={closeMobileMenu}
            onOpenLineModal={() => setLineModalOpen(true)}
          />
        )}
      </nav>

      {/* LINE Account Modal */}
      {currentUser && (
        <LineAccountModal
          isOpen={lineModalOpen}
          onClose={() => setLineModalOpen(false)}
          currentUser={currentUser}
        />
      )}
    </header>
  );
}

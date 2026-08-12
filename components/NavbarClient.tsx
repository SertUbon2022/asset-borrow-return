"use client";

import React, { useState, memo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import LogoutButton from "./LogoutButton";
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
  User,
  LogIn,
} from "lucide-react";

interface NavbarClientProps {
  currentUser: {
    id: number;
    email: string;
    name: string;
    department: string | null;
    role: "admin" | "user";
  } | null;
}

const baseNavItems = [
  { label: "หน้าหลัก", href: "/", icon: LayoutDashboard },
  { label: "คลังอุปกรณ์ไอที", href: "/assets", icon: Laptop },
  { label: "รายการยืม-คืนของฉัน", href: "/borrow", icon: ClipboardList },
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
}: {
  pathname: string;
  currentUser: NavbarClientProps["currentUser"];
  onClose: () => void;
}) => (
  <div className="md:hidden bg-[#003366] border-t border-blue-600 px-4 py-3 space-y-3">
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
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors",
            isActive
              ? "bg-[#0072BC] text-white font-bold"
              : "text-blue-100 hover:bg-white/10"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isActive ? "text-[#E5A823]" : "text-blue-300"
            )}
          />
          <span>{item.label}</span>
        </Link>
      );
    })}

    {/* Mobile Admin Group */}
    {currentUser?.role === "admin" && (
      <div className="pt-2 border-t border-blue-700/80 space-y-2">
        <div className="text-[11px] font-bold text-[#E5A823] px-3 uppercase tracking-wider flex items-center gap-1.5">
          <Settings2 className="w-3.5 h-3.5" />
          ระบบบริหารแอดมิน (Admin Management)
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                isSubActive
                  ? "bg-[#0072BC] text-white border-l-4 border-[#E5A823]"
                  : "text-blue-100 bg-white/5 hover:bg-white/10"
              )}
            >
              <SubIcon className="w-4 h-4 text-[#E5A823]" />
              <div className="flex-1">
                <div>{subItem.label}</div>
                <div className="text-[10px] text-blue-200 font-light">{subItem.subtitle}</div>
              </div>
            </Link>
          );
        })}
      </div>
    )}

    {currentUser ? (
      <div className="pt-3 border-t border-blue-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full bg-[#E5A823] text-slate-900 font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-blue-200 font-light truncate">
              {currentUser.role === "admin" ? "เจ้าหน้าที่ IT Admin" : currentUser.department || "พนักงาน กปภ."}
            </div>
          </div>
        </div>
        <LogoutButton />
      </div>
    ) : (
      <div className="pt-3 border-t border-blue-700">
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
));
MobileMenuDrawer.displayName = "MobileMenuDrawer";

export default function NavbarClient({ currentUser }: NavbarClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  if (pathname === "/login") {
    return null;
  }

  const isAdminActive = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Main Navigation Bar */}
      <nav className="bg-[#0072BC] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand Title */}
            <Link href="/" className="flex items-center gap-3.5 group py-1">
              <div className="relative h-11 px-2.5 py-1 flex items-center justify-center group-hover:scale-105 transition-all overflow-hidden shrink-0">
                <Image
                  src="/pwasite.png"
                  alt="โลโก้ การประปาส่วนภูมิภาค"
                  width={160}
                  height={44}
                  className="h-8 sm:h-9 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1.5">
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
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
                      isActive
                        ? "bg-white/20 text-white shadow-inner border-b-2 border-[#E5A823]"
                        : "text-blue-50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "text-[#E5A823]" : "text-blue-200"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Admin Management Group Dropdown */}
              {currentUser?.role === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all outline-none cursor-pointer",
                      isAdminActive
                        ? "bg-[#003366] text-white shadow-inner border-b-2 border-[#E5A823]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    <Settings2 className="w-4 h-4 text-[#E5A823]" />
                    <span>ระบบบริหารแอดมิน</span>
                    <ChevronDown className="w-4 h-4 text-blue-200 opacity-80" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl">
                    <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-[#0072BC]">
                      <Settings2 className="w-3.5 h-3.5" />
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
                              "flex items-start gap-3 p-2.5 rounded-xl transition-all",
                              isSubActive
                                ? "bg-blue-50 text-[#0072BC] font-bold"
                                : "hover:bg-slate-50 text-slate-800"
                            )}
                          >
                            <div className="p-2 rounded-lg bg-blue-100/60 text-[#0072BC] shrink-0 mt-0.5">
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

              {currentUser ? (
                <div className="ml-2 border-l border-blue-400/40 pl-3.5 flex items-center gap-3">
                  {/* User Profile Badge */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/15 border border-white/20 text-xs shadow-xs">
                    <div className="w-7 h-7 rounded-full bg-[#E5A823] text-slate-900 font-extrabold flex items-center justify-center shrink-0 text-xs shadow-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="text-left hidden lg:block max-w-[140px]">
                      <div className="font-bold text-white truncate leading-tight">{currentUser.name}</div>
                      <div className="text-[10px] text-blue-200 font-light truncate">
                        {currentUser.role === "admin" ? "เจ้าหน้าที่ IT Admin" : currentUser.department || "พนักงาน กปภ."}
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <LogoutButton />
                </div>
              ) : (
                <div className="ml-2 border-l border-blue-400/40 pl-3">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E5A823] hover:bg-amber-500 text-slate-900 font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-slate-900" />
                    <span>เข้าสู่ระบบ</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-white hover:bg-white/10 focus:outline-hidden"
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
          />
        )}
      </nav>
    </header>
  );
}

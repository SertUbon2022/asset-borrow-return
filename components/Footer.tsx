"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PhoneCall, Building2 } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on /login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <footer className="bg-[#0072BC] text-white py-4 border-t border-blue-600/40 text-center text-sm font-sans shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Department Info & Styled Contact Phone */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-blue-100 font-medium">
            <Building2 className="w-4 h-4 text-blue-200 shrink-0" />
            <span>กองเทคโนโลยีสารสนเทศ เขต 8</span>
            <span className="text-blue-300/60 hidden sm:inline">•</span>
            <span className="hidden sm:inline">งานบริการคอมพิวเตอร์และเครือข่าย</span>
          </div>

          {/* Clickable Phone Number Pill */}
          <a
            href="tel:045311432"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white hover:text-[#0072BC] border border-white/25 font-bold text-xs transition-all shadow-xs group cursor-pointer"
            title="คลิกเพื่อโทรออก"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#E5A823] group-hover:text-[#0072BC] transition-colors shrink-0" />
            <span>โทร. 0-4531-1432-4</span>
            <span className="px-1.5 py-0.2 rounded-md bg-[#E5A823] group-hover:bg-[#0072BC] group-hover:text-white text-slate-900 font-black text-[10px] transition-colors">
              ต่อ 139
            </span>
          </a>
        </div>

        {/* Copyright */}
        <p className="text-blue-200/80 text-[11px] font-normal">
          © {new Date().getFullYear()} Provincial Waterworks Authority. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

"use client";

import React, { useState } from "react";
import { MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LineAccountModal from "./LineAccountModal";

interface LineLinkBannerProps {
  currentUser: {
    id: number;
    name: string;
    email: string;
    lineUserId?: string | null;
    lineDisplayName?: string | null;
    linePictureUrl?: string | null;
  };
}

export default function LineLinkBanner({ currentUser }: LineLinkBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (currentUser.lineUserId) {
    return (
      <>
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#06C755] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950">
                  บัญชีของคุณผูกกับ LINE เรียบร้อยแล้ว
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อแล้ว
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                บัญชี LINE: <strong>{currentUser.lineDisplayName || "LINE User"}</strong> (คุณจะได้รับการแจ้งเตือนสถานะคำขอยืม-คืน)
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 rounded-xl shrink-0"
          >
            จัดการบัญชี LINE
          </Button>
        </div>

        <LineAccountModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          currentUser={currentUser}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-emerald-50/50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#06C755] text-white flex items-center justify-center shrink-0 shadow-xs">
            <MessageCircle className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#003366]">
              ผูกบัญชี LINE เพื่อรับการแจ้งเตือนทันใจ
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              รับข้อความแจ้งผลการอนุมัติคำขอยืม และแจ้งเตือนก่อนถึงกำหนดคืนอุปกรณ์ผ่าน LINE Group
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="h-8.5 px-3.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold shadow-xs gap-1.5 shrink-0 active:scale-95 transition-all"
        >
          <span>ผูกบัญชี LINE</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <LineAccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
}

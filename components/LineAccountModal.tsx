"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  linkLineAccount,
  unlinkLineAccount,
  getLineLinkInfo,
} from "@/server/actions/line";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  ShieldCheck,
  Unlink,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

interface LineAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: number;
    name: string;
    email: string;
    lineUserId?: string | null;
    lineDisplayName?: string | null;
    linePictureUrl?: string | null;
  } | null;
  onSuccess?: () => void;
}

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  idToken?: string;
}

export default function LineAccountModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}: LineAccountModalProps) {
  const [isPending, startTransition] = useTransition();
  const [liffLoaded, setLiffLoaded] = useState(() => !process.env.NEXT_PUBLIC_LINE_LIFF_ID?.trim());
  const [liffError, setLiffError] = useState<string | null>(null);
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);

  const [dbLineInfo, setDbLineInfo] = useState<{
    isLinked: boolean;
    lineUserId: string | null;
    lineDisplayName: string | null;
    linePictureUrl: string | null;
    groupSummary: {
      groupId: string;
      groupName?: string;
      pictureUrl?: string;
    } | null;
    liffIdConfigured: boolean;
  }>({
    isLinked: Boolean(currentUser?.lineUserId),
    lineUserId: currentUser?.lineUserId || null,
    lineDisplayName: currentUser?.lineDisplayName || null,
    linePictureUrl: currentUser?.linePictureUrl || null,
    groupSummary: null,
    liffIdConfigured: Boolean(process.env.NEXT_PUBLIC_LINE_LIFF_ID),
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // Load server-side link status & group info when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    getLineLinkInfo().then((info) => {
      setDbLineInfo(info);
    });
  }, [isOpen]);

  // Initialize LIFF
  useEffect(() => {
    if (!isOpen) return;

    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID?.trim();
    if (!liffId) {
      return;
    }

    const targetLiffId = liffId;
    let isMounted = true;

    async function initLiff() {
      try {
        const liffModule = await import("@line/liff");
        const liff = liffModule.default;

        await liff.init({ liffId: targetLiffId });

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          const idToken = liff.getIDToken() || undefined;
          if (isMounted) {
            setLiffProfile({
              userId: profile.userId,
              displayName: profile.displayName || "LINE User",
              pictureUrl: profile.pictureUrl,
              statusMessage: profile.statusMessage,
              idToken,
            });
          }
        }
        if (isMounted) {
          setLiffLoaded(true);
        }
      } catch (err: unknown) {
        console.error("LIFF initialization error:", err);
        if (isMounted) {
          setLiffError(
            err instanceof Error ? err.message : "ไม่สามารถโหลดระบบ LINE SDK ได้"
          );
          setLiffLoaded(true);
        }
      }
    }

    initLiff();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle LINE Login trigger
  const handleLineLogin = async () => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    if (!liffId || liffId.trim() === "") {
      setFeedback({
        type: "error",
        message:
          "ยังไม่ได้ระบุ NEXT_PUBLIC_LINE_LIFF_ID ในระบบ กรุณาติดต่อผู้ดูแลระบบ",
      });
      return;
    }

    try {
      const targetLiffId = liffId.trim();
      const liffModule = await import("@line/liff");
      const liff = liffModule.default;
      if (!liff.id) {
        await liff.init({ liffId: targetLiffId });
      }
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
      }
    } catch (err) {
      console.error("Line login error:", err);
      setFeedback({
        type: "error",
        message: "เกิดข้อผิดพลาดในการเปิดหน้าเข้าสู่ระบบ LINE",
      });
    }
  };

  // Handle Link Account submission
  const handleLinkAccount = () => {
    if (!liffProfile?.userId) {
      setFeedback({
        type: "error",
        message: "ไม่พบข้อมูล LINE User ID กรุณาเข้าสู่ระบบ LINE ก่อน",
      });
      return;
    }

    setFeedback({ type: null, message: "" });

    startTransition(async () => {
      const res = await linkLineAccount({
        lineUserId: liffProfile.userId,
        displayName: liffProfile.displayName,
        pictureUrl: liffProfile.pictureUrl,
        idToken: liffProfile.idToken,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "ผูกบัญชี LINE เรียบร้อยแล้ว",
        });
        const updatedInfo = await getLineLinkInfo();
        setDbLineInfo(updatedInfo);
        if (onSuccess) onSuccess();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "ไม่สามารถผูกบัญชี LINE ได้",
        });
      }
    });
  };

  // Handle Unlink Account
  const handleUnlinkAccount = () => {
    if (!confirm("คุณต้องการยกเลิกการผูกบัญชี LINE กับระบบใช่หรือไม่?")) {
      return;
    }

    setFeedback({ type: null, message: "" });

    startTransition(async () => {
      const res = await unlinkLineAccount();
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "ยกเลิกการผูกบัญชีเรียบร้อยแล้ว",
        });
        const updatedInfo = await getLineLinkInfo();
        setDbLineInfo(updatedInfo);
        if (onSuccess) onSuccess();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "เกิดข้อผิดพลาดในการยกเลิกการผูกบัญชี",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-900 overflow-hidden">
        {/* Header Section */}
        <DialogHeader className="text-left space-y-1.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#06C755]/10 text-[#06C755] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#003366] leading-tight">
                เชื่อมต่อและผูกบัญชี LINE
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal">
                รับการแจ้งเตือนคำขอยืมและสิทธิ์จัดการผ่าน LINE Group
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Group Rule Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#0072BC] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-[#003366]">เงื่อนไขความปลอดภัย:</span>{" "}
            บัญชี LINE ของท่านต้องเป็นสมาชิกในกลุ่ม{" "}
            <span className="font-bold text-[#0072BC]">
              {dbLineInfo.groupSummary?.groupName || "LINE Group ทางการของ กปภ."}
            </span>{" "}
            ระบบจึงจะอนุญาตให้ผูกบัญชีสำเร็จ
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback.type && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : feedback.type === "error"
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{feedback.message}</div>
          </div>
        )}

        {/* State 1: Currently Linked in Database */}
        {dbLineInfo.isLinked ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              {dbLineInfo.linePictureUrl ? (
                <Image
                  src={dbLineInfo.linePictureUrl}
                  alt="LINE Avatar"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#06C755] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  {dbLineInfo.lineDisplayName?.charAt(0) || "L"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {dbLineInfo.lineDisplayName || "บัญชี LINE ของคุณ"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> ผูกแล้ว
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                  ID: {dbLineInfo.lineUserId}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleUnlinkAccount}
                className="flex-1 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-10 text-xs font-bold gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4" />
                )}
                <span>ยกเลิกการผูกบัญชี</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl h-10 text-xs font-bold"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        ) : (
          /* State 2: Not Linked Yet */
          <div className="space-y-4 py-2">
            {!dbLineInfo.liffIdConfigured && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  ยังไม่ได้กำหนด <code>NEXT_PUBLIC_LINE_LIFF_ID</code> ในระบบ
                </span>
              </div>
            )}

            {/* If LIFF is logged in and profile is ready */}
            {liffProfile ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3.5">
                  {liffProfile.pictureUrl ? (
                    <Image
                      src={liffProfile.pictureUrl}
                      alt="LINE Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#06C755] shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#06C755] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      {liffProfile.displayName.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500 font-medium">
                      พบบัญชี LINE ของคุณ:
                    </div>
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {liffProfile.displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {liffProfile.userId}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleLinkAccount}
                  className="w-full h-11 rounded-xl bg-[#0072BC] hover:bg-[#005a96] text-white font-bold text-xs shadow-md gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังตรวจสอบสมาชิกในกลุ่มและผูกบัญชี...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 text-[#E5A823]" />
                      <span>ตรวจสอบกลุ่มและยืนยันการผูกบัญชี</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* If LIFF is NOT logged in yet */
              <div className="space-y-3">
                <div className="text-center py-4 px-2 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#06C755]/10 text-[#06C755] flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-xs text-slate-600">
                    กดปุ่มด้านล่างเพื่อเข้าสู่ระบบด้วย LINE จากนั้นระบบจะตรวจสอบสถานะสมาชิกกลุ่มโดยอัตโนมัติ
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleLineLogin}
                  disabled={!liffLoaded}
                  className="w-full h-11 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs shadow-md gap-2"
                >
                  {!liffLoaded ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังเตรียมระบบ LINE...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>เข้าสู่ระบบด้วย LINE (LINE Login)</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {liffError && (
              <div className="text-[11px] text-rose-500 text-center font-mono">
                {liffError}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { uploadAssetImageAction, deleteAssetImageAction } from "@/server/actions/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Camera,
  Link as LinkIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "camera" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream on unmount or tab change
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setMessage(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setMessage({
        type: "error",
        text: "ไม่สามารถเข้าถึงกล้องถ่ายรูปได้ กรุณาตรวจสอบการอนุญาตใช้งานกล้องบนเว็บบราวเซอร์",
      });
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const maxW = 1280;
    const scale = Math.min(1, maxW / (video.videoWidth || maxW));
    canvas.width = (video.videoWidth || maxW) * scale;
    canvas.height = (video.videoHeight || 720) * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL("image/jpeg", 0.75);

    stopCamera();
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("base64", base64Data);

    const res = await uploadAssetImageAction(formData);
    setUploading(false);

    if (res.success && res.url) {
      onChange(res.url);
      setMessage({ type: "success", text: "ถ่ายภาพและบันทึกรูปภาพเรียบร้อยแล้ว" });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadAssetImageAction(formData);
    setUploading(false);

    if (res.success && res.url) {
      onChange(res.url);
      setMessage({ type: "success", text: "อัปโหลดรูปภาพลงโฟลเดอร์เรียบร้อยแล้ว" });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const handleRemoveImage = async () => {
    if (!value) return;

    setUploading(true);
    setMessage(null);

    if (value.startsWith("/uploads/assets/")) {
      await deleteAssetImageAction(value);
    }

    onChange("");
    setUploading(false);
    setMessage({ type: "success", text: "ลบรูปภาพเรียบร้อยแล้ว" });
  };

  return (
    <div className="space-y-3">
      {/* 1. Header Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-[#0072BC]" />
          รูปภาพประกอบครุภัณฑ์ (Asset Image)
        </span>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("upload");
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === "upload" ? "bg-white text-[#0072BC] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-3 h-3 inline mr-1" />
            แนบไฟล์
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
              startCamera();
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === "camera" ? "bg-white text-[#0072BC] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-3 h-3 inline mr-1" />
            ถ่ายกล้อง
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("url");
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === "url" ? "bg-white text-[#0072BC] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LinkIcon className="w-3 h-3 inline mr-1" />
            ระบุ URL
          </button>
        </div>
      </div>

      {/* 2. Messages */}
      {message && (
        <div
          className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {message.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 3. Image Preview Container */}
      {value ? (
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-between gap-3">
          <div className="relative h-20 w-24 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
            <Image src={value} alt="พรีวิวรูปภาพครุภัณฑ์" fill className="object-cover" unoptimized />
          </div>

          <div className="min-w-0 flex-1 space-y-1 text-xs">
            <div className="font-bold text-slate-800 line-clamp-1">รูปภาพที่เลือกอยู่</div>
            <div className="text-[10px] text-slate-400 font-mono line-clamp-1">{value}</div>
            <div className="text-[10px] text-emerald-600 font-semibold">✓ จัดเก็บที่ public/uploads/assets/</div>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={uploading}
            onClick={handleRemoveImage}
            className="h-8 text-xs font-semibold shrink-0 cursor-pointer"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
            ลบรูปภาพ
          </Button>
        </div>
      ) : null}

      {/* 4. Tab Body Content */}
      {activeTab === "upload" && (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <label className="cursor-pointer space-y-2 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0072BC] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0072BC]">คลิกเพื่อแนบไฟล์รูปภาพ</span>
              <span className="text-xs text-slate-500"> หรือลากไฟล์มาวางที่นี่</span>
            </div>
            <span className="text-[10px] text-slate-400">รองรับไฟล์ PNG, JPG, WEBP (สูงสุด 10MB)</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {activeTab === "camera" && (
        <div className="space-y-3 border border-slate-200 rounded-2xl p-3 bg-slate-900 text-white overflow-hidden">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
            <video ref={videoRef} playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-300 text-xs gap-2">
                <Camera className="w-8 h-8 text-slate-500" />
                <span>กำลังเตรียมความพร้อมกล้องถ่ายรูป...</span>
                <Button size="sm" onClick={startCamera} className="text-xs bg-[#0072BC]">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> เปิดกล้องอีกครั้ง
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">หันกล้องถ่ายรูปอุปกรณ์ครุภัณฑ์ กปภ.</span>
            <Button
              type="button"
              onClick={handleCapturePhoto}
              disabled={uploading || !isCameraActive}
              className="bg-[#0072BC] hover:bg-blue-600 text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-1.5" />
                  ถ่ายภาพและใช้รูปนี้
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {activeTab === "url" && (
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="วางลิงก์ URL รูปภาพ เช่น https://images.unsplash.com/..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-xs"
          />
          <p className="text-[10px] text-slate-400">
            ระบุ URL รูปภาพภายนอกโดยตรง หากไม่ได้ใช้อัปโหลดไฟล์ในระบบ
          </p>
        </div>
      )}
    </div>
  );
}

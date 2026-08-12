"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { uploadAnnouncementImageAction, deleteAssetImageAction } from "@/server/actions/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Camera,
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Images,
} from "lucide-react";

interface AlbumImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export default function AlbumImageUploader({ value = [], onChange }: AlbumImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "camera" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [urlInput, setUrlInput] = useState("");

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        text: "ไม่สามารถเข้าถึงกล้องถ่ายรูปได้ กรุณาตรวจสอบการอนุญาตกล้องบนเว็บบราวเซอร์",
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

    const res = await uploadAnnouncementImageAction(formData);
    setUploading(false);

    if (res.success && res.url) {
      onChange([...value, res.url]);
      setMessage({ type: "success", text: "ถ่ายภาพและเพิ่มเข้าอัลบั้มเรียบร้อยแล้ว" });
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadAnnouncementImageAction(formData);
      if (res.success && res.url) {
        newUrls.push(res.url);
      }
    }

    setUploading(false);

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
      setMessage({ type: "success", text: `เพิ่มรูปภาพเข้าอัลบั้ม ${newUrls.length} รูปเรียบร้อยแล้ว` });
    } else {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" });
    }
  };

  const handleAddUrl = () => {
    if (!urlInput || urlInput.trim() === "") return;
    onChange([...value, urlInput.trim()]);
    setUrlInput("");
    setMessage({ type: "success", text: "เพิ่ม URL รูปภาพเข้าอัลบั้มเรียบร้อยแล้ว" });
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    const targetUrl = value[indexToRemove];
    if (!targetUrl) return;

    if (targetUrl.startsWith("/uploads/announcements/")) {
      await deleteAssetImageAction(targetUrl);
    }

    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    setMessage({ type: "success", text: "ลบรูปภาพออกจากอัลบั้มเรียบร้อยแล้ว" });
  };

  return (
    <div className="space-y-3">
      {/* 1. Header Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Images className="w-4 h-4 text-[#0072BC]" />
          อัลบั้มรูปภาพประกอบข่าวประชาสัมพันธ์ ({value.length} รูป)
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
            เพิ่มไฟล์
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

      {/* 3. Album Thumbnail Grid */}
      {value.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500">อัลบั้มรูปภาพปัจจุบัน:</div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/70">
            {value.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-square shadow-xs"
              >
                <Image src={url} alt={`รูปภาพข่าว #${idx + 1}`} fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-rose-600/90 text-white rounded-full p-1 opacity-90 hover:opacity-100 hover:bg-rose-700 transition-all shadow-xs cursor-pointer"
                  title="ลบรูปภาพนี้"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1 left-1 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab Body Content */}
      {activeTab === "upload" && (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <label className="cursor-pointer space-y-2 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0072BC] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0072BC]">คลิกเพื่อเพิ่มไฟล์รูปภาพเข้าอัลบั้ม</span>
              <span className="text-xs text-slate-500"> (เลือกได้หลายไฟล์พร้อมกัน)</span>
            </div>
            <span className="text-[10px] text-slate-400">รองรับไฟล์ PNG, JPG, WEBP (จัดเก็บที่ public/uploads/announcements/)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesChange}
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
            <span className="text-[10px] text-slate-400">ถ่ายภาพกิจกรรม/ข่าวสารเพิ่มเข้าอัลบั้ม</span>
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
                  ถ่ายภาพเพิ่มเข้าอัลบั้ม
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {activeTab === "url" && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="วางลิงก์ URL รูปภาพ เช่น https://images.unsplash.com/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="text-xs flex-1"
          />
          <Button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="bg-[#0072BC] text-xs font-bold shrink-0 cursor-pointer"
          >
            เพิ่มเข้าอัลบั้ม
          </Button>
        </div>
      )}
    </div>
  );
}

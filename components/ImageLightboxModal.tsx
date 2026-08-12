"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";

interface ImageLightboxModalProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export default function ImageLightboxModal({
  images = [],
  initialIndex = 0,
  open,
  onClose,
  title,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialIndex, setPrevInitialIndex] = useState(initialIndex);

  if (open !== prevOpen || initialIndex !== prevInitialIndex) {
    setPrevOpen(open);
    setPrevInitialIndex(initialIndex);
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }

  if (!open || images.length === 0) return null;

  const currentUrl = images[currentIndex] || images[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex items-center justify-between text-white z-10 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Images className="w-5 h-5 text-[#00A8FF]" />
          <span>{title || "อัลบั้มรูปภาพ"}</span>
          <span className="text-xs text-slate-400 font-normal">
            ({currentIndex + 1} / {images.length})
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image View */}
      <div className="relative flex-1 flex items-center justify-center my-4">
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="relative w-full max-w-4xl h-[70vh] rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src={currentUrl}
            alt={`รูปภาพที่ ${currentIndex + 1}`}
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Carousel Bar */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10">
          {images.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-14 w-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                currentIndex === idx
                  ? "border-[#00A8FF] scale-105 shadow-md"
                  : "border-white/20 opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={url} alt={`รูปขนาดเล็ก ${idx + 1}`} fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

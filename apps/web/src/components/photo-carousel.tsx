"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads milik API */
import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

/** Carousel foto kartu listing ala Airbnb: panah muncul saat hover, titik penanda di bawah. */
export function PhotoCarousel({ photos, alt, className = "" }: { photos: string[]; alt: string; className?: string }) {
  const [i, setI] = useState(0);

  if (photos.length === 0) {
    return (
      <div className={`grid place-items-center bg-subtle ${className}`}>
        <ImageOff className="size-8 text-line" />
      </div>
    );
  }

  const go = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    setI((c) => (c + d + photos.length) % photos.length);
  };

  return (
    <div className={`group/photo relative overflow-hidden bg-subtle ${className}`}>
      <div className="flex h-full transition-transform duration-300" style={{ transform: `translateX(-${i * 100}%)` }}>
        {photos.map((src, idx) => (
          <img key={src + idx} src={src} alt={alt} loading="lazy" className="size-full shrink-0 object-cover" />
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => go(e, -1)}
            aria-label="Foto sebelumnya"
            className={`absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow transition hover:scale-105 group-hover/photo:opacity-100 ${i === 0 ? "invisible" : ""}`}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={(e) => go(e, 1)}
            aria-label="Foto berikutnya"
            className={`absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow transition hover:scale-105 group-hover/photo:opacity-100 ${i === photos.length - 1 ? "invisible" : ""}`}
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1">
            {photos.map((_, idx) => (
              <span key={idx} className={`size-1.5 rounded-full transition ${idx === i ? "bg-white" : "bg-white/55"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

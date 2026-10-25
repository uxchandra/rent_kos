"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads milik API */
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

/**
 * Carousel foto kartu listing. Di HP digeser dengan jari (scroll-snap),
 * di desktop ada panah yang muncul saat hover.
 */
export function PhotoCarousel({ photos, alt, className = "" }: { photos: string[]; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);

  if (photos.length === 0) {
    return (
      <div className={`grid place-items-center bg-white/5 ${className}`}>
        <ImageOff className="size-8 text-white/20" />
      </div>
    );
  }

  const go = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (el) el.scrollTo({ left: (i + d) * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={`group/photo relative overflow-hidden bg-white/5 ${className}`}>
      <div
        ref={ref}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((src, idx) => (
          <img key={src + idx} src={src} alt={alt} loading="lazy" draggable={false} className="size-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {photos.length > 1 && (
        <>
          {i > 0 && (
            <button
              onClick={(e) => go(e, -1)}
              aria-label="Foto sebelumnya"
              className="absolute left-2 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow transition group-hover/photo:opacity-100 sm:grid"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          {i < photos.length - 1 && (
            <button
              onClick={(e) => go(e, 1)}
              aria-label="Foto berikutnya"
              className="absolute right-2 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow transition group-hover/photo:opacity-100 sm:grid"
            >
              <ChevronRight className="size-4" />
            </button>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1">
            {photos.map((_, idx) => (
              <span key={idx} className={`size-1.5 rounded-full transition ${idx === i ? "bg-white" : "bg-white/55"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

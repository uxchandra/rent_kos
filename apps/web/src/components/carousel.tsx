"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Baris geser horizontal (scroll-snap) dengan tombol panah bulat. */
export function Carousel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className={className}>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-5 sm:px-0">
        {children}
      </div>
      <div className="mt-6 hidden gap-2 sm:flex">
        <CarouselButton onClick={() => scroll(-1)} label="Sebelumnya">
          <ArrowLeft className="size-4" />
        </CarouselButton>
        <CarouselButton onClick={() => scroll(1)} label="Berikutnya">
          <ArrowRight className="size-4" />
        </CarouselButton>
      </div>
    </div>
  );
}

function CarouselButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid size-10 place-items-center rounded-full border border-ink/15 bg-white text-ink transition hover:border-ink"
    >
      {children}
    </button>
  );
}

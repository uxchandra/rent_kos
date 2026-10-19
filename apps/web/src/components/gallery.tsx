"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads milik API */
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import { Photo } from "./photo";

export type GalleryPhoto = { url: string; caption?: string | null };

function Lightbox({ photos, index, onClose }: { photos: GalleryPhoto[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);
  const go = useCallback((d: number) => setCurrent((c) => (c + d + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [go, onClose]);

  const photo = photos[current];
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" role="dialog" aria-modal>
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span>
          {current + 1} / {photos.length}
          {photo.caption && <span className="ml-3 text-white/70">{photo.caption}</span>}
        </span>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Tutup">
          <X className="size-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        <img src={photo.url} alt={photo.caption ?? ""} className="max-h-full max-w-full rounded-lg object-contain" />
        {photos.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-4 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label="Sebelumnya">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} className="absolute right-4 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label="Berikutnya">
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Galeri utama halaman cabang: 1 foto besar + 4 foto kecil. */
export function GalleryGrid({ photos, name }: { photos: GalleryPhoto[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [main, ...rest] = photos;

  return (
    <>
      <div className="relative grid h-[260px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl sm:h-[440px]">
        <button onClick={() => setOpen(0)} className="col-span-4 row-span-2 sm:col-span-2">
          <Photo src={main?.url} alt={main?.caption ?? name} className="size-full transition hover:brightness-90" />
        </button>
        {rest.slice(0, 4).map((p, i) => (
          <button key={p.url} onClick={() => setOpen(i + 1)} className="hidden sm:block">
            <Photo src={p.url} alt={p.caption ?? name} className="size-full transition hover:brightness-90" />
          </button>
        ))}
        {photos.length > 1 && (
          <button
            onClick={() => setOpen(0)}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-subtle"
          >
            <Grid2x2 className="size-4" /> Lihat {photos.length} foto
          </button>
        )}
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/** Foto tipe kamar dengan penanda jumlah foto. */
export function RoomPhotos({ photos, name, className = "" }: { photos: GalleryPhoto[]; name: string; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <button onClick={() => photos.length && setOpen(0)} className={`relative overflow-hidden ${className}`}>
        <Photo src={photos[0]?.url} alt={name} className="size-full transition hover:scale-[1.03]" />
        {photos.length > 1 && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {photos.length} foto
          </span>
        )}
      </button>
      {open !== null && <Lightbox photos={photos.map((p) => ({ ...p, caption: p.caption ?? name }))} index={open} onClose={() => setOpen(null)} />}
    </>
  );
}

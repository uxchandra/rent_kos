"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** Panel yang muncul dari bawah layar, dipakai untuk filter & pemesanan di HP. `night` untuk halaman bertema gelap. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  night = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  night?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal aria-label={title}>
      <button className={`absolute inset-0 ${night ? "bg-black/60" : "bg-black/40"}`} onClick={onClose} aria-label="Tutup" />
      <div className={`relative flex max-h-[88dvh] w-full flex-col rounded-t-2xl shadow-2xl ${night ? "bg-night-2 text-white" : "bg-white"}`}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${night ? "border-white/10" : "border-line"}`}>
          <p className="font-semibold">{title}</p>
          <button onClick={onClose} className={`-mr-2 rounded-full p-2 ${night ? "hover:bg-white/10" : "hover:bg-subtle"}`} aria-label="Tutup">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className={`border-t px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 ${night ? "border-white/10" : "border-line"}`}>{footer}</div>}
      </div>
    </div>
  );
}

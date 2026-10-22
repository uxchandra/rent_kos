"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** Panel yang muncul dari bawah layar, dipakai untuk filter & pemesanan di HP. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Tutup" />
      <div className="relative flex max-h-[88dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-semibold">{title}</p>
          <button onClick={onClose} className="-mr-2 rounded-full p-2 hover:bg-subtle" aria-label="Tutup">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">{footer}</div>}
      </div>
    </div>
  );
}

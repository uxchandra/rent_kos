"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BottomSheet } from "./bottom-sheet";
import { price, waLink } from "@/lib/format";
import type { RoomType } from "@/lib/types";

type Props = { roomTypes: RoomType[]; deposit: number; whatsapp: string | null; kosName: string };

/** Tipe kamar terpilih: dari ?tipe= di URL, bisa ditimpa lewat dropdown. */
function useSelectedType(roomTypes: RoomType[]) {
  const fromUrl = Number(useSearchParams().get("tipe"));
  const [override, setOverride] = useState<number | null>(null);
  const [lastUrl, setLastUrl] = useState(fromUrl);
  if (fromUrl !== lastUrl) {
    setLastUrl(fromUrl);
    setOverride(null);
  }
  const fallback = roomTypes.find((t) => t.availableRooms > 0) ?? roomTypes[0];
  const type = roomTypes.find((t) => t.id === (override ?? fromUrl)) ?? fallback;
  return { type, setOverride, fromUrl };
}

function BookingForm({ roomTypes, deposit, whatsapp, kosName }: Props) {
  const { type, setOverride } = useSelectedType(roomTypes);
  const [moveIn, setMoveIn] = useState("");

  if (!type) return null;
  const full = type.availableRooms === 0;
  const message = [
    `Halo, saya ingin ${full ? "masuk daftar tunggu" : "mengajukan sewa"} di ${kosName}.`,
    `Tipe kamar: ${type.name}`,
    moveIn && `Rencana masuk: ${new Date(moveIn).toLocaleDateString("id-ID", { dateStyle: "long" })}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <p>
        <span className="text-2xl font-bold text-brand-700">{price(type.monthlyPrice)}</span>
        <span className="text-muted"> / bulan</span>
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border border-muted/50">
        <label className="block border-b border-muted/50 px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wide">Tipe kamar</span>
          {/* text-base di HP supaya iOS tidak auto-zoom saat input difokus */}
          <select
            value={type.id}
            onChange={(e) => setOverride(Number(e.target.value))}
            className="w-full bg-transparent text-base outline-none sm:text-sm"
          >
            {roomTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.availableRooms > 0 ? `${t.availableRooms} kosong` : "penuh"}
              </option>
            ))}
          </select>
        </label>
        <label className="block px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wide">Tanggal masuk</span>
          <input
            type="date"
            value={moveIn}
            onChange={(e) => setMoveIn(e.target.value)}
            className="w-full bg-transparent text-base outline-none sm:text-sm"
          />
        </label>
      </div>

      {whatsapp && (
        <a
          href={waLink(whatsapp, message)}
          target="_blank"
          rel="noopener"
          className={`mt-4 block rounded-full py-3.5 text-center font-semibold text-white transition ${
            full ? "bg-ink hover:bg-black" : "bg-brand-600 hover:bg-brand-700"
          }`}
        >
          {full ? "Masuk daftar tunggu" : "Ajukan sewa"}
        </a>
      )}
      <p className="mt-3 text-center text-sm text-muted">Belum ada biaya yang dikenakan</p>

      <dl className="mt-5 space-y-3 text-[15px]">
        <div className="flex justify-between">
          <dt className="underline decoration-line underline-offset-4">Sewa bulan pertama</dt>
          <dd>{price(type.monthlyPrice)}</dd>
        </div>
        {deposit > 0 && (
          <div className="flex justify-between">
            <dt className="underline decoration-line underline-offset-4">Deposit (dikembalikan)</dt>
            <dd>{price(deposit)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-4 font-bold">
          <dt>Total bayar di awal</dt>
          <dd>{price(type.monthlyPrice + deposit)}</dd>
        </div>
      </dl>
    </>
  );
}

/** Kartu pemesanan di kolom samping (desktop). */
export function BookingCard(props: Props) {
  return (
    <div id="booking" className="scroll-mt-28 rounded-2xl border border-line p-6 shadow-[0_12px_32px_-12px_rgb(30_10_60/0.25)]">
      <BookingForm {...props} />
    </div>
  );
}

/** Bar bawah di HP; tombolnya membuka form pemesanan dalam bottom sheet. */
export function MobileBookingBar(props: Props & { minPrice: number | null }) {
  const [open, setOpen] = useState(false);
  const { fromUrl } = useSelectedType(props.roomTypes);
  const firstUrl = useRef(fromUrl);

  // "Pilih kamar ini" mengubah ?tipe=, di HP langsung buka form pemesanan.
  useEffect(() => {
    if (fromUrl && fromUrl !== firstUrl.current && window.matchMedia("(max-width: 1023px)").matches) {
      firstUrl.current = fromUrl;
      setOpen(true);
    }
  }, [fromUrl]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <p>
          <span className="block text-xs text-muted">Mulai dari</span>
          <span className="font-bold">{props.minPrice ? price(props.minPrice) : "-"}</span>
          <span className="text-sm text-muted"> / bulan</span>
        </p>
        <button onClick={() => setOpen(true)} className="rounded-full bg-brand-600 px-7 py-3 font-semibold text-white">
          Ajukan sewa
        </button>
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={props.kosName}>
        <BookingForm {...props} />
      </BottomSheet>
    </>
  );
}

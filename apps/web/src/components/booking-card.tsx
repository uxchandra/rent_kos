"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { price, waLink } from "@/lib/format";
import type { RoomType } from "@/lib/types";

type Props = { roomTypes: RoomType[]; deposit: number; whatsapp: string | null; kosName: string };

export function BookingCard({ roomTypes, deposit, whatsapp, kosName }: Props) {
  const fromUrl = Number(useSearchParams().get("tipe"));
  const fallback = roomTypes.find((t) => t.availableRooms > 0) ?? roomTypes[0];
  const selected = roomTypes.find((t) => t.id === fromUrl) ?? fallback;
  const [override, setOverride] = useState<number | null>(null);
  const [moveIn, setMoveIn] = useState("");
  const type = roomTypes.find((t) => t.id === override) ?? selected;

  if (!type) return null;
  const full = type.availableRooms === 0;
  const total = type.monthlyPrice + deposit;
  const message = [
    `Halo, saya ingin ${full ? "masuk daftar tunggu" : "mengajukan sewa"} di ${kosName}.`,
    `Tipe kamar: ${type.name}`,
    moveIn && `Rencana masuk: ${new Date(moveIn).toLocaleDateString("id-ID", { dateStyle: "long" })}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div id="booking" className="scroll-mt-28 rounded-xl border border-line p-6 shadow-[0_6px_16px_rgb(0_0_0/0.12)]">
      <p>
        <span className="text-2xl font-bold">{price(type.monthlyPrice)}</span>
        <span className="text-muted"> / bulan</span>
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border border-muted/50">
        <label className="block border-b border-muted/50 px-3 py-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wide">Tipe kamar</span>
          <select
            value={type.id}
            onChange={(e) => {
              setOverride(Number(e.target.value));
            }}
            className="w-full bg-transparent text-sm outline-none"
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
          <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      {whatsapp && (
        <a
          href={waLink(whatsapp, message)}
          target="_blank"
          rel="noopener"
          className={`mt-4 block rounded-lg py-3.5 text-center font-semibold text-white transition ${
            full ? "bg-ink hover:bg-black" : "bg-linear-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800"
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
          <dd>{price(total)}</dd>
        </div>
      </dl>
    </div>
  );
}

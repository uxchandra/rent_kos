"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BottomSheet } from "./bottom-sheet";
import { Check, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/client-api";
import { price, todayInput, waLink } from "@/lib/format";
import type { RoomType } from "@/lib/types";

type Props = { roomTypes: RoomType[]; deposit: number; whatsapp: string | null; kosName: string; slug: string };

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

type Step = { name: "pick" } | { name: "details" } | { name: "done"; code: string };

const fieldBox = "block border-ink-soft/50 px-3 py-2.5";
const fieldLabel = "block text-[10px] font-bold uppercase tracking-wide";
const fieldInput = "w-full bg-transparent text-base outline-none sm:text-sm";

function BookingForm({ roomTypes, deposit, whatsapp, kosName, slug }: Props) {
  const { type, setOverride } = useSelectedType(roomTypes);
  const [moveIn, setMoveIn] = useState("");
  const [step, setStep] = useState<Step>({ name: "pick" });
  const [v, setV] = useState({ name: "", phone: "", email: "", occupation: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [sending, setSending] = useState(false);

  if (!type) return null;
  const full = type.availableRooms === 0;
  const moveInLabel = moveIn && new Date(moveIn).toLocaleDateString("id-ID", { dateStyle: "long" });
  const waMessage = (code?: string) =>
    [
      `Halo, saya ingin ${full ? "masuk daftar tunggu" : "mengajukan sewa"} di ${kosName}.`,
      `Tipe kamar: ${type.name}`,
      moveIn && `Rencana masuk: ${moveInLabel}`,
      code && `Kode pengajuan: ${code}`,
    ]
      .filter(Boolean)
      .join("\n");

  function next() {
    if (!moveIn) {
      setErrors({ moveInDate: ["Pilih tanggal masuk dulu"] });
      return;
    }
    setErrors({});
    setStep({ name: "details" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setErrors({});
    try {
      const res = await api<{ data: { code: string } }>(`/public/kos/${slug}/bookings`, {
        method: "POST",
        body: JSON.stringify({ ...v, roomTypeId: type.id, moveInDate: moveIn }),
      });
      setStep({ name: "done", code: res.data.code });
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
        if (err.errors.moveInDate || err.errors.roomTypeId) setStep({ name: "pick" });
      } else setErrors({ form: [err instanceof Error ? err.message : "Gagal mengirim, coba lagi"] });
    } finally {
      setSending(false);
    }
  }

  if (step.name === "done") {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-mint text-mint-ink">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <p className="mt-4 text-xl font-bold">Pengajuan terkirim</p>
        <p className="mt-2 text-ink-soft">Pengelola {kosName} akan menghubungi Anda lewat WhatsApp untuk konfirmasi. Simpan kode pengajuan berikut:</p>
        <p className="mt-4 rounded-xl bg-subtle py-3 font-mono text-lg font-bold tracking-widest">{step.code}</p>
        {whatsapp && (
          <a href={waLink(whatsapp, waMessage(step.code))} target="_blank" rel="noopener" className="mt-5 block text-sm font-semibold text-brand-600 underline underline-offset-4">
            Ingin lebih cepat? Chat pengelola
          </a>
        )}
      </div>
    );
  }

  if (step.name === "details") {
    const err = (k: string) => errors[k] && <span className="mt-0.5 block text-xs text-red-600">{errors[k][0]}</span>;
    return (
      <form onSubmit={submit}>
        <div className="flex items-start justify-between gap-3 rounded-lg bg-subtle px-3 py-2.5 text-sm">
          <p>
            <span className="font-semibold">{type.name}</span>
            <span className="block text-ink-soft">Masuk {moveInLabel}</span>
          </p>
          <button type="button" onClick={() => setStep({ name: "pick" })} className="font-semibold underline underline-offset-4">
            Ubah
          </button>
        </div>

        <div className="mt-4 divide-y divide-ink-soft/50 overflow-hidden rounded-lg border border-ink-soft/50">
          <label className={fieldBox}>
            <span className={fieldLabel}>Nama lengkap</span>
            <input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" className={fieldInput} />
            {err("name")}
          </label>
          <label className={fieldBox}>
            <span className={fieldLabel}>No. WhatsApp</span>
            <input
              required
              value={v.phone}
              onChange={(e) => setV({ ...v, phone: e.target.value })}
              inputMode="tel"
              autoComplete="tel"
              placeholder="081234567890"
              className={fieldInput}
            />
            {err("phone")}
          </label>
          <label className={fieldBox}>
            <span className={fieldLabel}>Email</span>
            <input required type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" className={fieldInput} />
            {err("email")}
          </label>
          <label className={fieldBox}>
            <span className={fieldLabel}>Pekerjaan / kampus (opsional)</span>
            <input value={v.occupation} onChange={(e) => setV({ ...v, occupation: e.target.value })} className={fieldInput} />
          </label>
          <label className={fieldBox}>
            <span className={fieldLabel}>Pesan (opsional)</span>
            <textarea rows={2} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} className={`${fieldInput} resize-none`} />
          </label>
        </div>
        {/* Honeypot anti-bot: disembunyikan dari pengguna. */}
        <input tabIndex={-1} autoComplete="off" aria-hidden name="website" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} className="hidden" />

        {errors.form && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form[0]}</p>}
        <button
          type="submit"
          disabled={sending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {sending && <Loader2 className="size-4 animate-spin" />} Kirim pengajuan
        </button>
        <p className="mt-3 text-center text-sm text-ink-soft">Gratis, belum ada biaya yang dikenakan</p>
      </form>
    );
  }

  return (
    <>
      <p>
        <span className="text-2xl font-bold text-brand-700">{price(type.monthlyPrice)}</span>
        <span className="text-ink-soft"> / bulan</span>
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border border-ink-soft/50">
        <label className="block border-b border-ink-soft/50 px-3 py-2.5">
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
            min={todayInput()}
            onChange={(e) => setMoveIn(e.target.value)}
            className="w-full bg-transparent text-base outline-none sm:text-sm"
          />
        </label>
      </div>
      {(errors.moveInDate ?? errors.roomTypeId) && <p className="mt-1.5 text-xs text-red-600">{(errors.moveInDate ?? errors.roomTypeId)[0]}</p>}

      <button
        onClick={next}
        className={`mt-4 block w-full rounded-full py-3.5 text-center font-semibold text-white transition ${
          full ? "bg-ink hover:bg-black" : "bg-brand-600 hover:bg-brand-700"
        }`}
      >
        {full ? "Masuk daftar tunggu" : "Ajukan sewa"}
      </button>
      {whatsapp ? (
        <a href={waLink(whatsapp, waMessage())} target="_blank" rel="noopener" className="mt-3 block text-center text-sm font-semibold underline underline-offset-4">
          Tanya dulu via WhatsApp
        </a>
      ) : (
        <p className="mt-3 text-center text-sm text-ink-soft">Belum ada biaya yang dikenakan</p>
      )}

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
          <span className="block text-xs text-ink-soft">Mulai dari</span>
          <span className="font-bold">{props.minPrice ? price(props.minPrice) : "-"}</span>
          <span className="text-sm text-ink-soft"> / bulan</span>
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

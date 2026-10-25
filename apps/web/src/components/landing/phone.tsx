/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import { BedDouble, Bell, CalendarDays, CheckCircle2, Home, MapPin, ReceiptText, UserRound, Wifi } from "lucide-react";
import { price } from "@/lib/format";
import type { RoomListing } from "@/lib/types";

/** Bingkai HP dari CSS; isi layar lewat children. */
export function Phone({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-[240px] rounded-[2.6rem] bg-[#0d0a18] p-2 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/15 ${className}`}>
      <div className="relative h-[490px] overflow-hidden rounded-[2.1rem] bg-white text-ink">
        <span className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0d0a18]" />
        {children}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[10px] font-semibold">
      <span>09.41</span>
      <span className="flex items-center gap-1">
        <Wifi className="size-3" /> 100%
      </span>
    </div>
  );
}

function TabBar({ active }: { active: number }) {
  const tabs = [Home, ReceiptText, BedDouble, UserRound];
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-line bg-white px-4 pb-4 pt-2.5">
      {tabs.map((Icon, i) => (
        <Icon key={i} className={`size-[18px] ${i === active ? "text-brand-600" : "text-ink-soft/60"}`} />
      ))}
    </div>
  );
}

/** Layar area penghuni: tagihan bulan ini. */
export function TenantScreen({ room }: { room: RoomListing }) {
  const total = room.monthlyPrice;
  return (
    <div className="flex h-full flex-col bg-subtle text-[11px]">
      <div className="bg-brand-600 pb-10 text-white">
        <StatusBar />
        <div className="flex items-center justify-between px-5 pt-2">
          <div>
            <p className="text-white/70">Halo,</p>
            <p className="text-sm font-bold">Penghuni Kamar 201</p>
          </div>
          <Bell className="size-4" />
        </div>
      </div>
      <div className="-mt-7 space-y-2.5 px-4">
        <div className="rounded-2xl bg-white p-3.5 shadow-sm">
          <p className="text-ink-soft">Tagihan sewa bulan ini</p>
          <p className="mt-0.5 text-lg font-bold">{price(total)}</p>
          <p className="flex items-center gap-1 text-ink-soft">
            <CalendarDays className="size-3" /> Jatuh tempo tanggal 5
          </p>
          <div className="mt-3 rounded-full bg-brand-600 py-2 text-center text-[11px] font-semibold text-white">Bayar & upload bukti</div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm">
          <img src={room.photos[0]?.url ?? room.kos.coverImage ?? ""} alt="" className="size-11 rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{room.kos.name}</p>
            <p className="truncate text-ink-soft">Kamar {room.name}</p>
          </div>
        </div>
        <p className="px-1 pt-1 font-semibold">Riwayat</p>
        {["September", "Agustus"].map((m) => (
          <div key={m} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 shadow-sm">
            <span>Sewa {m}</span>
            <span className="flex items-center gap-1 font-semibold text-mint-ink">
              <CheckCircle2 className="size-3.5" /> Lunas
            </span>
          </div>
        ))}
      </div>
      <TabBar active={1} />
    </div>
  );
}

/** Layar detail kamar. */
export function RoomScreen({ room }: { room: RoomListing }) {
  return (
    <div className="flex h-full flex-col bg-white text-[11px]">
      <div className="relative h-52 shrink-0">
        <img src={room.photos[0]?.url ?? room.kos.coverImage ?? ""} alt="" className="size-full object-cover" />
        <div className="absolute inset-x-0 top-0 bg-linear-to-b from-black/40 to-transparent text-white">
          <StatusBar />
        </div>
        <span className="absolute bottom-3 left-3 rounded-md bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          {room.availableRooms} kamar tersedia
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-sm font-bold">
          {room.kos.name} · {room.name}
        </p>
        <p className="flex items-center gap-1 text-ink-soft">
          <MapPin className="size-3" /> {room.kos.city}
        </p>
        <div className="flex flex-wrap gap-1">
          {(room.facilities ?? []).slice(0, 4).map((f) => (
            <span key={f} className="rounded-md bg-lavender px-1.5 py-0.5 text-[10px] text-brand-700">
              {f}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between pt-2">
          <p>
            <span className="text-base font-bold text-brand-700">{price(room.monthlyPrice)}</span>
            <span className="text-ink-soft"> /bln</span>
          </p>
          <span className="rounded-full bg-brand-600 px-3 py-1.5 text-[10px] font-semibold text-white">Ajukan sewa</span>
        </div>
      </div>
      <TabBar active={2} />
    </div>
  );
}

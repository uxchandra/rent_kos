"use client";

import { useMemo, useState } from "react";
import { Bath, Flame, LayoutGrid, Snowflake, Tv, Users, Venus, Mars, Wallet, type LucideIcon } from "lucide-react";
import { RoomCard } from "./room-card";
import type { RoomListing } from "@/lib/types";

type Chip = { id: string; label: string; icon: LucideIcon; test: (r: RoomListing) => boolean };

const has = (r: RoomListing, re: RegExp) => r.facilities?.some((f) => re.test(f)) ?? false;

const chips: Chip[] = [
  { id: "all", label: "Semua", icon: LayoutGrid, test: () => true },
  { id: "putri", label: "Putri", icon: Venus, test: (r) => r.kos.gender === "PUTRI" },
  { id: "putra", label: "Putra", icon: Mars, test: (r) => r.kos.gender === "PUTRA" },
  { id: "campur", label: "Campur", icon: Users, test: (r) => r.kos.gender === "CAMPUR" },
  { id: "ac", label: "AC", icon: Snowflake, test: (r) => has(r, /\bac\b/i) },
  { id: "km", label: "K. Mandi Dalam", icon: Bath, test: (r) => has(r, /kamar mandi dalam/i) },
  { id: "heater", label: "Water Heater", icon: Flame, test: (r) => has(r, /water heater/i) },
  { id: "tv", label: "Smart TV", icon: Tv, test: (r) => has(r, /tv/i) },
  { id: "hemat", label: "< Rp1,5 jt", icon: Wallet, test: (r) => r.monthlyPrice < 1_500_000 },
];

const sorts = {
  rekomendasi: { label: "Rekomendasi", fn: (a: RoomListing, b: RoomListing) => b.availableRooms - a.availableRooms },
  murah: { label: "Harga termurah", fn: (a: RoomListing, b: RoomListing) => a.monthlyPrice - b.monthlyPrice },
  mahal: { label: "Harga tertinggi", fn: (a: RoomListing, b: RoomListing) => b.monthlyPrice - a.monthlyPrice },
};

export function ListingExplorer({ rooms }: { rooms: RoomListing[] }) {
  const cities = useMemo(() => [...new Set(rooms.map((r) => r.kos.city))], [rooms]);
  const [city, setCity] = useState<string | null>(null);
  const [chip, setChip] = useState("all");
  const [sort, setSort] = useState<keyof typeof sorts>("rekomendasi");

  const result = useMemo(() => {
    const test = chips.find((c) => c.id === chip)!.test;
    return rooms.filter((r) => (!city || r.kos.city === city) && test(r)).sort(sorts[sort].fn);
  }, [rooms, city, chip, sort]);

  return (
    <div>
      {/* Bar kategori ala Airbnb */}
      <div className="sticky top-20 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-350 gap-8 overflow-x-auto px-4 pt-4 [scrollbar-width:none] sm:px-6">
          {chips.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setChip(id)}
              className={`flex shrink-0 flex-col items-center gap-1.5 border-b-2 pb-3 text-xs font-semibold transition ${
                chip === id ? "border-ink text-ink" : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
            >
              <Icon className="size-6" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-350 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[null, ...cities].map((c) => (
              <button
                key={c ?? "semua"}
                onClick={() => setCity(c)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  city === c ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                }`}
              >
                {c ?? "Semua kota"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Urutkan</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as keyof typeof sorts)}
              className="rounded-lg border border-line bg-white px-3 py-2 font-medium outline-none focus:border-ink"
            >
              {Object.entries(sorts).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-6 text-sm text-muted">
          {result.length} tipe kamar{city ? ` di ${city}` : ""}
        </p>

        {result.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-semibold">Belum ada kamar yang cocok</p>
            <p className="mt-1 text-sm text-muted">Coba ubah filter atau pilih kota lain.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.map((r) => (
              <RoomCard key={r.id} room={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

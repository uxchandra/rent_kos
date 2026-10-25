"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { RoomCard } from "./room-card";
import { BottomSheet } from "./bottom-sheet";
import { tierOf, tiers } from "@/lib/tiers";
import type { KosGender, RoomListing } from "@/lib/types";

const has = (r: RoomListing, re: RegExp) => r.facilities?.some((f) => re.test(f)) ?? false;

const features = [
  { id: "ac", label: "AC", test: (r: RoomListing) => has(r, /\bac\b/i) },
  { id: "km", label: "Kamar mandi dalam", test: (r: RoomListing) => has(r, /kamar mandi dalam/i) },
  { id: "heater", label: "Water heater", test: (r: RoomListing) => has(r, /water heater/i) },
  { id: "tv", label: "Smart TV", test: (r: RoomListing) => has(r, /tv/i) },
];

const genders: { id: KosGender; label: string }[] = [
  { id: "PUTRI", label: "Putri" },
  { id: "PUTRA", label: "Putra" },
  { id: "CAMPUR", label: "Campur" },
];

const sorts = {
  tersedia: { label: "Paling banyak tersedia", fn: (a: RoomListing, b: RoomListing) => b.availableRooms - a.availableRooms },
  murah: { label: "Harga termurah", fn: (a: RoomListing, b: RoomListing) => a.monthlyPrice - b.monthlyPrice },
  mahal: { label: "Harga tertinggi", fn: (a: RoomListing, b: RoomListing) => b.monthlyPrice - a.monthlyPrice },
};

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
        active ? "border-lime bg-lime font-semibold text-night" : "border-white/15 bg-white/5 text-white/80 hover:border-lime/60"
      }`}
    >
      {children}
    </button>
  );
}

export function ListingExplorer({ rooms }: { rooms: RoomListing[] }) {
  const params = useSearchParams();
  const cities = useMemo(() => [...new Set(rooms.map((r) => r.kos.city))], [rooms]);
  const [city, setCity] = useState<string | null>(params.get("kota"));
  const [tier, setTier] = useState<string | null>(params.get("tier"));
  const [gender, setGender] = useState<KosGender | null>(genders.find((g) => g.id === params.get("khusus")?.toUpperCase())?.id ?? null);
  const [feature, setFeature] = useState<string | null>(null);
  const [sort, setSort] = useState<keyof typeof sorts>("tersedia");
  const maxPrice = Number(params.get("maks")) || Infinity;

  const result = useMemo(() => {
    const test = features.find((f) => f.id === feature)?.test ?? (() => true);
    return rooms
      .filter(
        (r) =>
          (!city || r.kos.city === city) &&
          (!tier || tierOf(r.monthlyPrice).id === tier) &&
          (!gender || r.kos.gender === gender) &&
          r.monthlyPrice <= maxPrice &&
          test(r),
      )
      .sort(sorts[sort].fn);
  }, [rooms, city, tier, gender, feature, sort, maxPrice]);

  const toggle = <T,>(set: (v: T | null) => void, current: T | null, v: T) => set(current === v ? null : v);
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = [tier, gender, feature].filter(Boolean).length;

  const cityPills = (
    <>
      <Pill active={!city} onClick={() => setCity(null)}>
        Semua
      </Pill>
      {cities.map((c) => (
        <Pill key={c} active={city === c} onClick={() => toggle(setCity, city, c)}>
          {c}
        </Pill>
      ))}
    </>
  );

  const otherFilters = (
    <>
      <FilterGroup title="Tipe">
          {tiers.map((t) => (
            <Pill key={t.id} active={tier === t.id} onClick={() => toggle(setTier, tier, t.id)}>
              {t.label}
            </Pill>
          ))}
        </FilterGroup>
        <FilterGroup title="Khusus">
          {genders.map((g) => (
            <Pill key={g.id} active={gender === g.id} onClick={() => toggle(setGender, gender, g.id)}>
              {g.label}
            </Pill>
          ))}
        </FilterGroup>
        <FilterGroup title="Fasilitas">
          {features.map((f) => (
            <Pill key={f.id} active={feature === f.id} onClick={() => toggle(setFeature, feature, f.id)}>
              {f.label}
            </Pill>
          ))}
        </FilterGroup>
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
      {/* Desktop: filter di samping */}
      <aside className="hidden space-y-7 lg:sticky lg:top-24 lg:block lg:self-start">
        <FilterGroup title="Kota">{cityPills}</FilterGroup>
        {otherFilters}
      </aside>

      {/* HP: chip kota yang bisa digeser + tombol filter */}
      <div className="sticky top-16 z-30 -mx-4 -mt-6 border-b border-white/10 bg-night/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/40 px-4 py-1.5 text-sm font-semibold"
          >
            <SlidersHorizontal className="size-4" /> Filter
            {activeCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-lime text-[11px] text-night">{activeCount}</span>
            )}
          </button>
          <span className="h-6 w-px shrink-0 bg-white/15" />
          <div className="no-scrollbar -mr-4 flex gap-2 overflow-x-auto pr-4">{cityPills}</div>
        </div>
      </div>
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter kamar"
        night
        footer={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTier(null);
                setGender(null);
                setFeature(null);
              }}
              className="px-2 py-3 text-sm font-semibold underline underline-offset-4"
            >
              Reset
            </button>
            <button onClick={() => setSheetOpen(false)} className="flex-1 rounded-full bg-lime py-3.5 font-semibold text-night">
              Tampilkan {result.length} kamar
            </button>
          </div>
        }
      >
        <div className="space-y-7">
          {otherFilters}
          <FilterGroup title="Urutkan">
            {Object.entries(sorts).map(([k, v]) => (
              <Pill key={k} active={sort === k} onClick={() => setSort(k as keyof typeof sorts)}>
                {v.label}
              </Pill>
            ))}
          </FilterGroup>
        </div>
      </BottomSheet>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/60">
            <span className="font-semibold text-white">{result.length}</span> tipe kamar
            {city && ` di ${city}`}
            {Number.isFinite(maxPrice) && ` · maks. Rp${(maxPrice / 1_000_000).toLocaleString("id-ID")} jt`}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof sorts)}
            className="hidden rounded-full border border-white/15 bg-night-2 px-4 py-2 text-sm text-white outline-none focus:border-lime lg:block"
          >
            {Object.entries(sorts).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {result.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-night-2 px-6 py-20 text-center ring-1 ring-white/6">
            <p className="text-lg font-bold">Belum ada kamar yang cocok</p>
            <p className="mt-1 text-sm text-white/60">Coba longgarkan filter atau pilih kota lain.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.map((r) => (
              <RoomCard key={r.id} room={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/50">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

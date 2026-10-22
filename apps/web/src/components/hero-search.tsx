"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search, Wallet } from "lucide-react";
import { tiers } from "@/lib/tiers";

const budgets = [
  { value: "", label: "Semua harga" },
  { value: "1500000", label: "Di bawah Rp1,5 jt" },
  { value: "2500000", label: "Di bawah Rp2,5 jt" },
  { value: "4000000", label: "Di bawah Rp4 jt" },
];

export function HeroSearch({ cities }: { cities: string[] }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (city) q.set("kota", city);
    if (budget) q.set("maks", budget);
    router.push(`/kamar${q.size ? `?${q}` : ""}`);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_18px_50px_-18px_rgb(30_10_60/0.35)]">
      <p className="text-sm font-semibold">Cari kamar bulanan</p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-xl border border-line px-4 py-2.5">
          <MapPin className="size-4 shrink-0 text-brand-600" />
          <span className="flex-1">
            <span className="block text-xs font-semibold">Lokasi</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-transparent text-base text-muted outline-none sm:text-sm">
              <option value="">Semua kota</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </span>
        </label>
        <label className="flex flex-1 items-center gap-3 rounded-xl border border-line px-4 py-2.5">
          <Wallet className="size-4 shrink-0 text-brand-600" />
          <span className="flex-1">
            <span className="block text-xs font-semibold">Budget per bulan</span>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-transparent text-base text-muted outline-none sm:text-sm">
              {budgets.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </span>
        </label>
        <button
          aria-label="Cari"
          className="grid h-12 place-items-center rounded-full bg-brand-600 px-5 text-white transition hover:bg-brand-700 sm:size-12 sm:px-0"
        >
          <Search className="size-5" />
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        Atau pilih berdasarkan tipe
        {tiers.map((t) => (
          <Link key={t.id} href={`/kamar?tier=${t.id}`} className={`rounded-full px-3 py-1 font-semibold ${t.tag}`}>
            SmartKos {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, BedDouble, CircleDollarSign, ClipboardList, DoorOpen } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
import { priceCompact } from "@/lib/format";
import type { Dashboard } from "@/lib/admin-types";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data } = useSWR<{ data: Dashboard }>("/admin/dashboard");
  const d = data?.data;
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description={user.role === "OWNER" ? "Ringkasan semua cabang SmartKos." : "Ringkasan cabang yang Anda kelola."}
      />

      {!d ? (
        <Spinner />
      ) : d.kos.length === 0 ? (
        <EmptyState title="Belum ada cabang" text="Anda belum ditugaskan ke cabang mana pun. Hubungi Owner." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat icon={BedDouble} label="Okupansi" value={`${d.totals.totalRooms ? Math.round((d.totals.occupied / d.totals.totalRooms) * 100) : 0}%`} sub={`${d.totals.occupied} dari ${d.totals.totalRooms} kamar`} />
            <Stat icon={DoorOpen} label="Kamar kosong" value={d.totals.available} sub={d.totals.maintenance ? `${d.totals.maintenance} sedang perbaikan` : "siap disewakan"} />
            <Stat icon={CircleDollarSign} label="Potensi sewa/bulan" value={priceCompact(d.totals.potentialRevenue)} sub="dari kamar terisi" />
            <Stat icon={ClipboardList} label="Booking baru" value={d.totals.pendingBookings} sub="menunggu diproses" />
          </div>

          <h2 className="mb-3 mt-10 text-lg font-bold">Per cabang</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {d.kos.map((k) => {
              const pct = k.totalRooms ? (k.occupied / k.totalRooms) * 100 : 0;
              return (
                <Link key={k.id} href={`/admin/kos/${k.id}`} className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-md">
                  <div className="flex items-center gap-4 p-4">
                    {k.coverImage ? (
                      <img src={k.coverImage} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="size-16 shrink-0 rounded-xl bg-subtle" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{k.name}</p>
                      <p className="text-sm text-ink-soft">
                        {k.city} · {k.isPublished ? <span className="text-mint-ink">Tayang</span> : <span className="text-amber-600">Draf</span>}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-ink-soft transition group-hover:translate-x-0.5" />
                  </div>
                  <div className="border-t border-line px-4 py-3">
                    <div className="flex justify-between text-xs text-ink-soft">
                      <span>
                        <b className="text-ink">{k.occupied}</b>/{k.totalRooms} terisi
                      </span>
                      <span>
                        {k.available} kosong{k.maintenance > 0 && ` · ${k.maintenance} perbaikan`}
                      </span>
                    </div>
                    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-mint">
                      <div className="bg-brand-600" style={{ width: `${pct}%` }} />
                      <div className="bg-amber-400" style={{ width: `${k.totalRooms ? (k.maintenance / k.totalRooms) * 100 : 0}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof BedDouble; label: string; value: string | number; sub: string }) {
  return (
    <Card className="p-4! sm:p-5!">
      <Icon className="size-5 text-brand-600" />
      <p className="mt-3 text-xs font-medium text-ink-soft sm:text-sm">{label}</p>
      <p className="mt-0.5 truncate text-xl font-bold sm:text-2xl">{value}</p>
      <p className="mt-0.5 truncate text-xs text-ink-soft">{sub}</p>
    </Card>
  );
}

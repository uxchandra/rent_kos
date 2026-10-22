"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import Link from "next/link";
import useSWR from "swr";
import { ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
import { genderLabel } from "@/lib/format";
import type { AdminKosSummary } from "@/lib/admin-types";

export default function AdminKosListPage() {
  const { user } = useAuth();
  const { data } = useSWR<{ data: AdminKosSummary[] }>("/admin/kos");
  const isOwner = user.role === "OWNER";

  const addButton = isOwner && (
    <Link href="/admin/kos/baru" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
      <Plus className="size-4" /> Tambah cabang
    </Link>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Cabang" description="Kelola info, foto, tipe kamar, dan kamar setiap cabang." actions={addButton} />
      {!data ? (
        <Spinner />
      ) : data.data.length === 0 ? (
        <EmptyState title="Belum ada cabang" text={isOwner ? "Tambahkan cabang pertama SmartKos." : "Anda belum ditugaskan ke cabang mana pun."} action={addButton} />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {data.data.map((k) => (
            <Link key={k.id} href={`/admin/kos/${k.id}`} className="flex items-center gap-4 p-4 transition hover:bg-subtle">
              {k.coverImage ? (
                <img src={k.coverImage} alt="" className="size-16 shrink-0 rounded-xl object-cover sm:size-20" />
              ) : (
                <span className="size-16 shrink-0 rounded-xl bg-subtle sm:size-20" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{k.name}</p>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${k.isPublished ? "bg-mint text-mint-ink" : "bg-amber-50 text-amber-700"}`}
                  >
                    {k.isPublished ? "Tayang" : "Draf"}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {k.city} · {genderLabel[k.gender]} · smartkos.com/{k.slug}
                </p>
                <p className="mt-1 text-sm">
                  {k.roomTypeCount} tipe · {k.totalRooms} kamar · <span className="text-mint-ink">{k.availableRooms} kosong</span>
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

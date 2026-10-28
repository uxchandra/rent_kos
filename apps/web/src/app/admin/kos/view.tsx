"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
import { genderLabel } from "@/lib/format";
import type { AdminKosSummary } from "@/lib/admin-types";
import { CellStack, DesktopTable, MobileList } from "@/components/admin/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";

export default function AdminKosListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data } = useSWR<{ data: AdminKosSummary[] }>("/admin/kos");
  const isOwner = user.role === "OWNER";

  const addButton = isOwner && (
    <Link href="/admin/kos/baru" className={buttonVariants()}>
      <Plus className="size-4" /> Tambah cabang
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Cabang" description="Kelola info, foto, tipe kamar, dan kamar setiap cabang." actions={addButton} />
      {!data ? (
        <Spinner />
      ) : data.data.length === 0 ? (
        <EmptyState title="Belum ada cabang" text={isOwner ? "Tambahkan cabang pertama SmartKos." : "Anda belum ditugaskan ke cabang mana pun."} action={addButton} />
      ) : (
        <>
        <MobileList className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {data.data.map((k) => (
            <Link key={k.id} href={`/admin/kos/${k.id}`} className="flex items-center gap-4 p-4 transition hover:bg-muted">
              {k.coverImage ? (
                <img src={k.coverImage} alt="" className="size-16 shrink-0 rounded-xl object-cover sm:size-20" />
              ) : (
                <span className="size-16 shrink-0 rounded-xl bg-muted sm:size-20" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{k.name}</p>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${!k.isPublished ? "bg-amber-50 text-amber-700" : k.comingSoon ? "bg-accent text-foreground" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {!k.isPublished ? "Draf" : k.comingSoon ? "Segera hadir" : "Tayang"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {k.city} · {genderLabel[k.gender]} · smartkos.com/{k.slug}
                </p>
                <p className="mt-1 text-sm">
                  {k.roomTypeCount} tipe · {k.totalRooms} kamar · <span className="text-emerald-700">{k.availableRooms} kosong</span>
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </MobileList>
        <DesktopTable>
          <TableHeader>
            <TableRow>
              <TableHead>Cabang</TableHead>
              <TableHead>Alamat website</TableHead>
              <TableHead>Khusus</TableHead>
              <TableHead className="text-right">Tipe</TableHead>
              <TableHead className="text-right">Kamar</TableHead>
              <TableHead className="text-right">Terisi</TableHead>
              <TableHead className="text-right">Kosong</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((k) => (
              <TableRow key={k.id} onClick={() => router.push(`/admin/kos/${k.id}`)} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {k.coverImage ? (
                      <img src={k.coverImage} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="size-10 shrink-0 rounded-lg bg-muted" />
                    )}
                    <CellStack title={<Link href={`/admin/kos/${k.id}`}>{k.name}</Link>} sub={k.city} />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">/{k.slug}</TableCell>
                <TableCell>{genderLabel[k.gender]}</TableCell>
                <TableCell className="text-right tabular-nums">{k.roomTypeCount}</TableCell>
                <TableCell className="text-right tabular-nums">{k.totalRooms}</TableCell>
                <TableCell className="text-right tabular-nums">{k.occupiedRooms}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-emerald-700">{k.availableRooms}</TableCell>
                <TableCell>
                  <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${!k.isPublished ? "bg-amber-50 text-amber-700" : k.comingSoon ? "bg-accent text-foreground" : "bg-emerald-100 text-emerald-700"}`}>
                    {!k.isPublished ? "Draf" : k.comingSoon ? "Segera hadir" : "Tayang"}
                  </span>
                </TableCell>
                <TableCell className="w-8">
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DesktopTable>
        </>
      )}
    </div>
  );
}

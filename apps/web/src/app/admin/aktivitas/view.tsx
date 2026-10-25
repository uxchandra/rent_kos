"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { EmptyState, Input, PageHeader, Select, Spinner } from "@/components/admin/ui";
import { DesktopTable, MobileList } from "@/components/admin/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { price } from "@/lib/format";
import type { ActivityEntry, ActivityPage } from "@/lib/admin-types";

const statusWords: Record<string, string> = {
  AVAILABLE: "kosong",
  OCCUPIED: "terisi",
  MAINTENANCE: "perbaikan",
};

/** Ringkasan isi `meta` dalam kalimat pendek, misal "status: perbaikan". */
function metaText(meta: ActivityEntry["meta"]) {
  if (!meta) return null;
  const parts = Object.entries(meta).map(([k, v]) => {
    if (k === "status" && typeof v === "string") return `status: ${statusWords[v] ?? v.toLowerCase()}`;
    if ((k === "amount" || k === "monthlyPrice") && typeof v === "number") return price(v);
    if (k === "isActive" || k === "isPublished") return v ? (k === "isPublished" ? "tayang" : "aktif") : k === "isPublished" ? "draf" : "nonaktif";
    if (k === "year" || k === "month") return `${k === "year" ? "tahun" : "bulan"} ${v}`;
    return String(v);
  });
  return parts.join(" · ");
}

const when = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  };
};

export default function AktivitasPage() {
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page) });
  if (userId) params.set("userId", userId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (query.trim()) params.set("q", query.trim());
  const { data } = useSWR<ActivityPage>(`/admin/activity?${params}`, { keepPreviousData: true });

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Log aktivitas" description="Semua perubahan data di admin panel: siapa, melakukan apa, dan kapan." />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <Input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Cari aksi, nama kamar, penghuni" className="pl-10" />
        </label>
        <Select value={userId} onChange={(e) => reset(setUserId)(e.target.value)}>
          <option value="">Semua pengguna</option>
          {data?.users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.userName}
            </option>
          ))}
        </Select>
        <Input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="Dari tanggal" />
        <Input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="Sampai tanggal" />
      </div>

      {!data ? (
        <Spinner />
      ) : data.data.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" text={params.size > 1 ? "Coba ubah filter." : "Aktivitas akan tercatat saat ada data yang diubah di admin panel."} />
      ) : (
        <>
          <MobileList className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {data.data.map((a) => {
              const t = when(a.createdAt);
              return (
                <div key={a.id} className="p-4">
                  <p className="text-sm">
                    <b>{a.userName}</b> {a.label.charAt(0).toLowerCase() + a.label.slice(1)}
                  </p>
                  {a.target && <p className="mt-0.5 text-sm text-ink-soft">{a.target}</p>}
                  {metaText(a.meta) && <p className="mt-0.5 text-xs text-ink-soft">{metaText(a.meta)}</p>}
                  <p className="mt-1 text-xs text-ink-soft">
                    {t.date}, {t.time}
                  </p>
                </div>
              );
            })}
          </MobileList>
          <DesktopTable>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Objek</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((a) => {
                const t = when(a.createdAt);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="tabular-nums">
                      <span className="block">{t.date}</span>
                      <span className="block text-xs text-muted-foreground">{t.time}</span>
                    </TableCell>
                    <TableCell className="font-medium">{a.userName}</TableCell>
                    <TableCell>{a.label}</TableCell>
                    <TableCell className="max-w-64 truncate" title={a.target ?? undefined}>
                      {a.target ?? <span className="text-muted-foreground">–</span>}
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">{metaText(a.meta) ?? "–"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.ip?.replace("::ffff:", "") ?? "–"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DesktopTable>

          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span>
              {data.meta.total.toLocaleString("id-ID")} aktivitas · halaman {data.meta.page} dari {data.meta.pages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full border border-line bg-white p-2 disabled:opacity-40"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
                disabled={page >= data.meta.pages}
                className="rounded-full border border-line bg-white p-2 disabled:opacity-40"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

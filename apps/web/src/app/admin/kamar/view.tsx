"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/components/auth-provider";
import { ChevronRight, UserPlus } from "lucide-react";
import { Button, Dialog, EmptyState, PageHeader, Spinner, useFeedback } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/client-api";
import { price } from "@/lib/format";
import { roomStatusLabel, roomStatusStyle, type RoomBoard, type RoomStatus } from "@/lib/admin-types";
import { Button as UiButton, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Room = RoomBoard[number]["roomTypes"][number]["rooms"][number];
type Selected = Room & { kosName: string; typeName: string };

const statuses: RoomStatus[] = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];
const statusDot: Record<RoomStatus, string> = { AVAILABLE: "bg-emerald-500", OCCUPIED: "bg-foreground/40", MAINTENANCE: "bg-amber-500" };

export default function RoomBoardPage() {
  const { can } = useAuth();
  const canEdit = can("rooms.update", "kos.update");
  const { data, mutate } = useSWR<{ data: RoomBoard }>("/admin/rooms");
  const { toast } = useFeedback();
  const [kosFilter, setKosFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<RoomStatus | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [saving, setSaving] = useState<RoomStatus | null>(null);

  const board = data?.data ?? [];
  // Jumlah per status mengikuti cabang yang dipilih.
  const allRooms = board.filter((k) => !kosFilter || k.id === kosFilter).flatMap((k) => k.roomTypes.flatMap((t) => t.rooms));
  const count = (s: RoomStatus) => allRooms.filter((r) => r.status === s).length;

  async function setStatus(status: RoomStatus) {
    if (!selected) return;
    setSaving(status);
    try {
      await api(`/admin/rooms/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await mutate();
      toast(`Kamar ${selected.number} → ${roomStatusLabel[status]}`);
      setSelected(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Gagal menyimpan", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Papan kamar" description="Ketuk kamar untuk mengubah statusnya." />

      {!data ? (
        <Spinner />
      ) : board.length === 0 ? (
        <EmptyState title="Belum ada kamar" />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Select value={kosFilter ? String(kosFilter) : "all"} onValueChange={(v) => setKosFilter(v === "all" ? null : Number(v))}>
              <SelectTrigger className="w-full sm:w-64" aria-label="Pilih cabang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua cabang</SelectItem>
                {board.map((k) => (
                  <SelectItem key={k.id} value={String(k.id)}>
                    {k.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5 sm:ml-auto">
              {statuses.map((s) => (
                <UiButton
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                  aria-pressed={statusFilter === s}
                >
                  <span className={`size-2 rounded-full ${statusDot[s]}`} />
                  {roomStatusLabel[s]}
                  <span className="tabular-nums text-muted-foreground">{count(s)}</span>
                </UiButton>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {board
              .filter((k) => !kosFilter || k.id === kosFilter)
              .map((k) => (
                <section key={k.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <h2 className="font-bold">
                    {k.name} <span className="font-normal text-muted-foreground">· {k.city}</span>
                  </h2>
                  <div className="mt-4 space-y-5">
                    {k.roomTypes.map((t) => {
                      const rooms = t.rooms.filter((r) => !statusFilter || r.status === statusFilter);
                      if (rooms.length === 0) return null;
                      return (
                        <div key={t.id}>
                          <p className="mb-2 text-sm">
                            <span className="font-semibold">{t.name}</span> <span className="text-muted-foreground">· {price(t.monthlyPrice)}</span>
                          </p>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                            {rooms.map((r) => (
                              <button
                                key={r.id}
                                onClick={() => setSelected({ ...r, kosName: k.name, typeName: t.name })}
                                className={`rounded-xl border px-2 py-3 text-center transition active:scale-95 ${roomStatusStyle[r.status]}`}
                              >
                                <span className="block font-bold">{r.number}</span>
                                <span className="block truncate text-[10px] font-medium">{r.tenantName ?? roomStatusLabel[r.status]}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
          </div>
        </>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected ? `Kamar ${selected.number}` : ""}>
        {selected && (
          <>
            <p className="text-sm text-muted-foreground">
              {selected.kosName} · Tipe {selected.typeName}
              {selected.floor !== null && ` · Lantai ${selected.floor}`}
            </p>
            {selected.tenantName ? (
              <Link href="/admin/penghuni" className="mt-3 flex items-center justify-between rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">
                Dihuni oleh {selected.tenantName} <ChevronRight className="size-4" />
              </Link>
            ) : (
              selected.status !== "MAINTENANCE" && (
                <Link
                  href={`/admin/penghuni?kamar=${selected.id}`}
                  className={cn(buttonVariants(), "mt-4 w-full")}
                >
                  <UserPlus className="size-4" /> Daftarkan penghuni
                </Link>
              )
            )}
            {!canEdit ? (
              <p className="mt-5 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">Peran Anda hanya bisa melihat status kamar.</p>
            ) : (
              <>
                <p className="mb-3 mt-5 text-sm font-semibold">Ubah status</p>
                <div className="grid gap-2">
                  {statuses.map((s) => (
                    <Button
                      key={s}
                      variant={selected.status === s ? "primary" : "secondary"}
                      loading={saving === s}
                      disabled={selected.status === s || saving !== null}
                      onClick={() => setStatus(s)}
                      className="justify-start rounded-xl! py-3"
                    >
                      <span className={`size-3 rounded-full border ${roomStatusStyle[s]}`} /> {roomStatusLabel[s]}
                      {selected.status === s && <span className="ml-auto text-xs font-normal">status saat ini</span>}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Dialog>
    </div>
  );
}

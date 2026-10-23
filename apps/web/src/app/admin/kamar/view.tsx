"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ChevronRight, UserPlus } from "lucide-react";
import { Button, Dialog, EmptyState, PageHeader, Spinner, useFeedback } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/client-api";
import { price } from "@/lib/format";
import { roomStatusLabel, roomStatusStyle, type RoomBoard, type RoomStatus } from "@/lib/admin-types";

type Room = RoomBoard[number]["roomTypes"][number]["rooms"][number];
type Selected = Room & { kosName: string; typeName: string };

const statuses: RoomStatus[] = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];

export default function RoomBoardPage() {
  const { data, mutate } = useSWR<{ data: RoomBoard }>("/admin/rooms");
  const { toast } = useFeedback();
  const [kosFilter, setKosFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<RoomStatus | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [saving, setSaving] = useState<RoomStatus | null>(null);

  const board = data?.data ?? [];
  const allRooms = board.flatMap((k) => k.roomTypes.flatMap((t) => t.rooms));
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
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {[null, ...board.map((k) => k.id)].map((id) => (
              <button
                key={id ?? "all"}
                onClick={() => setKosFilter(id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                  kosFilter === id ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white"
                }`}
              >
                {id === null ? "Semua cabang" : board.find((k) => k.id === id)!.name}
              </button>
            ))}
          </div>
          <div className="mb-6 grid grid-cols-3 gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${roomStatusStyle[s]} ${
                  statusFilter && statusFilter !== s ? "opacity-40" : ""
                }`}
              >
                <span className="block text-xl font-bold">{count(s)}</span>
                <span className="text-xs font-semibold">{roomStatusLabel[s]}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {board
              .filter((k) => !kosFilter || k.id === kosFilter)
              .map((k) => (
                <section key={k.id} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
                  <h2 className="font-bold">
                    {k.name} <span className="font-normal text-muted">· {k.city}</span>
                  </h2>
                  <div className="mt-4 space-y-5">
                    {k.roomTypes.map((t) => {
                      const rooms = t.rooms.filter((r) => !statusFilter || r.status === statusFilter);
                      if (rooms.length === 0) return null;
                      return (
                        <div key={t.id}>
                          <p className="mb-2 text-sm">
                            <span className="font-semibold">{t.name}</span> <span className="text-muted">· {price(t.monthlyPrice)}</span>
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
            <p className="text-sm text-muted">
              {selected.kosName} · Tipe {selected.typeName}
              {selected.floor !== null && ` · Lantai ${selected.floor}`}
            </p>
            {selected.tenantName ? (
              <Link href="/admin/penghuni" className="mt-3 flex items-center justify-between rounded-xl bg-lavender px-3 py-2 text-sm text-brand-800">
                Dihuni oleh {selected.tenantName} <ChevronRight className="size-4" />
              </Link>
            ) : (
              selected.status !== "MAINTENANCE" && (
                <Link
                  href={`/admin/penghuni?kamar=${selected.id}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <UserPlus className="size-4" /> Daftarkan penghuni
                </Link>
              )
            )}
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
      </Dialog>
    </div>
  );
}

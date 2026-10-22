"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Check } from "lucide-react";
import { Button, Card, EmptyState, Spinner, useFeedback } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/client-api";
import type { AdminKosDetail, AdminUser } from "@/lib/admin-types";

export function AdminsTab({ kos, reload }: { kos: AdminKosDetail; reload: () => Promise<unknown> }) {
  const { data, mutate } = useSWR<{ data: AdminUser[] }>("/admin/users");
  const { toast } = useFeedback();
  const [selected, setSelected] = useState(() => new Set(kos.admins.map((a) => a.id)));
  const [saving, setSaving] = useState(false);

  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function save() {
    setSaving(true);
    try {
      await api(`/admin/kos/${kos.id}/admins`, { method: "PUT", body: JSON.stringify({ userIds: [...selected] }) });
      await Promise.all([reload(), mutate()]);
      toast("Pengelola diperbarui");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <Spinner />;
  const admins = data.data.filter((a) => a.isActive);

  return (
    <Card>
      <h2 className="font-bold">Pengelola cabang</h2>
      <p className="mb-5 text-sm text-muted">Admin yang dipilih bisa mengelola kamar, booking, dan tagihan di {kos.name}.</p>
      {admins.length === 0 ? (
        <EmptyState
          title="Belum ada akun admin"
          action={
            <Link href="/admin/pengelola" className="text-sm font-semibold text-brand-600 underline">
              Buat akun admin
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-line rounded-xl border border-line">
          {admins.map((a) => (
            <button key={a.id} onClick={() => toggle(a.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle">
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-md border ${selected.has(a.id) ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}
              >
                {selected.has(a.id) && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{a.name}</span>
                <span className="block truncate text-xs text-muted">
                  {a.email}
                  {a.kos.length > 0 && ` · ${a.kos.map((k) => k.name).join(", ")}`}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Link href="/admin/pengelola" className="text-sm font-semibold text-brand-600">
          Kelola akun admin →
        </Link>
        <Button loading={saving} onClick={save}>
          Simpan
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, Dialog, EmptyState, Field, Input, PageHeader, Spinner, Switch, useFeedback } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/client-api";
import type { AdminKosSummary, AdminUser } from "@/lib/admin-types";

type FormState = { name: string; email: string; phone: string; password: string; kosIds: number[]; isActive: boolean };

const empty: FormState = { name: "", email: "", phone: "", password: "", kosIds: [], isActive: true };

function AdminDialog({
  admin,
  open,
  onClose,
  kosList,
  onSaved,
}: {
  admin: AdminUser | null;
  open: boolean;
  onClose: () => void;
  kosList: AdminKosSummary[];
  onSaved: () => Promise<unknown>;
}) {
  const { toast } = useFeedback();
  const initial: FormState = admin
    ? { name: admin.name, email: admin.email, phone: admin.phone ? `0${admin.phone.slice(2)}` : "", password: "", kosIds: admin.kos.map((k) => k.id), isActive: admin.isActive }
    : empty;
  const [v, setV] = useState(initial);
  const [last, setLast] = useState<{ admin: AdminUser | null; open: boolean }>({ admin, open });
  if (last.admin !== admin || last.open !== open) {
    setLast({ admin, open });
    setV(initial);
  }
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      if (admin) {
        await api(`/admin/users/${admin.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: v.name, phone: v.phone, kosIds: v.kosIds, isActive: v.isActive, password: v.password }),
        });
      } else {
        await api("/admin/users", { method: "POST", body: JSON.stringify(v) });
      }
      await onSaved();
      toast(admin ? "Admin diperbarui" : "Akun admin dibuat");
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      else toast(err instanceof Error ? err.message : "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  }

  const toggleKos = (id: number) => setV((s) => ({ ...s, kosIds: s.kosIds.includes(id) ? s.kosIds.filter((x) => x !== id) : [...s.kosIds, id] }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={admin ? `Edit ${admin.name}` : "Tambah admin cabang"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button loading={saving} onClick={save}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama" error={errors.name}>
          <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="No. HP / WhatsApp" error={errors.phone}>
          <Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} inputMode="tel" placeholder="081234567890" />
        </Field>
        <Field label="Email (untuk login)" error={errors.email} hint={admin ? "Email tidak bisa diubah." : undefined}>
          <Input type="email" value={v.email} disabled={!!admin} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </Field>
        <Field label={admin ? "Password baru" : "Password"} error={errors.password} hint={admin ? "Kosongkan jika tidak diganti." : "Minimal 8 karakter."}>
          <Input type="text" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="new-password" />
        </Field>
      </div>

      <p className="mb-2 mt-5 text-sm font-medium">Cabang yang dikelola</p>
      <div className="divide-y divide-line rounded-xl border border-line">
        {kosList.map((k) => (
          <button key={k.id} type="button" onClick={() => toggleKos(k.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle">
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-md border ${v.kosIds.includes(k.id) ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}
            >
              {v.kosIds.includes(k.id) && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className="text-sm">
              {k.name} <span className="text-muted">· {k.city}</span>
            </span>
          </button>
        ))}
      </div>

      {admin && (
        <div className="mt-5 rounded-xl bg-subtle p-4">
          <Switch checked={v.isActive} onChange={(c) => setV({ ...v, isActive: c })} label="Akun aktif" />
          <p className="mt-1 pl-14 text-xs text-muted">Akun nonaktif tidak bisa login.</p>
        </div>
      )}
    </Dialog>
  );
}

export default function PengelolaPage() {
  const { user } = useAuth();
  const { data, mutate } = useSWR<{ data: AdminUser[] }>(user.role === "OWNER" ? "/admin/users" : null);
  const { data: kosData } = useSWR<{ data: AdminKosSummary[] }>("/admin/kos");
  const [dialog, setDialog] = useState<{ open: boolean; admin: AdminUser | null }>({ open: false, admin: null });

  if (user.role !== "OWNER") return <EmptyState title="Halaman ini khusus Owner" />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Pengelola"
        description="Akun admin untuk setiap cabang. Admin hanya bisa melihat dan mengubah cabang yang ditugaskan."
        actions={
          <Button onClick={() => setDialog({ open: true, admin: null })}>
            <Plus className="size-4" /> Tambah admin
          </Button>
        }
      />
      {!data ? (
        <Spinner />
      ) : data.data.length === 0 ? (
        <EmptyState title="Belum ada admin" text="Tambahkan admin agar pengelola cabang bisa login." />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {data.data.map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lavender font-bold text-brand-700">{a.name[0]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{a.name}</p>
                  {!a.isActive && <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-muted">Nonaktif</span>}
                </div>
                <p className="truncate text-sm text-muted">{a.email}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{a.kos.length ? a.kos.map((k) => k.name).join(", ") : "Belum ditugaskan"}</p>
              </div>
              <button onClick={() => setDialog({ open: true, admin: a })} className="shrink-0 rounded-full p-2.5 hover:bg-subtle" aria-label={`Edit ${a.name}`}>
                <Pencil className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <AdminDialog
        open={dialog.open}
        admin={dialog.admin}
        onClose={() => setDialog({ open: false, admin: null })}
        kosList={kosData?.data ?? []}
        onSaved={mutate}
      />
    </div>
  );
}

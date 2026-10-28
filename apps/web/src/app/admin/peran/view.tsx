"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Dialog, EmptyState, Field, Input, PageHeader, Spinner, useFeedback, useSave } from "@/components/admin/ui";
import { CellStack, DesktopTable, MobileList } from "@/components/admin/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/client-api";
import type { PermissionCatalog, StaffRole } from "@/lib/admin-types";

function Checkbox({ checked, partial = false }: { checked: boolean; partial?: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-md border transition ${
        checked || partial ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
      }`}
    >
      {checked ? <Check className="size-3.5" strokeWidth={3} /> : partial ? <span className="h-0.5 w-2.5 rounded bg-card" /> : null}
    </span>
  );
}

function RoleDialog({ role, catalog, onClose, onSaved }: { role: StaffRole | null; catalog: PermissionCatalog; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { errors, saving, run } = useSave();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [perms, setPerms] = useState(() => new Set(role?.permissions ?? ["dashboard.view"]));

  const toggle = (key: string) =>
    setPerms((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const setGroup = (keys: string[], on: boolean) =>
    setPerms((s) => {
      const next = new Set(s);
      keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
      return next;
    });

  async function save() {
    const body = JSON.stringify({ name, description, permissions: [...perms] });
    const ok = await run(
      () => (role ? api(`/admin/roles/${role.id}`, { method: "PUT", body }) : api("/admin/roles", { method: "POST", body })),
      role ? "Peran diperbarui" : "Peran dibuat",
    );
    if (ok) {
      await onSaved();
      onClose();
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={role ? `Edit peran ${role.name}` : "Tambah peran"}
      footer={
        <>
          <span className="mr-auto self-center text-sm text-muted-foreground">{perms.size} izin dipilih</span>
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
        <Field label="Nama peran" error={errors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Keuangan" />
        </Field>
        <Field label="Keterangan" error={errors.description}>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mengurus tagihan dan pembayaran" />
        </Field>
      </div>
      {role && role.userCount > 0 && (
        <p className="mt-3 rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">
          Perubahan izin langsung berlaku untuk {role.userCount} pengguna dengan peran ini.
        </p>
      )}

      <p className="mb-2 mt-6 text-sm font-medium">Izin</p>
      {errors.permissions && <p className="mb-2 text-xs text-red-600">{errors.permissions[0]}</p>}
      <div className="divide-y divide-border rounded-xl border border-border">
        {catalog.groups.map((g) => {
          const keys = g.permissions.map((p) => p.key);
          const count = keys.filter((k) => perms.has(k)).length;
          return (
            <div key={g.key} className="p-4">
              <button type="button" onClick={() => setGroup(keys, count < keys.length)} className="flex w-full items-center gap-3 text-left">
                <Checkbox checked={count === keys.length} partial={count > 0 && count < keys.length} />
                <span className="font-semibold">{g.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {count}/{keys.length}
                </span>
              </button>
              <div className="mt-3 grid gap-2 pl-8 sm:grid-cols-2">
                {g.permissions.map((p) => (
                  <button key={p.key} type="button" onClick={() => toggle(p.key)} className="flex items-center gap-2.5 text-left text-sm">
                    <Checkbox checked={perms.has(p.key)} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-muted p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="size-4" /> Selalu khusus Owner
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-9 text-sm text-muted-foreground">
          {catalog.ownerOnly.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}

export default function PeranPage() {
  const { toast, confirm } = useFeedback();
  const { data, mutate } = useSWR<{ data: StaffRole[] }>("/admin/roles");
  const { data: catalog } = useSWR<{ data: PermissionCatalog }>("/admin/roles/catalog");
  const [editing, setEditing] = useState<{ role: StaffRole | null } | null>(null);

  const labelOf = (key: string) => catalog?.data.groups.flatMap((g) => g.permissions.map((p) => ({ ...p, group: g.label }))).find((p) => p.key === key);
  const summary = (r: StaffRole) => {
    const groups = [...new Set(r.permissions.map((k) => labelOf(k)?.group).filter(Boolean))];
    return groups.join(", ") || "–";
  };

  async function remove(r: StaffRole) {
    if (!(await confirm({ title: `Hapus peran ${r.name}?`, text: "Peran dihapus permanen.", confirmLabel: "Hapus", danger: true }))) return;
    try {
      const res = await api<{ message: string }>(`/admin/roles/${r.id}`, { method: "DELETE" });
      await mutate();
      toast(res.message);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghapus", "error");
    }
  }

  const actions = (r: StaffRole) => (
    <div className="flex justify-end gap-1">
      <button onClick={() => setEditing({ role: r })} className="rounded-full p-2 hover:bg-muted" aria-label={`Edit ${r.name}`} title="Edit izin">
        <Pencil className="size-4" />
      </button>
      {!r.isSystem && (
        <button onClick={() => remove(r)} className="rounded-full p-2 text-red-600 hover:bg-red-50" aria-label={`Hapus ${r.name}`} title="Hapus">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Peran & izin"
        description="Tentukan menu dan aksi apa saja yang boleh dipakai setiap admin. Owner selalu punya akses penuh."
        actions={
          <Button onClick={() => setEditing({ role: null })} disabled={!catalog}>
            <Plus className="size-4" /> Tambah peran
          </Button>
        }
      />
      {!data || !catalog ? (
        <Spinner />
      ) : data.data.length === 0 ? (
        <EmptyState title="Belum ada peran" />
      ) : (
        <>
          <MobileList className="space-y-3">
            {data.data.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {r.name} {r.isSystem && <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Bawaan</span>}
                    </p>
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  </div>
                  {actions(r)}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {r.permissions.length} izin · {r.userCount} pengguna · {summary(r)}
                </p>
              </div>
            ))}
          </MobileList>
          <DesktopTable>
            <TableHeader>
              <TableRow>
                <TableHead>Peran</TableHead>
                <TableHead>Akses ke</TableHead>
                <TableHead className="text-right">Izin</TableHead>
                <TableHead className="text-right">Pengguna</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-72">
                    <CellStack
                      title={
                        <>
                          {r.name} {r.isSystem && <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Bawaan</span>}
                        </>
                      }
                      sub={r.description ?? undefined}
                    />
                  </TableCell>
                  <TableCell className="max-w-96 truncate text-muted-foreground">{summary(r)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.permissions.length}/{catalog.data.all.length}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.userCount}</TableCell>
                  <TableCell>{actions(r)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DesktopTable>
        </>
      )}
      {editing && catalog && <RoleDialog role={editing.role} catalog={catalog.data} onClose={() => setEditing(null)} onSaved={mutate} />}
    </div>
  );
}

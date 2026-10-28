"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Check, KeyRound, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, Dialog, EmptyState, Field, Input, PageHeader, Select, Spinner, useFeedback, useSave } from "@/components/admin/ui";
import { CellStack, DesktopTable, MobileList } from "@/components/admin/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/client-api";
import { localPhone } from "@/lib/format";
import type { AdminKosSummary, AdminUser, StaffRole } from "@/lib/admin-types";

type Tab = "staff" | "tenant";

const lastSeen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Belum pernah";

function roleText(u: AdminUser) {
  if (u.role === "OWNER") return "Owner";
  if (u.role === "TENANT") return "Penghuni";
  return u.staffRole?.name ?? "Admin tanpa peran";
}

function RoleBadge({ u }: { u: AdminUser }) {
  const cls = u.role === "OWNER" ? "bg-primary text-primary-foreground" : u.role === "TENANT" ? "bg-muted text-muted-foreground" : "bg-accent text-foreground";
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold ${cls}`}>{roleText(u)}</span>;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

// ---------- Dialog akun staf ----------

function StaffDialog({ user, roles, kosList, onClose, onSaved }: { user: AdminUser | null; roles: StaffRole[]; kosList: AdminKosSummary[]; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { errors, saving, run } = useSave();
  const [v, setV] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: localPhone(user?.phone ?? null),
    password: "",
    role: (user?.role === "OWNER" ? "OWNER" : "ADMIN") as "OWNER" | "ADMIN",
    staffRoleId: (user?.staffRole?.id ?? roles.find((r) => r.isSystem)?.id ?? roles[0]?.id ?? null) as number | null,
    kosIds: user?.kos.map((k) => k.id) ?? [],
  });
  const isAdmin = v.role === "ADMIN";
  const toggleKos = (id: number) => setV((s) => ({ ...s, kosIds: s.kosIds.includes(id) ? s.kosIds.filter((x) => x !== id) : [...s.kosIds, id] }));

  async function save() {
    const body = { name: v.name, phone: v.phone, role: v.role, staffRoleId: isAdmin ? v.staffRoleId : null, kosIds: isAdmin ? v.kosIds : [] };
    const ok = await run(
      () =>
        user
          ? api(`/admin/users/${user.id}`, { method: "PUT", body: JSON.stringify(body) })
          : api("/admin/users", { method: "POST", body: JSON.stringify({ ...body, email: v.email, password: v.password }) }),
      user ? "Akun diperbarui" : "Akun dibuat",
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
      title={user ? `Edit ${user.name}` : "Tambah akun staf"}
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
        <Field label="Email (untuk login)" error={errors.email} hint={user ? "Email tidak bisa diubah." : undefined}>
          <Input type="email" value={v.email} disabled={!!user} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </Field>
        {!user && (
          <Field label="Password awal" error={errors.password} hint="Minimal 8 karakter. Minta pemilik akun menggantinya setelah login.">
            <Input value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="new-password" />
          </Field>
        )}
      </div>

      <p className="mb-2 mt-6 text-sm font-medium">Jenis akun</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            { value: "ADMIN", title: "Admin", text: "Akses sesuai peran, hanya di cabang yang dipilih." },
            { value: "OWNER", title: "Owner", text: "Akses penuh ke semua cabang, pengguna, dan pengaturan." },
          ] as const
        ).map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setV({ ...v, role: o.value })}
            className={`rounded-xl border p-3 text-left transition ${v.role === o.value ? "border-primary bg-accent/60" : "border-border hover:border-foreground"}`}
          >
            <span className="block text-sm font-semibold">{o.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{o.text}</span>
          </button>
        ))}
      </div>

      {isAdmin && (
        <>
          <Field label="Peran" error={errors.staffRoleId} className="mt-5" hint="Peran menentukan menu dan aksi yang boleh dipakai.">
            <Select value={v.staffRoleId ?? ""} onChange={(e) => setV({ ...v, staffRoleId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Pilih peran</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.permissions.length} izin
                </option>
              ))}
            </Select>
          </Field>
          <p className="mb-2 mt-5 text-sm font-medium">Cabang yang dikelola</p>
          <div className="divide-y divide-border rounded-xl border border-border">
            {kosList.map((k) => (
              <button key={k.id} type="button" onClick={() => toggleKos(k.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border ${v.kosIds.includes(k.id) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                >
                  {v.kosIds.includes(k.id) && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="text-sm">
                  {k.name} <span className="text-muted-foreground">· {k.city}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}

// ---------- Dialog penghuni ----------

function TenantDialog({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { errors, saving, run } = useSave();
  const [v, setV] = useState({ name: user.name, phone: localPhone(user.phone) });
  async function save() {
    if (await run(() => api(`/admin/users/${user.id}`, { method: "PUT", body: JSON.stringify(v) }), "Data penghuni diperbarui")) {
      await onSaved();
      onClose();
    }
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit ${user.name}`}
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
      <div className="grid gap-4">
        <Field label="Nama" error={errors.name}>
          <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="No. HP / WhatsApp" error={errors.phone}>
          <Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} inputMode="tel" />
        </Field>
        <p className="text-xs text-muted-foreground">Ketentuan sewa (harga, tanggal tagihan, deposit) diubah dari menu Penghuni.</p>
      </div>
    </Dialog>
  );
}

// ---------- Reset password ----------

const randomPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => chars[n % chars.length]).join("");
};

function ResetDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const { errors, saving, run } = useSave();
  const [password, setPassword] = useState("");
  async function save() {
    if (await run(() => api(`/admin/users/${user.id}/reset-password`, { method: "POST", body: JSON.stringify({ password }) }), "Password baru disimpan")) onClose();
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Reset password ${user.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button loading={saving} onClick={save}>
            Simpan password
          </Button>
        </>
      }
    >
      <Field label="Password baru" error={errors.password} hint="Berikan ke pemilik akun lewat chat pribadi, lalu minta ia menggantinya.">
        <div className="flex gap-2">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="font-mono" />
          <Button type="button" variant="secondary" onClick={() => setPassword(randomPassword())} className="shrink-0">
            Buat acak
          </Button>
        </div>
      </Field>
    </Dialog>
  );
}

// ---------- Halaman ----------

export default function PenggunaPage() {
  const { user: me } = useAuth();
  const { toast, confirm } = useFeedback();
  const [tab, setTab] = useState<Tab>("staff");
  const [query, setQuery] = useState("");
  const { data, mutate } = useSWR<{ data: AdminUser[] }>(`/admin/users?type=${tab}`);
  const { data: roles } = useSWR<{ data: StaffRole[] }>("/admin/roles");
  const { data: kos } = useSWR<{ data: AdminKosSummary[] }>("/admin/kos");
  const [editing, setEditing] = useState<{ user: AdminUser | null } | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

  const q = query.trim().toLowerCase();
  const rows = (data?.data ?? []).filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone?.includes(q.replace(/^0/, "62")),
  );

  async function toggleStatus(u: AdminUser) {
    if (u.isActive) {
      const ok = await confirm({
        title: `Nonaktifkan ${u.name}?`,
        text: "Akun tidak bisa login sampai diaktifkan lagi. Data dan riwayatnya tetap tersimpan.",
        confirmLabel: "Nonaktifkan",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      const res = await api<{ message: string }>(`/admin/users/${u.id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !u.isActive }) });
      await mutate();
      toast(res.message);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal", "error");
    }
  }

  async function remove(u: AdminUser) {
    if (!(await confirm({ title: `Hapus akun ${u.name}?`, text: "Akun dihapus permanen. Log aktivitasnya tetap tersimpan.", confirmLabel: "Hapus", danger: true }))) return;
    try {
      const res = await api<{ message: string }>(`/admin/users/${u.id}`, { method: "DELETE" });
      await mutate();
      toast(res.message);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghapus", "error");
    }
  }

  const actions = (u: AdminUser, className = "") => (
    <div className={`flex gap-1 ${className}`}>
      <button onClick={() => setEditing({ user: u })} className="rounded-full p-2 hover:bg-muted" aria-label={`Edit ${u.name}`} title="Edit">
        <Pencil className="size-4" />
      </button>
      <button onClick={() => setResetting(u)} className="rounded-full p-2 hover:bg-muted" aria-label={`Reset password ${u.name}`} title="Reset password">
        <KeyRound className="size-4" />
      </button>
      {u.id !== me.id && (
        <button
          onClick={() => toggleStatus(u)}
          className={`rounded-full p-2 ${u.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-100"}`}
          aria-label={u.isActive ? `Nonaktifkan ${u.name}` : `Aktifkan ${u.name}`}
          title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
        >
          <Power className="size-4" />
        </button>
      )}
      {u.id !== me.id && u.role !== "TENANT" && (
        <button onClick={() => remove(u)} className="rounded-full p-2 text-red-600 hover:bg-red-50" aria-label={`Hapus ${u.name}`} title="Hapus">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pengguna"
        description="Akun Owner, admin cabang, dan penghuni. Atur peran dan cabang yang boleh diakses setiap admin."
        actions={
          tab === "staff" && (
            <Button onClick={() => setEditing({ user: null })}>
              <Plus className="size-4" /> Tambah staf
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-border bg-card p-1">
          {(["staff", "tenant"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "staff" ? "Staf" : "Penghuni"}
            </button>
          ))}
        </div>
        <label className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, email, no. HP" className="pl-10" />
        </label>
        {tab === "staff" && (
          <Link href="/admin/peran" className="text-sm font-semibold text-foreground hover:underline">
            Atur peran & izin →
          </Link>
        )}
      </div>

      {!data ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title={data.data.length ? "Tidak ada yang cocok" : tab === "staff" ? "Belum ada staf" : "Belum ada akun penghuni"} />
      ) : (
        <>
          <MobileList className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {rows.map((u) => (
              <div key={u.id} className={`p-4 ${u.isActive ? "" : "opacity-60"}`}>
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-bold text-foreground">{u.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {u.name} {u.id === me.id && <span className="text-xs font-normal text-muted-foreground">(Anda)</span>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <RoleBadge u={u} />
                      {!u.isActive && <StatusBadge active={false} />}
                    </div>
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">
                      {u.role === "TENANT"
                        ? u.stay
                          ? `Kamar ${u.stay.roomNumber} · ${u.stay.kos.name}`
                          : "Tidak sedang menyewa"
                        : u.role === "OWNER"
                          ? "Semua cabang"
                          : u.kos.map((k) => k.name).join(", ") || "Belum ditugaskan"}
                    </p>
                  </div>
                </div>
                {actions(u, "mt-2 justify-end")}
              </div>
            ))}
          </MobileList>

          <DesktopTable>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>{tab === "staff" ? "Peran" : "No. HP"}</TableHead>
                <TableHead>{tab === "staff" ? "Cabang" : "Kamar"}</TableHead>
                <TableHead>Login terakhir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id} className={u.isActive ? undefined : "opacity-60"}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-foreground">{u.name[0]}</span>
                      <CellStack title={<>{u.name} {u.id === me.id && <span className="text-xs font-normal text-muted-foreground">(Anda)</span>}</>} sub={u.email} />
                    </div>
                  </TableCell>
                  <TableCell>{tab === "staff" ? <RoleBadge u={u} /> : u.phone ? localPhone(u.phone) : "–"}</TableCell>
                  <TableCell className="max-w-64 truncate">
                    {u.role === "TENANT" ? (
                      u.stay ? (
                        `Kamar ${u.stay.roomNumber} · ${u.stay.kos.name}`
                      ) : (
                        <span className="text-muted-foreground">Tidak sedang menyewa</span>
                      )
                    ) : u.role === "OWNER" ? (
                      "Semua cabang"
                    ) : (
                      u.kos.map((k) => k.name).join(", ") || <span className="text-muted-foreground">Belum ditugaskan</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lastSeen(u.lastLoginAt)}</TableCell>
                  <TableCell>
                    <StatusBadge active={u.isActive} />
                  </TableCell>
                  <TableCell>{actions(u, "justify-end")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DesktopTable>
        </>
      )}

      {editing && (editing.user?.role === "TENANT" ? (
        <TenantDialog user={editing.user} onClose={() => setEditing(null)} onSaved={mutate} />
      ) : (
        roles && (
          <StaffDialog user={editing.user} roles={roles.data} kosList={kos?.data ?? []} onClose={() => setEditing(null)} onSaved={mutate} />
        )
      ))}
      {resetting && <ResetDialog user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}

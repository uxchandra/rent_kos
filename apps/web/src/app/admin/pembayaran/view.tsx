"use client";

/* eslint-disable @next/next/no-img-element -- bukti transfer dari /uploads atau Blob */
import { useState } from "react";
import useSWR from "swr";
import { AlertTriangle, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, Dialog, EmptyState, Field, Input, Select, Spinner, Switch, Textarea, PageHeader, useFeedback, useSave } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { dateShort, invoiceTitle, price } from "@/lib/format";
import type { AdminBankAccount, AdminKosSummary, AdminPayment, PaymentStatus } from "@/lib/admin-types";
import { CellStack, DesktopTable, MobileList } from "@/components/admin/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tab = PaymentStatus | "BANK";

const tabs: { value: Tab; label: string }[] = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "BANK", label: "Rekening" },
];

const rejectReasons = ["Bukti transfer tidak terbaca", "Nominal tidak sesuai tagihan", "Dana belum masuk ke rekening"];

const submittedAt = (iso: string) => new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

// ---------- Verifikasi ----------

function PaymentDialog({ payment, onClose, onSaved }: { payment: AdminPayment; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { errors, saving, run } = useSave();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const pending = payment.status === "PENDING";
  const mismatch = payment.amount !== payment.invoice.amount;

  async function act(path: "approve" | "reject", body?: object) {
    const ok = await run(
      () => api(`/admin/payments/${payment.id}/${path}`, { method: "POST", body: body && JSON.stringify(body) }),
      path === "approve" ? "Pembayaran disetujui" : "Pembayaran ditolak",
    );
    if (ok) {
      await onSaved();
      onClose();
    }
  }

  const canVerify = useAuth().can("payments.verify");
  const footer = !pending || !canVerify ? undefined : rejecting ? (
    <>
      <Button variant="secondary" onClick={() => setRejecting(false)}>
        Kembali
      </Button>
      <Button variant="danger" loading={saving} onClick={() => act("reject", { note })}>
        Tolak pembayaran
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={() => setRejecting(true)}>
        Tolak
      </Button>
      <Button loading={saving} onClick={() => act("approve")}>
        Setujui, tandai lunas
      </Button>
    </>
  );

  return (
    <Dialog open onClose={onClose} title={`${invoiceTitle(payment.invoice)} · ${payment.tenant.name}`} footer={footer} size="lg">
      <div className="grid gap-5 sm:grid-cols-[1fr_1.1fr]">
        <a href={payment.proofUrl} target="_blank" rel="noopener" className="group relative block overflow-hidden rounded-xl border border-border bg-muted">
          <img src={payment.proofUrl} alt="Bukti transfer" className="max-h-[60dvh] w-full object-contain" />
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
            <ExternalLink className="size-3" /> Buka
          </span>
        </a>
        <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-muted-foreground">Ditransfer</dt>
              <dd className={`text-lg font-bold ${mismatch ? "text-amber-700" : ""}`}>{price(payment.amount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tagihan</dt>
              <dd className="text-lg font-bold">{price(payment.invoice.amount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tanggal transfer</dt>
              <dd className="font-semibold">{dateShort(payment.transferDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Nama pengirim</dt>
              <dd className="font-semibold">{payment.senderName}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Rekening tujuan</dt>
              <dd className="font-semibold">
                {payment.bankAccount ? `${payment.bankAccount.bankName} ${payment.bankAccount.accountNumber} a.n. ${payment.bankAccount.accountName}` : "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Penghuni</dt>
              <dd className="font-semibold">
                {payment.tenant.name} · Kamar {payment.roomNumber}, {payment.kos.name}
              </dd>
            </div>
          </dl>
          {mismatch && (
            <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Nominal transfer berbeda dari tagihan. Jika disetujui, tagihan tetap dianggap lunas.
            </p>
          )}
          {pending && !rejecting && <p className="text-muted-foreground">Cocokkan dengan mutasi rekening sebelum menyetujui.</p>}
          {!pending && (
            <p className="rounded-xl bg-muted px-3 py-2">
              {payment.status === "APPROVED" ? "Disetujui" : "Ditolak"} oleh {payment.verifiedBy?.name ?? "—"}
              {payment.verifiedAt && `, ${submittedAt(payment.verifiedAt)}`}
              {payment.note && <span className="mt-1 block text-muted-foreground">Alasan: {payment.note}</span>}
            </p>
          )}
          {rejecting && (
            <div>
              <Field label="Alasan penolakan" error={errors.note} hint="Ditampilkan ke penghuni.">
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
              </Field>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rejectReasons.map((r) => (
                  <button key={r} type="button" onClick={() => setNote(r)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-foreground">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function PaymentList({ status }: { status: PaymentStatus }) {
  const { data, mutate } = useSWR<{ data: AdminPayment[] }>(`/admin/payments?status=${status}`);
  const [selected, setSelected] = useState<AdminPayment | null>(null);

  if (!data) return <Spinner />;
  if (data.data.length === 0) {
    return <EmptyState title={status === "PENDING" ? "Tidak ada yang perlu dicek" : "Belum ada data"} text={status === "PENDING" ? "Bukti transfer dari penghuni akan muncul di sini." : undefined} />;
  }
  return (
    <>
      <MobileList className="grid gap-3">
        {data.data.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} className="flex gap-4 rounded-xl border border-border bg-card p-3 text-left transition hover:border-foreground">
            <img src={p.proofUrl} alt="" className="size-20 shrink-0 rounded-xl bg-muted object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.tenant.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {invoiceTitle(p.invoice)} · Kamar {p.roomNumber}, {p.kos.name}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-semibold">{price(p.amount)}</span>
                {p.amount !== p.invoice.amount && <span className="ml-1.5 text-xs font-semibold text-amber-700">≠ tagihan {price(p.invoice.amount)}</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{status === "REJECTED" && p.note ? `Ditolak: ${p.note}` : `Dikirim ${submittedAt(p.createdAt)}`}</p>
            </div>
          </button>
        ))}
      </MobileList>
      <DesktopTable>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Bukti</TableHead>
            <TableHead>Penghuni</TableHead>
            <TableHead>Tagihan</TableHead>
            <TableHead className="text-right">Ditransfer</TableHead>
            <TableHead>Tgl transfer</TableHead>
            <TableHead>{status === "REJECTED" ? "Alasan ditolak" : status === "APPROVED" ? "Diverifikasi" : "Dikirim"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((p) => (
            <TableRow key={p.id} onClick={() => setSelected(p)} className="cursor-pointer">
              <TableCell>
                <img src={p.proofUrl} alt="" className="size-12 rounded-lg bg-muted object-cover" />
              </TableCell>
              <TableCell>
                <CellStack title={p.tenant.name} sub={`Kamar ${p.roomNumber} · ${p.kos.name}`} />
              </TableCell>
              <TableCell>
                <CellStack title={invoiceTitle(p.invoice)} sub={price(p.invoice.amount)} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="font-medium">{price(p.amount)}</span>
                {p.amount !== p.invoice.amount && <span className="block text-xs font-semibold text-amber-700">tidak sama</span>}
              </TableCell>
              <TableCell>
                <CellStack title={dateShort(p.transferDate)} sub={p.bankAccount ? `ke ${p.bankAccount.bankName}` : `a.n. ${p.senderName}`} />
              </TableCell>
              <TableCell className="max-w-56 text-muted-foreground">
                {status === "REJECTED" ? (
                  <span className="block truncate" title={p.note ?? undefined}>
                    {p.note ?? "–"}
                  </span>
                ) : status === "APPROVED" && p.verifiedAt ? (
                  <CellStack title={submittedAt(p.verifiedAt)} sub={p.verifiedBy?.name} />
                ) : (
                  submittedAt(p.createdAt)
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DesktopTable>
      {selected && <PaymentDialog payment={selected} onClose={() => setSelected(null)} onSaved={mutate} />}
    </>
  );
}

// ---------- Rekening ----------

function BankDialog({ account, kosList, onClose, onSaved }: { account: AdminBankAccount | null; kosList: AdminKosSummary[]; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { errors, saving, run } = useSave();
  const [v, setV] = useState({
    bankName: account?.bankName ?? "",
    accountNumber: account?.accountNumber ?? "",
    accountName: account?.accountName ?? "",
    kosId: account?.kos?.id ?? null,
    isActive: account?.isActive ?? true,
  });

  async function save() {
    const ok = await run(
      () => api(account ? `/admin/bank-accounts/${account.id}` : "/admin/bank-accounts", { method: account ? "PUT" : "POST", body: JSON.stringify(v) }),
      account ? "Rekening diperbarui" : "Rekening ditambahkan",
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
      title={account ? "Edit rekening" : "Tambah rekening"}
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
        <Field label="Bank" error={errors.bankName}>
          <Input value={v.bankName} onChange={(e) => setV({ ...v, bankName: e.target.value })} placeholder="BCA" />
        </Field>
        <Field label="Nomor rekening" error={errors.accountNumber}>
          <Input value={v.accountNumber} onChange={(e) => setV({ ...v, accountNumber: e.target.value })} inputMode="numeric" />
        </Field>
        <Field label="Atas nama" error={errors.accountName} className="sm:col-span-2">
          <Input value={v.accountName} onChange={(e) => setV({ ...v, accountName: e.target.value })} />
        </Field>
        <Field label="Berlaku untuk" error={errors.kosId} className="sm:col-span-2" hint="Penghuni hanya melihat rekening untuk cabangnya dan rekening semua cabang.">
          <Select value={v.kosId ?? ""} onChange={(e) => setV({ ...v, kosId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Semua cabang</option>
            {kosList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {account && (
        <div className="mt-5 rounded-xl bg-muted p-4">
          <Switch checked={v.isActive} onChange={(c) => setV({ ...v, isActive: c })} label="Tampilkan ke penghuni" />
        </div>
      )}
    </Dialog>
  );
}

function BankAccounts() {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const isOwner = user.role === "OWNER";
  const { data, mutate } = useSWR<{ data: AdminBankAccount[] }>("/admin/bank-accounts");
  const { data: kosData } = useSWR<{ data: AdminKosSummary[] }>(isOwner ? "/admin/kos" : null);
  const [dialog, setDialog] = useState<{ account: AdminBankAccount | null } | null>(null);

  async function remove(a: AdminBankAccount) {
    const ok = await confirm({ title: "Hapus rekening?", text: `${a.bankName} ${a.accountNumber} tidak lagi ditampilkan ke penghuni.`, confirmLabel: "Hapus", danger: true });
    if (!ok) return;
    try {
      const res = await api<{ message: string }>(`/admin/bank-accounts/${a.id}`, { method: "DELETE" });
      await mutate();
      toast(res.message);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghapus", "error");
    }
  }

  if (!data) return <Spinner />;
  return (
    <>
      {isOwner && (
        <div className="mb-3 flex justify-end">
          <Button onClick={() => setDialog({ account: null })}>
            <Plus className="size-4" /> Tambah rekening
          </Button>
        </div>
      )}
      {data.data.length === 0 ? (
        <EmptyState title="Belum ada rekening" text="Penghuni butuh rekening tujuan untuk transfer." />
      ) : (
        <>
        <MobileList className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {data.data.map((a) => (
            <div key={a.id} className={`flex items-center gap-4 p-4 ${a.isActive ? "" : "opacity-60"}`}>
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-xs font-bold text-foreground">{a.bankName.slice(0, 4)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {a.accountNumber} {!a.isActive && <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Nonaktif</span>}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {a.bankName} · a.n. {a.accountName} · {a.kos?.name ?? "Semua cabang"}
                </p>
              </div>
              {isOwner && (
                <div className="flex shrink-0">
                  <button onClick={() => setDialog({ account: a })} className="rounded-full p-2.5 hover:bg-muted" aria-label="Edit rekening">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(a)} className="rounded-full p-2.5 text-red-600 hover:bg-red-50" aria-label="Hapus rekening">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </MobileList>
        <DesktopTable>
          <TableHeader>
            <TableRow>
              <TableHead>Bank</TableHead>
              <TableHead>Nomor rekening</TableHead>
              <TableHead>Atas nama</TableHead>
              <TableHead>Berlaku untuk</TableHead>
              <TableHead>Status</TableHead>
              {isOwner && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((a) => (
              <TableRow key={a.id} className={a.isActive ? undefined : "opacity-60"}>
                <TableCell className="font-semibold">{a.bankName}</TableCell>
                <TableCell className="font-mono tabular-nums">{a.accountNumber}</TableCell>
                <TableCell>{a.accountName}</TableCell>
                <TableCell>{a.kos?.name ?? "Semua cabang"}</TableCell>
                <TableCell>
                  <span className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold ${a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {a.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </TableCell>
                {isOwner && (
                  <TableCell>
                    <div className="flex justify-end">
                      <button onClick={() => setDialog({ account: a })} className="rounded-full p-2 hover:bg-muted" aria-label="Edit rekening">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => remove(a)} className="rounded-full p-2 text-red-600 hover:bg-red-50" aria-label="Hapus rekening">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </DesktopTable>
        </>
      )}
      {dialog && <BankDialog account={dialog.account} kosList={kosData?.data ?? []} onClose={() => setDialog(null)} onSaved={mutate} />}
    </>
  );
}

// ---------- Halaman ----------

export default function PembayaranPage() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const { data: pending } = useSWR<{ data: AdminPayment[] }>("/admin/payments?status=PENDING");
  const pendingCount = pending?.data.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Pembayaran" description="Periksa bukti transfer dari penghuni, lalu setujui atau tolak." />
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${tab === t.value ? "border-foreground bg-primary font-semibold text-primary-foreground" : "border-border bg-card"}`}
          >
            {t.label}
            {t.value === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>
      {tab === "BANK" ? <BankAccounts /> : <PaymentList key={tab} status={tab} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AlertTriangle, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button, Dialog, EmptyState, Field, Input, PageHeader, Spinner, useFeedback, useSave } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { dateShort, invoiceTitle, monthName, price, priceCompact, todayInput, waLink } from "@/lib/format";
import { invoiceStatusLabel, invoiceStatusStyle, type Invoice, type InvoiceList, type InvoiceStatus } from "@/lib/admin-types";

type StatusFilter = InvoiceStatus | "OVERDUE" | null;

const isOpen = (i: Invoice) => i.status === "UNPAID" || i.status === "WAITING_VERIFICATION";
const isOverdue = (i: Invoice, today: string) => i.status === "UNPAID" && i.dueDate < today;


function reminderText(i: Invoice) {
  return [
    `Halo ${i.tenant.name},`,
    `kami mengingatkan tagihan ${invoiceTitle(i).toLowerCase()} kamar ${i.roomNumber} (${i.kos.name}) sebesar ${price(i.amount)}, jatuh tempo ${dateShort(i.dueDate)}.`,
    "Mohon kirimkan bukti transfer setelah membayar. Terima kasih.",
  ].join("\n");
}

function shiftMonth(p: { year: number; month: number }, delta: number) {
  const n = p.year * 12 + (p.month - 1) + delta;
  return { year: Math.floor(n / 12), month: (n % 12) + 1 };
}

// ---------- Detail & aksi ----------

function InvoiceDialog({ invoice, today, onClose, onSaved }: { invoice: Invoice; today: string; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { confirm } = useFeedback();
  const { errors, saving, run } = useSave();
  const [mode, setMode] = useState<"view" | "pay" | "edit">("view");
  const [paidAt, setPaidAt] = useState(todayInput());
  const [edit, setEdit] = useState({ amount: String(invoice.amount), dueDate: invoice.dueDate.slice(0, 10) });

  async function act(path: string, body: object | undefined, success: string) {
    const ok = await run(() => api(`/admin/invoices/${invoice.id}${path}`, { method: path ? "POST" : "PUT", body: body && JSON.stringify(body) }), success);
    if (ok) {
      await onSaved();
      onClose();
    }
  }

  async function cancel() {
    const ok = await confirm({
      title: "Batalkan tagihan?",
      text: `${invoiceTitle(invoice)} untuk ${invoice.tenant.name} tidak akan ditagihkan lagi.`,
      confirmLabel: "Batalkan tagihan",
      danger: true,
    });
    if (ok) await act("/cancel", undefined, "Tagihan dibatalkan");
  }

  async function unpay() {
    const ok = await confirm({ title: "Batalkan pelunasan?", text: "Tagihan akan kembali berstatus belum bayar.", confirmLabel: "Ya, batalkan" });
    if (ok) await act("/unpay", undefined, "Pelunasan dibatalkan");
  }

  function remind() {
    window.open(waLink(invoice.tenant.phone!, reminderText(invoice)), "_blank", "noopener");
    api(`/admin/invoices/${invoice.id}/reminded`, { method: "POST" }).then(onSaved, () => {});
  }

  const footer =
    mode === "pay" ? (
      <>
        <Button variant="secondary" onClick={() => setMode("view")}>
          Kembali
        </Button>
        <Button loading={saving} onClick={() => act("/pay", { paidAt }, "Tagihan ditandai lunas")}>
          Tandai lunas
        </Button>
      </>
    ) : mode === "edit" ? (
      <>
        <Button variant="secondary" onClick={() => setMode("view")}>
          Kembali
        </Button>
        <Button loading={saving} onClick={() => act("", edit, "Tagihan diperbarui")}>
          Simpan
        </Button>
      </>
    ) : undefined;

  return (
    <Dialog open onClose={onClose} title={invoiceTitle(invoice)} footer={footer}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{invoice.tenant.name}</p>
          <p className="text-sm text-muted">
            Kamar {invoice.roomNumber} · {invoice.kos.name}
          </p>
          <p className="mt-1 font-mono text-xs text-muted">{invoice.number}</p>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${invoiceStatusStyle[invoice.status]}`}>{invoiceStatusLabel[invoice.status]}</span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-subtle p-4 text-sm">
        <div>
          <dt className="text-muted">Nominal</dt>
          <dd className="text-lg font-bold">{price(invoice.amount)}</dd>
        </div>
        <div>
          <dt className="text-muted">Jatuh tempo</dt>
          <dd className={`font-semibold ${isOverdue(invoice, today) ? "text-red-600" : ""}`}>{dateShort(invoice.dueDate)}</dd>
        </div>
        {invoice.paidAt && (
          <div>
            <dt className="text-muted">Dibayar</dt>
            <dd className="font-semibold">{dateShort(invoice.paidAt)}</dd>
          </div>
        )}
        {invoice.reminderSentAt && (
          <div>
            <dt className="text-muted">Pengingat terakhir</dt>
            <dd className="font-semibold">{new Date(invoice.reminderSentAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</dd>
          </div>
        )}
      </dl>
      {invoice.tenancyEnded && <p className="mt-3 text-xs text-muted">Penghuni ini sudah tidak menyewa.</p>}
      {invoice.status === "WAITING_VERIFICATION" && (
        <Link href="/admin/pembayaran" className="mt-3 flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Penghuni sudah mengirim bukti transfer. Periksa sekarang <ChevronRight className="size-4" />
        </Link>
      )}

      {mode === "pay" && (
        <Field label="Tanggal dibayar" error={errors.paidAt} className="mt-5">
          <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </Field>
      )}

      {mode === "edit" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nominal" error={errors.amount}>
            <Input type="number" inputMode="numeric" value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value })} />
          </Field>
          <Field label="Jatuh tempo" error={errors.dueDate}>
            <Input type="date" value={edit.dueDate} onChange={(e) => setEdit({ ...edit, dueDate: e.target.value })} />
          </Field>
        </div>
      )}

      {mode === "view" && (
        <div className="mt-5 grid gap-2">
          {isOpen(invoice) && invoice.tenant.phone && (
            <Button variant="secondary" onClick={remind} className="rounded-xl! py-3">
              <MessageCircle className="size-4" /> Kirim pengingat WhatsApp
            </Button>
          )}
          {invoice.status === "UNPAID" && (
            <Button onClick={() => setMode("pay")} className="rounded-xl! py-3">
              Tandai lunas
            </Button>
          )}
          {invoice.status === "UNPAID" && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setMode("edit")} className="rounded-xl!">
                Ubah nominal
              </Button>
              <Button variant="ghost" loading={saving} onClick={cancel} className="rounded-xl! text-red-600!">
                Batalkan
              </Button>
            </div>
          )}
          {invoice.status === "PAID" && (
            <Button variant="ghost" loading={saving} onClick={unpay} className="rounded-xl!">
              Batalkan pelunasan
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
}

// ---------- Halaman ----------

export default function TagihanPage() {
  const { toast } = useFeedback();
  const [view, setView] = useState<"period" | "outstanding">("period");
  const [period, setPeriod] = useState<{ year: number; month: number } | null>(null);
  const key = view === "outstanding" ? "/admin/invoices?outstanding=1" : `/admin/invoices${period ? `?year=${period.year}&month=${period.month}` : ""}`;
  const { data, mutate } = useSWR<InvoiceList>(key);
  const [status, setStatus] = useState<StatusFilter>(null);
  const [kosFilter, setKosFilter] = useState<number | null>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [generating, setGenerating] = useState(false);

  const meta = data?.meta;
  const today = meta?.today.slice(0, 10) ?? todayInput();
  const current = period ?? (meta ? { year: meta.year, month: meta.month } : null);
  const rows = data?.data ?? [];
  const kosList = [...new Map(rows.map((i) => [i.kos.id, i.kos])).values()];
  const byKos = rows.filter((i) => !kosFilter || i.kos.id === kosFilter);
  const filtered = byKos.filter((i) => !status || (status === "OVERDUE" ? isOverdue(i, today) : i.status === status));

  const active = byKos.filter((i) => i.status !== "CANCELLED");
  const sum = (list: Invoice[]) => list.reduce((s, i) => s + i.amount, 0);
  const paid = active.filter((i) => i.status === "PAID");
  const open = active.filter(isOpen);
  const overdue = byKos.filter((i) => isOverdue(i, today));

  async function generate() {
    if (!current) return;
    setGenerating(true);
    try {
      const res = await api<{ message: string }>("/admin/invoices/generate", { method: "POST", body: JSON.stringify(current) });
      await mutate();
      toast(res.message);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menerbitkan tagihan", "error");
    } finally {
      setGenerating(false);
    }
  }

  const filters: { value: StatusFilter; label: string; count: number }[] = [
    { value: null, label: "Semua", count: byKos.length },
    { value: "OVERDUE", label: "Telat", count: overdue.length },
    { value: "UNPAID", label: "Belum bayar", count: byKos.filter((i) => i.status === "UNPAID").length },
    { value: "WAITING_VERIFICATION", label: "Menunggu verifikasi", count: byKos.filter((i) => i.status === "WAITING_VERIFICATION").length },
    { value: "PAID", label: "Lunas", count: paid.length },
    { value: "CANCELLED", label: "Dibatalkan", count: byKos.filter((i) => i.status === "CANCELLED").length },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Tagihan" description="Tagihan sewa bulanan dan deposit penghuni." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-line bg-white p-1">
          {(["period", "outstanding"] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setStatus(null);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${view === v ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
            >
              {v === "period" ? "Per bulan" : "Semua belum lunas"}
            </button>
          ))}
        </div>
        {view === "period" && current && (
          <div className="flex items-center gap-1 rounded-full border border-line bg-white p-1">
            <button onClick={() => setPeriod(shiftMonth(current, -1))} className="rounded-full p-1.5 hover:bg-subtle" aria-label="Bulan sebelumnya">
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-36 text-center text-sm font-semibold">{monthName(current.year, current.month)}</span>
            <button onClick={() => setPeriod(shiftMonth(current, 1))} className="rounded-full p-1.5 hover:bg-subtle" aria-label="Bulan berikutnya">
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {!data ? (
        <Spinner />
      ) : (
        <>
          {view === "period" && meta!.unbilled > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-lavender px-4 py-3">
              <p className="text-sm text-brand-800">
                <span className="font-semibold">{meta!.unbilled} penghuni</span> belum ditagih untuk {monthName(meta!.year, meta!.month)}.
              </p>
              <Button loading={generating} onClick={generate} className="py-2!">
                Terbitkan tagihan
              </Button>
            </div>
          )}

          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-line bg-white px-3 py-2.5">
              <span className="block text-lg font-bold sm:text-xl">{priceCompact(sum(active))}</span>
              <span className="text-xs text-muted">{active.length} tagihan</span>
            </div>
            <div className="rounded-xl border border-mint-ink/20 bg-mint px-3 py-2.5 text-mint-ink">
              <span className="block text-lg font-bold sm:text-xl">{priceCompact(sum(paid))}</span>
              <span className="text-xs font-semibold">Lunas</span>
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-700">
              <span className="block text-lg font-bold sm:text-xl">{priceCompact(sum(open))}</span>
              <span className="text-xs font-semibold">Belum lunas{overdue.length > 0 && ` · ${overdue.length} telat`}</span>
            </div>
          </div>

          {kosList.length > 1 && (
            <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {[null, ...kosList.map((k) => k.id)].map((id) => (
                <button
                  key={id ?? "all"}
                  onClick={() => setKosFilter(id)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                    kosFilter === id ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white"
                  }`}
                >
                  {id === null ? "Semua cabang" : kosList.find((k) => k.id === id)!.name}
                </button>
              ))}
            </div>
          )}

          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {filters
              .filter((f) => f.value === null || f.count > 0 || f.value === status)
              .map((f) => (
                <button
                  key={f.value ?? "all"}
                  onClick={() => setStatus(f.value)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
                    status === f.value ? "border-brand-600 bg-brand-600 font-semibold text-white" : "border-line bg-white"
                  }`}
                >
                  {f.label} <span className="opacity-70">{f.count}</span>
                </button>
              ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={rows.length ? "Tidak ada tagihan dengan filter ini" : view === "outstanding" ? "Semua tagihan sudah lunas" : "Belum ada tagihan bulan ini"}
              text={!rows.length && view === "period" && meta!.unbilled === 0 ? "Daftarkan penghuni di menu Penghuni agar tagihan bisa diterbitkan." : undefined}
            />
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {filtered.map((i) => (
                <button key={i.id} onClick={() => setSelected(i)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-subtle/60">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lavender text-sm font-bold text-brand-700">{i.roomNumber}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{i.tenant.name}</p>
                    <p className="truncate text-sm text-muted">
                      {invoiceTitle(i)} · {i.kos.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{price(i.amount)}</p>
                    {isOverdue(i, today) ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                        <AlertTriangle className="size-3" /> Telat · {dateShort(i.dueDate)}
                      </span>
                    ) : (
                      <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${invoiceStatusStyle[i.status]}`}>
                        {i.status === "UNPAID" ? `Tempo ${dateShort(i.dueDate)}` : invoiceStatusLabel[i.status]}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selected && <InvoiceDialog invoice={selected} today={today} onClose={() => setSelected(null)} onSaved={mutate} />}
    </div>
  );
}

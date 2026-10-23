"use client";

/* eslint-disable @next/next/no-img-element -- pratinjau foto lokal (blob:) */
import { useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Camera, Check, Copy, MessageCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/auth-provider";
import { Button, Dialog, Field, Input, Select, Spinner, useFeedback, useSave } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { compressImage } from "@/lib/image-compress";
import { dateShort, invoiceTitle, price, todayInput, waLink } from "@/lib/format";
import { invoiceStatusLabel, invoiceStatusStyle, type TenantOverview } from "@/lib/admin-types";

type TenantInvoice = TenantOverview["invoices"][number];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text.replace(/\D/g, "")).then(() => setCopied(true))}
      className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold hover:border-ink"
    >
      {copied ? <Check className="size-3.5 text-mint-ink" /> : <Copy className="size-3.5" />} {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

function PayDialog({ invoice, overview, onClose, onSaved }: { invoice: TenantInvoice; overview: TenantOverview; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { user } = useAuth();
  const { errors, saving, run } = useSave();
  const banks = overview.bankAccounts;
  const [v, setV] = useState({
    senderName: user.name,
    transferDate: todayInput(),
    bankAccountId: banks[0] ? String(banks[0].id) : "",
    amount: String(invoice.amount),
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function pick(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f && URL.createObjectURL(f));
  }

  async function submit() {
    const ok = await run(async () => {
      if (!file) throw new Error("Lampirkan foto bukti transfer");
      const form = new FormData();
      form.append("proof", await compressImage(file));
      Object.entries(v).forEach(([k, val]) => form.append(k, val));
      await api(`/tenant/invoices/${invoice.id}/payments`, { method: "POST", body: form });
    }, "Bukti transfer terkirim");
    if (ok) {
      await onSaved();
      onClose();
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Bayar ${invoiceTitle(invoice).toLowerCase()}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button loading={saving} onClick={submit}>
            Kirim bukti
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">Transfer sebesar</p>
      <p className="text-2xl font-bold text-brand-700">{price(invoice.amount)}</p>

      <p className="mb-2 mt-5 text-sm font-semibold">1. Transfer ke salah satu rekening</p>
      {banks.length === 0 ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Rekening belum tersedia. Hubungi pengelola.</p>
      ) : (
        <div className="divide-y divide-line rounded-xl border border-line">
          {banks.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">{b.bankName}</p>
                <p className="font-mono font-semibold tracking-wide">{b.accountNumber}</p>
                <p className="truncate text-xs text-muted">a.n. {b.accountName}</p>
              </div>
              <CopyButton text={b.accountNumber} />
            </div>
          ))}
        </div>
      )}

      <p className="mb-3 mt-6 text-sm font-semibold">2. Kirim bukti transfer</p>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-line bg-subtle p-4 text-sm text-muted hover:border-brand-600">
        {preview ? (
          <img src={preview} alt="Pratinjau bukti transfer" className="max-h-56 rounded-lg object-contain" />
        ) : (
          <>
            <Camera className="size-6" /> Foto atau pilih screenshot bukti transfer
          </>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>
      {preview && <p className="mt-1 text-center text-xs text-muted">Ketuk gambar untuk mengganti</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nama pengirim (sesuai rekening)" error={errors.senderName}>
          <Input value={v.senderName} onChange={(e) => setV({ ...v, senderName: e.target.value })} />
        </Field>
        <Field label="Tanggal transfer" error={errors.transferDate}>
          <Input type="date" value={v.transferDate} max={todayInput()} onChange={(e) => setV({ ...v, transferDate: e.target.value })} />
        </Field>
        <Field label="Rekening tujuan" error={errors.bankAccountId}>
          <Select value={v.bankAccountId} onChange={(e) => setV({ ...v, bankAccountId: e.target.value })}>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName} {b.accountNumber}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nominal ditransfer" error={errors.amount}>
          <Input type="number" inputMode="numeric" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  );
}

function InvoiceCard({ invoice, today, onPay }: { invoice: TenantInvoice; today: string; onPay?: () => void }) {
  const overdue = invoice.status === "UNPAID" && invoice.dueDate < today;
  const rejected = invoice.status === "UNPAID" && invoice.lastPayment?.status === "REJECTED";
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{invoiceTitle(invoice)}</p>
          <p className={`text-sm ${overdue ? "font-semibold text-red-600" : "text-muted"}`}>
            {invoice.status === "PAID" ? `Dibayar ${dateShort(invoice.paidAt!)}` : `${overdue ? "Lewat jatuh tempo" : "Jatuh tempo"} ${dateShort(invoice.dueDate)}`}
          </p>
        </div>
        <p className="text-lg font-bold">{price(invoice.amount)}</p>
      </div>
      {rejected && (
        <p className="mt-3 flex gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Bukti sebelumnya ditolak{invoice.lastPayment?.note ? `: ${invoice.lastPayment.note}` : ""}. Silakan kirim ulang.
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${invoiceStatusStyle[invoice.status]}`}>
          {invoice.status === "WAITING_VERIFICATION" ? "Sedang dicek pengelola" : invoiceStatusLabel[invoice.status]}
        </span>
        {onPay && invoice.status === "UNPAID" && (
          <Button onClick={onPay} className="py-2!">
            Bayar
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PenghuniPage() {
  const { user, logout } = useAuth();
  const { data, mutate } = useSWR<{ data: TenantOverview }>("/tenant/overview");
  const [paying, setPaying] = useState<TenantInvoice | null>(null);
  const { toast } = useFeedback();

  const o = data?.data;
  const today = o?.today.slice(0, 10) ?? todayInput();
  const due = o?.invoices.filter((i) => i.status === "UNPAID" || i.status === "WAITING_VERIFICATION").reverse() ?? [];
  const paid = o?.invoices.filter((i) => i.status === "PAID") ?? [];
  const t = o?.tenancy;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <Logo href="/penghuni" />
        <button onClick={logout} className="text-sm font-semibold text-red-600">
          Keluar
        </button>
      </header>
      <h1 className="mt-8 text-2xl font-bold">Halo, {user.name.split(" ")[0]}</h1>

      {!o ? (
        <Spinner />
      ) : (
        <>
          {t ? (
            <section className="mt-5 rounded-3xl bg-ink p-5 text-white">
              <p className="text-sm text-white/70">{t.kos.name}</p>
              <p className="mt-1 text-2xl font-bold">Kamar {t.room.number}</p>
              <p className="text-sm text-white/70">{t.room.typeName}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/60">Sewa / bulan</p>
                  <p className="font-semibold">{price(t.monthlyPrice)}</p>
                </div>
                <div>
                  <p className="text-white/60">Tagihan tiap</p>
                  <p className="font-semibold">Tanggal {t.billingDay}</p>
                </div>
              </div>
              {t.kos.whatsapp && (
                <a
                  href={waLink(t.kos.whatsapp, `Halo, saya ${user.name} penghuni kamar ${t.room.number}.`)}
                  target="_blank"
                  rel="noopener"
                  className="mt-5 flex items-center justify-center gap-2 rounded-full bg-white/10 py-2.5 text-sm font-semibold hover:bg-white/20"
                >
                  <MessageCircle className="size-4" /> Hubungi pengelola
                </a>
              )}
            </section>
          ) : (
            <p className="mt-5 rounded-2xl bg-subtle p-4 text-sm text-muted">Anda tidak sedang menyewa kamar. Riwayat tagihan tetap bisa dilihat di bawah.</p>
          )}

          <h2 className="mb-3 mt-8 font-bold">Perlu dibayar</h2>
          {due.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">Tidak ada tagihan. Terima kasih sudah membayar tepat waktu!</p>
          ) : (
            <div className="space-y-3">
              {due.map((i) => (
                <InvoiceCard
                  key={i.id}
                  invoice={i}
                  today={today}
                  onPay={() => (o.bankAccounts.length ? setPaying(i) : toast("Rekening tujuan belum tersedia, hubungi pengelola", "error"))}
                />
              ))}
            </div>
          )}

          {paid.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 font-bold">Riwayat pembayaran</h2>
              <div className="space-y-3">
                {paid.map((i) => (
                  <InvoiceCard key={i.id} invoice={i} today={today} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {paying && o && <PayDialog invoice={paying} overview={o} onClose={() => setPaying(null)} onSaved={mutate} />}
    </div>
  );
}

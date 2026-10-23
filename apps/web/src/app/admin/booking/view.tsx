"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { CalendarDays, Mail, MessageCircle, UserPlus } from "lucide-react";
import { Button, Dialog, EmptyState, Field, PageHeader, Spinner, Textarea, useFeedback, useSave } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { dateShort, price, waLink } from "@/lib/format";
import type { AdminBooking } from "@/lib/admin-types";

type Tab = "PENDING" | "APPROVED" | "CLOSED";

const tabs: { value: Tab; label: string }[] = [
  { value: "PENDING", label: "Baru" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "CLOSED", label: "Ditolak / batal" },
];

const rejectReasons = ["Kamar sudah penuh", "Tidak sesuai ketentuan kos", "Tidak bisa dihubungi"];

const sentAt = (iso: string) => new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

function waText(b: AdminBooking) {
  if (b.status === "APPROVED") {
    return `Halo ${b.name}, pengajuan sewa ${b.roomType.name} di ${b.kos.name} (kode ${b.code}) sudah kami setujui. Rencana masuk ${dateShort(b.moveInDate)}. Kami akan menghubungi untuk proses selanjutnya.`;
  }
  return `Halo ${b.name}, terima kasih sudah mengajukan sewa ${b.roomType.name} di ${b.kos.name} (kode ${b.code}).`;
}

/** Dialog alasan: tolak booking baru atau batalkan booking yang sudah disetujui. */
function ReasonDialog({ booking, mode, onClose, onSaved }: { booking: AdminBooking; mode: "reject" | "cancel"; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { errors, saving, run } = useSave();
  const [reason, setReason] = useState("");
  const reject = mode === "reject";

  async function save() {
    const ok = await run(
      () => api(`/admin/bookings/${booking.id}/${mode}`, { method: "POST", body: JSON.stringify({ reason }) }),
      reject ? "Booking ditolak" : "Booking dibatalkan",
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
      title={reject ? `Tolak pengajuan ${booking.name}` : `Batalkan booking ${booking.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Kembali
          </Button>
          <Button variant="danger" loading={saving} onClick={save}>
            {reject ? "Tolak" : "Batalkan booking"}
          </Button>
        </>
      }
    >
      <Field label={reject ? "Alasan penolakan" : "Alasan (opsional)"} error={errors.reason} hint="Hanya untuk catatan internal.">
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Field>
      {reject && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rejectReasons.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)} className="rounded-full border border-line px-3 py-1 text-xs hover:border-ink">
              {r}
            </button>
          ))}
        </div>
      )}
    </Dialog>
  );
}

function BookingCard({ b, onAction, approving }: { b: AdminBooking; onAction: (action: "approve" | "reject" | "cancel") => void; approving: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{b.name}</p>
          <p className="text-sm text-muted">
            {b.kos.name} · {b.roomType.name} · {price(b.roomType.monthlyPrice)}
          </p>
        </div>
        <span className="rounded-md bg-subtle px-2 py-0.5 font-mono text-xs font-semibold">{b.code}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-muted" /> Masuk {dateShort(b.moveInDate)}
        </span>
        {b.occupation && <span className="text-muted">{b.occupation}</span>}
        {b.status === "PENDING" && (
          <span className={b.roomType.availableRooms ? "text-mint-ink" : "font-semibold text-amber-700"}>
            {b.roomType.availableRooms ? `${b.roomType.availableRooms} kamar kosong di tipe ini` : "Tipe ini sedang penuh"}
          </span>
        )}
      </div>
      {b.message && <p className="mt-3 rounded-xl bg-subtle px-3 py-2 text-sm">&ldquo;{b.message}&rdquo;</p>}
      {b.status !== "PENDING" && (
        <p className="mt-3 text-xs text-muted">
          {b.status === "APPROVED" ? "Disetujui" : b.status === "REJECTED" ? "Ditolak" : "Dibatalkan"}
          {b.handledBy && ` oleh ${b.handledBy.name}`}
          {b.handledAt && `, ${sentAt(b.handledAt)}`}
          {b.rejectReason && ` · ${b.rejectReason}`}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <a href={waLink(b.phone, waText(b))} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold hover:border-ink">
          <MessageCircle className="size-4" /> WhatsApp
        </a>
        <a href={`mailto:${b.email}`} className="rounded-full p-2.5 text-muted hover:bg-subtle hover:text-ink" aria-label={`Email ${b.name}`} title={b.email}>
          <Mail className="size-4" />
        </a>
        <span className="ml-auto text-xs text-muted">Masuk {sentAt(b.createdAt)}</span>
        {b.status === "PENDING" && (
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="secondary" onClick={() => onAction("reject")} className="flex-1 py-2! sm:flex-none">
              Tolak
            </Button>
            <Button loading={approving} onClick={() => onAction("approve")} className="flex-1 py-2! sm:flex-none">
              Setujui
            </Button>
          </div>
        )}
        {b.status === "APPROVED" && !b.tenancyId && (
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="ghost" onClick={() => onAction("cancel")} className="flex-1 py-2! sm:flex-none">
              Batalkan
            </Button>
            <Link
              href={`/admin/penghuni?booking=${b.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 sm:flex-none"
            >
              <UserPlus className="size-4" /> Daftarkan penghuni
            </Link>
          </div>
        )}
        {b.tenancyId && <span className="rounded-md bg-mint px-2 py-1 text-xs font-semibold text-mint-ink">Sudah jadi penghuni</span>}
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { toast } = useFeedback();
  const [tab, setTab] = useState<Tab>("PENDING");
  const { data, mutate } = useSWR<{ data: AdminBooking[] }>(`/admin/bookings?status=${tab}`);
  const { data: pending, mutate: mutatePending } = useSWR<{ data: AdminBooking[] }>("/admin/bookings?status=PENDING");
  const [dialog, setDialog] = useState<{ booking: AdminBooking; mode: "reject" | "cancel" } | null>(null);
  const [approving, setApproving] = useState<number | null>(null);

  const refresh = () => Promise.all([mutate(), mutatePending()]);

  async function handle(b: AdminBooking, action: "approve" | "reject" | "cancel") {
    if (action !== "approve") {
      setDialog({ booking: b, mode: action });
      return;
    }
    setApproving(b.id);
    try {
      await api(`/admin/bookings/${b.id}/approve`, { method: "POST" });
      await refresh();
      toast(`Booking ${b.name} disetujui. Kabari lewat WhatsApp di tab Disetujui.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyetujui", "error");
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Booking" description="Pengajuan sewa dari website. Hubungi calon penghuni, setujui, lalu daftarkan saat mereka masuk." />
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${tab === t.value ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white"}`}
          >
            {t.label}
            {t.value === "PENDING" && !!pending?.data.length && (
              <span className="ml-1.5 rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">{pending.data.length}</span>
            )}
          </button>
        ))}
      </div>

      {!data ? (
        <Spinner />
      ) : data.data.length === 0 ? (
        <EmptyState
          title={tab === "PENDING" ? "Belum ada pengajuan baru" : "Belum ada data"}
          text={tab === "PENDING" ? "Pengajuan dari halaman cabang di website akan muncul di sini." : undefined}
        />
      ) : (
        <div className="space-y-3">
          {data.data.map((b) => (
            <BookingCard key={b.id} b={b} approving={approving === b.id} onAction={(a) => handle(b, a)} />
          ))}
        </div>
      )}

      {dialog && <ReasonDialog booking={dialog.booking} mode={dialog.mode} onClose={() => setDialog(null)} onSaved={refresh} />}
    </div>
  );
}

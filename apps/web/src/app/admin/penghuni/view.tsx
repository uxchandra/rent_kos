"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { LogOut, MessageCircle, Pencil, Plus, Search } from "lucide-react";
import { Button, Dialog, EmptyState, Field, Input, PageHeader, Select, Spinner, Switch, Textarea, useSave } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { dateShort, localPhone, price, todayInput, waLink } from "@/lib/format";
import { depositStatusLabel, type AdminBooking, type DepositStatus, type RoomBoard, type Tenancy } from "@/lib/admin-types";

const depositBadge: Record<DepositStatus, string> = {
  NONE: "bg-subtle text-muted",
  UNPAID: "bg-amber-50 text-amber-700",
  HELD: "bg-mint text-mint-ink",
  REFUNDED: "bg-subtle text-muted",
  PARTIAL_REFUNDED: "bg-subtle text-muted",
  FORFEITED: "bg-red-50 text-red-700",
};

const billingDayOf = (date: string) => Math.min(Number(date.slice(8, 10)) || 1, 28);

// ---------- Check-in ----------

function CheckInDialog({
  onClose,
  initialRoomId,
  booking,
  onSaved,
}: {
  onClose: () => void;
  initialRoomId: number | null;
  booking: AdminBooking | null;
  onSaved: () => Promise<unknown>;
}) {
  const { data } = useSWR<{ data: RoomBoard }>("/admin/rooms");
  const { errors, saving, run } = useSave();

  // Kamar yang bisa diisi: belum ada penghuni tercatat dan tidak sedang perbaikan.
  const options = (data?.data ?? []).flatMap((k) =>
    k.roomTypes.flatMap((t) =>
      t.rooms
        .filter((r) => !r.tenantName && r.status !== "MAINTENANCE")
        .map((r) => ({ ...r, kos: k, type: t })),
    ),
  );

  const [v, setV] = useState(() => ({
    roomId: initialRoomId ? String(initialRoomId) : "",
    name: booking?.name ?? "",
    phone: localPhone(booking?.phone ?? null),
    email: booking?.email ?? "",
    password: "",
    startDate: booking?.moveInDate.slice(0, 10) ?? todayInput(),
    billingDay: String(billingDayOf(booking?.moveInDate.slice(0, 10) ?? todayInput())),
    monthlyPrice: "",
    depositAmount: "",
    depositPaid: false,
  }));
  // Dari booking: pilih otomatis kamar kosong pertama di tipe yang diajukan.
  const roomId = v.roomId || String(options.find((o) => o.type.id === booking?.roomType.id && o.status === "AVAILABLE")?.id ?? "");
  const room = options.find((o) => String(o.id) === roomId);
  // Harga & deposit mengikuti kamar terpilih sampai diubah manual.
  const monthlyPrice = v.monthlyPrice || (room ? String(room.type.monthlyPrice) : "");
  const depositAmount = v.depositAmount || (room ? String(room.kos.defaultDeposit) : "");

  async function save() {
    const ok = await run(
      () =>
        api("/admin/tenancies", {
          method: "POST",
          body: JSON.stringify({ ...v, roomId: Number(roomId) || 0, monthlyPrice, depositAmount: depositAmount || 0, bookingId: booking?.id }),
        }),
      "Penghuni didaftarkan",
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
      title="Daftarkan penghuni"
      size="lg"
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
      {!data ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {booking && (
            <p className="rounded-xl bg-lavender px-3 py-2 text-sm text-brand-800">
              Dari booking <span className="font-mono font-semibold">{booking.code}</span> · {booking.kos.name}, {booking.roomType.name}
            </p>
          )}
          <Field label="Kamar" error={errors.roomId} hint={options.length ? undefined : "Tidak ada kamar kosong."}>
            <Select value={roomId} onChange={(e) => setV({ ...v, roomId: e.target.value, monthlyPrice: "", depositAmount: "" })}>
              <option value="">Pilih kamar…</option>
              {data.data.map((k) => (
                <optgroup key={k.id} label={k.name}>
                  {options
                    .filter((o) => o.kos.id === k.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.number} · {o.type.name}
                        {o.status === "OCCUPIED" ? " (terisi, belum tercatat)" : ""}
                      </option>
                    ))}
                </optgroup>
              ))}
            </Select>
          </Field>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">Data penghuni</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap" error={errors.name}>
                <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
              </Field>
              <Field label="No. HP / WhatsApp" error={errors.phone}>
                <Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} inputMode="tel" placeholder="081234567890" />
              </Field>
              <Field label="Email (untuk login)" error={errors.email}>
                <Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
              </Field>
              <Field label="Password" error={errors.password} hint="Min. 8 karakter. Boleh kosong jika penghuni lama.">
                <Input value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="new-password" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">Ketentuan sewa</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal masuk" error={errors.startDate}>
                <Input
                  type="date"
                  value={v.startDate}
                  onChange={(e) => setV({ ...v, startDate: e.target.value, billingDay: String(billingDayOf(e.target.value)) })}
                />
              </Field>
              <Field label="Tanggal tagihan tiap bulan" error={errors.billingDay} hint="1–28">
                <Input type="number" min={1} max={28} value={v.billingDay} onChange={(e) => setV({ ...v, billingDay: e.target.value })} />
              </Field>
              <Field label="Harga sewa / bulan" error={errors.monthlyPrice}>
                <Input type="number" inputMode="numeric" value={monthlyPrice} onChange={(e) => setV({ ...v, monthlyPrice: e.target.value })} />
              </Field>
              <Field label="Deposit" error={errors.depositAmount} hint="Isi 0 jika tanpa deposit.">
                <Input type="number" inputMode="numeric" value={depositAmount} onChange={(e) => setV({ ...v, depositAmount: e.target.value || "0" })} />
              </Field>
            </div>
            {Number(depositAmount) > 0 && (
              <div className="mt-4 rounded-xl bg-subtle p-4">
                <Switch checked={v.depositPaid} onChange={(c) => setV({ ...v, depositPaid: c })} label="Deposit sudah dibayar" />
              </div>
            )}
          </fieldset>
        </div>
      )}
    </Dialog>
  );
}

// ---------- Edit ----------

function EditDialog({ tenancy, onClose, onSaved }: { tenancy: Tenancy; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { errors, saving, run } = useSave();
  const [v, setV] = useState({
    name: tenancy.tenant.name,
    phone: localPhone(tenancy.tenant.phone),
    password: "",
    monthlyPrice: String(tenancy.monthlyPrice),
    billingDay: String(tenancy.billingDay),
    depositAmount: String(tenancy.depositAmount),
    depositStatus: tenancy.depositStatus,
  });

  async function save() {
    const ok = await run(() => api(`/admin/tenancies/${tenancy.id}`, { method: "PUT", body: JSON.stringify(v) }), "Data penghuni diperbarui");
    if (ok) {
      await onSaved();
      onClose();
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit ${tenancy.tenant.name}`}
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
        <Field label="Nama lengkap" error={errors.name}>
          <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="No. HP / WhatsApp" error={errors.phone}>
          <Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} inputMode="tel" />
        </Field>
        <Field label="Email" hint="Email tidak bisa diubah.">
          <Input value={tenancy.tenant.email} disabled />
        </Field>
        <Field label="Password baru" error={errors.password} hint="Kosongkan jika tidak diganti.">
          <Input value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="new-password" />
        </Field>
        <Field label="Harga sewa / bulan" error={errors.monthlyPrice} hint="Berlaku untuk tagihan berikutnya.">
          <Input type="number" inputMode="numeric" value={v.monthlyPrice} onChange={(e) => setV({ ...v, monthlyPrice: e.target.value })} />
        </Field>
        <Field label="Tanggal tagihan tiap bulan" error={errors.billingDay}>
          <Input type="number" min={1} max={28} value={v.billingDay} onChange={(e) => setV({ ...v, billingDay: e.target.value })} />
        </Field>
        <Field label="Deposit" error={errors.depositAmount}>
          <Input type="number" inputMode="numeric" value={v.depositAmount} onChange={(e) => setV({ ...v, depositAmount: e.target.value || "0" })} />
        </Field>
        {Number(v.depositAmount) > 0 && (
          <Field label="Status deposit" error={errors.depositStatus}>
            <Select value={v.depositStatus === "HELD" ? "HELD" : "UNPAID"} onChange={(e) => setV({ ...v, depositStatus: e.target.value as DepositStatus })}>
              <option value="UNPAID">{depositStatusLabel.UNPAID}</option>
              <option value="HELD">Sudah dibayar (ditahan)</option>
            </Select>
          </Field>
        )}
      </div>
    </Dialog>
  );
}

// ---------- Check-out ----------

type RefundChoice = "REFUNDED" | "PARTIAL_REFUNDED" | "FORFEITED";

function CheckOutDialog({ tenancy, onClose, onSaved }: { tenancy: Tenancy; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { errors, saving, run } = useSave();
  const [v, setV] = useState({
    endDate: todayInput(),
    depositStatus: "REFUNDED" as RefundChoice,
    depositRefundAmount: "",
    depositNote: "",
  });
  const held = tenancy.depositStatus === "HELD";

  async function save() {
    const body = held ? v : { endDate: v.endDate, depositNote: v.depositNote };
    const ok = await run(() => api(`/admin/tenancies/${tenancy.id}/end`, { method: "POST", body: JSON.stringify(body) }), `Sewa ${tenancy.tenant.name} diakhiri`);
    if (ok) {
      await onSaved();
      onClose();
    }
  }

  const choices: { value: RefundChoice; label: string }[] = [
    { value: "REFUNDED", label: `Kembalikan penuh (${price(tenancy.depositAmount)})` },
    { value: "PARTIAL_REFUNDED", label: "Kembalikan sebagian" },
    { value: "FORFEITED", label: "Hangus" },
  ];

  return (
    <Dialog
      open
      onClose={onClose}
      title="Akhiri sewa"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" loading={saving} onClick={save}>
            Akhiri sewa
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{tenancy.tenant.name}</span> keluar dari kamar {tenancy.room.number} ({tenancy.kos.name}). Kamar akan
          kembali berstatus kosong.
        </p>
        {tenancy.unpaidInvoices > 0 && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Masih ada {tenancy.unpaidInvoices} tagihan yang belum lunas.</p>
        )}
        <Field label="Tanggal keluar" error={errors.endDate}>
          <Input type="date" value={v.endDate} onChange={(e) => setV({ ...v, endDate: e.target.value })} />
        </Field>
        {held && (
          <div>
            <p className="mb-2 text-sm font-medium">Deposit {price(tenancy.depositAmount)}</p>
            <div className="divide-y divide-line rounded-xl border border-line">
              {choices.map((c) => (
                <label key={c.value} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-subtle">
                  <input
                    type="radio"
                    name="deposit"
                    checked={v.depositStatus === c.value}
                    onChange={() => setV({ ...v, depositStatus: c.value })}
                    className="size-4 accent-brand-600"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {errors.depositStatus && <p className="mt-1 text-xs text-red-600">{errors.depositStatus[0]}</p>}
            {v.depositStatus === "PARTIAL_REFUNDED" && (
              <Field label="Jumlah dikembalikan" error={errors.depositRefundAmount} className="mt-4">
                <Input type="number" inputMode="numeric" value={v.depositRefundAmount} onChange={(e) => setV({ ...v, depositRefundAmount: e.target.value })} />
              </Field>
            )}
          </div>
        )}
        <Field label="Catatan" error={errors.depositNote} hint={held ? "Misal: potong biaya ganti kunci." : undefined}>
          <Textarea rows={2} value={v.depositNote} onChange={(e) => setV({ ...v, depositNote: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  );
}

// ---------- Halaman ----------

export default function PenghuniPage() {
  const router = useRouter();
  const params = useSearchParams();
  const kamarParam = Number(params.get("kamar")) || null;
  const bookingParam = Number(params.get("booking")) || null;
  const { data: bookingData } = useSWR<{ data: AdminBooking }>(bookingParam ? `/admin/bookings/${bookingParam}` : null);
  const [tab, setTab] = useState<"ACTIVE" | "ENDED">("ACTIVE");
  const { data, mutate } = useSWR<{ data: Tenancy[] }>(`/admin/tenancies?status=${tab}`);
  const [kosFilter, setKosFilter] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [checkIn, setCheckIn] = useState(kamarParam !== null || bookingParam !== null);
  const [editing, setEditing] = useState<Tenancy | null>(null);
  const [ending, setEnding] = useState<Tenancy | null>(null);

  const rows = data?.data ?? [];
  const kosList = [...new Map(rows.map((t) => [t.kos.id, t.kos])).values()];
  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (t) =>
      (!kosFilter || t.kos.id === kosFilter) &&
      (!q || t.tenant.name.toLowerCase().includes(q) || t.room.number.toLowerCase().includes(q) || t.tenant.phone?.includes(q.replace(/^0/, "62"))),
  );

  function closeCheckIn() {
    setCheckIn(false);
    if (kamarParam || bookingParam) router.replace("/admin/penghuni");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Penghuni"
        description="Daftarkan penghuni baru, ubah ketentuan sewa, dan proses check-out."
        actions={
          <Button onClick={() => setCheckIn(true)}>
            <Plus className="size-4" /> Daftarkan penghuni
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-line bg-white p-1">
          {(["ACTIVE", "ENDED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === s ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
            >
              {s === "ACTIVE" ? "Aktif" : "Riwayat"}
            </button>
          ))}
        </div>
        <label className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, kamar, no. HP" className="pl-10" />
        </label>
      </div>

      {kosList.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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

      {!data ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={rows.length ? "Tidak ada yang cocok" : tab === "ACTIVE" ? "Belum ada penghuni" : "Belum ada riwayat"}
          text={rows.length ? "Coba kata kunci lain." : tab === "ACTIVE" ? "Daftarkan penghuni saat mereka mulai menempati kamar." : undefined}
        />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {filtered.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lavender font-bold text-brand-700">{t.room.number}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.tenant.name}</p>
                <p className="truncate text-sm text-muted">
                  {t.kos.name} · {t.room.typeName}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {t.status === "ACTIVE" ? `Sejak ${dateShort(t.startDate)} · tagihan tiap tgl ${t.billingDay}` : `${dateShort(t.startDate)} – ${dateShort(t.endDate!)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{price(t.monthlyPrice)}</p>
                {t.depositStatus !== "NONE" && (
                  <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${depositBadge[t.depositStatus]}`}>
                    Deposit {depositStatusLabel[t.depositStatus].toLowerCase()}
                    {t.depositStatus === "PARTIAL_REFUNDED" && t.depositRefundAmount !== null && ` ${price(t.depositRefundAmount)}`}
                  </span>
                )}
              </div>
              {t.status === "ACTIVE" && (
                <div className="flex w-full justify-end gap-1 sm:w-auto">
                  {t.tenant.phone && (
                    <a
                      href={waLink(t.tenant.phone, `Halo ${t.tenant.name},`)}
                      target="_blank"
                      rel="noopener"
                      className="rounded-full p-2.5 hover:bg-subtle"
                      aria-label={`WhatsApp ${t.tenant.name}`}
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  )}
                  <button onClick={() => setEditing(t)} className="rounded-full p-2.5 hover:bg-subtle" aria-label={`Edit ${t.tenant.name}`}>
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => setEnding(t)} className="rounded-full p-2.5 text-red-600 hover:bg-red-50" aria-label={`Akhiri sewa ${t.tenant.name}`}>
                    <LogOut className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {checkIn && (!bookingParam || bookingData) && (
        <CheckInDialog onClose={closeCheckIn} initialRoomId={kamarParam} booking={bookingData?.data ?? null} onSaved={mutate} />
      )}
      {editing && <EditDialog tenancy={editing} onClose={() => setEditing(null)} onSaved={mutate} />}
      {ending && <CheckOutDialog tenancy={ending} onClose={() => setEnding(null)} onSaved={mutate} />}
    </div>
  );
}

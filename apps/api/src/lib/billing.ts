import { prisma } from "./prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";

type Tx = Prisma.TransactionClient;
type Billable = { id: number; startDate: Date; billingDay: number; monthlyPrice: number; dueDays: number };

const DAY = 24 * 60 * 60 * 1000;
const pad = (n: number, len: number) => String(n).padStart(len, "0");

/** Tanggal hari ini di WIB sebagai Date UTC tengah malam (sama seperti kolom @db.Date). */
export function todayWib() {
  const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function currentPeriod() {
  const t = todayWib();
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1 };
}

/** Nomor dibentuk dari id sewa + periode, jadi unik tanpa perlu counter. */
export const rentInvoiceNumber = (tenancyId: number, year: number, month: number) => `INV-${year}${pad(month, 2)}-${pad(tenancyId, 6)}`;
export const depositInvoiceNumber = (tenancyId: number) => `DEP-${pad(tenancyId, 6)}`;

/**
 * Tagihan sewa periode (year, month) terbit di tanggal tagihan bulan itu,
 * atau di tanggal masuk untuk bulan pertama. Bulan sebelum tanggal masuk tidak ditagih.
 */
function rentInvoiceFor(t: Billable, year: number, month: number): Prisma.InvoiceCreateManyInput | null {
  const startPeriod = t.startDate.getUTCFullYear() * 12 + t.startDate.getUTCMonth();
  if (year * 12 + (month - 1) < startPeriod) return null;
  const issued = new Date(Math.max(Date.UTC(year, month - 1, t.billingDay), t.startDate.getTime()));
  return {
    number: rentInvoiceNumber(t.id, year, month),
    tenancyId: t.id,
    type: "RENT",
    periodYear: year,
    periodMonth: month,
    amount: t.monthlyPrice,
    dueDate: new Date(issued.getTime() + t.dueDays * DAY),
  };
}

const billableSelect = {
  id: true,
  startDate: true,
  billingDay: true,
  monthlyPrice: true,
  room: { select: { roomType: { select: { kos: { select: { billingDueDays: true } } } } } },
} satisfies Prisma.TenancySelect;

const toBillable = ({ room, ...t }: Prisma.TenancyGetPayload<{ select: typeof billableSelect }>): Billable => ({
  ...t,
  dueDays: room.roomType.kos.billingDueDays,
});

/** Penghuni aktif yang seharusnya ditagih di periode ini tapi belum punya tagihan sewanya. */
export async function unbilledTenancies(kosIds: number[] | null, year: number, month: number) {
  const rows = await prisma.tenancy.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lt: new Date(Date.UTC(year, month, 1)) },
      invoices: { none: { type: "RENT", periodYear: year, periodMonth: month } },
      ...(kosIds === null ? {} : { room: { roomType: { kosId: { in: kosIds } } } }),
    },
    select: billableSelect,
  });
  return rows.map(toBillable);
}

/** Terbitkan tagihan sewa satu periode untuk semua penghuni aktif. Aman dipanggil berulang. */
export async function generateRentInvoices(kosIds: number[] | null, year: number, month: number) {
  const data = (await unbilledTenancies(kosIds, year, month)).map((t) => rentInvoiceFor(t, year, month)).filter((x) => x !== null);
  if (!data.length) return 0;
  const { count } = await prisma.invoice.createMany({ data, skipDuplicates: true });
  return count;
}

/** Tagihan sewa periode berjalan untuk satu sewa (dipakai saat check-in). */
export async function createCurrentRentInvoice(tx: Tx, tenancyId: number) {
  const t = toBillable(await tx.tenancy.findUniqueOrThrow({ where: { id: tenancyId }, select: billableSelect }));
  const { year, month } = currentPeriod();
  const data = rentInvoiceFor(t, year, month);
  if (data) await tx.invoice.create({ data });
}

/**
 * Samakan tagihan deposit dengan status deposit sewa:
 * NONE → tagihan belum lunas dibatalkan, UNPAID → ada tagihan belum lunas, HELD → tagihan lunas.
 */
export async function syncDepositInvoice(
  tx: Tx,
  t: { id: number; depositAmount: number; depositStatus: string; startDate: Date },
) {
  const number = depositInvoiceNumber(t.id);
  const invoice = await tx.invoice.findUnique({ where: { number } });
  const open = invoice && (invoice.status === "UNPAID" || invoice.status === "WAITING_VERIFICATION");

  if (t.depositStatus === "NONE") {
    if (open) await tx.invoice.update({ where: { id: invoice.id }, data: { status: "CANCELLED" } });
    return;
  }
  if (t.depositStatus !== "UNPAID" && t.depositStatus !== "HELD") return;

  const paid = t.depositStatus === "HELD";
  if (!invoice) {
    await tx.invoice.create({
      data: {
        number,
        tenancyId: t.id,
        type: "DEPOSIT",
        amount: t.depositAmount,
        dueDate: t.startDate,
        status: paid ? "PAID" : "UNPAID",
        paidAt: paid ? new Date() : null,
      },
    });
  } else if (paid) {
    if (invoice.status !== "PAID") await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: new Date() } });
  } else {
    // Tagihan yang masih terbuka (termasuk menunggu verifikasi) cukup disesuaikan nominalnya.
    await tx.invoice.update({
      where: { id: invoice.id },
      data: open ? { amount: t.depositAmount } : { amount: t.depositAmount, status: "UNPAID", paidAt: null },
    });
  }
}

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, notFound } from "../../lib/http-error.ts";
import { dateSchema } from "../../lib/validation.ts";
import { accessibleKosIds, assertKosAccess } from "../../middlewares/auth.ts";
import { currentPeriod, generateRentInvoices, todayWib, unbilledTenancies } from "../../lib/billing.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

const router = Router();

const periodSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const invoiceSelect = {
  id: true,
  number: true,
  type: true,
  periodYear: true,
  periodMonth: true,
  amount: true,
  dueDate: true,
  status: true,
  paidAt: true,
  reminderSentAt: true,
  tenancy: {
    select: {
      id: true,
      status: true,
      tenant: { select: { id: true, name: true, phone: true } },
      room: { select: { number: true, roomType: { select: { kos: { select: { id: true, name: true } } } } } },
    },
  },
} satisfies Prisma.InvoiceSelect;

const shape = ({ tenancy, ...i }: Prisma.InvoiceGetPayload<{ select: typeof invoiceSelect }>) => ({
  ...i,
  tenancyId: tenancy.id,
  tenancyEnded: tenancy.status === "ENDED",
  tenant: tenancy.tenant,
  roomNumber: tenancy.room.number,
  kos: tenancy.room.roomType.kos,
});

const kosFilter = (ids: number[] | null) => (ids === null ? {} : { tenancy: { room: { roomType: { kosId: { in: ids } } } } });

async function loadInvoice(user: Express.Request["user"], id: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { tenancy: { select: { id: true, room: { select: { roomType: { select: { kosId: true } } } } } } },
  });
  if (!invoice) throw notFound("Tagihan tidak ditemukan");
  await assertKosAccess(user!, invoice.tenancy.room.roomType.kosId);
  return invoice;
}

/**
 * Tagihan satu periode: sewa bulan itu + deposit yang jatuh tempo di bulan itu.
 * `?outstanding=1` → semua tagihan yang belum lunas, lintas periode.
 */
router.get("/", async (req, res) => {
  const ids = await accessibleKosIds(req.user!);
  const outstanding = req.query.outstanding === "1";
  const { year, month } = outstanding ? currentPeriod() : periodSchema.parse({ ...currentPeriod(), ...req.query });

  const where: Prisma.InvoiceWhereInput = outstanding
    ? { status: { in: ["UNPAID", "WAITING_VERIFICATION"] } }
    : {
        OR: [
          { type: "RENT", periodYear: year, periodMonth: month },
          { type: "DEPOSIT", dueDate: { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) } },
        ],
      };

  const [rows, unbilled] = await Promise.all([
    prisma.invoice.findMany({
      where: { ...where, ...kosFilter(ids) },
      orderBy: [{ dueDate: "asc" }, { number: "asc" }],
      select: invoiceSelect,
    }),
    outstanding ? Promise.resolve([]) : unbilledTenancies(ids, year, month),
  ]);
  res.json({ data: rows.map(shape), meta: { year, month, today: todayWib(), unbilled: unbilled.length } });
});

/** Terbitkan tagihan sewa untuk periode tertentu (yang sudah ada dilewati). */
router.post("/generate", async (req, res) => {
  const { year, month } = periodSchema.parse(req.body);
  const ids = await accessibleKosIds(req.user!);
  const count = await generateRentInvoices(ids, year, month);
  res.status(201).json({ message: count ? `${count} tagihan diterbitkan` : "Semua penghuni sudah punya tagihan", count });
});

const updateSchema = z.object({
  amount: z.coerce.number().int().min(1, "Nominal tidak valid").max(100_000_000),
  dueDate: dateSchema,
});

router.put("/:id", async (req, res) => {
  const invoice = await loadInvoice(req.user, Number(req.params.id));
  if (invoice.status !== "UNPAID") throw new HttpError(409, "Hanya tagihan yang belum dibayar yang bisa diubah");
  const data = updateSchema.parse(req.body);
  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id: invoice.id }, data });
    if (invoice.type === "DEPOSIT") await tx.tenancy.update({ where: { id: invoice.tenancyId }, data: { depositAmount: data.amount } });
  });
  res.json({ message: "Tagihan diperbarui" });
});

/** Tandai lunas (bayar tunai / transfer yang dicek manual). */
router.post("/:id/pay", async (req, res) => {
  const invoice = await loadInvoice(req.user, Number(req.params.id));
  if (invoice.status === "WAITING_VERIFICATION") throw new HttpError(409, "Ada bukti transfer yang menunggu verifikasi. Proses di menu Pembayaran.");
  if (invoice.status !== "UNPAID") throw new HttpError(409, "Tagihan ini sudah lunas atau dibatalkan");
  const { paidAt } = z.object({ paidAt: dateSchema }).parse(req.body);
  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt } });
    if (invoice.type === "DEPOSIT") await tx.tenancy.update({ where: { id: invoice.tenancyId }, data: { depositStatus: "HELD" } });
  });
  res.json({ message: "Tagihan ditandai lunas" });
});

/** Batalkan pelunasan yang salah input. Tidak berlaku untuk pembayaran yang diverifikasi dari bukti transfer. */
router.post("/:id/unpay", async (req, res) => {
  const invoice = await loadInvoice(req.user, Number(req.params.id));
  if (invoice.status !== "PAID") throw new HttpError(409, "Tagihan ini belum lunas");
  const approved = await prisma.payment.count({ where: { invoiceId: invoice.id, status: "APPROVED" } });
  if (approved) throw new HttpError(409, "Tagihan ini lunas dari bukti transfer yang sudah diverifikasi");
  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id: invoice.id }, data: { status: "UNPAID", paidAt: null } });
    if (invoice.type === "DEPOSIT") {
      await tx.tenancy.updateMany({ where: { id: invoice.tenancyId, depositStatus: "HELD" }, data: { depositStatus: "UNPAID" } });
    }
  });
  res.json({ message: "Pelunasan dibatalkan" });
});

router.post("/:id/cancel", async (req, res) => {
  const invoice = await loadInvoice(req.user, Number(req.params.id));
  if (invoice.status !== "UNPAID") throw new HttpError(409, "Hanya tagihan yang belum dibayar yang bisa dibatalkan");
  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id: invoice.id }, data: { status: "CANCELLED" } });
    if (invoice.type === "DEPOSIT") await tx.tenancy.update({ where: { id: invoice.tenancyId }, data: { depositStatus: "NONE" } });
  });
  res.json({ message: "Tagihan dibatalkan" });
});

/** Dicatat saat admin membuka pengingat WhatsApp. */
router.post("/:id/reminded", async (req, res) => {
  const invoice = await loadInvoice(req.user, Number(req.params.id));
  await prisma.invoice.update({ where: { id: invoice.id }, data: { reminderSentAt: new Date() } });
  res.json({ message: "Pengingat dicatat" });
});

export default router;

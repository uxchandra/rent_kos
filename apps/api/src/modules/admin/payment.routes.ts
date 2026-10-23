import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, notFound } from "../../lib/http-error.ts";
import { accessibleKosIds, assertKosAccess } from "../../middlewares/auth.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

const router = Router();

const paymentSelect = {
  id: true,
  amount: true,
  proofUrl: true,
  senderName: true,
  transferDate: true,
  status: true,
  note: true,
  verifiedAt: true,
  createdAt: true,
  bankAccount: { select: { bankName: true, accountNumber: true, accountName: true } },
  verifiedBy: { select: { name: true } },
  invoice: {
    select: {
      id: true,
      number: true,
      type: true,
      periodYear: true,
      periodMonth: true,
      amount: true,
      dueDate: true,
      status: true,
      tenancy: {
        select: {
          tenant: { select: { name: true, phone: true } },
          room: { select: { number: true, roomType: { select: { kos: { select: { id: true, name: true } } } } } },
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

const shape = ({ invoice: { tenancy, ...invoice }, ...p }: Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>) => ({
  ...p,
  invoice,
  tenant: tenancy.tenant,
  roomNumber: tenancy.room.number,
  kos: tenancy.room.roomType.kos,
});

async function loadPendingPayment(user: Express.Request["user"], id: number) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { invoice: { select: { id: true, type: true, tenancyId: true, tenancy: { select: { room: { select: { roomType: { select: { kosId: true } } } } } } } } },
  });
  if (!payment) throw notFound("Pembayaran tidak ditemukan");
  await assertKosAccess(user!, payment.invoice.tenancy.room.roomType.kosId);
  if (payment.status !== "PENDING") throw new HttpError(409, "Pembayaran ini sudah diproses");
  return payment;
}

/** Ubah status hanya jika masih PENDING, supaya dua admin tidak memproses pembayaran yang sama. */
async function claim(tx: Prisma.TransactionClient, id: number, data: Prisma.PaymentUncheckedUpdateManyInput) {
  const { count } = await tx.payment.updateMany({ where: { id, status: "PENDING" }, data });
  if (!count) throw new HttpError(409, "Pembayaran ini sudah diproses");
}

router.get("/", async (req, res) => {
  const ids = await accessibleKosIds(req.user!);
  const status = z.enum(["PENDING", "APPROVED", "REJECTED"]).catch("PENDING").parse(req.query.status);
  const rows = await prisma.payment.findMany({
    where: { status, ...(ids === null ? {} : { invoice: { tenancy: { room: { roomType: { kosId: { in: ids } } } } } }) },
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    take: status === "PENDING" ? undefined : 100,
    select: paymentSelect,
  });
  res.json({ data: rows.map(shape) });
});

/** Setujui bukti transfer → tagihan lunas per tanggal transfer. */
router.post("/:id/approve", async (req, res) => {
  const payment = await loadPendingPayment(req.user, Number(req.params.id));
  const { invoice } = payment;
  await prisma.$transaction(async (tx) => {
    await claim(tx, payment.id, { status: "APPROVED", verifiedById: req.user!.id, verifiedAt: new Date() });
    await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: payment.transferDate } });
    if (invoice.type === "DEPOSIT") await tx.tenancy.update({ where: { id: invoice.tenancyId }, data: { depositStatus: "HELD" } });
  });
  res.json({ message: "Pembayaran disetujui, tagihan lunas" });
});

/** Tolak bukti transfer → tagihan kembali belum bayar, penghuni bisa kirim ulang. */
router.post("/:id/reject", async (req, res) => {
  const payment = await loadPendingPayment(req.user, Number(req.params.id));
  const { note } = z.object({ note: z.string().trim().min(3, "Tulis alasan penolakan").max(255) }).parse(req.body);
  await prisma.$transaction(async (tx) => {
    await claim(tx, payment.id, { status: "REJECTED", note, verifiedById: req.user!.id, verifiedAt: new Date() });
    await tx.invoice.updateMany({ where: { id: payment.invoice.id, status: "WAITING_VERIFICATION" }, data: { status: "UNPAID" } });
  });
  res.json({ message: "Pembayaran ditolak" });
});

export default router;

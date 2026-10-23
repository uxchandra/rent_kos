import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, notFound } from "../../lib/http-error.ts";
import { dateSchema } from "../../lib/validation.ts";
import { deleteImage, imageUpload, saveImage, uploadedFiles } from "../../lib/upload.ts";
import { todayWib } from "../../lib/billing.ts";

// Area penghuni (dipasang dengan requireRole("TENANT") di app.ts).
const router = Router();

/** Sewa aktif, tagihan, dan rekening tujuan transfer milik penghuni yang login. */
router.get("/overview", async (req, res) => {
  const tenantId = req.user!.id;
  const [tenancy, invoices] = await Promise.all([
    prisma.tenancy.findFirst({
      where: { tenantId, status: "ACTIVE" },
      select: {
        id: true,
        startDate: true,
        monthlyPrice: true,
        billingDay: true,
        depositAmount: true,
        depositStatus: true,
        room: {
          select: {
            number: true,
            roomType: { select: { name: true, kos: { select: { id: true, name: true, city: true, address: true, whatsapp: true } } } },
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: { tenancy: { tenantId }, status: { not: "CANCELLED" } },
      orderBy: [{ dueDate: "desc" }, { id: "desc" }],
      take: 36,
      select: {
        id: true,
        number: true,
        type: true,
        periodYear: true,
        periodMonth: true,
        amount: true,
        dueDate: true,
        status: true,
        paidAt: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, note: true, createdAt: true },
        },
      },
    }),
  ]);

  const kos = tenancy?.room.roomType.kos;
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true, OR: [{ kosId: null }, ...(kos ? [{ kosId: kos.id }] : [])] },
    orderBy: [{ kosId: "desc" }, { bankName: "asc" }],
    select: { id: true, bankName: true, accountNumber: true, accountName: true },
  });

  res.json({
    data: {
      tenancy: tenancy && {
        ...tenancy,
        room: { number: tenancy.room.number, typeName: tenancy.room.roomType.name },
        kos,
      },
      invoices: invoices.map(({ payments, ...i }) => ({ ...i, lastPayment: payments[0] ?? null })),
      bankAccounts,
      today: todayWib(),
    },
  });
});

const paymentSchema = z.object({
  senderName: z.string().trim().min(2, "Nama pengirim wajib diisi").max(100),
  transferDate: dateSchema,
  bankAccountId: z.coerce.number().int().positive("Pilih rekening tujuan"),
  amount: z.coerce.number().int().min(1, "Nominal tidak valid").max(100_000_000),
});

/** Kirim bukti transfer untuk satu tagihan; tagihan menunggu verifikasi admin. */
router.post("/invoices/:id/payments", imageUpload.single("proof"), async (req, res) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: Number(req.params.id), tenancy: { tenantId: req.user!.id } },
    select: { id: true, status: true, tenancy: { select: { room: { select: { roomType: { select: { kosId: true } } } } } } },
  });
  if (!invoice) throw notFound("Tagihan tidak ditemukan");
  if (invoice.status === "WAITING_VERIFICATION") throw new HttpError(409, "Bukti transfer tagihan ini sedang dicek pengelola");
  if (invoice.status !== "UNPAID") throw new HttpError(409, "Tagihan ini sudah lunas atau dibatalkan");

  const data = paymentSchema.parse(req.body);
  const kosId = invoice.tenancy.room.roomType.kosId;
  const bank = await prisma.bankAccount.findFirst({ where: { id: data.bankAccountId, isActive: true, OR: [{ kosId: null }, { kosId }] } });
  if (!bank) throw new HttpError(422, "Data tidak valid", { bankAccountId: ["Rekening tujuan tidak valid"] });
  if (data.transferDate > todayWib()) throw new HttpError(422, "Data tidak valid", { transferDate: ["Tanggal transfer tidak boleh di masa depan"] });

  const [file] = uploadedFiles(req);
  const proofUrl = await saveImage(file, `payments/${kosId}`);

  try {
    await prisma.$transaction(async (tx) => {
      // Kunci lewat status: kiriman ganda (misal tombol ditekan dua kali) hanya satu yang lolos.
      const { count } = await tx.invoice.updateMany({ where: { id: invoice.id, status: "UNPAID" }, data: { status: "WAITING_VERIFICATION" } });
      if (!count) throw new HttpError(409, "Bukti transfer tagihan ini sedang dicek pengelola");
      await tx.payment.create({ data: { ...data, invoiceId: invoice.id, proofUrl } });
    });
  } catch (err) {
    await deleteImage(proofUrl);
    throw err;
  }
  res.status(201).json({ message: "Bukti transfer terkirim. Pengelola akan mengeceknya." });
});

export default router;

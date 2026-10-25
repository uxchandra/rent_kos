import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { notFound } from "../../lib/http-error.ts";
import { requireRole } from "../../middlewares/auth.ts";

// Rekening tujuan transfer. Semua admin bisa melihat, hanya Owner yang bisa mengubah.
const router = Router();

const accountSchema = z.object({
  bankName: z.string().trim().min(2, "Nama bank wajib diisi").max(50),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9 -]{5,40}$/, "Nomor rekening hanya angka"),
  accountName: z.string().trim().min(2, "Nama pemilik rekening wajib diisi").max(100),
  kosId: z.number().int().nullable().default(null),
  isActive: z.boolean().default(true),
});

const select = { id: true, bankName: true, accountNumber: true, accountName: true, isActive: true, kos: { select: { id: true, name: true } } };

router.get("/", async (_req, res) => {
  const rows = await prisma.bankAccount.findMany({ orderBy: [{ isActive: "desc" }, { bankName: "asc" }], select });
  res.json({ data: rows });
});

router.post("/", requireRole("OWNER"), async (req, res) => {
  const data = accountSchema.parse(req.body);
  res.locals.activityTarget = `${data.bankName} ${data.accountNumber}`;
  res.status(201).json({ data: await prisma.bankAccount.create({ data, select }) });
});

router.put("/:id", requireRole("OWNER"), async (req, res) => {
  const id = Number(req.params.id);
  if (!(await prisma.bankAccount.findUnique({ where: { id } }))) throw notFound("Rekening tidak ditemukan");
  const data = accountSchema.parse(req.body);
  res.json({ data: await prisma.bankAccount.update({ where: { id }, data, select }) });
});

/** Rekening yang pernah dipakai untuk pembayaran cukup dinonaktifkan agar riwayat tetap utuh. */
router.delete("/:id", requireRole("OWNER"), async (req, res) => {
  const id = Number(req.params.id);
  if (!(await prisma.bankAccount.findUnique({ where: { id } }))) throw notFound("Rekening tidak ditemukan");
  const used = await prisma.payment.count({ where: { bankAccountId: id } });
  if (used) {
    await prisma.bankAccount.update({ where: { id }, data: { isActive: false } });
    res.json({ message: "Rekening sudah pernah dipakai, jadi dinonaktifkan" });
    return;
  }
  await prisma.bankAccount.delete({ where: { id } });
  res.json({ message: "Rekening dihapus" });
});

export default router;

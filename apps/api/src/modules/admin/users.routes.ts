import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, badRequest, notFound } from "../../lib/http-error.ts";

// Semua route di sini khusus Owner (dipasang dengan requireRole("OWNER") di app.ts).
const router = Router();

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, "").replace(/^0/, "62"))
  .refine((v) => !v || /^62\d{8,13}$/.test(v), "Nomor HP tidak valid (contoh: 081234567890)")
  .transform((v) => v || null)
  .nullish();

const createSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.email("Format email tidak valid").transform((v) => v.toLowerCase()),
  phone,
  password: z.string().min(8, "Password minimal 8 karakter"),
  kosIds: z.array(z.number().int()).default([]),
});

const updateSchema = createSchema.omit({ email: true, password: true }).extend({
  isActive: z.boolean(),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
});

const adminSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  managedKos: { select: { kos: { select: { id: true, name: true, city: true } } } },
} as const;

const shape = ({ managedKos, ...u }: { managedKos: { kos: { id: number; name: string; city: string } }[] } & Record<string, unknown>) => ({
  ...u,
  kos: managedKos.map((m) => m.kos),
});

router.get("/", async (_req, res) => {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { name: "asc" }, select: adminSelect });
  res.json({ data: admins.map(shape) });
});

router.post("/", async (req, res) => {
  const { kosIds, password, ...data } = createSchema.parse(req.body);
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    throw new HttpError(422, "Data tidak valid", { email: ["Email sudah terdaftar"] });
  }
  const user = await prisma.user.create({
    data: {
      ...data,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 10),
      managedKos: { create: kosIds.map((kosId) => ({ kosId })) },
    },
    select: adminSelect,
  });
  res.status(201).json({ data: shape(user) });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "ADMIN") throw notFound("Admin tidak ditemukan");
  const { kosIds, password, ...data } = updateSchema.parse(req.body);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.kosAdmin.deleteMany({ where: { userId: id } });
    if (kosIds.length) await tx.kosAdmin.createMany({ data: kosIds.map((kosId) => ({ userId: id, kosId })) });
    return tx.user.update({
      where: { id },
      data: { ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
      select: adminSelect,
    });
  });
  res.json({ data: shape(updated) });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "ADMIN") throw notFound("Admin tidak ditemukan");
  const handled = await prisma.booking.count({ where: { handledById: id } });
  const verified = await prisma.payment.count({ where: { verifiedById: id } });
  if (handled + verified > 0) throw badRequest("Admin ini punya riwayat aktivitas. Nonaktifkan saja akunnya.");
  await prisma.user.delete({ where: { id } });
  res.json({ message: "Admin dihapus" });
});

export default router;

import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, badRequest, notFound } from "../../lib/http-error.ts";
import { phoneSchema } from "../../lib/validation.ts";
import { permissionsOf } from "../../middlewares/auth.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

// Semua route di sini khusus Owner (dibatasi oleh enforcePermissions di app.ts).
const router = Router();

const password = z.string().min(8, "Password minimal 8 karakter");

const staffSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
    phone: phoneSchema,
    role: z.enum(["OWNER", "ADMIN"]),
    staffRoleId: z.number().int().nullish(),
    kosIds: z.array(z.number().int()).default([]),
  })
  .refine((v) => v.role === "OWNER" || v.staffRoleId, { path: ["staffRoleId"], message: "Pilih peran untuk admin" });

const createSchema = z.intersection(
  staffSchema,
  z.object({ email: z.email("Format email tidak valid").transform((v) => v.toLowerCase()), password }),
);

const tenantUpdateSchema = z.object({ name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100), phone: phoneSchema });

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  staffRole: { select: { id: true, name: true, permissions: true } },
  managedKos: { select: { kos: { select: { id: true, name: true, city: true } } } },
  tenancies: {
    where: { status: "ACTIVE" },
    take: 1,
    select: { room: { select: { number: true, roomType: { select: { kos: { select: { id: true, name: true } } } } } } },
  },
} satisfies Prisma.UserSelect;

type Row = Prisma.UserGetPayload<{ select: typeof userSelect }>;

const shape = ({ managedKos, tenancies, staffRole, ...u }: Row) => ({
  ...u,
  staffRole: staffRole ? { id: staffRole.id, name: staffRole.name } : null,
  permissionCount: permissionsOf(u.role, staffRole).length,
  kos: managedKos.map((m) => m.kos),
  // Untuk penghuni: kamar yang sedang ditempati.
  stay: tenancies[0] ? { roomNumber: tenancies[0].room.number, kos: tenancies[0].room.roomType.kos } : null,
});

async function findUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound("Pengguna tidak ditemukan");
  return user;
}

/** Cegah sistem kehilangan Owner aktif terakhir. */
async function assertNotLastOwner(userId: number, action: string) {
  const others = await prisma.user.count({ where: { role: "OWNER", isActive: true, id: { not: userId } } });
  if (others === 0) throw badRequest(`Tidak bisa ${action}: harus ada minimal satu Owner aktif.`);
}

async function assertRoleExists(staffRoleId: number | null | undefined) {
  if (staffRoleId && !(await prisma.staffRole.findUnique({ where: { id: staffRoleId } }))) {
    throw new HttpError(422, "Data tidak valid", { staffRoleId: ["Peran tidak ditemukan"] });
  }
}

router.get("/", async (req, res) => {
  const type = req.query.type === "tenant" ? "tenant" : "staff";
  const q = String(req.query.q ?? "").trim();
  const users = await prisma.user.findMany({
    where: {
      role: type === "tenant" ? "TENANT" : { in: ["OWNER", "ADMIN"] },
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q.replace(/^0/, "62") } }] } : {}),
    },
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
    take: type === "tenant" ? 300 : undefined,
    select: userSelect,
  });
  res.json({ data: users.map(shape) });
});

router.post("/", async (req, res) => {
  const { kosIds, password: pw, staffRoleId, ...data } = createSchema.parse(req.body);
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    throw new HttpError(422, "Data tidak valid", { email: ["Email sudah terdaftar"] });
  }
  await assertRoleExists(staffRoleId);
  const isAdmin = data.role === "ADMIN";
  const user = await prisma.user.create({
    data: {
      ...data,
      staffRoleId: isAdmin ? staffRoleId : null,
      passwordHash: await bcrypt.hash(pw, 10),
      managedKos: isAdmin ? { create: kosIds.map((kosId) => ({ kosId })) } : undefined,
    },
    select: userSelect,
  });
  res.locals.activityTarget = `${user.name} (${user.role === "OWNER" ? "Owner" : user.staffRole?.name})`;
  res.status(201).json({ data: shape(user) });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await findUser(id);

  if (user.role === "TENANT") {
    const data = tenantUpdateSchema.parse(req.body);
    const updated = await prisma.user.update({ where: { id }, data, select: userSelect });
    return res.json({ data: shape(updated) });
  }

  const { kosIds, staffRoleId, ...data } = staffSchema.parse(req.body);
  if (user.role === "OWNER" && data.role !== "OWNER") {
    if (id === req.user!.id) throw badRequest("Anda tidak bisa menurunkan peran akun sendiri.");
    await assertNotLastOwner(id, "menurunkan Owner terakhir");
  }
  await assertRoleExists(staffRoleId);
  const isAdmin = data.role === "ADMIN";

  const updated = await prisma.$transaction(async (tx) => {
    await tx.kosAdmin.deleteMany({ where: { userId: id } });
    if (isAdmin && kosIds.length) await tx.kosAdmin.createMany({ data: kosIds.map((kosId) => ({ userId: id, kosId })) });
    return tx.user.update({ where: { id }, data: { ...data, staffRoleId: isAdmin ? staffRoleId : null }, select: userSelect });
  });
  res.json({ data: shape(updated) });
});

router.patch("/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  const user = await findUser(id);
  if (!isActive) {
    if (id === req.user!.id) throw badRequest("Anda tidak bisa menonaktifkan akun sendiri.");
    if (user.role === "OWNER") await assertNotLastOwner(id, "menonaktifkan Owner terakhir");
  }
  const updated = await prisma.user.update({ where: { id }, data: { isActive }, select: userSelect });
  res.json({ data: shape(updated), message: isActive ? "Akun diaktifkan" : "Akun dinonaktifkan, tidak bisa login lagi" });
});

router.post("/:id/reset-password", async (req, res) => {
  const id = Number(req.params.id);
  const body = z.object({ password }).parse(req.body);
  await findUser(id);
  await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(body.password, 10) } });
  res.json({ message: "Password baru sudah disimpan. Berikan ke pemilik akun lewat jalur pribadi." });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await findUser(id);
  if (id === req.user!.id) throw badRequest("Anda tidak bisa menghapus akun sendiri.");
  if (user.role === "TENANT") throw badRequest("Akun penghuni tidak bisa dihapus karena terkait data sewa. Nonaktifkan saja.");
  if (user.role === "OWNER") await assertNotLastOwner(id, "menghapus Owner terakhir");
  const [handled, verified] = await Promise.all([
    prisma.booking.count({ where: { handledById: id } }),
    prisma.payment.count({ where: { verifiedById: id } }),
  ]);
  if (handled + verified > 0) throw badRequest("Akun ini punya riwayat memproses booking atau pembayaran. Nonaktifkan saja.");
  await prisma.user.delete({ where: { id } });
  res.json({ message: "Akun dihapus" });
});

export default router;

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, badRequest, notFound } from "../../lib/http-error.ts";
import { ALL_PERMISSIONS, OWNER_ONLY, isPermission, permissionGroups } from "../../lib/permissions.ts";

// Khusus Owner (dibatasi oleh enforcePermissions di app.ts).
const router = Router();

const roleSchema = z.object({
  name: z.string().trim().min(2, "Nama peran minimal 2 karakter").max(60),
  description: z
    .string()
    .trim()
    .max(255)
    .transform((v) => v || null)
    .nullish(),
  permissions: z
    .array(z.string())
    .transform((list) => [...new Set(list.filter(isPermission))])
    .refine((list) => list.length > 0, "Pilih minimal satu izin"),
});

/** Katalog izin untuk editor peran di admin panel. */
router.get("/catalog", (_req, res) => {
  res.json({ data: { groups: permissionGroups, ownerOnly: OWNER_ONLY, all: ALL_PERMISSIONS } });
});

router.get("/", async (_req, res) => {
  const roles = await prisma.staffRole.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true } } },
  });
  res.json({ data: roles.map(({ _count, ...r }) => ({ ...r, userCount: _count.users })) });
});

async function assertNameFree(name: string, exceptId?: number) {
  const existing = await prisma.staffRole.findUnique({ where: { name } });
  if (existing && existing.id !== exceptId) throw new HttpError(422, "Data tidak valid", { name: ["Nama peran sudah dipakai"] });
}

router.post("/", async (req, res) => {
  const data = roleSchema.parse(req.body);
  await assertNameFree(data.name);
  const role = await prisma.staffRole.create({ data });
  res.locals.activityTarget = `Peran ${role.name}`;
  res.status(201).json({ data: role });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!(await prisma.staffRole.findUnique({ where: { id } }))) throw notFound("Peran tidak ditemukan");
  const data = roleSchema.parse(req.body);
  await assertNameFree(data.name, id);
  const role = await prisma.staffRole.update({ where: { id }, data });
  res.json({ data: role });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const role = await prisma.staffRole.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) throw notFound("Peran tidak ditemukan");
  if (role.isSystem) throw badRequest("Peran bawaan tidak bisa dihapus.");
  if (role._count.users > 0) throw badRequest(`Masih ada ${role._count.users} pengguna dengan peran ini. Pindahkan dulu ke peran lain.`);
  await prisma.staffRole.delete({ where: { id } });
  res.json({ message: "Peran dihapus" });
});

export default router;

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, notFound } from "../../lib/http-error.ts";
import { accessibleKosIds, assertKosAccess } from "../../middlewares/auth.ts";
import { deleteImage, imageUpload, saveImage, uploadedFiles } from "../../lib/upload.ts";
import { revalidatePublic } from "../../lib/revalidate.ts";

const router = Router();

const roomTypeSchema = z.object({
  name: z.string().trim().min(2, "Nama tipe minimal 2 karakter").max(80),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => v || null)
    .nullish(),
  monthlyPrice: z.coerce.number().int().min(50_000, "Harga minimal Rp50.000").max(100_000_000),
  size: z
    .string()
    .trim()
    .max(30)
    .transform((v) => v || null)
    .nullish(),
  facilities: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  isActive: z.boolean().default(true),
});

const roomSchema = z.object({
  number: z.string().trim().min(1, "Nomor kamar wajib diisi").max(20),
  floor: z.coerce.number().int().min(0).max(100).nullish(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).default("AVAILABLE"),
  notes: z
    .string()
    .trim()
    .max(255)
    .transform((v) => v || null)
    .nullish(),
});

async function loadRoomType(user: Express.Request["user"], id: number) {
  const type = await prisma.roomType.findUnique({ where: { id }, include: { kos: { select: { id: true, slug: true } } } });
  if (!type) throw notFound("Tipe kamar tidak ditemukan");
  await assertKosAccess(user!, type.kos.id);
  return type;
}

async function loadRoom(user: Express.Request["user"], id: number) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: { roomType: { select: { id: true, kos: { select: { id: true, slug: true } } } } },
  });
  if (!room) throw notFound("Kamar tidak ditemukan");
  await assertKosAccess(user!, room.roomType.kos.id);
  return room;
}

/** Kamar yang sedang disewa hanya bisa dikosongkan lewat check-out penghuni. */
async function assertStatusChangeAllowed(roomId: number, status: string) {
  if (status === "OCCUPIED") return;
  const active = await prisma.tenancy.count({ where: { roomId, status: "ACTIVE" } });
  if (active) throw new HttpError(409, "Kamar ini masih dihuni. Akhiri sewanya dulu di menu Penghuni.");
}

function duplicateRoomError(err: unknown): never {
  if (typeof err === "object" && err && "code" in err && err.code === "P2002") {
    throw new HttpError(422, "Data tidak valid", { number: ["Nomor kamar sudah ada di tipe ini"] });
  }
  throw err;
}

// ---------- Tipe kamar ----------

router.post("/kos/:kosId/room-types", async (req, res) => {
  const kosId = Number(req.params.kosId);
  await assertKosAccess(req.user!, kosId);
  const kos = await prisma.kos.findUnique({ where: { id: kosId }, select: { slug: true } });
  if (!kos) throw notFound("Kos tidak ditemukan");
  const data = roomTypeSchema.parse(req.body);
  const type = await prisma.roomType.create({ data: { ...data, kosId } });
  revalidatePublic(kos.slug);
  res.status(201).json({ data: type });
});

router.put("/room-types/:id", async (req, res) => {
  const type = await loadRoomType(req.user, Number(req.params.id));
  const data = roomTypeSchema.parse(req.body);
  const updated = await prisma.roomType.update({ where: { id: type.id }, data });
  revalidatePublic(type.kos.slug);
  res.json({ data: updated });
});

router.delete("/room-types/:id", async (req, res) => {
  const type = await loadRoomType(req.user, Number(req.params.id));
  const tenancies = await prisma.tenancy.count({ where: { room: { roomTypeId: type.id } } });
  if (tenancies > 0) {
    throw new HttpError(409, "Tipe ini punya riwayat penyewa, tidak bisa dihapus. Nonaktifkan saja agar tidak tampil di website.");
  }
  const photos = await prisma.roomTypePhoto.findMany({ where: { roomTypeId: type.id }, select: { url: true } });
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { roomTypeId: type.id } }),
    prisma.room.deleteMany({ where: { roomTypeId: type.id } }),
    prisma.roomType.delete({ where: { id: type.id } }),
  ]);
  await Promise.all(photos.map((p) => deleteImage(p.url)));
  revalidatePublic(type.kos.slug);
  res.json({ message: "Tipe kamar dihapus" });
});

router.post("/room-types/:id/photos", imageUpload.array("photos", 10), async (req, res) => {
  const type = await loadRoomType(req.user, Number(req.params.id));
  const files = uploadedFiles(req);
  const last = await prisma.roomTypePhoto.aggregate({ where: { roomTypeId: type.id }, _max: { sortOrder: true } });
  let order = (last._max.sortOrder ?? -1) + 1;
  const urls = await Promise.all(files.map((f) => saveImage(f, `kos/${type.kos.id}`)));
  await prisma.roomTypePhoto.createMany({ data: urls.map((url) => ({ roomTypeId: type.id, url, sortOrder: order++ })) });
  revalidatePublic(type.kos.slug);
  res.status(201).json({ message: `${urls.length} foto ditambahkan` });
});

/** Pindahkan foto ke urutan pertama (jadi foto utama tipe kamar). */
router.post("/room-types/:id/photos/:photoId/primary", async (req, res) => {
  const type = await loadRoomType(req.user, Number(req.params.id));
  const photo = await prisma.roomTypePhoto.findFirst({ where: { id: Number(req.params.photoId), roomTypeId: type.id } });
  if (!photo) throw notFound("Foto tidak ditemukan");
  const min = await prisma.roomTypePhoto.aggregate({ where: { roomTypeId: type.id }, _min: { sortOrder: true } });
  await prisma.roomTypePhoto.update({ where: { id: photo.id }, data: { sortOrder: (min._min.sortOrder ?? 0) - 1 } });
  revalidatePublic(type.kos.slug);
  res.json({ message: "Foto utama diperbarui" });
});

router.delete("/room-types/:id/photos/:photoId", async (req, res) => {
  const type = await loadRoomType(req.user, Number(req.params.id));
  const photo = await prisma.roomTypePhoto.findFirst({ where: { id: Number(req.params.photoId), roomTypeId: type.id } });
  if (!photo) throw notFound("Foto tidak ditemukan");
  await prisma.roomTypePhoto.delete({ where: { id: photo.id } });
  await deleteImage(photo.url);
  revalidatePublic(type.kos.slug);
  res.json({ message: "Foto dihapus" });
});

// ---------- Kamar ----------

/** Papan kamar: semua kamar dari kos yang bisa diakses. */
router.get("/rooms", async (req, res) => {
  const ids = await accessibleKosIds(req.user!);
  const kos = await prisma.kos.findMany({
    where: ids === null ? {} : { id: { in: ids } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      defaultDeposit: true,
      roomTypes: {
        orderBy: { monthlyPrice: "asc" },
        select: {
          id: true,
          name: true,
          monthlyPrice: true,
          rooms: {
            orderBy: [{ floor: "asc" }, { number: "asc" }],
            select: {
              id: true,
              number: true,
              floor: true,
              status: true,
              notes: true,
              tenancies: { where: { status: "ACTIVE" }, select: { tenant: { select: { name: true } } }, take: 1 },
            },
          },
        },
      },
    },
  });
  res.json({
    data: kos.map((k) => ({
      ...k,
      roomTypes: k.roomTypes.map((t) => ({
        ...t,
        rooms: t.rooms.map(({ tenancies, ...r }) => ({ ...r, tenantName: tenancies[0]?.tenant.name ?? null })),
      })),
    })),
  });
});

const bulkRoomSchema = z.object({
  numbers: z.array(z.string().trim().min(1).max(20)).min(1, "Isi minimal satu nomor kamar").max(100),
  floor: z.coerce.number().int().min(0).max(100).nullish(),
});

/** Tambah satu atau beberapa kamar sekaligus, misal "101, 102, 103". */
router.post("/room-types/:id/rooms", async (req, res) => {
  const type = await loadRoomType(req.user, Number(req.params.id));
  const { numbers, floor } = bulkRoomSchema.parse(req.body);
  const unique = [...new Set(numbers)];
  const existing = await prisma.room.findMany({ where: { roomTypeId: type.id, number: { in: unique } }, select: { number: true } });
  if (existing.length) {
    throw new HttpError(422, "Data tidak valid", { numbers: [`Nomor sudah ada: ${existing.map((r) => r.number).join(", ")}`] });
  }
  await prisma.room.createMany({ data: unique.map((number) => ({ number, floor: floor ?? null, roomTypeId: type.id })) });
  revalidatePublic(type.kos.slug);
  res.status(201).json({ message: `${unique.length} kamar ditambahkan` });
});

router.put("/rooms/:id", async (req, res) => {
  const room = await loadRoom(req.user, Number(req.params.id));
  const data = roomSchema.parse(req.body);
  await assertStatusChangeAllowed(room.id, data.status);
  const updated = await prisma.room.update({ where: { id: room.id }, data }).catch(duplicateRoomError);
  revalidatePublic(room.roomType.kos.slug);
  res.json({ data: updated });
});

router.patch("/rooms/:id/status", async (req, res) => {
  const room = await loadRoom(req.user, Number(req.params.id));
  const { status } = z.object({ status: roomSchema.shape.status }).parse(req.body);
  await assertStatusChangeAllowed(room.id, status);
  const updated = await prisma.room.update({ where: { id: room.id }, data: { status } });
  revalidatePublic(room.roomType.kos.slug);
  res.json({ data: updated });
});

router.delete("/rooms/:id", async (req, res) => {
  const room = await loadRoom(req.user, Number(req.params.id));
  const tenancies = await prisma.tenancy.count({ where: { roomId: room.id } });
  if (tenancies > 0) throw new HttpError(409, "Kamar ini punya riwayat penyewa, tidak bisa dihapus.");
  await prisma.room.delete({ where: { id: room.id } });
  revalidatePublic(room.roomType.kos.slug);
  res.json({ message: "Kamar dihapus" });
});

export default router;

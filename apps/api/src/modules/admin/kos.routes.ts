import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, badRequest, forbidden, notFound } from "../../lib/http-error.ts";
import { accessibleKosIds, assertKosAccess, requireRole } from "../../middlewares/auth.ts";
import { slugSchema } from "../../lib/slug.ts";
import { deleteImage, imageUpload, saveImage, uploadedFiles } from "../../lib/upload.ts";
import { revalidatePublic } from "../../lib/revalidate.ts";

const router = Router();

const toNumber = (v: { toString(): string } | null) => (v === null ? null : Number(v.toString()));
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullish();

const kosSchema = z.object({
  name: z.string().trim().min(3, "Nama kos minimal 3 karakter").max(100),
  slug: slugSchema,
  tagline: optionalText(200),
  description: optionalText(5000),
  address: z.string().trim().min(5, "Alamat wajib diisi").max(255),
  city: z.string().trim().min(2, "Kota wajib diisi").max(80),
  province: optionalText(80),
  latitude: z.coerce.number().min(-90).max(90).nullish(),
  longitude: z.coerce.number().min(-180).max(180).nullish(),
  gender: z.enum(["PUTRA", "PUTRI", "CAMPUR"]),
  facilities: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  rules: optionalText(3000),
  nearby: z
    .array(z.object({ name: z.string().trim().min(1).max(80), distance: z.string().trim().min(1).max(20) }))
    .max(15)
    .default([]),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, "").replace(/^0/, "62"))
    .refine((v) => !v || /^62\d{8,13}$/.test(v), "Nomor WhatsApp tidak valid (contoh: 081234567890)")
    .transform((v) => v || null)
    .nullish(),
  defaultDeposit: z.coerce.number().int().min(0).max(100_000_000),
  billingDueDays: z.coerce.number().int().min(1).max(28).default(7),
  isPublished: z.boolean().default(false),
});

// Kolom yang hanya boleh diubah Owner.
const OWNER_ONLY = ["slug", "isPublished"] as const;

async function assertSlugFree(slug: string, exceptId?: number) {
  const existing = await prisma.kos.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== exceptId) throw new HttpError(422, "Data tidak valid", { slug: ["Slug sudah dipakai cabang lain"] });
}

async function getKos(id: number) {
  const kos = await prisma.kos.findUnique({ where: { id }, select: { id: true, slug: true, coverImage: true } });
  if (!kos) throw notFound("Kos tidak ditemukan");
  return kos;
}

/** Daftar kos yang bisa diakses user beserta ringkasan kamar. */
router.get("/", async (req, res) => {
  const ids = await accessibleKosIds(req.user!);
  const list = await prisma.kos.findMany({
    where: ids === null ? {} : { id: { in: ids } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      gender: true,
      coverImage: true,
      isPublished: true,
      roomTypes: { select: { id: true, rooms: { select: { status: true } } } },
    },
  });
  res.json({
    data: list.map(({ roomTypes, ...k }) => {
      const rooms = roomTypes.flatMap((t) => t.rooms);
      return {
        ...k,
        roomTypeCount: roomTypes.length,
        totalRooms: rooms.length,
        availableRooms: rooms.filter((r) => r.status === "AVAILABLE").length,
        occupiedRooms: rooms.filter((r) => r.status === "OCCUPIED").length,
      };
    }),
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await assertKosAccess(req.user!, id);
  const kos = await prisma.kos.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      admins: { select: { user: { select: { id: true, name: true, email: true, phone: true } } } },
      roomTypes: {
        orderBy: { monthlyPrice: "asc" },
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
          rooms: {
            orderBy: [{ floor: "asc" }, { number: "asc" }],
            include: { _count: { select: { tenancies: { where: { status: "ACTIVE" } } } } },
          },
        },
      },
    },
  });
  if (!kos) throw notFound("Kos tidak ditemukan");
  const { admins, latitude, longitude, roomTypes, ...rest } = kos;
  res.json({
    data: {
      ...rest,
      latitude: toNumber(latitude),
      longitude: toNumber(longitude),
      admins: admins.map((a) => a.user),
      roomTypes: roomTypes.map((t) => ({
        ...t,
        rooms: t.rooms.map(({ _count, ...r }) => ({ ...r, hasActiveTenancy: _count.tenancies > 0 })),
      })),
    },
  });
});

router.post("/", requireRole("OWNER"), async (req, res) => {
  const data = kosSchema.parse(req.body);
  await assertSlugFree(data.slug);
  const kos = await prisma.kos.create({ data });
  revalidatePublic(kos.slug);
  res.locals.activityTarget = kos.name;
  res.status(201).json({ data: kos });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await assertKosAccess(req.user!, id);
  const current = await getKos(id);
  const data = kosSchema.parse(req.body);

  if (req.user!.role !== "OWNER") {
    // Admin cabang tidak boleh mengubah slug & status publikasi.
    for (const key of OWNER_ONLY) delete (data as Partial<typeof data>)[key];
  } else {
    await assertSlugFree(data.slug, id);
  }

  const kos = await prisma.kos.update({ where: { id }, data });
  revalidatePublic(current.slug, kos.slug);
  res.json({ data: kos });
});

router.delete("/:id", requireRole("OWNER"), async (req, res) => {
  const id = Number(req.params.id);
  const kos = await getKos(id);
  const tenancies = await prisma.tenancy.count({ where: { room: { roomType: { kosId: id } } } });
  if (tenancies > 0) throw new HttpError(409, "Kos ini sudah punya data penyewa, tidak bisa dihapus. Nonaktifkan publikasinya saja.");

  const photos = await prisma.kosPhoto.findMany({ where: { kosId: id }, select: { url: true } });
  const typePhotos = await prisma.roomTypePhoto.findMany({ where: { roomType: { kosId: id } }, select: { url: true } });
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { kosId: id } }),
    prisma.room.deleteMany({ where: { roomType: { kosId: id } } }),
    prisma.kos.delete({ where: { id } }),
  ]);
  await Promise.all([kos.coverImage, ...photos.map((p) => p.url), ...typePhotos.map((p) => p.url)].map(deleteImage));
  revalidatePublic(kos.slug);
  res.json({ message: "Kos dihapus" });
});

// ---------- Foto ----------

router.post("/:id/cover", imageUpload.single("photo"), async (req, res) => {
  const id = Number(req.params.id);
  await assertKosAccess(req.user!, id);
  const kos = await getKos(id);
  const [file] = uploadedFiles(req);

  const url = await saveImage(file, `kos/${id}`);
  await prisma.kos.update({ where: { id }, data: { coverImage: url } });
  await deleteImage(kos.coverImage);
  revalidatePublic(kos.slug);
  res.json({ data: { coverImage: url } });
});

router.post("/:id/photos", imageUpload.array("photos", 10), async (req, res) => {
  const id = Number(req.params.id);
  await assertKosAccess(req.user!, id);
  const kos = await getKos(id);
  const files = uploadedFiles(req);

  const last = await prisma.kosPhoto.aggregate({ where: { kosId: id }, _max: { sortOrder: true } });
  let order = (last._max.sortOrder ?? -1) + 1;
  const urls = await Promise.all(files.map((f) => saveImage(f, `kos/${id}`)));
  await prisma.kosPhoto.createMany({ data: urls.map((url) => ({ kosId: id, url, sortOrder: order++ })) });
  revalidatePublic(kos.slug);
  res.status(201).json({ message: `${urls.length} foto ditambahkan` });
});

const photoPatch = z.object({ caption: z.string().trim().max(150).nullish(), sortOrder: z.number().int().optional() });

router.patch("/:id/photos/:photoId", async (req, res) => {
  const id = Number(req.params.id);
  await assertKosAccess(req.user!, id);
  const kos = await getKos(id);
  const photo = await prisma.kosPhoto.findFirst({ where: { id: Number(req.params.photoId), kosId: id } });
  if (!photo) throw notFound("Foto tidak ditemukan");
  const data = photoPatch.parse(req.body);
  await prisma.kosPhoto.update({ where: { id: photo.id }, data: { ...data, caption: data.caption || null } });
  revalidatePublic(kos.slug);
  res.json({ message: "Foto diperbarui" });
});

/** Jadikan foto galeri sebagai cover; cover lama masuk ke galeri. */
router.post("/:id/photos/:photoId/cover", async (req, res) => {
  const id = Number(req.params.id);
  await assertKosAccess(req.user!, id);
  const kos = await getKos(id);
  const photo = await prisma.kosPhoto.findFirst({ where: { id: Number(req.params.photoId), kosId: id } });
  if (!photo) throw notFound("Foto tidak ditemukan");

  await prisma.$transaction([
    prisma.kos.update({ where: { id }, data: { coverImage: photo.url } }),
    kos.coverImage
      ? prisma.kosPhoto.update({ where: { id: photo.id }, data: { url: kos.coverImage, caption: null } })
      : prisma.kosPhoto.delete({ where: { id: photo.id } }),
  ]);
  revalidatePublic(kos.slug);
  res.json({ message: "Cover diperbarui" });
});

router.delete("/:id/photos/:photoId", async (req, res) => {
  const id = Number(req.params.id);
  await assertKosAccess(req.user!, id);
  const kos = await getKos(id);
  const photo = await prisma.kosPhoto.findFirst({ where: { id: Number(req.params.photoId), kosId: id } });
  if (!photo) throw notFound("Foto tidak ditemukan");
  await prisma.kosPhoto.delete({ where: { id: photo.id } });
  await deleteImage(photo.url);
  revalidatePublic(kos.slug);
  res.json({ message: "Foto dihapus" });
});

// ---------- Pengelola (Owner) ----------

router.put("/:id/admins", requireRole("OWNER"), async (req, res) => {
  const id = Number(req.params.id);
  await getKos(id);
  const { userIds } = z.object({ userIds: z.array(z.number().int()) }).parse(req.body);
  const admins = await prisma.user.count({ where: { id: { in: userIds }, role: "ADMIN" } });
  if (admins !== userIds.length) throw forbidden("Hanya akun admin yang bisa ditugaskan");
  await prisma.$transaction([
    prisma.kosAdmin.deleteMany({ where: { kosId: id } }),
    prisma.kosAdmin.createMany({ data: userIds.map((userId) => ({ userId, kosId: id })) }),
  ]);
  res.json({ message: "Pengelola diperbarui" });
});

export default router;

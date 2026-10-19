import { Router } from "express";
import { prisma } from "../../lib/prisma.ts";
import { notFound } from "../../lib/http-error.ts";

const router = Router();

const toNumber = (v: { toString(): string } | null) => (v === null ? null : Number(v.toString()));

/** Daftar semua cabang kos yang sudah dipublikasikan (untuk halaman utama). */
router.get("/kos", async (_req, res) => {
  const list = await prisma.kos.findMany({
    where: { isPublished: true },
    orderBy: { city: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      city: true,
      address: true,
      gender: true,
      coverImage: true,
      facilities: true,
      latitude: true,
      longitude: true,
      roomTypes: {
        where: { isActive: true },
        select: {
          monthlyPrice: true,
          rooms: { select: { status: true } },
        },
      },
    },
  });

  res.json({
    data: list.map(({ roomTypes, latitude, longitude, ...kos }) => ({
      ...kos,
      latitude: toNumber(latitude),
      longitude: toNumber(longitude),
      minPrice: roomTypes.length ? Math.min(...roomTypes.map((t) => t.monthlyPrice)) : null,
      totalRooms: roomTypes.reduce((sum, t) => sum + t.rooms.length, 0),
      availableRooms: roomTypes.reduce((sum, t) => sum + t.rooms.filter((r) => r.status === "AVAILABLE").length, 0),
    })),
  });
});

/** Semua tipe kamar dari semua cabang, untuk listing ala marketplace di halaman utama. */
router.get("/rooms", async (_req, res) => {
  const types = await prisma.roomType.findMany({
    where: { isActive: true, kos: { isPublished: true } },
    orderBy: [{ kos: { city: "asc" } }, { monthlyPrice: "asc" }],
    include: {
      photos: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true } },
      rooms: { select: { status: true } },
      kos: { select: { slug: true, name: true, city: true, address: true, gender: true, coverImage: true } },
    },
  });

  res.json({
    data: types.map(({ rooms, kosId: _k, createdAt: _c, updatedAt: _u, isActive: _a, ...t }) => ({
      ...t,
      totalRooms: rooms.length,
      availableRooms: rooms.filter((r) => r.status === "AVAILABLE").length,
    })),
  });
});

/** Detail satu kos untuk website cabang: smartkos.com/{slug} */
router.get("/kos/:slug", async (req, res) => {
  const kos = await prisma.kos.findFirst({
    where: { slug: req.params.slug, isPublished: true },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      admins: { select: { user: { select: { name: true } } }, take: 1 },
      roomTypes: {
        where: { isActive: true },
        orderBy: { monthlyPrice: "asc" },
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
          rooms: { select: { status: true } },
        },
      },
    },
  });
  if (!kos) throw notFound("Kos tidak ditemukan");

  const { roomTypes, admins, latitude, longitude, billingDueDays: _b, isPublished: _p, ...rest } = kos;
  res.json({
    data: {
      ...rest,
      managerName: admins[0]?.user.name ?? null,
      latitude: toNumber(latitude),
      longitude: toNumber(longitude),
      roomTypes: roomTypes.map(({ rooms, ...t }) => ({
        ...t,
        totalRooms: rooms.length,
        availableRooms: rooms.filter((r) => r.status === "AVAILABLE").length,
      })),
    },
  });
});

export default router;

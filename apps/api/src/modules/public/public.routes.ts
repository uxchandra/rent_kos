import { Router } from "express";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, notFound } from "../../lib/http-error.ts";
import { dateSchema, phoneSchema } from "../../lib/validation.ts";
import { todayWib } from "../../lib/billing.ts";

const router = Router();

const toNumber = (v: { toString(): string } | null) => (v === null ? null : Number(v.toString()));

/** Daftar semua cabang kos yang sudah dipublikasikan (untuk halaman utama). Cabang "segera hadir" di urutan akhir. */
router.get("/kos", async (_req, res) => {
  const list = await prisma.kos.findMany({
    where: { isPublished: true },
    // Cabang yang sudah buka urut kota; yang "segera hadir" urut waktu dibuat (= urutan tahap pembukaan).
    orderBy: [{ comingSoon: "asc" }, { city: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      city: true,
      address: true,
      gender: true,
      coverImage: true,
      area: true,
      areaImage: true,
      areaImageCredit: true,
      comingSoon: true,
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

  const opening = list.filter((k) => !k.comingSoon);
  const upcoming = list.filter((k) => k.comingSoon).sort((x, y) => x.id - y.id);

  res.json({
    data: [...opening, ...upcoming].map(({ roomTypes, latitude, longitude, ...kos }) => ({
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
    // Kamar di cabang "segera hadir" belum dipasarkan.
    where: { isActive: true, kos: { isPublished: true, comingSoon: false } },
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

const bookingSchema = z.object({
  roomTypeId: z.number().int(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.email("Format email tidak valid").transform((v) => v.toLowerCase()),
  phone: phoneSchema.refine((v) => !!v, "Nomor WhatsApp wajib diisi"),
  occupation: z
    .string()
    .trim()
    .max(100)
    .transform((v) => v || null)
    .nullish(),
  moveInDate: dateSchema,
  message: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => v || null)
    .nullish(),
  // Honeypot: field tersembunyi yang hanya diisi bot.
  website: z.string().optional(),
});

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const bookingCode = () => `BK${Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("")}`;
const DAY = 24 * 60 * 60 * 1000;

/** Pengajuan sewa dari website cabang. Pengelola memproses di menu Booking. */
router.post("/kos/:slug/bookings", async (req, res) => {
  const { website, ...data } = bookingSchema.parse(req.body);
  const kos = await prisma.kos.findFirst({ where: { slug: req.params.slug, isPublished: true, comingSoon: false }, select: { id: true } });
  if (!kos) throw notFound("Kos tidak ditemukan");
  if (website) {
    res.status(201).json({ data: { code: bookingCode() } });
    return;
  }

  const type = await prisma.roomType.findFirst({ where: { id: data.roomTypeId, kosId: kos.id, isActive: true } });
  if (!type) throw new HttpError(422, "Data tidak valid", { roomTypeId: ["Tipe kamar tidak tersedia"] });
  const today = todayWib();
  if (data.moveInDate < today || data.moveInDate.getTime() > today.getTime() + 180 * DAY) {
    throw new HttpError(422, "Data tidak valid", { moveInDate: ["Pilih tanggal antara hari ini dan 6 bulan ke depan"] });
  }

  const duplicate = await prisma.booking.findFirst({
    where: { kosId: kos.id, status: "PENDING", OR: [{ phone: data.phone! }, { email: data.email }] },
    select: { code: true },
  });
  if (duplicate) throw new HttpError(409, `Anda sudah punya pengajuan yang sedang diproses (kode ${duplicate.code}). Pengelola akan segera menghubungi.`);

  for (let attempt = 0; ; attempt++) {
    try {
      const booking = await prisma.booking.create({ data: { ...data, phone: data.phone!, kosId: kos.id, code: bookingCode() }, select: { code: true } });
      res.status(201).json({ data: booking });
      return;
    } catch (err) {
      const clash = typeof err === "object" && err && "code" in err && err.code === "P2002";
      if (!clash || attempt >= 4) throw err;
    }
  }
});

export default router;

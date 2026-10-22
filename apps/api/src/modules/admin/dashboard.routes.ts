import { Router } from "express";
import { prisma } from "../../lib/prisma.ts";
import { accessibleKosIds } from "../../middlewares/auth.ts";

const router = Router();

/** Ringkasan okupansi per kos untuk halaman dashboard. */
router.get("/", async (req, res) => {
  const ids = await accessibleKosIds(req.user!);
  const where = ids === null ? {} : { id: { in: ids } };

  const [kos, pendingBookings] = await Promise.all([
    prisma.kos.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        slug: true,
        isPublished: true,
        coverImage: true,
        roomTypes: { select: { monthlyPrice: true, rooms: { select: { status: true } } } },
      },
    }),
    prisma.booking.count({ where: { status: "PENDING", kosId: ids === null ? undefined : { in: ids } } }),
  ]);

  const perKos = kos.map(({ roomTypes, ...k }) => {
    const rooms = roomTypes.flatMap((t) => t.rooms.map((r) => ({ ...r, price: t.monthlyPrice })));
    const occupied = rooms.filter((r) => r.status === "OCCUPIED");
    return {
      ...k,
      totalRooms: rooms.length,
      occupied: occupied.length,
      available: rooms.filter((r) => r.status === "AVAILABLE").length,
      maintenance: rooms.filter((r) => r.status === "MAINTENANCE").length,
      // Perkiraan pendapatan dari kamar terisi (harga tipe kamar).
      potentialRevenue: occupied.reduce((s, r) => s + r.price, 0),
    };
  });

  const sum = (key: "totalRooms" | "occupied" | "available" | "maintenance" | "potentialRevenue") =>
    perKos.reduce((s, k) => s + k[key], 0);

  res.json({
    data: {
      totals: {
        kos: perKos.length,
        totalRooms: sum("totalRooms"),
        occupied: sum("occupied"),
        available: sum("available"),
        maintenance: sum("maintenance"),
        potentialRevenue: sum("potentialRevenue"),
        pendingBookings,
      },
      kos: perKos,
    },
  });
});

export default router;

import { Router } from "express";
import { prisma } from "../../lib/prisma.ts";
import { accessibleKosIds } from "../../middlewares/auth.ts";
import { currentPeriod, todayWib } from "../../lib/billing.ts";

const router = Router();

const TREND_MONTHS = 6;
const DAY = 24 * 60 * 60 * 1000;

/** Ringkasan untuk halaman dashboard: okupansi per kos, tren 6 bulan, tagihan bulan ini, dan daftar yang perlu ditindak. */
router.get("/", async (req, res) => {
  const ids = await accessibleKosIds(req.user!);
  const where = ids === null ? {} : { id: { in: ids } };
  const kosIdFilter = ids === null ? undefined : { in: ids };
  const byKos = ids === null ? {} : { room: { roomType: { kosId: { in: ids } } } };

  const today = todayWib();
  const now = currentPeriod();
  // Periode tren: 5 bulan lalu s.d. bulan ini.
  const periods = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const d = new Date(Date.UTC(now.year, now.month - TREND_MONTHS + i, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  });
  const trendStart = new Date(Date.UTC(periods[0].year, periods[0].month - 1, 1));
  const periodIndex = (d: Date) => periods.findIndex((p) => p.year === d.getUTCFullYear() && p.month === d.getUTCMonth() + 1);

  const [kos, pendingBookings, pendingPayments, invoices, bookings, tenancies, overdue, recentBookings] = await Promise.all([
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
    prisma.booking.count({ where: { status: "PENDING", kosId: kosIdFilter } }),
    prisma.payment.count({ where: { status: "PENDING", invoice: { tenancy: byKos } } }),
    prisma.invoice.findMany({
      where: {
        status: { not: "CANCELLED" },
        tenancy: byKos,
        OR: [
          { type: "RENT", OR: periods.map((p) => ({ periodYear: p.year, periodMonth: p.month })) },
          { status: "PAID", paidAt: { gte: trendStart } },
        ],
      },
      select: { type: true, periodYear: true, periodMonth: true, amount: true, status: true, paidAt: true, dueDate: true },
    }),
    prisma.booking.findMany({ where: { kosId: kosIdFilter, createdAt: { gte: trendStart } }, select: { createdAt: true, status: true } }),
    prisma.tenancy.findMany({
      where: { ...byKos, OR: [{ startDate: { gte: trendStart } }, { endDate: { gte: trendStart } }, { status: "ACTIVE" }] },
      select: { startDate: true, endDate: true, status: true },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["UNPAID", "WAITING_VERIFICATION"] }, dueDate: { lt: today }, tenancy: byKos },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        number: true,
        amount: true,
        dueDate: true,
        status: true,
        tenancy: { select: { tenant: { select: { name: true } }, room: { select: { number: true, roomType: { select: { kos: { select: { name: true } } } } } } } },
      },
    }),
    prisma.booking.findMany({
      where: { kosId: kosIdFilter },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, code: true, name: true, status: true, createdAt: true, moveInDate: true, kos: { select: { name: true } }, roomType: { select: { name: true } } },
    }),
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

  // ---------- Tren per bulan ----------
  const trend = periods.map((p) => ({ ...p, billed: 0, collected: 0, cashIn: 0, bookings: 0, approved: 0, moveIns: 0, moveOuts: 0 }));
  const thisMonth = { billed: 0, paid: 0, paidCount: 0, waiting: 0, waitingCount: 0, unpaid: 0, unpaidCount: 0, overdue: 0, overdueCount: 0 };

  for (const inv of invoices) {
    if (inv.type === "RENT" && inv.periodYear && inv.periodMonth) {
      const i = periods.findIndex((p) => p.year === inv.periodYear && p.month === inv.periodMonth);
      if (i >= 0) {
        trend[i].billed += inv.amount;
        if (inv.status === "PAID") trend[i].collected += inv.amount;
      }
      if (inv.periodYear === now.year && inv.periodMonth === now.month) {
        thisMonth.billed += inv.amount;
        if (inv.status === "PAID") {
          thisMonth.paid += inv.amount;
          thisMonth.paidCount++;
        } else if (inv.status === "WAITING_VERIFICATION") {
          thisMonth.waiting += inv.amount;
          thisMonth.waitingCount++;
        } else if (inv.dueDate < today) {
          thisMonth.overdue += inv.amount;
          thisMonth.overdueCount++;
        } else {
          thisMonth.unpaid += inv.amount;
          thisMonth.unpaidCount++;
        }
      }
    }
    if (inv.status === "PAID" && inv.paidAt) {
      const i = periodIndex(inv.paidAt);
      if (i >= 0) trend[i].cashIn += inv.amount;
    }
  }
  for (const b of bookings) {
    const i = periodIndex(b.createdAt);
    if (i < 0) continue;
    trend[i].bookings++;
    if (b.status === "APPROVED") trend[i].approved++;
  }
  for (const t of tenancies) {
    const inIdx = periodIndex(t.startDate);
    if (inIdx >= 0) trend[inIdx].moveIns++;
    const outIdx = t.endDate ? periodIndex(t.endDate) : -1;
    if (outIdx >= 0) trend[outIdx].moveOuts++;
  }

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
        pendingPayments,
        activeTenants: tenancies.filter((t) => t.status === "ACTIVE").length,
        overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
        overdueCount: overdue.length,
      },
      thisMonth,
      trend,
      overdue: overdue.slice(0, 5).map((i) => ({
        id: i.id,
        number: i.number,
        amount: i.amount,
        dueDate: i.dueDate,
        daysLate: Math.round((today.getTime() - i.dueDate.getTime()) / DAY),
        status: i.status,
        tenantName: i.tenancy.tenant.name,
        kosName: i.tenancy.room.roomType.kos.name,
        roomNumber: i.tenancy.room.number,
      })),
      recentBookings: recentBookings.map(({ kos, roomType, ...b }) => ({ ...b, kosName: kos.name, roomTypeName: roomType.name })),
      kos: perKos,
    },
  });
});

export default router;

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { accessibleKosIds, assertKosAccess } from "../../middlewares/auth.ts";
import { currentPeriod, todayWib } from "../../lib/billing.ts";

const router = Router();

const querySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  kosId: z.coerce.number().int().optional(),
});

/**
 * Laporan tahunan: tagihan vs terkumpul per bulan, kas masuk, keluar-masuk penghuni,
 * ringkasan per cabang, dan daftar tunggakan.
 */
router.get("/", async (req, res) => {
  const query = querySchema.parse(req.query);
  const year = query.year ?? currentPeriod().year;
  if (query.kosId) await assertKosAccess(req.user!, query.kosId);
  const ids = query.kosId ? [query.kosId] : await accessibleKosIds(req.user!);
  const byKos = ids === null ? {} : { room: { roomType: { kosId: { in: ids } } } };

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
  const today = todayWib();

  const [invoices, tenancies, kos, overdue, firstInvoice] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        status: { not: "CANCELLED" },
        tenancy: byKos,
        OR: [{ type: "RENT", periodYear: year }, { status: "PAID", paidAt: { gte: yearStart, lt: yearEnd } }],
      },
      select: {
        type: true,
        periodYear: true,
        periodMonth: true,
        amount: true,
        status: true,
        paidAt: true,
        tenancy: { select: { room: { select: { roomType: { select: { kosId: true } } } } } },
      },
    }),
    prisma.tenancy.findMany({
      where: { ...byKos, OR: [{ startDate: { gte: yearStart, lt: yearEnd } }, { endDate: { gte: yearStart, lt: yearEnd } }, { status: "ACTIVE" }] },
      select: { startDate: true, endDate: true, status: true, depositStatus: true, depositAmount: true },
    }),
    prisma.kos.findMany({
      where: ids === null ? {} : { id: { in: ids } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, roomTypes: { select: { rooms: { select: { status: true } } } } },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["UNPAID", "WAITING_VERIFICATION"] }, dueDate: { lt: today }, tenancy: byKos },
      orderBy: { dueDate: "asc" },
      select: {
        amount: true,
        dueDate: true,
        tenancy: {
          select: {
            id: true,
            status: true,
            tenant: { select: { name: true, phone: true } },
            room: { select: { number: true, roomType: { select: { kos: { select: { name: true } } } } } },
          },
        },
      },
    }),
    prisma.invoice.findFirst({ where: { tenancy: byKos }, orderBy: { dueDate: "asc" }, select: { dueDate: true } }),
  ]);

  // ---------- Per bulan ----------
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    billed: 0, // tagihan sewa periode ini
    collected: 0, // tagihan sewa periode ini yang sudah lunas
    cashRent: 0, // uang masuk bulan ini (berdasar tanggal bayar) dari sewa
    cashDeposit: 0, // ... dari deposit
    moveIns: 0,
    moveOuts: 0,
  }));
  const kosTotals = new Map<number, { billed: number; collected: number }>();

  for (const inv of invoices) {
    if (inv.type === "RENT" && inv.periodYear === year) {
      const m = months[inv.periodMonth! - 1];
      m.billed += inv.amount;
      if (inv.status === "PAID") m.collected += inv.amount;
      const k = kosTotals.get(inv.tenancy.room.roomType.kosId) ?? { billed: 0, collected: 0 };
      k.billed += inv.amount;
      if (inv.status === "PAID") k.collected += inv.amount;
      kosTotals.set(inv.tenancy.room.roomType.kosId, k);
    }
    if (inv.status === "PAID" && inv.paidAt && inv.paidAt >= yearStart && inv.paidAt < yearEnd) {
      const m = months[inv.paidAt.getUTCMonth()];
      if (inv.type === "RENT") m.cashRent += inv.amount;
      else m.cashDeposit += inv.amount;
    }
  }
  for (const t of tenancies) {
    if (t.startDate >= yearStart && t.startDate < yearEnd) months[t.startDate.getUTCMonth()].moveIns++;
    if (t.endDate && t.endDate >= yearStart && t.endDate < yearEnd) months[t.endDate.getUTCMonth()].moveOuts++;
  }

  // ---------- Tunggakan per penghuni ----------
  const arrears = new Map<number, { tenancyId: number; name: string; phone: string | null; kosName: string; roomNumber: string; ended: boolean; count: number; amount: number; oldestDue: Date }>();
  for (const inv of overdue) {
    const t = inv.tenancy;
    const row = arrears.get(t.id) ?? {
      tenancyId: t.id,
      name: t.tenant.name,
      phone: t.tenant.phone,
      kosName: t.room.roomType.kos.name,
      roomNumber: t.room.number,
      ended: t.status === "ENDED",
      count: 0,
      amount: 0,
      oldestDue: inv.dueDate,
    };
    row.count++;
    row.amount += inv.amount;
    arrears.set(t.id, row);
  }

  const kosRows = kos.map((k) => {
    const rooms = k.roomTypes.flatMap((t) => t.rooms);
    const totals = kosTotals.get(k.id) ?? { billed: 0, collected: 0 };
    return { id: k.id, name: k.name, totalRooms: rooms.length, occupied: rooms.filter((r) => r.status === "OCCUPIED").length, ...totals };
  });

  const activeTenancies = tenancies.filter((t) => t.status === "ACTIVE");
  res.json({
    data: {
      year,
      firstYear: Math.min(firstInvoice?.dueDate.getUTCFullYear() ?? year, year),
      currentYear: currentPeriod().year,
      months,
      kos: kosRows,
      arrears: [...arrears.values()].sort((a, b) => b.amount - a.amount),
      snapshot: {
        activeTenants: activeTenancies.length,
        depositsHeld: activeTenancies.filter((t) => t.depositStatus === "HELD").reduce((s, t) => s + t.depositAmount, 0),
        overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
      },
    },
  });
});

export default router;

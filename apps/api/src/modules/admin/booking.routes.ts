import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, notFound } from "../../lib/http-error.ts";
import { accessibleKosIds, assertKosAccess } from "../../middlewares/auth.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type { BookingStatus } from "../../generated/prisma/enums.ts";

const router = Router();

const bookingSelect = {
  id: true,
  code: true,
  name: true,
  email: true,
  phone: true,
  occupation: true,
  moveInDate: true,
  message: true,
  status: true,
  rejectReason: true,
  handledAt: true,
  createdAt: true,
  handledBy: { select: { name: true } },
  kos: { select: { id: true, name: true } },
  roomType: { select: { id: true, name: true, monthlyPrice: true, rooms: { select: { status: true } } } },
  tenancy: { select: { id: true } },
} satisfies Prisma.BookingSelect;

const shape = ({ roomType: { rooms, ...roomType }, tenancy, ...b }: Prisma.BookingGetPayload<{ select: typeof bookingSelect }>) => ({
  ...b,
  roomType: { ...roomType, availableRooms: rooms.filter((r) => r.status === "AVAILABLE").length },
  tenancyId: tenancy?.id ?? null,
});

async function loadBooking(user: Express.Request["user"], id: number) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: { tenancy: { select: { id: true } } } });
  if (!booking) throw notFound("Booking tidak ditemukan");
  await assertKosAccess(user!, booking.kosId);
  return booking;
}

/** Ubah status hanya dari status asal yang diharapkan, supaya dua admin tidak saling menimpa. */
async function transition(id: number, from: BookingStatus, data: Prisma.BookingUncheckedUpdateManyInput) {
  const { count } = await prisma.booking.updateMany({ where: { id, status: from }, data });
  if (!count) throw new HttpError(409, "Booking ini sudah diproses");
}

router.get("/", async (req, res) => {
  const ids = await accessibleKosIds(req.user!);
  const status = z.enum(["PENDING", "APPROVED", "CLOSED"]).catch("PENDING").parse(req.query.status);
  const where: Prisma.BookingWhereInput =
    status === "CLOSED" ? { status: { in: ["REJECTED", "CANCELLED"] } } : { status };
  const rows = await prisma.booking.findMany({
    where: { ...where, ...(ids === null ? {} : { kosId: { in: ids } }) },
    orderBy: status === "PENDING" ? { createdAt: "asc" } : status === "APPROVED" ? { moveInDate: "asc" } : { handledAt: "desc" },
    take: status === "CLOSED" ? 100 : undefined,
    select: bookingSelect,
  });
  res.json({ data: rows.map(shape) });
});

router.get("/:id", async (req, res) => {
  const booking = await loadBooking(req.user, Number(req.params.id));
  res.json({ data: shape(await prisma.booking.findUniqueOrThrow({ where: { id: booking.id }, select: bookingSelect })) });
});

router.post("/:id/approve", async (req, res) => {
  const booking = await loadBooking(req.user, Number(req.params.id));
  await transition(booking.id, "PENDING", { status: "APPROVED", handledById: req.user!.id, handledAt: new Date() });
  res.json({ message: "Booking disetujui" });
});

router.post("/:id/reject", async (req, res) => {
  const booking = await loadBooking(req.user, Number(req.params.id));
  const { reason } = z.object({ reason: z.string().trim().min(3, "Tulis alasan penolakan").max(255) }).parse(req.body);
  await transition(booking.id, "PENDING", { status: "REJECTED", rejectReason: reason, handledById: req.user!.id, handledAt: new Date() });
  res.json({ message: "Booking ditolak" });
});

/** Calon penghuni batal setelah disetujui (belum check-in). */
router.post("/:id/cancel", async (req, res) => {
  const booking = await loadBooking(req.user, Number(req.params.id));
  if (booking.tenancy) throw new HttpError(409, "Booking ini sudah menjadi data penghuni");
  const { reason } = z.object({ reason: z.string().trim().max(255).optional() }).parse(req.body ?? {});
  await transition(booking.id, "APPROVED", { status: "CANCELLED", rejectReason: reason || null, handledById: req.user!.id, handledAt: new Date() });
  res.json({ message: "Booking dibatalkan" });
});

export default router;

import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { HttpError, notFound } from "../../lib/http-error.ts";
import { dateSchema, phoneSchema } from "../../lib/validation.ts";
import { accessibleKosIds, assertKosAccess } from "../../middlewares/auth.ts";
import { revalidatePublic } from "../../lib/revalidate.ts";
import { createCurrentRentInvoice, syncDepositInvoice } from "../../lib/billing.ts";
import type { DepositStatus } from "../../generated/prisma/enums.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

const router = Router();

const invalid = (field: string, message: string) => new HttpError(422, "Data tidak valid", { [field]: [message] });

const tenantFields = {
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  phone: phoneSchema,
};

const termsFields = {
  monthlyPrice: z.coerce.number().int().min(50_000, "Harga minimal Rp50.000").max(100_000_000),
  billingDay: z.coerce.number().int().min(1, "Tanggal tagihan 1–28").max(28, "Tanggal tagihan 1–28"),
  depositAmount: z.coerce.number().int().min(0).max(100_000_000),
};

const checkInSchema = z.object({
  ...tenantFields,
  ...termsFields,
  roomId: z.number().int(),
  email: z.email("Format email tidak valid").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  startDate: dateSchema,
  depositPaid: z.boolean().default(false),
  bookingId: z.number().int().nullish(),
});

const updateSchema = z.object({
  ...tenantFields,
  ...termsFields,
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  depositStatus: z.enum(["NONE", "UNPAID", "HELD"]),
});

const checkOutSchema = z.object({
  endDate: dateSchema,
  depositStatus: z.enum(["REFUNDED", "PARTIAL_REFUNDED", "FORFEITED"]).optional(),
  depositRefundAmount: z.coerce.number().int().min(0).nullish(),
  depositNote: z
    .string()
    .trim()
    .max(255)
    .transform((v) => v || null)
    .nullish(),
});

const tenancySelect = {
  id: true,
  startDate: true,
  endDate: true,
  monthlyPrice: true,
  billingDay: true,
  depositAmount: true,
  depositStatus: true,
  depositRefundAmount: true,
  depositNote: true,
  status: true,
  tenant: { select: { id: true, name: true, email: true, phone: true } },
  room: {
    select: {
      id: true,
      number: true,
      floor: true,
      roomType: { select: { id: true, name: true, kos: { select: { id: true, name: true, city: true } } } },
    },
  },
  _count: { select: { invoices: { where: { status: { in: ["UNPAID", "WAITING_VERIFICATION"] } } } } },
} satisfies Prisma.TenancySelect;

type TenancyRow = Awaited<ReturnType<typeof findTenancy>>;
const findTenancy = (id: number) => prisma.tenancy.findUniqueOrThrow({ where: { id }, select: tenancySelect });

const shape = ({ room, _count, ...t }: TenancyRow) => ({
  ...t,
  room: { id: room.id, number: room.number, floor: room.floor, typeName: room.roomType.name },
  kos: room.roomType.kos,
  unpaidInvoices: _count.invoices,
});

async function loadTenancy(user: Express.Request["user"], id: number) {
  const tenancy = await prisma.tenancy.findUnique({
    where: { id },
    include: { room: { select: { id: true, roomType: { select: { kos: { select: { id: true, slug: true } } } } } } },
  });
  if (!tenancy) throw notFound("Data sewa tidak ditemukan");
  await assertKosAccess(user!, tenancy.room.roomType.kos.id);
  return tenancy;
}

router.get("/", async (req, res) => {
  const ids = await accessibleKosIds(req.user!);
  const status = req.query.status === "ENDED" ? "ENDED" : "ACTIVE";
  const rows = await prisma.tenancy.findMany({
    where: { status, ...(ids === null ? {} : { room: { roomType: { kosId: { in: ids } } } }) },
    orderBy: status === "ACTIVE" ? [{ room: { roomType: { kosId: "asc" } } }, { room: { number: "asc" } }] : { endDate: "desc" },
    take: status === "ENDED" ? 200 : undefined,
    select: tenancySelect,
  });
  res.json({ data: rows.map(shape) });
});

/** Check-in: daftarkan penghuni ke kamar. Akun penghuni dibuat (atau dipakai ulang jika emailnya sudah ada). */
router.post("/", async (req, res) => {
  const { roomId, email, password, name, phone, startDate, depositPaid, bookingId, ...terms } = checkInSchema.parse(req.body);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      number: true,
      status: true,
      roomType: { select: { kos: { select: { id: true, slug: true } } } },
      tenancies: { where: { status: "ACTIVE" }, select: { id: true } },
    },
  });
  if (!room) throw invalid("roomId", "Kamar tidak ditemukan");
  await assertKosAccess(req.user!, room.roomType.kos.id);
  if (room.tenancies.length) throw invalid("roomId", `Kamar ${room.number} masih dihuni`);
  if (room.status === "MAINTENANCE") throw invalid("roomId", `Kamar ${room.number} sedang perbaikan`);

  // Check-in dari booking: booking ditautkan ke sewa dan otomatis dianggap disetujui.
  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { tenancy: { select: { id: true } } } });
    if (!booking || booking.kosId !== room.roomType.kos.id) throw invalid("roomId", "Kamar harus di cabang yang sama dengan booking");
    if (booking.tenancy) throw invalid("roomId", "Booking ini sudah didaftarkan sebagai penghuni");
    if (booking.status !== "PENDING" && booking.status !== "APPROVED") throw invalid("roomId", "Booking ini sudah ditolak atau dibatalkan");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { tenancies: { where: { status: "ACTIVE" }, select: { room: { select: { number: true } } } } },
  });
  if (existing && existing.role !== "TENANT") throw invalid("email", "Email ini dipakai akun pengelola");
  if (existing?.tenancies.length) throw invalid("email", `Penghuni ini masih menempati kamar ${existing.tenancies[0].room.number}`);
  if (!existing && !password) throw invalid("password", "Password wajib diisi untuk akun baru");

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  const depositStatus: DepositStatus = terms.depositAmount === 0 ? "NONE" : depositPaid ? "HELD" : "UNPAID";

  const tenancy = await prisma.$transaction(async (tx) => {
    const tenant = existing
      ? await tx.user.update({ where: { id: existing.id }, data: { name, phone, isActive: true, ...(passwordHash ? { passwordHash } : {}) } })
      : await tx.user.create({ data: { name, email, phone, role: "TENANT", passwordHash: passwordHash! } });
    await tx.room.update({ where: { id: room.id }, data: { status: "OCCUPIED" } });
    const created = await tx.tenancy.create({ data: { ...terms, roomId: room.id, tenantId: tenant.id, startDate, depositStatus, bookingId } });
    if (bookingId) {
      await tx.booking.updateMany({
        where: { id: bookingId, status: "PENDING" },
        data: { status: "APPROVED", handledById: req.user!.id, handledAt: new Date() },
      });
    }
    await syncDepositInvoice(tx, created);
    await createCurrentRentInvoice(tx, created.id);
    return created;
  });

  revalidatePublic(room.roomType.kos.slug);
  res.status(201).json({ data: shape(await findTenancy(tenancy.id)) });
});

router.put("/:id", async (req, res) => {
  const tenancy = await loadTenancy(req.user, Number(req.params.id));
  if (tenancy.status !== "ACTIVE") throw new HttpError(409, "Sewa yang sudah berakhir tidak bisa diubah");
  const { name, phone, password, ...terms } = updateSchema.parse(req.body);
  if (terms.depositAmount === 0) terms.depositStatus = "NONE";
  else if (terms.depositStatus === "NONE") terms.depositStatus = "UNPAID";

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: tenancy.tenantId }, data: { name, phone, ...(passwordHash ? { passwordHash } : {}) } });
    await syncDepositInvoice(tx, await tx.tenancy.update({ where: { id: tenancy.id }, data: terms }));
  });
  res.json({ data: shape(await findTenancy(tenancy.id)) });
});

/** Check-out: akhiri sewa, kamar kembali kosong, catat pengembalian deposit. */
router.post("/:id/end", async (req, res) => {
  const tenancy = await loadTenancy(req.user, Number(req.params.id));
  if (tenancy.status !== "ACTIVE") throw new HttpError(409, "Sewa ini sudah berakhir");
  const { endDate, depositStatus, depositRefundAmount, depositNote } = checkOutSchema.parse(req.body);
  if (endDate < tenancy.startDate) throw invalid("endDate", "Tanggal keluar tidak boleh sebelum tanggal masuk");

  // Deposit yang ditahan wajib diputuskan: kembali penuh, sebagian, atau hangus.
  const deposit: { depositStatus?: DepositStatus; depositRefundAmount?: number | null } = {};
  if (tenancy.depositStatus === "HELD") {
    if (!depositStatus) throw invalid("depositStatus", "Pilih nasib deposit");
    deposit.depositStatus = depositStatus;
    if (depositStatus === "REFUNDED") deposit.depositRefundAmount = tenancy.depositAmount;
    else if (depositStatus === "FORFEITED") deposit.depositRefundAmount = 0;
    else if (!depositRefundAmount || depositRefundAmount >= tenancy.depositAmount) {
      throw invalid("depositRefundAmount", "Isi jumlah yang dikembalikan (lebih kecil dari deposit)");
    } else deposit.depositRefundAmount = depositRefundAmount;
  } else if (tenancy.depositStatus === "UNPAID") {
    deposit.depositStatus = "NONE";
  }

  // Tagihan sewa periode setelah bulan keluar yang belum dibayar ikut dibatalkan.
  const endPeriod = endDate.getUTCFullYear() * 12 + endDate.getUTCMonth();
  const laterInvoices = await prisma.invoice.findMany({
    where: { tenancyId: tenancy.id, type: "RENT", status: "UNPAID" },
    select: { id: true, periodYear: true, periodMonth: true },
  });
  const cancelIds = laterInvoices.filter((i) => i.periodYear! * 12 + i.periodMonth! - 1 > endPeriod).map((i) => i.id);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.tenancy.update({ where: { id: tenancy.id }, data: { status: "ENDED", endDate, depositNote, ...deposit } });
    await tx.room.update({ where: { id: tenancy.roomId }, data: { status: "AVAILABLE" } });
    await syncDepositInvoice(tx, updated);
    if (cancelIds.length) await tx.invoice.updateMany({ where: { id: { in: cancelIds } }, data: { status: "CANCELLED" } });
  });
  revalidatePublic(tenancy.room.roomType.kos.slug);
  res.json({ data: shape(await findTenancy(tenancy.id)) });
});

export default router;

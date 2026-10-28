/**
 * Data demo 6 bulan terakhir: penghuni, sewa, tagihan, pembayaran, dan booking.
 * Dipakai untuk presentasi supaya dashboard & laporan terlihat terisi.
 *
 *   npm run db:demo -w api            → hapus data demo lama lalu isi ulang
 *   npm run db:demo -w api -- --hapus → hanya hapus data demo
 *
 * Semua data demo ditandai email @demo.smartkos.id, jadi aman dihapus tanpa menyentuh data asli.
 * Penghuni demo hanya ditempatkan di kamar yang sudah berstatus Terisi (aktif) atau Kosong (sudah keluar),
 * jadi status kamar tidak diubah.
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.ts";
import type { Prisma } from "../src/generated/prisma/client.ts";
import { depositInvoiceNumber, rentInvoiceNumber, todayWib } from "../src/lib/billing.ts";

const DEMO_DOMAIN = "demo.smartkos.id";
const PROOF_URL = "/uploads/demo/bukti-transfer.svg";
const DAY = 24 * 60 * 60 * 1000;

// Acak yang bisa diulang, supaya hasil demo sama setiap kali dijalankan.
let seed = 20261028;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const withTime = (d: Date) => new Date(d.getTime() + randInt(8, 21) * 3600_000 + randInt(0, 59) * 60_000);

const FIRST = ["Andi", "Budi", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hendra", "Indah", "Joko", "Kurnia", "Lestari", "Mega", "Nanda", "Oki", "Putri", "Rizky", "Sari", "Teguh", "Utami", "Vina", "Wahyu", "Yusuf", "Zahra", "Ayu", "Bayu", "Dimas", "Fitri", "Galih", "Hana", "Ilham", "Kevin", "Laras", "Nisa", "Raka", "Salsa", "Tiara", "Wulan", "Yoga", "Arif", "Bella", "Dina", "Farhan", "Intan", "Reza", "Siti"];
const LAST = ["Pratama", "Saputra", "Wijaya", "Lestari", "Hidayat", "Nugroho", "Kusuma", "Santoso", "Permata", "Ramadhan", "Wibowo", "Setiawan", "Anggraini", "Maharani", "Kurniawan", "Firmansyah", "Putri", "Siregar", "Harahap", "Gunawan"];
const JOBS = ["Mahasiswa", "Karyawan swasta", "Staf pabrik", "Perawat", "Guru honorer", "Desainer grafis", "Programmer", "Admin kantor", "Barista", "Pegawai bank"];
const REJECT_REASONS = ["Kamar tipe ini sudah penuh", "Tanggal masuk terlalu jauh", "Tidak bisa dihubungi", "Tidak sesuai ketentuan kos"];

const usedNames = new Set<string>();
function personName() {
  for (;;) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    if (!usedNames.has(name)) return usedNames.add(name), name;
  }
}
const emailOf = (name: string, i: number) => `${name.toLowerCase().replace(/\s+/g, ".")}.${i}@${DEMO_DOMAIN}`;
const phone = () => `628${randInt(11, 59)}${String(randInt(0, 99999999)).padStart(8, "0")}`;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const bookingCode = () => `BK${Array.from({ length: 6 }, () => pick([...CODE_CHARS])).join("")}`;

async function removeDemo() {
  const tenants = await prisma.user.findMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } }, select: { id: true } });
  const tenantIds = tenants.map((t) => t.id);
  // Tagihan & pembayaran ikut terhapus (cascade dari sewa).
  const tenancies = await prisma.tenancy.deleteMany({ where: { tenantId: { in: tenantIds } } });
  const bookings = await prisma.booking.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } });
  const users = await prisma.user.deleteMany({ where: { id: { in: tenantIds } } });
  console.log(`Data demo dihapus: ${users.count} penghuni, ${tenancies.count} sewa, ${bookings.count} booking.`);
}

type Plan = {
  roomId: number;
  kosId: number;
  roomTypeId: number;
  price: number;
  dueDays: number;
  deposit: number;
  start: Date;
  end: Date | null;
  /** Penghuni yang sering telat: 1–2 tagihan terakhir dibiarkan menunggak. */
  late: boolean;
};

async function createDemo() {
  const today = todayWib();
  const owner = await prisma.user.findFirst({ where: { role: "OWNER" }, select: { id: true } });
  const bank = await prisma.bankAccount.findFirst({ where: { isActive: true }, select: { id: true } });
  const kosList = await prisma.kos.findMany({
    where: { isPublished: true, comingSoon: false },
    select: {
      id: true,
      billingDueDays: true,
      defaultDeposit: true,
      roomTypes: { select: { id: true, monthlyPrice: true, rooms: { orderBy: { number: "asc" }, select: { id: true, status: true, _count: { select: { tenancies: true } } } } } },
    },
  });

  // Hari pertama 7 bulan lalu: sebagian penghuni sudah tinggal sebelum jendela 6 bulan dashboard.
  const windowStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
  const earliest = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 8, 1));
  const randomDate = (from: Date, to: Date) => new Date(Date.UTC(1970, 0, 1) + Math.floor((from.getTime() + rand() * (to.getTime() - from.getTime())) / DAY) * DAY);

  const plans: Plan[] = [];
  for (const kos of kosList) {
    for (const type of kos.roomTypes) {
      for (const room of type.rooms) {
        if (room._count.tenancies) continue; // kamar dengan riwayat sewa asli tidak disentuh
        const base = { roomId: room.id, kosId: kos.id, roomTypeId: type.id, price: type.monthlyPrice, dueDays: kos.billingDueDays, deposit: kos.defaultDeposit };
        if (room.status === "OCCUPIED") {
          // 40% sudah tinggal sebelum jendela dashboard, sisanya masuk merata 6 bulan terakhir.
          const start = rand() < 0.4 ? randomDate(earliest, windowStart) : randomDate(windowStart, addDays(today, -3));
          plans.push({ ...base, start, end: null, late: rand() < 0.12 });
        } else if (room.status === "AVAILABLE" && rand() < 0.3) {
          // Mantan penghuni: sempat tinggal lalu keluar dalam 6 bulan terakhir.
          const start = randomDate(earliest, addDays(windowStart, 60));
          const end = randomDate(new Date(Math.max(addDays(start, 75).getTime(), windowStart.getTime())), addDays(today, -5));
          if (end > start) plans.push({ ...base, start, end, late: false });
        }
      }
    }
  }

  // ---------- Penghuni ----------
  const passwordHash = await bcrypt.hash("password123", 10);
  const people = plans.map((_, i) => {
    const name = personName();
    return { name, email: emailOf(name, i), phone: phone(), passwordHash, role: "TENANT" as const, createdAt: addDays(plans[i].start, -randInt(3, 14)) };
  });
  await prisma.user.createMany({ data: people });
  const users = await prisma.user.findMany({ where: { email: { in: people.map((p) => p.email) } }, select: { id: true, email: true } });
  const userId = new Map(users.map((u) => [u.email, u.id]));

  // ---------- Booking yang berujung sewa ----------
  const bookingRows: Prisma.BookingCreateManyInput[] = plans.map((p, i) => {
    const created = withTime(addDays(p.start, -randInt(5, 21)));
    return {
      code: bookingCode(),
      kosId: p.kosId,
      roomTypeId: p.roomTypeId,
      name: people[i].name,
      email: people[i].email,
      phone: people[i].phone,
      occupation: pick(JOBS),
      moveInDate: p.start,
      status: "APPROVED" as const,
      handledById: owner?.id ?? null,
      handledAt: addDays(created, randInt(0, 2)),
      createdAt: created,
    };
  });

  // ---------- Booking lain: ditolak, batal, dan yang masih menunggu ----------
  const roomTypes = kosList.flatMap((k) => k.roomTypes.map((t) => ({ kosId: k.id, roomTypeId: t.id })));
  const extra = (status: "PENDING" | "REJECTED" | "CANCELLED", created: Date) => {
    const name = personName();
    const t = pick(roomTypes);
    return {
      code: bookingCode(),
      ...t,
      name,
      email: emailOf(name, 1000 + bookingRows.length),
      phone: phone(),
      occupation: pick(JOBS),
      moveInDate: addDays(created, randInt(7, 30)),
      message: rand() < 0.4 ? "Apakah masih ada kamar kosong? Saya mau survei dulu." : null,
      status,
      rejectReason: status === "REJECTED" ? pick(REJECT_REASONS) : null,
      handledById: status === "PENDING" ? null : (owner?.id ?? null),
      handledAt: status === "PENDING" ? null : addDays(created, 1),
      createdAt: created,
    };
  };
  for (let i = 0; i < 10; i++) bookingRows.push(extra("REJECTED", withTime(randomDate(windowStart, addDays(today, -4)))));
  for (let i = 0; i < 7; i++) bookingRows.push(extra("CANCELLED", withTime(randomDate(windowStart, addDays(today, -4)))));
  for (let i = 0; i < 4; i++) bookingRows.push(extra("PENDING", withTime(randomDate(addDays(today, -4), today))));
  await prisma.booking.createMany({ data: bookingRows });
  const bookings = await prisma.booking.findMany({ where: { email: { in: people.map((p) => p.email) } }, select: { id: true, email: true } });
  const bookingId = new Map(bookings.map((b) => [b.email, b.id]));

  // ---------- Sewa, tagihan, pembayaran ----------
  let invoiceCount = 0;
  let paymentCount = 0;
  for (const [i, p] of plans.entries()) {
    const ended = p.end !== null;
    const refund = ended ? (rand() < 0.75 ? p.deposit : Math.round((p.deposit * 0.6) / 50_000) * 50_000) : null;
    const tenancy = await prisma.tenancy.create({
      data: {
        roomId: p.roomId,
        tenantId: userId.get(people[i].email)!,
        bookingId: bookingId.get(people[i].email),
        startDate: p.start,
        endDate: p.end,
        monthlyPrice: p.price,
        billingDay: Math.min(p.start.getUTCDate(), 28),
        depositAmount: p.deposit,
        depositStatus: p.deposit === 0 ? "NONE" : !ended ? "HELD" : refund === p.deposit ? "REFUNDED" : "PARTIAL_REFUNDED",
        depositRefundAmount: refund && p.deposit ? refund : null,
        depositNote: refund !== null && refund < p.deposit ? "Dipotong biaya perbaikan kerusakan" : null,
        status: ended ? "ENDED" : "ACTIVE",
        createdAt: p.start,
      },
    });

    type Inv = { number: string; type: "RENT" | "DEPOSIT"; periodYear: number | null; periodMonth: number | null; amount: number; dueDate: Date; issued: Date; status: "UNPAID" | "WAITING_VERIFICATION" | "PAID" };
    const invoices: Inv[] = [];
    if (p.deposit > 0) {
      invoices.push({ number: depositInvoiceNumber(tenancy.id), type: "DEPOSIT", periodYear: null, periodMonth: null, amount: p.deposit, dueDate: p.start, issued: addDays(p.start, -3), status: "PAID" });
    }
    const last = p.end ?? today;
    for (let y = p.start.getUTCFullYear(), m = p.start.getUTCMonth() + 1; y * 12 + m <= last.getUTCFullYear() * 12 + last.getUTCMonth() + 1; m === 12 ? (y++, (m = 1)) : m++) {
      const issued = new Date(Math.max(Date.UTC(y, m - 1, Math.min(p.start.getUTCDate(), 28)), p.start.getTime()));
      if (issued > today || (p.end && issued > p.end)) break;
      invoices.push({ number: rentInvoiceNumber(tenancy.id, y, m), type: "RENT", periodYear: y, periodMonth: m, amount: p.price, dueDate: addDays(issued, p.dueDays), issued, status: "PAID" });
    }
    // Status tagihan sewa: yang lama lunas, yang terbaru campuran.
    const rent = invoices.filter((inv) => inv.type === "RENT");
    rent.forEach((inv, idx) => {
      const fromEnd = rent.length - 1 - idx;
      if (ended) return;
      if (p.late && fromEnd <= 1) inv.status = "UNPAID";
      else if (fromEnd === 0 && inv.issued > addDays(today, -35)) {
        const r = rand();
        inv.status = r < 0.55 ? "PAID" : r < 0.72 ? "WAITING_VERIFICATION" : "UNPAID";
      }
    });

    await prisma.invoice.createMany({
      data: invoices.map(({ issued, ...inv }) => {
        const paidAt = inv.status === "PAID" ? withTime(new Date(Math.min(addDays(issued, randInt(0, p.dueDays + 2)).getTime(), today.getTime()))) : null;
        return { ...inv, tenancyId: tenancy.id, paidAt, createdAt: issued };
      }),
    });
    invoiceCount += invoices.length;

    const saved = await prisma.invoice.findMany({ where: { tenancyId: tenancy.id }, select: { id: true, amount: true, status: true, paidAt: true, createdAt: true } });
    const payments = saved.flatMap((inv): Prisma.PaymentCreateManyInput[] => {
      const sender = people[i].name;
      if (inv.status === "WAITING_VERIFICATION") {
        return [{ invoiceId: inv.id, bankAccountId: bank?.id ?? null, amount: inv.amount, proofUrl: PROOF_URL, senderName: sender, transferDate: addDays(today, -randInt(0, 2)), status: "PENDING" as const, createdAt: withTime(addDays(today, -randInt(0, 2))) }];
      }
      if (inv.status !== "PAID" || !inv.paidAt) return [];
      const transferDate = new Date(Date.UTC(inv.paidAt.getUTCFullYear(), inv.paidAt.getUTCMonth(), inv.paidAt.getUTCDate()));
      const approved = {
        invoiceId: inv.id,
        bankAccountId: bank?.id ?? null,
        amount: inv.amount,
        proofUrl: PROOF_URL,
        senderName: sender,
        transferDate,
        status: "APPROVED" as const,
        verifiedById: owner?.id ?? null,
        verifiedAt: new Date(inv.paidAt.getTime()),
        createdAt: new Date(inv.paidAt.getTime() - randInt(1, 6) * 3600_000),
      };
      // Sesekali ada bukti yang sempat ditolak sebelum yang benar dikirim.
      if (rand() < 0.06) {
        const rejectedAt = new Date(approved.createdAt.getTime() - DAY);
        return [
          { ...approved, status: "REJECTED" as const, note: "Bukti transfer buram, mohon kirim ulang", createdAt: rejectedAt, verifiedAt: new Date(rejectedAt.getTime() + 3 * 3600_000) },
          approved,
        ];
      }
      return [approved];
    });
    if (payments.length) await prisma.payment.createMany({ data: payments });
    paymentCount += payments.length;
  }

  const active = plans.filter((p) => !p.end).length;
  console.log(
    `Data demo dibuat: ${plans.length} penghuni (${active} aktif, ${plans.length - active} sudah keluar), ` +
      `${invoiceCount} tagihan, ${paymentCount} pembayaran, ${bookingRows.length} booking.`,
  );
  console.log(`Login penghuni demo: email mana pun berakhiran @${DEMO_DOMAIN}, password "password123".`);
}

await removeDemo();
if (!process.argv.includes("--hapus")) await createDemo();
await prisma.$disconnect();

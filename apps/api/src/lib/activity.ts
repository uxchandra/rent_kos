import type { Request, RequestHandler } from "express";
import { prisma } from "./prisma.ts";

/** Kalimat log per endpoint. Kunci: "METHOD /pola-route" relatif terhadap /api/admin. */
const labels: Record<string, string> = {
  "POST /kos": "Menambah cabang",
  "PUT /kos/:id": "Mengubah info cabang",
  "DELETE /kos/:id": "Menghapus cabang",
  "POST /kos/:id/cover": "Mengganti foto cover",
  "POST /kos/:id/photos": "Menambah foto cabang",
  "PATCH /kos/:id/photos/:photoId": "Mengubah keterangan foto",
  "POST /kos/:id/photos/:photoId/cover": "Menjadikan foto sebagai cover",
  "DELETE /kos/:id/photos/:photoId": "Menghapus foto cabang",
  "PUT /kos/:id/admins": "Mengatur pengelola cabang",
  "POST /kos/:kosId/room-types": "Menambah tipe kamar",
  "PUT /room-types/:id": "Mengubah tipe kamar",
  "DELETE /room-types/:id": "Menghapus tipe kamar",
  "POST /room-types/:id/photos": "Menambah foto tipe kamar",
  "POST /room-types/:id/photos/:photoId/primary": "Mengganti foto utama tipe kamar",
  "DELETE /room-types/:id/photos/:photoId": "Menghapus foto tipe kamar",
  "POST /room-types/:id/rooms": "Menambah kamar",
  "PUT /rooms/:id": "Mengubah data kamar",
  "PATCH /rooms/:id/status": "Mengubah status kamar",
  "DELETE /rooms/:id": "Menghapus kamar",
  "POST /bookings/:id/approve": "Menyetujui booking",
  "POST /bookings/:id/reject": "Menolak booking",
  "POST /bookings/:id/cancel": "Membatalkan booking",
  "POST /tenancies": "Mendaftarkan penghuni",
  "PUT /tenancies/:id": "Mengubah ketentuan sewa",
  "POST /tenancies/:id/end": "Memproses check-out",
  "POST /invoices/generate": "Menerbitkan tagihan bulanan",
  "PUT /invoices/:id": "Mengubah tagihan",
  "POST /invoices/:id/pay": "Menandai tagihan lunas",
  "POST /invoices/:id/unpay": "Membatalkan status lunas",
  "POST /invoices/:id/cancel": "Membatalkan tagihan",
  "POST /invoices/:id/reminded": "Mengirim pengingat tagihan",
  "POST /payments/:id/approve": "Menyetujui pembayaran",
  "POST /payments/:id/reject": "Menolak pembayaran",
  "POST /bank-accounts": "Menambah rekening",
  "PUT /bank-accounts/:id": "Mengubah rekening",
  "DELETE /bank-accounts/:id": "Menghapus rekening",
  "POST /users": "Membuat akun pengguna",
  "PUT /users/:id": "Mengubah akun pengguna",
  "DELETE /users/:id": "Menghapus akun pengguna",
  "POST /users/:id/reset-password": "Mereset password pengguna",
  "PATCH /users/:id/status": "Mengubah status akun",
  "POST /roles": "Membuat peran",
  "PUT /roles/:id": "Mengubah peran & izin",
  "DELETE /roles/:id": "Menghapus peran",
};

// "PUT /kos/:id" → regex untuk dicocokkan dengan path request sebenarnya.
const labelPatterns = Object.entries(labels).map(([key, label]) => {
  const [method, pattern] = key.split(" ");
  return { key, label, method, re: new RegExp(`^${pattern.replace(/:[a-zA-Z]+/g, String.raw`\d+`)}/?$`) };
});

function labelFor(method: string, path: string) {
  return labelPatterns.find((l) => l.method === method && l.re.test(path)) ?? { key: `${method} ${path}`, label: "Mengubah data" };
}

/** Nama objek yang mudah dibaca, diambil sebelum aksi (agar tetap ada walau datanya dihapus). */
async function describeTarget(resource: string, id: number): Promise<string | null> {
  switch (resource) {
    case "kos": {
      const k = await prisma.kos.findUnique({ where: { id }, select: { name: true } });
      return k?.name ?? null;
    }
    case "room-types": {
      const t = await prisma.roomType.findUnique({ where: { id }, select: { name: true, kos: { select: { name: true } } } });
      return t ? `Tipe ${t.name} · ${t.kos.name}` : null;
    }
    case "rooms": {
      const r = await prisma.room.findUnique({ where: { id }, select: { number: true, roomType: { select: { kos: { select: { name: true } } } } } });
      return r ? `Kamar ${r.number} · ${r.roomType.kos.name}` : null;
    }
    case "bookings": {
      const b = await prisma.booking.findUnique({ where: { id }, select: { name: true, code: true } });
      return b ? `${b.name} (${b.code})` : null;
    }
    case "tenancies": {
      const t = await prisma.tenancy.findUnique({ where: { id }, select: { tenant: { select: { name: true } }, room: { select: { number: true } } } });
      return t ? `${t.tenant.name} · Kamar ${t.room.number}` : null;
    }
    case "invoices": {
      const i = await prisma.invoice.findUnique({ where: { id }, select: { number: true, tenancy: { select: { tenant: { select: { name: true } } } } } });
      return i ? `${i.number} · ${i.tenancy.tenant.name}` : null;
    }
    case "payments": {
      const p = await prisma.payment.findUnique({ where: { id }, select: { amount: true, invoice: { select: { number: true } } } });
      return p ? `Pembayaran ${p.invoice.number}` : null;
    }
    case "bank-accounts": {
      const a = await prisma.bankAccount.findUnique({ where: { id }, select: { bankName: true, accountNumber: true } });
      return a ? `${a.bankName} ${a.accountNumber}` : null;
    }
    case "users": {
      const u = await prisma.user.findUnique({ where: { id }, select: { name: true } });
      return u?.name ?? null;
    }
    case "roles": {
      const r = await prisma.staffRole.findUnique({ where: { id }, select: { name: true } });
      return r ? `Peran ${r.name}` : null;
    }
    default:
      return null;
  }
}

// Field body yang aman & berguna untuk dicatat.
const META_FIELDS = ["status", "reason", "note", "amount", "monthlyPrice", "isActive", "isPublished", "comingSoon", "year", "month"];

function pickMeta(req: Request) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const meta: Record<string, unknown> = {};
  for (const f of META_FIELDS) if (f in body && body[f] !== "" && body[f] !== undefined) meta[f] = body[f];
  return Object.keys(meta).length ? meta : undefined;
}

/** Simpan satu baris log. Gagal mencatat tidak boleh menggagalkan aksi utama. */
export async function logActivity(entry: { userId: number | null; userName: string; action: string; label: string; target?: string | null; meta?: object; ip?: string }) {
  try {
    await prisma.activityLog.create({ data: { ...entry, target: entry.target ?? null, meta: entry.meta } });
  } catch (err) {
    console.warn("Gagal mencatat aktivitas:", (err as Error).message);
  }
}

/** Middleware di /api/admin: catat setiap aksi POST/PUT/PATCH/DELETE yang berhasil. */
export const activityLogger: RequestHandler = async (req, res, next) => {
  if (req.method === "GET" || !req.user) return next();

  const match = req.path.match(/^\/([a-z-]+)\/(\d+)/);
  const target = match ? await describeTarget(match[1], Number(match[2])).catch(() => null) : null;
  const fallbackTarget = match ? `${match[1]} #${match[2]}` : null;

  // Dicatat sekarang: req.path relatif terhadap /api/admin di titik ini.
  const { key, label } = labelFor(req.method, req.path);

  res.on("finish", () => {
    if (res.statusCode >= 400) return;
    void logActivity({
      userId: req.user!.id,
      userName: req.user!.name,
      action: key,
      label,
      target: target ?? (res.locals.activityTarget as string | undefined) ?? fallbackTarget,
      meta: pickMeta(req),
      ip: req.ip,
    });
  });
  next();
};

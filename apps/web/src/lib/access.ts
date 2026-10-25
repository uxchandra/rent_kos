/**
 * Izin yang dibutuhkan untuk membuka halaman admin. Cermin dari aturan di API
 * (apps/api/src/lib/permissions.ts); server tetap yang menentukan, ini hanya agar
 * menu dan halaman yang tidak boleh dibuka tidak tampil.
 *
 * - string[]: cukup punya salah satu izin
 * - "owner": khusus Owner
 * - "staff": semua akun staf
 */
export type PageAccess = string[] | "owner" | "staff";

const pages: { match: RegExp; need: PageAccess }[] = [
  { match: /^\/admin$/, need: ["dashboard.view"] },
  { match: /^\/admin\/kamar/, need: ["rooms.view"] },
  { match: /^\/admin\/booking/, need: ["bookings.view"] },
  { match: /^\/admin\/penghuni/, need: ["tenants.view"] },
  { match: /^\/admin\/tagihan/, need: ["invoices.view"] },
  { match: /^\/admin\/pembayaran/, need: ["payments.view"] },
  { match: /^\/admin\/laporan/, need: ["reports.view"] },
  { match: /^\/admin\/kos\/baru/, need: "owner" },
  { match: /^\/admin\/kos\/\d+/, need: ["kos.view"] },
  { match: /^\/admin\/kos$/, need: "staff" },
  { match: /^\/admin\/(pengguna|peran|aktivitas|pengelola)/, need: "owner" },
  { match: /^\/admin\/akun/, need: "staff" },
];

export function pageAccess(pathname: string): PageAccess {
  return pages.find((p) => p.match.test(pathname))?.need ?? "owner";
}

export function allowed(need: PageAccess, ctx: { isOwner: boolean; can: (...p: string[]) => boolean }) {
  if (ctx.isOwner || need === "staff") return true;
  if (need === "owner") return false;
  return ctx.can(...need);
}

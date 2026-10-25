/**
 * Izin akses admin panel.
 *
 * - OWNER selalu punya semua izin (termasuk yang khusus Owner di bawah).
 * - ADMIN mendapat izin dari peran (StaffRole) yang ditugaskan, dan tetap dibatasi ke cabang yang ia kelola.
 * - Endpoint admin yang tidak tercantum di `rules` DITOLAK untuk ADMIN (default deny).
 */

export const permissionGroups = [
  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [{ key: "dashboard.view", label: "Lihat ringkasan" }],
  },
  {
    key: "rooms",
    label: "Papan kamar",
    permissions: [
      { key: "rooms.view", label: "Lihat status kamar" },
      { key: "rooms.update", label: "Ubah status kamar" },
    ],
  },
  {
    key: "bookings",
    label: "Booking",
    permissions: [
      { key: "bookings.view", label: "Lihat pengajuan" },
      { key: "bookings.manage", label: "Setujui, tolak, batalkan" },
    ],
  },
  {
    key: "tenants",
    label: "Penghuni",
    permissions: [
      { key: "tenants.view", label: "Lihat penghuni" },
      { key: "tenants.create", label: "Daftarkan penghuni" },
      { key: "tenants.update", label: "Ubah ketentuan sewa" },
      { key: "tenants.checkout", label: "Proses check-out" },
    ],
  },
  {
    key: "invoices",
    label: "Tagihan",
    permissions: [
      { key: "invoices.view", label: "Lihat tagihan" },
      { key: "invoices.manage", label: "Terbitkan, ubah, tandai lunas, batalkan" },
    ],
  },
  {
    key: "payments",
    label: "Pembayaran",
    permissions: [
      { key: "payments.view", label: "Lihat bukti transfer" },
      { key: "payments.verify", label: "Setujui atau tolak pembayaran" },
    ],
  },
  {
    key: "reports",
    label: "Laporan",
    permissions: [{ key: "reports.view", label: "Lihat laporan keuangan" }],
  },
  {
    key: "kos",
    label: "Cabang",
    permissions: [
      { key: "kos.view", label: "Lihat detail cabang" },
      { key: "kos.update", label: "Ubah info, foto, tipe kamar, dan kamar" },
    ],
  },
] as const;

export type Permission = (typeof permissionGroups)[number]["permissions"][number]["key"];

export const ALL_PERMISSIONS: Permission[] = permissionGroups.flatMap((g) => g.permissions.map((p) => p.key));

/** Hal yang tidak bisa diberikan lewat peran; hanya Owner. Ditampilkan di editor peran sebagai info. */
export const OWNER_ONLY = [
  "Membuat dan menghapus cabang",
  "Mengubah alamat website (slug) dan status tayang cabang",
  "Mengelola rekening bank",
  "Mengelola pengguna, peran, dan melihat log aktivitas",
];

export const isPermission = (v: string): v is Permission => (ALL_PERMISSIONS as string[]).includes(v);

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
/** `anyOf`: cukup punya salah satu izin. `"owner"`: hanya Owner. `"staff"`: semua akun staf. */
type Rule = { methods: Method[] | "*"; path: RegExp; need: Permission[] | "owner" | "staff" };

const MUTATE: Method[] = ["POST", "PUT", "PATCH", "DELETE"];
const id = String.raw`\d+`;

// Path relatif terhadap /api/admin. Urutan penting: aturan pertama yang cocok dipakai.
export const rules: Rule[] = [
  { methods: ["GET"], path: /^\/dashboard\/?$/, need: ["dashboard.view"] },

  // Daftar cabang dipakai sidebar & filter di banyak halaman (hanya cabang yang ia kelola).
  { methods: ["GET"], path: /^\/kos\/?$/, need: "staff" },
  { methods: ["GET"], path: new RegExp(`^/kos/${id}$`), need: ["kos.view"] },
  { methods: ["POST"], path: /^\/kos\/?$/, need: "owner" },
  { methods: ["DELETE"], path: new RegExp(`^/kos/${id}$`), need: "owner" },
  { methods: ["PUT"], path: new RegExp(`^/kos/${id}/admins$`), need: "owner" },
  // Status kamar harus dicek sebelum aturan umum /rooms/:id di bawah.
  { methods: ["PATCH"], path: new RegExp(`^/rooms/${id}/status$`), need: ["rooms.update", "kos.update"] },
  { methods: MUTATE, path: new RegExp(`^/kos/${id}(/.*)?$`), need: ["kos.update"] },
  { methods: MUTATE, path: /^\/(room-types|rooms)\/\d+(\/.*)?$/, need: ["kos.update"] },

  // Papan kamar; daftar kamar juga dibutuhkan saat mendaftarkan penghuni.
  { methods: ["GET"], path: /^\/rooms\/?$/, need: ["rooms.view", "tenants.create"] },

  { methods: ["GET"], path: /^\/bookings\/?$/, need: ["bookings.view"] },
  { methods: ["GET"], path: new RegExp(`^/bookings/${id}$`), need: ["bookings.view", "tenants.create"] },
  { methods: ["POST"], path: new RegExp(`^/bookings/${id}/(approve|reject|cancel)$`), need: ["bookings.manage"] },

  { methods: ["GET"], path: /^\/tenancies(\/.*)?$/, need: ["tenants.view"] },
  { methods: ["POST"], path: /^\/tenancies\/?$/, need: ["tenants.create"] },
  { methods: ["POST"], path: new RegExp(`^/tenancies/${id}/end$`), need: ["tenants.checkout"] },
  { methods: ["PUT"], path: new RegExp(`^/tenancies/${id}$`), need: ["tenants.update"] },

  { methods: ["GET"], path: /^\/invoices(\/.*)?$/, need: ["invoices.view"] },
  { methods: MUTATE, path: /^\/invoices(\/.*)?$/, need: ["invoices.manage"] },

  { methods: ["GET"], path: /^\/payments(\/.*)?$/, need: ["payments.view"] },
  { methods: ["POST"], path: new RegExp(`^/payments/${id}/(approve|reject)$`), need: ["payments.verify"] },

  // Rekening dilihat saat verifikasi pembayaran; mengubahnya khusus Owner.
  { methods: ["GET"], path: /^\/bank-accounts\/?$/, need: ["payments.view"] },
  { methods: MUTATE, path: /^\/bank-accounts(\/.*)?$/, need: "owner" },

  { methods: ["GET"], path: /^\/reports(\/.*)?$/, need: ["reports.view"] },

  { methods: "*", path: /^\/(users|roles|activity|permissions)(\/.*)?$/, need: "owner" },
];

export function findRule(method: string, path: string): Rule | undefined {
  return rules.find((r) => (r.methods === "*" || (r.methods as string[]).includes(method)) && r.path.test(path));
}

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.ts";
import { ALL_PERMISSIONS } from "../src/lib/permissions.ts";

// Foto contoh dari Unsplash (lisensi bebas), disimpan di apps/web/public/uploads/seed (disajikan Next.js).
const img = (name: string) => `/uploads/seed/${name}.jpg`;

type SeedRoomType = {
  name: string;
  description: string;
  monthlyPrice: number;
  size: string;
  facilities: string[];
  photos: string[];
  rooms: { number: string; floor: number; status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" }[];
};

/**
 * Nomor kamar berurutan per lantai (101–110, 201–...). `start` untuk melanjutkan nomor dari tipe sebelumnya,
 * `occupied` = berapa kamar pertama yang sudah terisi.
 */
const rooms = (count: number, { start = 1, occupied = 0 } = {}): SeedRoomType["rooms"] =>
  Array.from({ length: count }, (_, i) => {
    const n = start + i;
    const floor = Math.floor((n - 1) / 10) + 1;
    return { number: `${floor}${String(((n - 1) % 10) + 1).padStart(2, "0")}`, floor, status: i < occupied ? ("OCCUPIED" as const) : ("AVAILABLE" as const) };
  });

const commonFacilities = ["WiFi 24 jam", "Parkir motor", "CCTV 24 jam", "Dapur bersama", "Ruang tamu", "Penjaga kos"];
const commonRules =
  "Tamu lawan jenis hanya sampai ruang tamu.\nTamu menginap wajib izin pengelola.\nDilarang merokok di dalam kamar.\nMenjaga kebersihan area bersama setelah dipakai.";

// Data cabang SmartKos (jumlah kamar sesuai data owner, 27 Okt 2026).
// Alamat lengkap, koordinat peta, harga, dan foto masih sementara: lengkapi lewat admin panel.
const kosData: {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  province: string | null;
  gender: "PUTRA" | "PUTRI" | "CAMPUR";
  whatsapp: string;
  defaultDeposit: number;
  coverImage: string;
  /** Judul kartu cabang di beranda + foto landmark daerahnya. */
  area: string;
  areaImage?: string;
  areaImageCredit?: string;
  comingSoon?: boolean;
  photos: { url: string; caption: string }[];
  facilities: string[];
  rules: string;
  admin?: { name: string; email: string; phone: string };
  types: SeedRoomType[];
}[] = [
  {
    slug: "cikarang",
    name: "SmartKos Meadow Lippo Cikarang",
    tagline: "Kos di kawasan Meadow, Lippo Cikarang",
    description: "SmartKos Meadow Lippo Cikarang punya 11 kamar di kawasan Lippo Cikarang, Kabupaten Bekasi.",
    address: "Meadow, Lippo Cikarang, Kabupaten Bekasi",
    city: "Cikarang",
    province: "Jawa Barat",
    gender: "CAMPUR",
    whatsapp: "6281200000003",
    defaultDeposit: 500_000,
    coverImage: img("bandung-cover"),
    area: "Lippo Cikarang",
    areaImage: img("area-lippo-cikarang"),
    areaImageCredit: "Foto: Medelam, CC BY-SA 4.0, Wikimedia Commons (dipotong)",
    photos: [
      { url: img("bandung-living"), caption: "Ruang bersama" },
      { url: img("bandung-kitchen"), caption: "Dapur bersama" },
      { url: img("bandung-dlx-1"), caption: "Kamar" },
    ],
    facilities: commonFacilities,
    rules: commonRules,
    admin: { name: "Dimas Prasetyo", email: "admin.cikarang@smartkos.id", phone: "6281200000003" },
    types: [
      {
        name: "Standar",
        description: "Kamar dengan kasur, lemari, dan meja.",
        monthlyPrice: 1_200_000,
        size: "3 x 3 m",
        facilities: ["Kasur", "Lemari", "Meja & kursi", "Kipas angin"],
        photos: [img("bandung-std-1"), img("bandung-std-2")],
        rooms: rooms(6, { occupied: 4 }),
      },
      {
        name: "AC",
        description: "Kamar dengan AC dan kamar mandi dalam.",
        monthlyPrice: 1_600_000,
        size: "3 x 4 m",
        facilities: ["AC", "Kamar mandi dalam", "Kasur", "Lemari", "Meja & kursi"],
        photos: [img("bandung-dlx-1"), img("bandung-dlx-2")],
        rooms: rooms(5, { start: 7, occupied: 3 }),
      },
    ],
  },
  {
    slug: "jogja",
    name: "SmartKos Danunegaran",
    tagline: "Kos di Danunegaran, Yogyakarta",
    description: "SmartKos Danunegaran punya 19 kamar di daerah Danunegaran, Mantrijeron, Kota Yogyakarta.",
    address: "Danunegaran, Mantrijeron, Kota Yogyakarta",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
    gender: "CAMPUR",
    whatsapp: "6281200000002",
    defaultDeposit: 500_000,
    coverImage: img("jogja-cover"),
    area: "Yogyakarta",
    areaImage: img("area-yogyakarta"),
    areaImageCredit: "Foto: Chainwit., CC BY 4.0, Wikimedia Commons (dipotong)",
    photos: [
      { url: img("jogja-lounge"), caption: "Ruang bersama" },
      { url: img("jogja-kitchen"), caption: "Dapur bersama" },
      { url: img("jogja-bath"), caption: "Kamar mandi" },
    ],
    facilities: commonFacilities,
    rules: commonRules,
    admin: { name: "Rina Wulandari", email: "admin.jogja@smartkos.id", phone: "6281200000002" },
    types: [
      {
        name: "Standar",
        description: "Kamar dengan kasur, lemari, dan meja. Kamar mandi luar.",
        monthlyPrice: 900_000,
        size: "3 x 3 m",
        facilities: ["Kasur", "Lemari", "Meja & kursi", "Kipas angin", "Kamar mandi luar"],
        photos: [img("jogja-std-1"), img("jogja-std-2")],
        rooms: rooms(11, { occupied: 8 }),
      },
      {
        name: "Premium",
        description: "Kamar lebih luas dengan AC dan kamar mandi dalam.",
        monthlyPrice: 1_400_000,
        size: "3 x 4 m",
        facilities: ["AC", "Kamar mandi dalam", "Kasur", "Lemari", "Meja & kursi"],
        photos: [img("jogja-prem-1"), img("jogja-prem-2"), img("jogja-prem-3")],
        rooms: rooms(8, { start: 12, occupied: 6 }),
      },
    ],
  },
  {
    slug: "jababeka",
    name: "SmartKos Merak Jababeka",
    tagline: "Kos di kawasan Merak, Jababeka",
    description: "SmartKos Merak Jababeka punya 6 kamar di kawasan Jababeka, Cikarang, Kabupaten Bekasi.",
    address: "Merak, Kota Jababeka, Cikarang, Kabupaten Bekasi",
    city: "Cikarang",
    province: "Jawa Barat",
    gender: "CAMPUR",
    whatsapp: "6281200000003",
    defaultDeposit: 500_000,
    coverImage: img("jakarta-cover"),
    area: "Jababeka",
    areaImage: img("area-jababeka"),
    areaImageCredit: "Foto: Bureau of Marketing President University, CC BY 4.0, Wikimedia Commons (dipotong)",
    photos: [
      { url: img("jakarta-lounge"), caption: "Ruang bersama" },
      { url: img("jakarta-pantry"), caption: "Dapur bersama" },
    ],
    facilities: commonFacilities,
    rules: commonRules,
    admin: { name: "Dimas Prasetyo", email: "admin.cikarang@smartkos.id", phone: "6281200000003" },
    types: [
      {
        name: "Standar",
        description: "Kamar dengan kasur, lemari, dan meja.",
        monthlyPrice: 1_100_000,
        size: "3 x 3 m",
        facilities: ["Kasur", "Lemari", "Meja & kursi", "Kipas angin"],
        photos: [img("jakarta-exec-1"), img("jakarta-exec-2")],
        rooms: rooms(6, { occupied: 4 }),
      },
    ],
  },
  {
    slug: "madiun",
    name: "SmartKos Jl. Bangka Madiun",
    tagline: "Kos di Jl. Bangka, Kota Madiun",
    description: "SmartKos Jl. Bangka punya 5 kamar di Kota Madiun.",
    address: "Jl. Bangka, Kota Madiun",
    city: "Madiun",
    province: "Jawa Timur",
    gender: "CAMPUR",
    whatsapp: "6281200000004",
    defaultDeposit: 500_000,
    coverImage: img("about-room"),
    area: "Madiun",
    areaImage: img("area-madiun"),
    areaImageCredit: "Foto: Indonesiagood, CC BY 4.0, Wikimedia Commons (dipotong)",
    photos: [
      { url: img("about-lounge"), caption: "Ruang bersama" },
      { url: img("about-kitchen"), caption: "Dapur bersama" },
    ],
    facilities: commonFacilities,
    rules: commonRules,
    admin: { name: "Asep Hidayat", email: "admin.madiun@smartkos.id", phone: "6281200000004" },
    types: [
      {
        name: "Standar",
        description: "Kamar dengan kasur, lemari, dan meja.",
        monthlyPrice: 800_000,
        size: "3 x 3 m",
        facilities: ["Kasur", "Lemari", "Meja & kursi", "Kipas angin"],
        photos: [img("jogja-std-2"), img("jogja-std-1")],
        rooms: rooms(5, { occupied: 3 }),
      },
    ],
  },

  // Segera hadir (tahap 1 dan 2): tampil di website, tapi belum bisa diajukan sewa.
  ...[
    {
      slug: "tamsos-blok-i",
      name: "SmartKos Tamsos Blok I",
      count: 32,
      cover: "jakarta-corridor",
      area: "Taman Sentosa Blok I",
      address: "Perumahan Taman Sentosa Blok I, Cikarang, Kabupaten Bekasi",
      city: "Cikarang",
    },
    {
      slug: "pocin",
      name: "SmartKos Pocin",
      count: 18,
      cover: "hero-living",
      area: "Pondok Cina",
      address: "Pondok Cina, Beji, Kota Depok",
      city: "Depok",
      areaImage: img("area-pondok-cina"),
      areaImageCredit: "Foto: Ilham Kuniawan Gumilang, CC BY-SA 4.0, Wikimedia Commons (dipotong)",
    },
    {
      slug: "tamsos-blok-a",
      name: "SmartKos Tamsos Blok A",
      count: 32,
      cover: "jakarta-lobby",
      area: "Taman Sentosa Blok A",
      address: "Perumahan Taman Sentosa Blok A, Cikarang, Kabupaten Bekasi",
      city: "Cikarang",
    },
  ].map(
    ({
      slug,
      name,
      count,
      cover,
      area,
      address,
      city,
      areaImage,
      areaImageCredit,
    }: {
      slug: string;
      name: string;
      count: number;
      cover: string;
      area: string;
      address: string;
      city: string;
      areaImage?: string;
      areaImageCredit?: string;
    }) => ({
      slug,
      name,
      tagline: `${count} kamar, segera dibuka`,
      description: `${name} sedang disiapkan dan akan punya ${count} kamar.`,
      address,
      city,
      province: "Jawa Barat",
      area,
      areaImage,
      areaImageCredit,
      gender: "CAMPUR" as const,
      whatsapp: "6281200000001",
      defaultDeposit: 500_000,
      coverImage: img(cover),
      comingSoon: true,
      photos: [],
      facilities: commonFacilities,
      rules: commonRules,
      types: [
        {
          name: "Standar",
          description: "Detail kamar menyusul.",
          monthlyPrice: 1_000_000,
          size: "3 x 3 m",
          facilities: [],
          photos: [],
          rooms: rooms(count),
        },
      ],
    }),
  ),
];

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  // Peran bawaan untuk akun admin (lihat src/lib/permissions.ts).
  const adminRole = await prisma.staffRole.upsert({
    where: { name: "Admin Cabang" },
    update: {},
    create: { name: "Admin Cabang", description: "Mengelola semua operasional di cabang yang ditugaskan.", permissions: ALL_PERMISSIONS, isSystem: true },
  });
  await prisma.staffRole.upsert({
    where: { name: "Keuangan" },
    update: {},
    create: {
      name: "Keuangan",
      description: "Mengurus tagihan, verifikasi pembayaran, dan laporan.",
      permissions: ["dashboard.view", "tenants.view", "invoices.view", "invoices.manage", "payments.view", "payments.verify", "reports.view"],
    },
  });
  await prisma.staffRole.upsert({
    where: { name: "Staf Kamar" },
    update: {},
    create: {
      name: "Staf Kamar",
      description: "Memperbarui status kamar dan melihat booking.",
      permissions: ["dashboard.view", "rooms.view", "rooms.update", "bookings.view"],
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@smartkos.id" },
    update: {},
    create: { name: "Owner SmartKos", email: "owner@smartkos.id", phone: "6281200000001", passwordHash: hash, role: "OWNER" },
  });

  // Cabang contoh lama yang tidak ada di daftar dihapus, selama belum punya data sewa.
  const oldKos = await prisma.kos.findMany({
    where: { slug: { notIn: kosData.map((k) => k.slug) }, roomTypes: { none: { rooms: { some: { tenancies: { some: {} } } } } } },
    select: { id: true },
  });
  for (const { id } of oldKos) {
    await prisma.booking.deleteMany({ where: { kosId: id } });
    await prisma.room.deleteMany({ where: { roomType: { kosId: id } } });
    await prisma.kos.delete({ where: { id } });
  }

  for (const { admin, types, photos, ...k } of kosData) {
    const data = { comingSoon: false, areaImage: null, areaImageCredit: null, ...k, isPublished: true };
    const kos = await prisma.kos.upsert({ where: { slug: k.slug }, update: data, create: data });

    await prisma.kosPhoto.deleteMany({ where: { kosId: kos.id } });
    await prisma.kosPhoto.createMany({ data: photos.map((p, i) => ({ ...p, kosId: kos.id, sortOrder: i })) });

    if (admin) {
      const adminUser = await prisma.user.upsert({
        where: { email: admin.email },
        update: { name: admin.name },
        create: { ...admin, passwordHash: hash, role: "ADMIN", staffRoleId: adminRole.id },
      });
      await prisma.kosAdmin.upsert({
        where: { userId_kosId: { userId: adminUser.id, kosId: kos.id } },
        update: {},
        create: { userId: adminUser.id, kosId: kos.id },
      });
    }

    // Tipe kamar & kamar hanya dibuat ulang selama belum ada data sewa.
    const hasTenancy = await prisma.tenancy.count({ where: { room: { roomType: { kosId: kos.id } } } });
    if (hasTenancy) continue;

    await prisma.booking.deleteMany({ where: { kosId: kos.id } });
    await prisma.room.deleteMany({ where: { roomType: { kosId: kos.id } } });
    await prisma.roomType.deleteMany({ where: { kosId: kos.id } });
    for (const { rooms, photos: typePhotos, ...t } of types) {
      await prisma.roomType.create({
        data: {
          ...t,
          kosId: kos.id,
          photos: { create: typePhotos.map((url, i) => ({ url, sortOrder: i })) },
          rooms: { create: rooms },
        },
      });
    }
  }

  if ((await prisma.bankAccount.count()) === 0) {
    await prisma.bankAccount.create({
      data: { bankName: "BCA", accountNumber: "1234567890", accountName: "PT Smart Kos Indonesia" },
    });
  }

  console.log(`Seed selesai. Login owner: ${owner.email} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

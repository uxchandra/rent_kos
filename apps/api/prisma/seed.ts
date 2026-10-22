import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.ts";

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

const kosData = [
  {
    slug: "jogja",
    name: "SmartKos Seturan",
    tagline: "Kos putri tenang di Seturan, dekat UGM, UNY, dan Ambarrukmo",
    description:
      "SmartKos Seturan berada di gang yang tenang, tapi cuma beberapa menit dari Jl. Seturan Raya. Bangunan dua lantai dengan 7 kamar, ruang bersama yang terang, dan dapur yang bisa dipakai bersama. Cocok untuk mahasiswi atau karyawati yang ingin tempat tinggal bersih tanpa ribet.\n\nPengelola tinggal di lokasi, jadi kalau ada keperluan atau kerusakan bisa langsung ditangani.",
    address: "Jl. Seturan II Gg. Kenanga No. 12, Caturtunggal, Depok, Sleman",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
    latitude: -7.7712,
    longitude: 110.4105,
    gender: "PUTRI" as const,
    whatsapp: "6281200000002",
    defaultDeposit: 500_000,
    coverImage: img("jogja-cover"),
    photos: [
      { url: img("jogja-lounge"), caption: "Ruang bersama" },
      { url: img("jogja-kitchen"), caption: "Dapur bersama" },
      { url: img("jogja-bath"), caption: "Kamar mandi" },
      { url: img("jogja-prem-1"), caption: "Kamar tipe Premium" },
    ],
    facilities: ["WiFi 100 Mbps", "Dapur bersama", "Parkir motor", "CCTV 24 jam", "Mesin cuci", "Air galon gratis", "Penjaga kos", "Ruang tamu"],
    rules:
      "Khusus putri, tamu laki-laki hanya sampai ruang tamu.\nJam malam pukul 23.00, setelahnya akses dengan kunci pribadi.\nDilarang merokok di dalam kamar.\nTamu menginap wajib izin pengelola, maksimal 2 malam.\nMenjaga kebersihan dapur setelah dipakai.",
    nearby: [
      { name: "Universitas Gadjah Mada", distance: "3,2 km" },
      { name: "Universitas Negeri Yogyakarta", distance: "1,8 km" },
      { name: "Plaza Ambarrukmo", distance: "2,1 km" },
      { name: "Indomaret Seturan", distance: "200 m" },
      { name: "RS Panti Rapih", distance: "4 km" },
    ],
    admin: { name: "Rina Wulandari", email: "admin.jogja@smartkos.id", phone: "6281200000002" },
    types: [
      {
        name: "Standar",
        description: "Kamar ringkas dengan kamar mandi luar yang dibersihkan setiap hari. Pas untuk yang lebih banyak beraktivitas di luar.",
        monthlyPrice: 900_000,
        size: "3 x 3 m",
        facilities: ["Kasur 120x200", "Lemari 2 pintu", "Meja & kursi belajar", "Kipas angin", "Kamar mandi luar"],
        photos: [img("jogja-std-1"), img("jogja-std-2")],
        rooms: [
          { number: "101", floor: 1, status: "OCCUPIED" },
          { number: "102", floor: 1 },
          { number: "103", floor: 1 },
          { number: "104", floor: 1, status: "OCCUPIED" },
        ],
      },
      {
        name: "Premium",
        description: "Kamar lebih luas di lantai 2 dengan AC, kamar mandi dalam, dan water heater. Jendela menghadap taman.",
        monthlyPrice: 1_400_000,
        size: "3 x 4 m",
        facilities: ["Kasur 160x200", "AC", "Kamar mandi dalam", "Water heater", "Lemari 3 pintu", "Meja rias"],
        photos: [img("jogja-prem-1"), img("jogja-prem-2"), img("jogja-prem-3")],
        rooms: [
          { number: "201", floor: 2 },
          { number: "202", floor: 2, status: "OCCUPIED" },
          { number: "203", floor: 2 },
        ],
      },
    ] satisfies SeedRoomType[],
  },
  {
    slug: "jakarta",
    name: "SmartKos Kebayoran",
    tagline: "Kos eksekutif 5 menit jalan kaki ke MRT Blok M",
    description:
      "Hunian eksekutif untuk profesional muda di Kebayoran Baru. Akses kartu di setiap lantai, housekeeping mingguan, dan lounge di lantai atas untuk kerja atau santai sepulang kantor.\n\nLokasinya dekat MRT Blok M dan halte TransJakarta, jadi perjalanan ke SCBD atau Sudirman tidak perlu lewat macet.",
    address: "Jl. Wijaya I No. 8, Petogogan, Kebayoran Baru, Jakarta Selatan",
    city: "Jakarta",
    province: "DKI Jakarta",
    latitude: -6.2443,
    longitude: 106.8048,
    gender: "CAMPUR" as const,
    whatsapp: "6281200000003",
    defaultDeposit: 1_000_000,
    coverImage: img("jakarta-cover"),
    photos: [
      { url: img("jakarta-lounge"), caption: "Lounge lantai atas" },
      { url: img("jakarta-lobby"), caption: "Lobi" },
      { url: img("jakarta-pantry"), caption: "Pantry bersama" },
      { url: img("jakarta-corridor"), caption: "Koridor" },
    ],
    facilities: ["WiFi 200 Mbps", "Akses kartu", "Lounge & coworking", "Parkir mobil", "Housekeeping mingguan", "CCTV 24 jam", "Laundry", "Lift"],
    rules:
      "Tidak diperbolehkan membawa hewan peliharaan.\nTamu menginap wajib lapor ke resepsionis.\nDilarang merokok di seluruh area dalam gedung.\nKartu akses tidak boleh dipinjamkan.",
    nearby: [
      { name: "Stasiun MRT Blok M", distance: "450 m" },
      { name: "Blok M Plaza", distance: "800 m" },
      { name: "SCBD", distance: "3,5 km" },
      { name: "Taman Literasi Martha Tiahahu", distance: "600 m" },
      { name: "RS Pertamina Pusat", distance: "1,2 km" },
    ],
    admin: { name: "Dimas Prasetyo", email: "admin.jakarta@smartkos.id", phone: "6281200000003" },
    types: [
      {
        name: "Executive",
        description: "Kamar siap huni dengan kasur queen, smart TV, dan kamar mandi dalam. Listrik termasuk hingga 150 kWh per bulan.",
        monthlyPrice: 2_500_000,
        size: "3 x 4 m",
        facilities: ["Kasur queen", "AC", "Kamar mandi dalam", "Water heater", "Smart TV", "Kulkas mini"],
        photos: [img("jakarta-exec-1"), img("jakarta-exec-2"), img("jakarta-exec-3")],
        rooms: [
          { number: "A1", floor: 2, status: "OCCUPIED" },
          { number: "A2", floor: 2 },
          { number: "A3", floor: 2 },
          { number: "A4", floor: 3, status: "OCCUPIED" },
        ],
      },
      {
        name: "Suite",
        description: "Unit paling luas dengan pantry pribadi dan balkon. Cocok untuk yang sering kerja dari rumah.",
        monthlyPrice: 3_800_000,
        size: "4 x 5 m",
        facilities: ["Kasur queen", "AC", "Kamar mandi dalam", "Pantry pribadi", "Balkon", "Smart TV", "Meja kerja"],
        photos: [img("jakarta-suite-1"), img("jakarta-suite-2"), img("jakarta-suite-3")],
        rooms: [
          { number: "B1", floor: 4 },
          { number: "B2", floor: 4, status: "OCCUPIED" },
        ],
      },
    ] satisfies SeedRoomType[],
  },
  {
    slug: "bandung",
    name: "SmartKos Dago",
    tagline: "Kos campur berhawa sejuk di Dago, dekat ITB dan Unpad Dipatiukur",
    description:
      "Rumah dua lantai yang diubah menjadi kos, dengan halaman depan dan ruang keluarga yang luas. Udara Dago yang sejuk bikin betah, dan banyak kafe serta tempat makan di sekitar.\n\nLantai satu untuk penghuni putra, lantai dua untuk penghuni putri, dengan akses tangga terpisah.",
    address: "Jl. Tubagus Ismail VIII No. 21, Sekeloa, Coblong, Bandung",
    city: "Bandung",
    province: "Jawa Barat",
    latitude: -6.8848,
    longitude: 107.6185,
    gender: "CAMPUR" as const,
    whatsapp: "6281200000004",
    defaultDeposit: 750_000,
    coverImage: img("bandung-cover"),
    photos: [
      { url: img("bandung-living"), caption: "Ruang keluarga" },
      { url: img("bandung-kitchen"), caption: "Dapur" },
      { url: img("bandung-dlx-1"), caption: "Kamar Deluxe" },
      { url: img("bandung-std-1"), caption: "Kamar Standar" },
    ],
    facilities: ["WiFi 100 Mbps", "Dapur bersama", "Parkir motor & mobil", "CCTV", "Ruang keluarga", "Jemuran rooftop", "Air galon gratis"],
    rules:
      "Lantai 1 putra, lantai 2 putri.\nJam bertamu sampai pukul 22.00.\nDilarang merokok di dalam ruangan.\nSampah dibuang ke tempat yang disediakan setiap pagi.",
    nearby: [
      { name: "Institut Teknologi Bandung", distance: "1,4 km" },
      { name: "Unpad Dipatiukur", distance: "1,9 km" },
      { name: "Jalan Dago (Ir. H. Juanda)", distance: "900 m" },
      { name: "Superindo Dago", distance: "1,1 km" },
      { name: "RS Borromeus", distance: "2,3 km" },
    ],
    admin: { name: "Asep Hidayat", email: "admin.bandung@smartkos.id", phone: "6281200000004" },
    types: [
      {
        name: "Standar",
        description: "Kamar dengan jendela besar, kamar mandi luar berbagi untuk 2 kamar.",
        monthlyPrice: 1_050_000,
        size: "3 x 3,5 m",
        facilities: ["Kasur 120x200", "Lemari", "Meja belajar", "Kamar mandi luar"],
        photos: [img("bandung-std-1"), img("bandung-std-2")],
        rooms: [
          { number: "1A", floor: 1 },
          { number: "1B", floor: 1, status: "OCCUPIED" },
          { number: "2A", floor: 2 },
          { number: "2B", floor: 2, status: "MAINTENANCE" },
        ],
      },
      {
        name: "Deluxe",
        description: "Kamar luas dengan kamar mandi dalam dan water heater, pas untuk udara Bandung yang dingin.",
        monthlyPrice: 1_650_000,
        size: "3,5 x 4 m",
        facilities: ["Kasur 160x200", "Kamar mandi dalam", "Water heater", "Lemari 3 pintu", "Meja kerja", "Smart TV"],
        photos: [img("bandung-dlx-1"), img("bandung-dlx-2"), img("bandung-dlx-3")],
        rooms: [
          { number: "1C", floor: 1, status: "OCCUPIED" },
          { number: "2C", floor: 2 },
          { number: "2D", floor: 2 },
        ],
      },
    ] satisfies SeedRoomType[],
  },
];

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@smartkos.id" },
    update: {},
    create: { name: "Owner SmartKos", email: "owner@smartkos.id", phone: "6281200000001", passwordHash: hash, role: "OWNER" },
  });

  for (const { admin, types, photos, ...k } of kosData) {
    const data = { ...k, isPublished: true };
    const kos = await prisma.kos.upsert({ where: { slug: k.slug }, update: data, create: data });

    await prisma.kosPhoto.deleteMany({ where: { kosId: kos.id } });
    await prisma.kosPhoto.createMany({ data: photos.map((p, i) => ({ ...p, kosId: kos.id, sortOrder: i })) });

    const adminUser = await prisma.user.upsert({
      where: { email: admin.email },
      update: { name: admin.name },
      create: { ...admin, passwordHash: hash, role: "ADMIN" },
    });
    await prisma.kosAdmin.upsert({
      where: { userId_kosId: { userId: adminUser.id, kosId: kos.id } },
      update: {},
      create: { userId: adminUser.id, kosId: kos.id },
    });

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

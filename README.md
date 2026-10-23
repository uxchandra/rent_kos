# SmartKos

Website pemasaran + manajemen kos untuk satu owner dengan banyak cabang.

- `smartkos.com/` — halaman utama, daftar semua cabang
- `smartkos.com/{slug}` — website tiap cabang (misal `/jogja`, `/jakarta`)
- `/admin` — panel Owner & Admin cabang
- `/penghuni` — area penghuni (tagihan, bukti bayar)

## Stack

| Bagian | Teknologi |
|---|---|
| `apps/web` | Next.js 16 (App Router, Cache Components), Tailwind CSS 4, TypeScript |
| `apps/api` | Express 5, Prisma 7 (adapter MariaDB/MySQL), Zod, JWT (cookie httpOnly) |
| Database | MySQL 8 (Laragon) |

Browser memanggil `/api/*` di Next, lalu diteruskan ke Express (`next.config.ts` → `rewrites`), sehingga cookie login bekerja tanpa CORS.

## Menjalankan

```bash
npm install                 # juga menjalankan prisma generate
cp apps/api/.env.example apps/api/.env   # sesuaikan DATABASE_URL & JWT_SECRET
npm run db:migrate          # buat tabel di database smartkos
npm run db:seed             # data contoh
npm run dev                 # API :4000 + Web :3000
```

Akun contoh (password `password123`):

| Email | Role |
|---|---|
| owner@smartkos.id | Owner (semua cabang) |
| admin.jogja@smartkos.id | Admin SmartKos Jogja |
| admin.jakarta@smartkos.id | Admin SmartKos Jakarta |

## Tagihan otomatis

Vercel Cron memanggil `GET /api/cron/invoices` setiap hari pukul 00:05 WIB (`apps/api/vercel.json`) untuk menerbitkan tagihan sewa bulan berjalan. Atur env `CRON_SECRET` (min. 16 karakter) di project Vercel API; tanpa itu endpoint menolak dengan 503. Tagihan juga bisa diterbitkan manual dari menu **Tagihan**.

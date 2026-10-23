import { Router } from "express";
import { env } from "../../config/env.ts";
import { HttpError, unauthorized } from "../../lib/http-error.ts";
import { currentPeriod, generateRentInvoices } from "../../lib/billing.ts";

// Dipanggil Vercel Cron (lihat vercel.json). Vercel mengirim header `Authorization: Bearer <CRON_SECRET>`.
const router = Router();

router.use((req, _res, next) => {
  if (!env.CRON_SECRET) throw new HttpError(503, "CRON_SECRET belum diatur");
  if (req.headers.authorization !== `Bearer ${env.CRON_SECRET}`) throw unauthorized();
  next();
});

/** Terbitkan tagihan sewa bulan berjalan untuk semua cabang. Aman dijalankan tiap hari. */
router.get("/invoices", async (_req, res) => {
  const { year, month } = currentPeriod();
  const count = await generateRentInvoices(null, year, month);
  res.json({ year, month, created: count });
});

export default router;

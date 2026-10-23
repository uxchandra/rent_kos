import { z } from "zod";

/** Nomor HP Indonesia, disimpan sebagai 62xxxxxxxx. Kosong → null. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, "").replace(/^0/, "62"))
  .refine((v) => !v || /^62\d{8,13}$/.test(v), "Nomor HP tidak valid (contoh: 081234567890)")
  .transform((v) => v || null)
  .nullish();

/** Tanggal "YYYY-MM-DD" dari input date → Date (UTC tengah malam, cocok untuk kolom @db.Date). */
export const dateSchema = z.iso.date("Tanggal tidak valid").transform((v) => new Date(v));

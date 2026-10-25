import { z } from "zod";

/** Path yang sudah dipakai halaman lain di website, tidak boleh jadi slug cabang. */
export const RESERVED_SLUGS = ["kamar", "admin", "penghuni", "login", "api", "uploads", "next-api", "_next", "favicon.ico"];

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug minimal 2 karakter")
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda strip (misal: jogja-seturan)")
  .refine((s) => !RESERVED_SLUGS.includes(s), "Slug ini sudah dipakai halaman lain, pilih yang lain");

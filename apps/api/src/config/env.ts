import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET minimal 32 karakter"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  REVALIDATE_SECRET: z.string().min(16, "REVALIDATE_SECRET minimal 16 karakter"),
  // Diisi otomatis oleh Vercel saat Blob store dihubungkan; kosong = simpan foto di folder lokal.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  // Rahasia untuk endpoint /api/cron/*; Vercel mengirimnya otomatis sebagai Bearer token.
  CRON_SECRET: z.string().min(16, "CRON_SECRET minimal 16 karakter").optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = schema.parse(process.env);
export const isProd = env.NODE_ENV === "production";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";
import { env } from "../config/env.ts";

// DATABASE_URL format Prisma: mysql://user:pass@host:port/db[?sslaccept=strict].
// Diurai manual supaya opsi TLS (wajib untuk TiDB Cloud) ikut terpasang di driver mariadb.
const url = new URL(env.DATABASE_URL);
const useSsl = url.searchParams.has("sslaccept") || url.searchParams.get("ssl") === "true";

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: useSsl ? { rejectUnauthorized: true } : undefined,
  connectionLimit: 5,
});

export const prisma = new PrismaClient({ adapter });

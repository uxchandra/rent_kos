import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";
import { env } from "../config/env.ts";

const adapter = new PrismaMariaDb(env.DATABASE_URL);

export const prisma = new PrismaClient({ adapter });

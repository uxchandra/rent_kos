import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

// Khusus Owner (dibatasi oleh enforcePermissions di app.ts).
const router = Router();

const PAGE_SIZE = 50;

const querySchema = z.object({
  userId: z.coerce.number().int().optional(),
  q: z.string().trim().optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

router.get("/", async (req, res) => {
  const { userId, q, from, to, page } = querySchema.parse(req.query);
  const where: Prisma.ActivityLogWhereInput = {
    ...(userId ? { userId } : {}),
    ...(q ? { OR: [{ label: { contains: q } }, { target: { contains: q } }, { userName: { contains: q } }] } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(`${from}T00:00:00+07:00`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999+07:00`) } : {}),
          },
        }
      : {}),
  };

  const [total, rows, users] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    // Daftar orang yang pernah tercatat, untuk filter.
    prisma.activityLog.findMany({ distinct: ["userId"], select: { userId: true, userName: true }, orderBy: { userName: "asc" } }),
  ]);

  res.json({
    data: rows,
    meta: { total, page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
    users: users.filter((u) => u.userId !== null),
  });
});

export default router;

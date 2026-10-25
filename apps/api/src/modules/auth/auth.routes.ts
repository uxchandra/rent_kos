import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { badRequest, unauthorized } from "../../lib/http-error.ts";
import { AUTH_COOKIE, permissionsOf, requireAuth, signToken } from "../../middlewares/auth.ts";
import { logActivity } from "../../lib/activity.ts";
import { isProd } from "../../config/env.ts";

const router = Router();

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorized("Email atau password salah");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  if (user.role !== "TENANT") {
    void logActivity({ userId: user.id, userName: user.name, action: "auth.login", label: "Masuk ke admin panel", ip: req.ip });
  }

  res.cookie(AUTH_COOKIE, signToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: COOKIE_MAX_AGE,
  });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE);
  res.json({ message: "Berhasil logout" });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      staffRole: { select: { id: true, name: true, permissions: true } },
      managedKos: { select: { kos: { select: { id: true, name: true, slug: true } } } },
    },
  });
  const { managedKos, staffRole, ...rest } = user;
  res.json({
    user: {
      ...rest,
      staffRole: staffRole ? { id: staffRole.id, name: staffRole.name } : null,
      permissions: permissionsOf(user.role, staffRole),
      kos: managedKos.map((m) => m.kos),
    },
  });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
});

router.put("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = passwordSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw badRequest("Password saat ini salah");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  res.json({ message: "Password berhasil diubah" });
});

export default router;

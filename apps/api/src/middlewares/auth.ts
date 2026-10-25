import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { prisma } from "../lib/prisma.ts";
import { forbidden, unauthorized } from "../lib/http-error.ts";
import type { Role } from "../generated/prisma/enums.ts";
import { ALL_PERMISSIONS, findRule, isPermission, type Permission } from "../lib/permissions.ts";

export const AUTH_COOKIE = "smartkos_token";

export type AuthUser = { id: number; role: Role; name: string; email: string; permissions: Permission[] };

/** Izin efektif: OWNER semua, ADMIN dari perannya, TENANT tidak ada. */
export function permissionsOf(role: Role, staffRole: { permissions: unknown } | null): Permission[] {
  if (role === "OWNER") return [...ALL_PERMISSIONS];
  if (role !== "ADMIN" || !staffRole || !Array.isArray(staffRole.permissions)) return [];
  return staffRole.permissions.filter((p): p is Permission => typeof p === "string" && isPermission(p));
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(userId: number) {
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = req.cookies?.[AUTH_COOKIE] ?? (header?.startsWith("Bearer ") ? header.slice(7) : undefined);
  if (!token) throw unauthorized();

  let userId: number;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    userId = Number(payload.sub);
  } catch {
    throw unauthorized("Sesi berakhir, silakan login ulang");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true, email: true, isActive: true, staffRole: { select: { permissions: true } } },
  });
  if (!user || !user.isActive) throw unauthorized();

  req.user = { id: user.id, role: user.role, name: user.name, email: user.email, permissions: permissionsOf(user.role, user.staffRole) };
  next();
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) throw forbidden();
    next();
  };

export const hasPermission = (user: AuthUser, ...anyOf: Permission[]) => user.role === "OWNER" || anyOf.some((p) => user.permissions.includes(p));

/**
 * Cek izin setiap request di /api/admin berdasarkan tabel `rules` di lib/permissions.ts.
 * Endpoint yang tidak terdaftar ditolak untuk non-Owner.
 */
export const enforcePermissions: RequestHandler = (req, _res, next) => {
  const user = req.user!;
  if (user.role === "OWNER") return next();
  const rule = findRule(req.method, req.path);
  if (!rule || rule.need === "owner") throw forbidden("Fitur ini khusus Owner");
  if (rule.need !== "staff" && !hasPermission(user, ...rule.need)) throw forbidden("Peran Anda tidak punya izin untuk aksi ini");
  next();
};

/** ID kos yang boleh diakses user. `null` berarti semua kos (OWNER). */
export async function accessibleKosIds(user: AuthUser): Promise<number[] | null> {
  if (user.role === "OWNER") return null;
  if (user.role !== "ADMIN") return [];
  const rows = await prisma.kosAdmin.findMany({ where: { userId: user.id }, select: { kosId: true } });
  return rows.map((r) => r.kosId);
}

export async function assertKosAccess(user: AuthUser, kosId: number) {
  const ids = await accessibleKosIds(user);
  if (ids !== null && !ids.includes(kosId)) throw forbidden("Anda tidak mengelola kos ini");
}

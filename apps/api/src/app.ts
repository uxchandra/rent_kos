import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env } from "./config/env.ts";
import authRoutes from "./modules/auth/auth.routes.ts";
import publicRoutes from "./modules/public/public.routes.ts";
import adminDashboardRoutes from "./modules/admin/dashboard.routes.ts";
import adminKosRoutes from "./modules/admin/kos.routes.ts";
import adminRoomRoutes from "./modules/admin/room.routes.ts";
import adminUserRoutes from "./modules/admin/users.routes.ts";
import { requireAuth, requireRole } from "./middlewares/auth.ts";
import { errorHandler, notFoundHandler } from "./middlewares/error.ts";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.WEB_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.resolve("uploads"), { maxAge: "30d", immutable: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

const admin = express.Router();
admin.use(requireAuth, requireRole("OWNER", "ADMIN"));
admin.use("/dashboard", adminDashboardRoutes);
admin.use("/kos", adminKosRoutes);
admin.use("/users", requireRole("OWNER"), adminUserRoutes);
admin.use("/", adminRoomRoutes);
app.use("/api/admin", admin);

app.use(notFoundHandler);
app.use(errorHandler);

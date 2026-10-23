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
import adminTenancyRoutes from "./modules/admin/tenancy.routes.ts";
import adminInvoiceRoutes from "./modules/admin/invoice.routes.ts";
import adminBookingRoutes from "./modules/admin/booking.routes.ts";
import adminReportRoutes from "./modules/admin/report.routes.ts";
import adminPaymentRoutes from "./modules/admin/payment.routes.ts";
import adminBankAccountRoutes from "./modules/admin/bank-account.routes.ts";
import tenantRoutes from "./modules/tenant/tenant.routes.ts";
import cronRoutes from "./modules/cron/cron.routes.ts";
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
admin.use("/tenancies", adminTenancyRoutes);
admin.use("/invoices", adminInvoiceRoutes);
admin.use("/bookings", adminBookingRoutes);
admin.use("/reports", adminReportRoutes);
admin.use("/payments", adminPaymentRoutes);
admin.use("/bank-accounts", adminBankAccountRoutes);
admin.use("/users", requireRole("OWNER"), adminUserRoutes);
admin.use("/", adminRoomRoutes);
app.use("/api/admin", admin);
app.use("/api/tenant", requireAuth, requireRole("TENANT"), tenantRoutes);
app.use("/api/cron", cronRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

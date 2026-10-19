import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env } from "./config/env.ts";
import authRoutes from "./modules/auth/auth.routes.ts";
import publicRoutes from "./modules/public/public.routes.ts";
import { errorHandler, notFoundHandler } from "./middlewares/error.ts";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.WEB_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

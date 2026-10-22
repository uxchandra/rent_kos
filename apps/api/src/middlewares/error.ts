import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { HttpError } from "../lib/http-error.ts";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(422).json({ message: "Data tidak valid", errors: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Ukuran foto maksimal 10 MB" : err.code === "LIMIT_FILE_COUNT" ? "Maksimal 10 foto sekali upload" : "Upload gagal";
    res.status(400).json({ message });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, errors: err.details });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan pada server" });
};

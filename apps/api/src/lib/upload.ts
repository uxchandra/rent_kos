import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { badRequest } from "./http-error.ts";

const UPLOAD_ROOT = path.resolve("uploads");
const MAX_SIZE = 10 * 1024 * 1024; // foto HP bisa besar, nanti dikompres

/** Terima file gambar di memori; diproses sharp sebelum disimpan. */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 10 },
  // Jangan lempar error di sini: multer akan memutus koneksi sebelum body selesai dibaca.
  // Tandai saja, lalu cek dengan uploadedFiles() di route.
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|heic|heif)$/.test(file.mimetype);
    if (!ok) req.uploadRejected = true;
    cb(null, ok);
  },
});

declare global {
  namespace Express {
    interface Request {
      uploadRejected?: boolean;
    }
  }
}

/** Ambil file hasil upload (single/array) dan pastikan semuanya gambar yang valid. */
export function uploadedFiles(req: Express.Request): Express.Multer.File[] {
  if (req.uploadRejected) throw badRequest("File harus berupa gambar JPG, PNG, WEBP, atau HEIC");
  const files = req.file ? [req.file] : ((req.files as Express.Multer.File[] | undefined) ?? []);
  if (files.length === 0) throw badRequest("Pilih minimal satu foto");
  return files;
}

/**
 * Kecilkan foto ke maks. 1600px lalu simpan sebagai WebP.
 * Mengembalikan URL publik, misal `/uploads/kos/3/abc.webp`.
 */
export async function saveImage(file: Express.Multer.File, folder: string): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.webp`;
  try {
    await sharp(file.buffer)
      .rotate() // ikuti orientasi EXIF dari kamera HP
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(dir, name));
  } catch {
    throw badRequest(`File "${file.originalname}" rusak atau formatnya tidak didukung`);
  }
  return `/uploads/${folder}/${name}`.replaceAll("\\", "/");
}

/** Hapus file upload. Foto contoh di /uploads/seed tidak ikut dihapus. */
export async function deleteImage(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/") || url.startsWith("/uploads/seed/")) return;
  const file = path.join(UPLOAD_ROOT, url.slice("/uploads/".length));
  if (!file.startsWith(UPLOAD_ROOT)) return;
  await unlink(file).catch(() => {});
}

// Kecilkan foto di browser sebelum upload, supaya upload dari HP (data seluler) cepat.
// Server tetap memproses ulang ke WebP; ini hanya mengurangi ukuran kiriman.

const MAX_SIDE = 2000;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 600 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    // Format yang tidak bisa dibaca browser (misal HEIC di Chrome) dikirim apa adanya.
    return file;
  }
}

// Vercel menolak body request > 4,5 MB, jadi kiriman dipecah di bawah batas itu.
const MAX_BATCH_BYTES = 4 * 1024 * 1024;
const MAX_BATCH_FILES = 10;

/** Upload beberapa foto (maks. 10 file & ~4 MB per request) ke endpoint multipart. */
export async function uploadPhotos(path: string, files: File[], field = "photos") {
  const compressed = await Promise.all(files.map(compressImage));
  const tooBig = compressed.find((f) => f.size > MAX_BATCH_BYTES);
  if (tooBig) throw new Error(`Foto "${tooBig.name}" terlalu besar (maks. 4 MB). Coba simpan ulang sebagai JPG.`);

  const batches: File[][] = [];
  let size = 0;
  for (const f of compressed) {
    const last = batches.at(-1);
    if (!last || last.length >= MAX_BATCH_FILES || size + f.size > MAX_BATCH_BYTES) {
      batches.push([f]);
      size = f.size;
    } else {
      last.push(f);
      size += f.size;
    }
  }

  for (const batch of batches) {
    const form = new FormData();
    batch.forEach((f) => form.append(field, f));
    const res = await fetch(`/api${path}`, { method: "POST", body: form, credentials: "include" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message ?? "Upload gagal");
  }
}

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

/** Upload beberapa foto sekaligus (maks. 10 per request) ke endpoint multipart. */
export async function uploadPhotos(path: string, files: File[], field = "photos") {
  const compressed = await Promise.all(files.map(compressImage));
  for (let i = 0; i < compressed.length; i += 10) {
    const form = new FormData();
    compressed.slice(i, i + 10).forEach((f) => form.append(field, f));
    const res = await fetch(`/api${path}`, { method: "POST", body: form, credentials: "include" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message ?? "Upload gagal");
  }
}

import { env } from "../config/env.ts";

/**
 * Minta Next.js membuang cache halaman publik setelah data kos berubah.
 * Tidak memblokir request admin; kalau gagal, cache tetap kedaluwarsa sendiri dalam beberapa menit.
 */
export function revalidatePublic(...slugs: (string | null | undefined)[]) {
  const tags = ["kos", ...slugs.filter(Boolean).map((s) => `kos:${s}`)];
  fetch(`${env.WEB_URL}/next-api/revalidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET },
    body: JSON.stringify({ tags }),
  }).catch((err) => console.warn("Revalidate gagal:", err.message));
}

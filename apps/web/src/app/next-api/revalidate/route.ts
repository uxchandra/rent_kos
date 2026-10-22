import { revalidateTag } from "next/cache";

// Dipanggil API Express setelah admin mengubah data kos, agar halaman publik langsung segar.
export async function POST(request: Request) {
  if (request.headers.get("x-revalidate-secret") !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { tags } = (await request.json()) as { tags?: unknown };
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
    return Response.json({ message: "tags harus berupa array string" }, { status: 400 });
  }
  // expire: 0 → kunjungan berikutnya langsung mengambil data baru, bukan versi lama.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tags });
}

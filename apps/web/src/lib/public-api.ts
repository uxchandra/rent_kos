import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { KosDetail, KosSummary, RoomListing } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getKosList(): Promise<KosSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("kos");

  const res = await fetch(`${API_URL}/api/public/kos`);
  if (!res.ok) throw new Error(`Gagal memuat daftar kos (${res.status})`);
  return (await res.json()).data;
}

export async function getKosBySlug(slug: string): Promise<KosDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`kos:${slug}`);

  const res = await fetch(`${API_URL}/api/public/kos/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Gagal memuat kos (${res.status})`);
  return (await res.json()).data;
}

export async function getRoomListings(): Promise<RoomListing[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("kos");

  const res = await fetch(`${API_URL}/api/public/rooms`);
  if (!res.ok) throw new Error(`Gagal memuat daftar kamar (${res.status})`);
  return (await res.json()).data;
}

import Link from "next/link";
import { Photo } from "./photo";
import { price } from "@/lib/format";
import type { KosSummary } from "@/lib/types";

export function KosCard({ kos }: { kos: KosSummary }) {
  return (
    <Link href={`/${kos.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl">
        <Photo src={kos.coverImage} alt={kos.name} className="aspect-4/3 w-full transition duration-500 group-hover:scale-105" />
      </div>
      <div className="mt-3">
        <h3 className="font-semibold">{kos.name}</h3>
        <p className="text-sm text-white/60">
          {kos.city} · {kos.availableRooms > 0 ? `${kos.availableRooms} kamar kosong` : "Penuh"}
        </p>
        <p className="mt-1 text-sm">
          Mulai <span className="font-bold">{kos.minPrice ? price(kos.minPrice) : "-"}</span>
          <span className="text-white/60"> / bulan</span>
        </p>
      </div>
    </Link>
  );
}

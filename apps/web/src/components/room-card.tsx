import Link from "next/link";
import { PhotoCarousel } from "./photo-carousel";
import { genderBadge, genderShort, price } from "@/lib/format";
import type { RoomListing } from "@/lib/types";

const shortFacility = (f: string) => f.replace("Kamar mandi", "K. Mandi").replace(/Kasur \S+/, "Kasur");

export function RoomCard({ room }: { room: RoomListing }) {
  const { kos } = room;
  const district = kos.address.split(",").slice(-2).join(",").trim();
  const photos = room.photos.length ? room.photos.map((p) => p.url) : kos.coverImage ? [kos.coverImage] : [];

  return (
    <Link href={`/${kos.slug}?tipe=${room.id}`} className="group block">
      <PhotoCarousel photos={photos} alt={`${kos.name} ${room.name}`} className="aspect-20/19 rounded-xl" />
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${genderBadge[kos.gender]}`}>
            {genderShort[kos.gender]}
          </span>
          {room.availableRooms === 0 ? (
            <span className="text-xs font-medium text-muted">Penuh</span>
          ) : room.availableRooms <= 2 ? (
            <span className="text-xs font-semibold text-red-600">Sisa {room.availableRooms} kamar</span>
          ) : (
            <span className="text-xs font-medium text-muted">Ada {room.availableRooms} kamar</span>
          )}
        </div>
        <h3 className="mt-1.5 font-semibold leading-snug">
          {kos.name} Tipe {room.name}
        </h3>
        <p className="text-sm text-muted">{district}</p>
        {room.facilities && (
          <p className="mt-1 line-clamp-1 text-sm text-muted">{room.facilities.slice(0, 4).map(shortFacility).join(" · ")}</p>
        )}
        <p className="mt-1.5">
          <span className="font-bold">{price(room.monthlyPrice)}</span>
          <span className="text-sm text-muted"> / bulan</span>
        </p>
      </div>
    </Link>
  );
}

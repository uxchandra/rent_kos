import Link from "next/link";
import { MapPin } from "lucide-react";
import { PhotoCarousel } from "./photo-carousel";
import { price } from "@/lib/format";
import { facilityIcon } from "@/lib/icons";
import { tierOf } from "@/lib/tiers";
import type { RoomListing } from "@/lib/types";

/** Kartu tipe kamar untuk halaman /kamar (latar gelap). */
export function RoomCard({ room, className = "" }: { room: RoomListing; className?: string }) {
  const { kos } = room;
  const tier = tierOf(room.monthlyPrice);
  const district = kos.address.split(",").slice(-2, -1).join("").trim() || kos.city;
  const photos = room.photos.length ? room.photos.map((p) => p.url) : kos.coverImage ? [kos.coverImage] : [];
  const tags = (room.facilities ?? []).slice(0, 5);

  return (
    <Link
      href={`/${kos.slug}?tipe=${room.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-night-2 ring-1 ring-white/6 transition hover:ring-lime/40 ${className}`}
    >
      <div className="relative">
        <PhotoCarousel photos={photos} alt={`${kos.name} ${room.name}`} className="aspect-4/3" />
        <span
          className={`absolute left-0 top-3 rounded-r-md px-2.5 py-1 text-[11px] font-semibold ${
            room.availableRooms > 0 ? "bg-lime text-night" : "bg-night/85 text-white/60"
          }`}
        >
          {room.availableRooms > 0 ? `${room.availableRooms} kamar tersedia` : "Penuh, daftar tunggu"}
        </span>
        <span className={`absolute bottom-3 left-3 rounded-md px-2 py-0.5 text-[11px] font-bold ${tier.tag}`}>SmartKos {tier.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{kos.name}</h3>
        <p className="text-sm text-white/60">
          Kamar {room.name}
          {room.size && ` · ${room.size}`}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/50">
          <MapPin className="size-3.5" /> {district}, {kos.city}
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-white/60">
          {tags.map((t) => {
            const Icon = facilityIcon(t);
            return (
              <li key={t} className="flex items-center gap-1.5 truncate">
                <Icon className="size-3.5 shrink-0 text-lime/80" /> {t}
              </li>
            );
          })}
        </ul>
        <p className="mt-auto pt-4 text-right">
          <span className="text-xs text-white/50">IDR </span>
          <span className="text-lg font-bold text-lime">{price(room.monthlyPrice).replace("Rp", "")}</span>
          <span className="text-xs text-white/50"> / bulan</span>
        </p>
      </div>
    </Link>
  );
}

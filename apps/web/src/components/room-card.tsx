import Link from "next/link";
import { MapPin } from "lucide-react";
import { PhotoCarousel } from "./photo-carousel";
import { genderShort, price } from "@/lib/format";
import { facilityIcon } from "@/lib/icons";
import { tierOf } from "@/lib/tiers";
import type { RoomListing } from "@/lib/types";

export function RoomCard({ room, className = "" }: { room: RoomListing; className?: string }) {
  const { kos } = room;
  const tier = tierOf(room.monthlyPrice);
  const district = kos.address.split(",").slice(-2, -1).join("").trim() || kos.city;
  const photos = room.photos.length ? room.photos.map((p) => p.url) : kos.coverImage ? [kos.coverImage] : [];
  const tags = [genderShort[kos.gender], ...(room.facilities ?? [])].slice(0, 5);

  return (
    <Link
      href={`/${kos.slug}?tipe=${room.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg ${className}`}
    >
      <div className="relative">
        <PhotoCarousel photos={photos} alt={`${kos.name} ${room.name}`} className="aspect-4/3" />
        <span
          className={`absolute left-0 top-3 rounded-r-md px-2.5 py-1 text-[11px] font-semibold ${
            room.availableRooms > 0 ? "bg-brand-600 text-white" : "bg-white/90 text-ink-soft"
          }`}
        >
          {room.availableRooms > 0 ? `${room.availableRooms} kamar tersedia` : "Penuh, daftar tunggu"}
        </span>
        <span className={`absolute bottom-3 left-3 rounded-md px-2 py-0.5 text-[11px] font-bold ${tier.tag}`}>SmartKos {tier.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{kos.name}</h3>
        <p className="text-sm text-ink-soft">
          Kamar {room.name}
          {room.size && ` · ${room.size}`}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
          <MapPin className="size-3.5" /> {district}, {kos.city}
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-ink-soft">
          {tags.map((t) => {
            const Icon = facilityIcon(t);
            return (
              <li key={t} className="flex items-center gap-1.5 truncate">
                <Icon className="size-3.5 shrink-0" /> {t}
              </li>
            );
          })}
        </ul>
        <p className="mt-auto pt-4 text-right">
          <span className="text-xs text-ink-soft">IDR </span>
          <span className="text-lg font-bold text-brand-700">{price(room.monthlyPrice).replace("Rp", "")}</span>
          <span className="text-xs text-ink-soft"> / bulan</span>
        </p>
      </div>
    </Link>
  );
}

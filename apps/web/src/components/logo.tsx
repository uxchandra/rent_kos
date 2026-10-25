import Link from "next/link";

/** `light` = di atas latar ungu tua (footer), `night` = di atas latar gelap landing page (aksen lime). */
export function Logo({ href = "/", light = false, night = false }: { href?: string; light?: boolean; night?: boolean }) {
  const house = night ? "fill-lime" : light ? "fill-white" : "fill-brand-600";
  const door = night ? "fill-night" : light ? "fill-brand-900" : "fill-white";
  const text = night || light ? "text-white" : "text-brand-600";
  return (
    <Link href={href} className="flex items-center gap-1.5" aria-label="SmartKos">
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <path d="M16 4 4 14v13a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1V14z" className={house} />
        <path d="M12 28v-7a4 4 0 0 1 8 0v7z" className={door} />
      </svg>
      <span className={`text-[1.4rem] font-bold tracking-tight ${text}`}>smartkos</span>
    </Link>
  );
}

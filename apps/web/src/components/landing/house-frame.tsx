/* eslint-disable @next/next/no-img-element -- foto dari /uploads */

// Bingkai foto berbentuk rumah beratap, motif khas SmartKos.
const HOUSE = "polygon(50% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)";

export function HouseFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-b-[2rem] ${className}`} style={{ clipPath: HOUSE }}>
      <img src={src} alt={alt} className="size-full object-cover" />
    </div>
  );
}

/** Lencana kecil berbentuk rumah, dipakai untuk nomor langkah. */
export function HouseBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative grid size-12 shrink-0 place-items-center ${className}`}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full" aria-hidden>
        <path d="M24 4 4 20v22a2 2 0 0 0 2 2h36a2 2 0 0 0 2-2V20z" className="fill-lime" />
      </svg>
      <span className="relative mt-2 text-lg font-bold text-night">{children}</span>
    </span>
  );
}

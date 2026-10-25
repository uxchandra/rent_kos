/* eslint-disable @next/next/no-img-element -- foto dari /uploads milik API, ukuran bervariasi */
import { ImageOff } from "lucide-react";

export function Photo({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`grid place-items-center bg-white/5 ${className}`}>
        <ImageOff className="size-8 text-white/20" strokeWidth={1.5} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} loading="lazy" decoding="async" />;
}

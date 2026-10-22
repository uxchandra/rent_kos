import Link from "next/link";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-1.5" aria-label="SmartKos">
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <path d="M16 4 4 14v13a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1V14z" className={light ? "fill-white" : "fill-brand-600"} />
        <path d="M12 28v-7a4 4 0 0 1 8 0v7z" className={light ? "fill-brand-900" : "fill-white"} />
      </svg>
      <span className={`text-[1.4rem] font-bold tracking-tight ${light ? "text-white" : "text-brand-600"}`}>smartkos</span>
    </Link>
  );
}

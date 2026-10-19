import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="SmartKos">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <path d="M16 3 3 13.5V27a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V13.5z" className="fill-brand-600" />
        <path d="M11.5 29v-8a4.5 4.5 0 0 1 9 0v8z" className="fill-white" />
        <circle cx="16" cy="13" r="2.4" className="fill-accent" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-brand-600">smartkos</span>
    </Link>
  );
}

/** Motif khas SmartKos untuk sudut section: rumah, kunci, dan jendela bergaris. */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`pointer-events-none ${className}`} aria-hidden>
      {/* rumah */}
      <path d="M20 70 50 44l30 26v40H20z" className="stroke-white/8" />
      <path d="M43 110V90h14v20" className="stroke-white/8" />
      {/* jendela */}
      <rect x="112" y="30" width="44" height="44" rx="6" className="stroke-lime/14" />
      <path d="M134 30v44M112 52h44" className="stroke-lime/14" />
      {/* kunci */}
      <circle cx="62" cy="152" r="14" className="stroke-lime/14" />
      <path d="M76 152h50m-12 0v12m-12-12v8" className="stroke-lime/14" />
      {/* rumah kecil */}
      <path d="M140 140l20-17 20 17v28h-40z" className="stroke-white/8" />
    </svg>
  );
}

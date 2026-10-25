/**
 * Motif khas SmartKos untuk sudut section: rumah, kunci, dan jendela bergaris.
 * `tone="light"` untuk latar terang (garis ungu tipis), default untuk latar gelap.
 */
export function Ornament({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const soft = tone === "light" ? "stroke-brand-600/12" : "stroke-white/8";
  const accent = tone === "light" ? "stroke-brand-400/25" : "stroke-lime/14";
  return (
    <svg viewBox="0 0 200 200" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`pointer-events-none ${className}`} aria-hidden>
      {/* rumah */}
      <path d="M20 70 50 44l30 26v40H20z" className={soft} />
      <path d="M43 110V90h14v20" className={soft} />
      {/* jendela */}
      <rect x="112" y="30" width="44" height="44" rx="6" className={accent} />
      <path d="M134 30v44M112 52h44" className={accent} />
      {/* kunci */}
      <circle cx="62" cy="152" r="14" className={accent} />
      <path d="M76 152h50m-12 0v12m-12-12v8" className={accent} />
      {/* rumah kecil */}
      <path d="M140 140l20-17 20 17v28h-40z" className={soft} />
    </svg>
  );
}

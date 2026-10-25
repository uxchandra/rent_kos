/**
 * Cahaya lembut di latar. Sengaja pakai radial-gradient, bukan `blur-3xl`:
 * Chrome Android sering tidak menggambar filter blur pada elemen besar yang bergerak,
 * sehingga yang terlihat malah lingkaran padat bertepi tegas.
 */
const colors = {
  purple: "117 57 230",
  lime: "196 242 90",
};

export function Glow({ tone = "purple", opacity = 0.3, className = "" }: { tone?: keyof typeof colors; opacity?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background: `radial-gradient(closest-side, rgb(${colors[tone]} / ${opacity}), rgb(${colors[tone]} / ${opacity * 0.4}) 45%, transparent)` }}
    />
  );
}

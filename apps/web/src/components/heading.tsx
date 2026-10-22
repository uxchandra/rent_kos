/** Judul section: kata pembuka tipis, kata kunci tebal, huruf kecil semua. */
export function Heading({
  light,
  bold,
  as: Tag = "h2",
  className = "",
}: {
  light: string;
  bold: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Tag className={`text-[2rem] leading-[1.12] tracking-tight text-ink sm:text-[2.6rem] ${className}`}>
      <span className="font-light">{light} </span>
      <span className="font-bold">{bold}</span>
    </Tag>
  );
}

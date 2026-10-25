export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const genderLabel = { PUTRA: "Kos Putra", PUTRI: "Kos Putri", CAMPUR: "Kos Campur" } as const;
export const genderShort = { PUTRA: "Putra", PUTRI: "Putri", CAMPUR: "Campur" } as const;

/** Warna label gender ala Mamikos. */
export const genderBadge = {
  PUTRA: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  PUTRI: "bg-pink-400/10 text-pink-300 ring-pink-400/30",
  CAMPUR: "bg-lime/10 text-lime ring-lime/30",
} as const;

/** Rp1.400.000 tanpa spasi, gaya label harga marketplace. */
export const price = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`;

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/** Rp14,7 jt — untuk angka besar di kartu statistik yang sempit. */
export const priceCompact = (n: number) =>
  n >= 1_000_000 ? `Rp${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt` : price(n);

/** Tanggal dari kolom DATE (disimpan UTC tengah malam) → "19 Okt 2026". */
export const dateShort = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "UTC" });

/** Hari ini dalam format input date (YYYY-MM-DD), waktu lokal. */
export const todayInput = () => new Date().toLocaleDateString("en-CA");

/** 6281234567890 → 081234567890 untuk ditampilkan/diedit. */
export const localPhone = (phone: string | null) => (phone ? `0${phone.slice(2)}` : "");

export const monthName = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

/** "Sewa Oktober 2026" atau "Deposit". */
export const invoiceTitle = (i: { type: "RENT" | "DEPOSIT"; periodYear: number | null; periodMonth: number | null }) =>
  i.type === "DEPOSIT" ? "Deposit" : `Sewa ${monthName(i.periodYear!, i.periodMonth!)}`;

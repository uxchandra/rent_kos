export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const genderLabel = { PUTRA: "Kos Putra", PUTRI: "Kos Putri", CAMPUR: "Kos Campur" } as const;
export const genderShort = { PUTRA: "Putra", PUTRI: "Putri", CAMPUR: "Campur" } as const;

/** Warna label gender ala Mamikos. */
export const genderBadge = {
  PUTRA: "bg-sky-50 text-sky-700 ring-sky-200",
  PUTRI: "bg-pink-50 text-pink-700 ring-pink-200",
  CAMPUR: "bg-brand-50 text-brand-700 ring-brand-200",
} as const;

/** Rp1.400.000 tanpa spasi, gaya label harga marketplace. */
export const price = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`;

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/** Rp14,7 jt — untuk angka besar di kartu statistik yang sempit. */
export const priceCompact = (n: number) =>
  n >= 1_000_000 ? `Rp${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt` : price(n);

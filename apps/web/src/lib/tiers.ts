// Tier harga untuk label & filter, terinspirasi tingkatan kamar di situs coliving.
export const tiers = [
  {
    id: "hemat",
    label: "Hemat",
    max: 1_200_000,
    tag: "bg-lavender text-brand-700",
    card: "bg-lavender",
    button: "bg-brand-500 hover:bg-brand-600 text-white",
    text: "Kamar ringkas dengan fasilitas lengkap untuk kebutuhan harian, harga paling bersahabat.",
  },
  {
    id: "nyaman",
    label: "Nyaman",
    max: 2_500_000,
    tag: "bg-mint text-mint-ink",
    card: "bg-mint",
    button: "bg-mint-ink hover:brightness-110 text-white",
    text: "Lebih luas, AC dan kamar mandi dalam. Pilihan favorit mahasiswa tingkat akhir dan pekerja.",
  },
  {
    id: "eksklusif",
    label: "Eksklusif",
    max: Infinity,
    tag: "bg-ink text-white",
    card: "bg-[#ecebef]",
    button: "bg-ink hover:bg-black text-white",
    text: "Unit terluas di lokasi paling strategis, lengkap dengan smart TV, pantry, atau balkon.",
  },
] as const;

export type Tier = (typeof tiers)[number];

export const tierOf = (monthlyPrice: number): Tier => tiers.find((t) => monthlyPrice < t.max) ?? tiers[2];

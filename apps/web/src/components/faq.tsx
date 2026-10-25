import { Plus } from "lucide-react";

export const faqs = [
  {
    q: "Berapa lama minimal sewa?",
    a: "Minimal 1 bulan. Sewa diperpanjang otomatis tiap bulan. Kalau mau pindah, kabari pengelola paling lambat 2 minggu sebelumnya.",
  },
  {
    q: "Deposit itu untuk apa, dan kapan dikembalikan?",
    a: "Deposit dibayar sekali di awal sebagai jaminan. Waktu kamu pindah, kamar dicek bareng pengelola. Kalau tidak ada kerusakan atau tunggakan, deposit dikembalikan penuh.",
  },
  {
    q: "Bayar sewa bulanannya gimana?",
    a: "Tiap bulan tagihan muncul di akun penghuni. Transfer ke rekening resmi SmartKos, lalu upload foto bukti transfernya. Setelah dicek pengelola, status tagihan berubah jadi lunas.",
  },
  {
    q: "Harga sudah termasuk apa saja?",
    a: "WiFi, air, dan kebersihan area bersama sudah termasuk, begitu juga fasilitas yang tertulis di tiap tipe kamar. Untuk listrik, aturannya bisa beda per cabang. Pengelola akan menjelaskannya waktu survey.",
  },
  {
    q: "Boleh lihat kamarnya dulu sebelum sewa?",
    a: "Boleh. Chat pengelola cabang lewat WhatsApp untuk atur jadwal survey.",
  },
  {
    q: "Kalau pindah kota, bisa pindah ke cabang lain?",
    a: "Bisa, selama ada kamar kosong di cabang tujuan. Depositnya bisa langsung dipindahkan, tidak perlu dicairkan dulu.",
  },
];

/** `night` = versi kartu gelap untuk landing page. */
export function Faq({ night = false }: { night?: boolean }) {
  if (night) {
    return (
      <div className="space-y-3">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group rounded-2xl border border-white/10 bg-night-2 px-5 py-4 open:border-lime/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
              {q}
              <Plus className="size-5 shrink-0 text-lime transition group-open:rotate-45" />
            </summary>
            <p className="mt-3 pr-8 leading-relaxed text-white/70">{a}</p>
          </details>
        ))}
      </div>
    );
  }
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map(({ q, a }) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {q}
            <Plus className="size-5 shrink-0 text-brand-600 transition group-open:rotate-45" />
          </summary>
          <p className="mt-3 pr-8 leading-relaxed text-ink-soft">{a}</p>
        </details>
      ))}
    </div>
  );
}

import { Plus } from "lucide-react";

export const faqs = [
  {
    q: "Berapa lama minimal sewa?",
    a: "Minimal sewa 1 bulan. Setelah itu sewa diperpanjang otomatis setiap bulan sampai kamu memberi tahu pengelola akan pindah, paling lambat 2 minggu sebelumnya.",
  },
  {
    q: "Untuk apa deposit, dan kapan dikembalikan?",
    a: "Deposit dibayar sekali di awal sebagai jaminan. Saat masa sewa selesai, kamar dicek bersama pengelola dan deposit dikembalikan penuh jika tidak ada kerusakan atau tunggakan.",
  },
  {
    q: "Bagaimana cara membayar sewa bulanan?",
    a: "Tagihan muncul otomatis di akun penghuni setiap bulan. Transfer ke rekening resmi SmartKos, lalu upload foto bukti transfer di akun. Pengelola akan memverifikasi dan status tagihan berubah menjadi lunas.",
  },
  {
    q: "Apa saja yang sudah termasuk dalam harga?",
    a: "Harga sudah termasuk WiFi, air, kebersihan area bersama, dan fasilitas yang tercantum di setiap tipe kamar. Ketentuan listrik bisa berbeda per cabang dan akan dijelaskan pengelola.",
  },
  {
    q: "Boleh survey kamar sebelum sewa?",
    a: "Boleh dan sangat disarankan. Hubungi pengelola cabang lewat WhatsApp untuk mengatur jadwal survey.",
  },
  {
    q: "Kalau pindah kota, bisa pindah ke cabang lain?",
    a: "Bisa, selama ada kamar kosong di cabang tujuan. Deposit bisa langsung dipindahkan tanpa perlu dicairkan dulu.",
  },
];

export function Faq() {
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map(({ q, a }) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {q}
            <Plus className="size-5 shrink-0 text-brand-600 transition group-open:rotate-45" />
          </summary>
          <p className="mt-3 pr-8 leading-relaxed text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}

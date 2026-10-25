import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="bg-subtle grid flex-1 place-items-center px-4 py-24 text-center">
      <div className="flex flex-col items-center">
        <Logo />
        <h1 className="mt-8 text-5xl font-bold text-brand-700">404</h1>
        <p className="mt-3 text-ink-soft">Halaman atau cabang kos yang Anda cari tidak ditemukan.</p>
        <Link href="/" className="mt-6 rounded-lg bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800">
          Lihat semua cabang
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Logo } from "@/components/logo";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-subtle grid flex-1 place-items-center px-4 py-24 text-center">
      <div className="flex flex-col items-center">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">Ups, halaman gagal dimuat</h1>
        <p className="mt-2 max-w-sm text-ink-soft">Server sedang tidak dapat dihubungi. Silakan coba beberapa saat lagi.</p>
        <button
          onClick={retry}
          className="mt-6 flex items-center gap-2 rounded-lg bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800"
        >
          <RefreshCw className="size-4" /> Coba lagi
        </button>
      </div>
    </main>
  );
}

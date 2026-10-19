"use client";

import { Logo } from "@/components/logo";
import { useAuth } from "@/components/auth-provider";

export default function PenghuniPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="flex items-center justify-between">
        <Logo href="/penghuni" />
        <button onClick={logout} className="text-sm font-semibold text-red-600">
          Keluar
        </button>
      </header>
      <h1 className="mt-10 text-2xl font-bold">Halo, {user.name}</h1>
      <div className="mt-6 rounded-3xl border border-dashed border-brand-200 bg-white p-10 text-center text-muted">
        Tagihan, riwayat pembayaran, dan upload bukti transfer akan tampil di sini.
      </div>
    </div>
  );
}

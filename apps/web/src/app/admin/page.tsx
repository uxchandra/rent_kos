"use client";

import { useAuth } from "@/components/auth-provider";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Halo, {user.name} 👋</h1>
      <p className="mt-1 text-muted">
        {user.role === "OWNER" ? "Anda mengelola semua cabang SmartKos." : `Anda mengelola: ${user.kos.map((k) => k.name).join(", ")}.`}
      </p>
      <div className="mt-8 rounded-3xl border border-dashed border-brand-200 bg-white p-10 text-center text-muted">
        Statistik dashboard (okupansi, pendapatan, tagihan tertunggak) akan tampil di sini.
      </div>
    </div>
  );
}

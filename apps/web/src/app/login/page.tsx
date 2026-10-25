"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { api, ApiError } from "@/lib/client-api";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const { user } = await api<{ user: { role: Role } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      router.replace(user.role === "TENANT" ? "/penghuni" : "/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server");
      setLoading(false);
    }
  }

  return (
    <main className="bg-subtle grid flex-1 place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <form onSubmit={onSubmit} className="mt-8 rounded-xl border border-line bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Selamat datang</h1>
          <p className="mt-1 text-sm text-ink-soft">Masuk sebagai pengelola atau penghuni kos.</p>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <label className="mt-6 block text-sm font-medium">
            Email
            <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
              <Mail className="size-4 text-ink-soft" />
              <input name="email" type="email" required autoComplete="email" className="w-full bg-transparent py-3 outline-none" />
            </span>
          </label>

          <label className="mt-4 block text-sm font-medium">
            Password
            <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
              <LockKeyhole className="size-4 text-ink-soft" />
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-transparent py-3 outline-none"
              />
            </span>
          </label>

          <button
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-3 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />} Masuk
          </button>
        </form>
      </div>
    </main>
  );
}

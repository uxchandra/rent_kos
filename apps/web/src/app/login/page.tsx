"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { Ornament } from "@/components/landing/ornament";
import { Glow } from "@/components/landing/glow";
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
    <main className="relative grid flex-1 place-items-center overflow-hidden bg-night px-4 py-16 text-white">
      <Ornament className="absolute -left-8 bottom-6 w-56 sm:w-64" />
      <Ornament className="absolute -right-10 top-6 w-48 rotate-12 sm:w-56" />
      <Glow opacity={0.4} className="-left-48 -top-48 size-[520px] motion-safe:animate-drift" />
      <Glow tone="lime" opacity={0.1} className="-bottom-56 -right-48 size-[520px] motion-safe:animate-drift motion-safe:[animation-delay:-6s]" />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center">
          <Logo night />
        </div>
        <form onSubmit={onSubmit} className="mt-8 rounded-3xl bg-night-2/90 p-7 shadow-2xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-md sm:p-8">
          <h1 className="text-2xl font-bold">Selamat datang</h1>
          <p className="mt-1 text-sm text-white/60">Login untuk pengelola dan penghuni SmartKos.</p>

          {error && <p className="mt-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">{error}</p>}

          <label className="mt-6 block text-sm font-medium text-white/80">
            Email
            <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/12 bg-night px-3 focus-within:border-lime focus-within:ring-2 focus-within:ring-lime/20">
              <Mail className="size-4 text-white/45" />
              <input name="email" type="email" required autoComplete="email" className="w-full bg-transparent py-3 text-base text-white outline-none sm:text-sm" />
            </span>
          </label>

          <label className="mt-4 block text-sm font-medium text-white/80">
            Password
            <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/12 bg-night px-3 focus-within:border-lime focus-within:ring-2 focus-within:ring-lime/20">
              <LockKeyhole className="size-4 text-white/45" />
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-transparent py-3 text-base text-white outline-none sm:text-sm"
              />
            </span>
          </label>

          <button
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-lime py-3 font-semibold text-night transition hover:brightness-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />} Login
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/55 transition hover:text-white">
            <ArrowLeft className="size-4" /> Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}

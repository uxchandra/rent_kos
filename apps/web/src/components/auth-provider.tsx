"use client";

import { createContext, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";
import type { CurrentUser, Role } from "@/lib/types";

type AuthValue = {
  user: CurrentUser;
  logout: () => Promise<void>;
  /** true bila user punya salah satu izin. Owner selalu true. */
  can: (...anyOf: string[]) => boolean;
  isOwner: boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

/** Memuat user yang sedang login; arahkan ke /login bila belum login atau role tidak sesuai. */
export function AuthProvider({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    api<{ user: CurrentUser }>("/auth/me")
      .then(({ user }) => {
        if (roles.includes(user.role)) setUser(user);
        else router.replace(user.role === "TENANT" ? "/penghuni" : "/admin");
      })
      .catch(() => router.replace("/login"));
  }, [roles, router]);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="grid flex-1 place-items-center">
        <Loader2 className="size-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const isOwner = user.role === "OWNER";
  const can = (...anyOf: string[]) => isOwner || anyOf.some((p) => user.permissions.includes(p));
  return <AuthContext value={{ user, logout, can, isOwner }}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

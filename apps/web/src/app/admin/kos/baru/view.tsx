"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, PageHeader, useFeedback } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { KosForm, emptyKos } from "../kos-form";

export default function NewKosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useFeedback();

  if (user.role !== "OWNER") return <EmptyState title="Hanya Owner yang bisa menambah cabang" />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/kos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft className="size-4" /> Cabang
      </Link>
      <PageHeader title="Tambah cabang" description="Foto, tipe kamar, dan kamar bisa ditambahkan setelah cabang disimpan." />
      <KosForm
        initial={emptyKos}
        isOwner
        isNew
        onSubmit={async (payload) => {
          const { data } = await api<{ data: { id: number } }>("/admin/kos", { method: "POST", body: JSON.stringify(payload) });
          toast("Cabang berhasil dibuat");
          router.replace(`/admin/kos/${data.id}?tab=kamar`);
        }}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, EmptyState, Spinner, useFeedback } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/client-api";
import type { AdminKosDetail } from "@/lib/admin-types";
import { KosForm, kosToForm } from "../kos-form";
import { PhotosTab } from "./photos-tab";
import { RoomsTab } from "./rooms-tab";
import { AdminsTab } from "./admins-tab";
import { buttonVariants } from "@/components/ui/button";

const tabs = [
  { id: "info", label: "Info" },
  { id: "foto", label: "Foto" },
  { id: "kamar", label: "Tipe & kamar" },
  { id: "pengelola", label: "Pengelola", ownerOnly: true },
];

export default function KosDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const tab = useSearchParams().get("tab") ?? "info";
  const { user, can } = useAuth();
  const canEdit = can("kos.update");
  const { toast, confirm } = useFeedback();
  const { data, error, mutate } = useSWR<{ data: AdminKosDetail }>(`/admin/kos/${id}`);
  const isOwner = user.role === "OWNER";

  if (error) return <EmptyState title={error instanceof ApiError ? error.message : "Gagal memuat"} />;
  if (!data) return <Spinner />;
  const kos = data.data;

  async function remove() {
    const ok = await confirm({
      title: `Hapus ${kos.name}?`,
      text: "Semua tipe kamar, kamar, dan foto cabang ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Hapus cabang",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/admin/kos/${kos.id}`, { method: "DELETE" });
      toast("Cabang dihapus");
      router.replace("/admin/kos");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Gagal menghapus", "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/kos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Cabang
      </Link>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{kos.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {kos.city} ·{" "}
            {!kos.isPublished ? (
              <span className="font-medium text-amber-600">Draf</span>
            ) : kos.comingSoon ? (
              <span className="font-medium text-foreground">Segera hadir di website</span>
            ) : (
              <span className="font-medium text-emerald-700">Tayang di website</span>
            )}
          </p>
        </div>
        {kos.isPublished && (
          <a href={`/${kos.slug}`} target="_blank" className={buttonVariants({ variant: "outline" })}>
            <ExternalLink className="size-4" /> Lihat halaman
          </a>
        )}
      </div>

      <div className="no-scrollbar sticky top-14 z-20 -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-border bg-background px-4 md:mx-0 md:px-0">
        {tabs
          .filter((t) => !t.ownerOnly || isOwner)
          .map((t) => (
            <Link
              key={t.id}
              href={`?tab=${t.id}`}
              scroll={false}
              replace
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
      </div>

      {!canEdit && (
        <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">Peran Anda hanya bisa melihat data cabang ini. Perubahan dilakukan oleh Owner atau admin dengan izin ubah cabang.</p>
      )}
      {/* Tanpa izin ubah cabang: semua isian & tombol di dalam fieldset otomatis nonaktif. */}
      <fieldset disabled={!canEdit} className="min-w-0">
        {tab === "info" && (
          <>
            <KosForm
              key={kos.id}
              initial={kosToForm(kos)}
              isOwner={isOwner}
              onSubmit={async (payload) => {
                await api(`/admin/kos/${kos.id}`, { method: "PUT", body: JSON.stringify(payload) });
                await mutate();
                toast("Perubahan disimpan");
              }}
            />
            {isOwner && (
              <Card className="mt-8 border-red-200">
                <h2 className="font-bold text-red-700">Hapus cabang</h2>
                <p className="mb-4 mt-1 text-sm text-muted-foreground">Hanya bisa dilakukan jika cabang belum pernah punya penyewa.</p>
                <Button variant="danger" onClick={remove}>
                  Hapus {kos.name}
                </Button>
              </Card>
            )}
          </>
        )}
        {tab === "foto" && <PhotosTab kos={kos} reload={mutate} />}
        {tab === "kamar" && <RoomsTab kos={kos} reload={mutate} />}
        {tab === "pengelola" && isOwner && <AdminsTab key={kos.admins.map((a) => a.id).join()} kos={kos} reload={mutate} />}
      </fieldset>
    </div>
  );
}

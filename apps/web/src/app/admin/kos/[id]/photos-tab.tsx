"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { Button, Card, useFeedback } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { uploadPhotos } from "@/lib/image-compress";
import type { AdminKosDetail } from "@/lib/admin-types";

export function PhotosTab({ kos, reload }: { kos: AdminKosDetail; reload: () => Promise<unknown> }) {
  const { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await fn();
      await reload();
      toast(success);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal", "error");
    } finally {
      setBusy(null);
    }
  }

  const onCover = (files: FileList | null) =>
    files?.[0] && run("cover", () => uploadPhotos(`/admin/kos/${kos.id}/cover`, [files[0]], "photo"), "Cover diperbarui");

  const onGallery = (files: FileList | null) =>
    files?.length && run("gallery", () => uploadPhotos(`/admin/kos/${kos.id}/photos`, [...files]), `${files.length} foto ditambahkan`);

  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Foto cover</h2>
            <p className="text-sm text-muted">Foto utama di website dan kartu cabang. Disarankan foto bangunan dari depan.</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-subtle">
          {kos.coverImage ? (
            <img src={kos.coverImage} alt="Cover" className="aspect-video w-full object-cover" />
          ) : (
            <div className="grid aspect-video place-items-center text-sm text-muted">Belum ada cover</div>
          )}
          <Button
            variant="secondary"
            loading={busy === "cover"}
            onClick={() => coverInput.current?.click()}
            className="absolute bottom-3 right-3 shadow"
          >
            <ImagePlus className="size-4" /> {kos.coverImage ? "Ganti cover" : "Upload cover"}
          </Button>
        </div>
        <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => (onCover(e.target.files), (e.target.value = ""))} />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Galeri</h2>
            <p className="text-sm text-muted">Ruang bersama, dapur, kamar mandi, dan sudut lain. Urutan sesuai waktu upload.</p>
          </div>
          <Button loading={busy === "gallery"} onClick={() => galleryInput.current?.click()}>
            <ImagePlus className="size-4" /> Tambah foto
          </Button>
          <input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={(e) => (onGallery(e.target.files), (e.target.value = ""))} />
        </div>

        {kos.photos.length === 0 ? (
          <button
            onClick={() => galleryInput.current?.click()}
            className="grid w-full place-items-center rounded-xl border-2 border-dashed border-line py-14 text-sm text-muted hover:border-brand-400"
          >
            <ImagePlus className="mb-2 size-8 text-brand-400" />
            Ketuk untuk menambah foto
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {kos.photos.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-xl bg-subtle">
                <img src={p.url} alt={p.caption ?? ""} className="aspect-4/3 w-full object-cover" />
                {busy === `p${p.id}` && (
                  <div className="absolute inset-0 grid place-items-center bg-white/60">
                    <Loader2 className="size-6 animate-spin text-brand-600" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-linear-to-t from-black/60 to-transparent p-2">
                  <button
                    onClick={() =>
                      run(`p${p.id}`, () => api(`/admin/kos/${kos.id}/photos/${p.id}/cover`, { method: "POST" }), "Dijadikan cover")
                    }
                    className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold"
                  >
                    <Star className="size-3.5" /> Cover
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm({ title: "Hapus foto?", text: "Foto akan dihapus dari website.", confirmLabel: "Hapus", danger: true }))
                        run(`p${p.id}`, () => api(`/admin/kos/${kos.id}/photos/${p.id}`, { method: "DELETE" }), "Foto dihapus");
                    }}
                    className="grid size-7 place-items-center rounded-full bg-white/90 text-red-600"
                    aria-label="Hapus foto"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


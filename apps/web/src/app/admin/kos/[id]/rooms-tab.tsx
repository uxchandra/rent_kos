"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import { useRef, useState } from "react";
import { EyeOff, ImagePlus, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button, Dialog, EmptyState, Field, Input, Select, Switch, TagInput, Textarea, useFeedback } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/client-api";
import { uploadPhotos } from "@/lib/image-compress";
import { price } from "@/lib/format";
import { roomStatusLabel, roomStatusStyle, type AdminKosDetail, type AdminRoom, type AdminRoomType, type RoomStatus } from "@/lib/admin-types";

type Reload = () => Promise<unknown>;

/** "101-105, 201" → ["101",...,"105","201"]; "A1-A3" → ["A1","A2","A3"]. */
export function parseRoomNumbers(input: string): string[] {
  const out: string[] = [];
  for (const part of input.split(/[,\s]+/).filter(Boolean)) {
    const range = part.match(/^([A-Za-z]*)(\d+)-\1?(\d+)$/);
    if (range) {
      const [, prefix, from, to] = range;
      const a = Number(from);
      const b = Number(to);
      if (b >= a && b - a < 100) for (let n = a; n <= b; n++) out.push(`${prefix}${String(n).padStart(from.length, "0")}`);
    } else out.push(part);
  }
  return [...new Set(out)];
}

function useAction() {
  const { toast } = useFeedback();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  async function run(fn: () => Promise<unknown>, success: string) {
    setSaving(true);
    setErrors({});
    try {
      await fn();
      toast(success);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      else toast(err instanceof Error ? err.message : "Gagal menyimpan", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }
  return { saving, errors, setErrors, run };
}

// ---------- Form tipe kamar ----------

function RoomTypeDialog({
  kosId,
  type,
  open,
  onClose,
  reload,
}: {
  kosId: number;
  type: AdminRoomType | null;
  open: boolean;
  onClose: () => void;
  reload: Reload;
}) {
  const initial = {
    name: type?.name ?? "",
    monthlyPrice: type ? String(type.monthlyPrice) : "",
    size: type?.size ?? "",
    description: type?.description ?? "",
    facilities: type?.facilities ?? [],
    isActive: type?.isActive ?? true,
  };
  const [v, setV] = useState(initial);
  const [lastType, setLastType] = useState(type);
  if (type !== lastType) {
    setLastType(type);
    setV(initial);
  }
  const { saving, errors, run } = useAction();

  async function save() {
    const body = JSON.stringify({ ...v, monthlyPrice: Number(v.monthlyPrice.replace(/\D/g, "")) });
    const ok = await run(
      () =>
        type
          ? api(`/admin/room-types/${type.id}`, { method: "PUT", body })
          : api(`/admin/kos/${kosId}/room-types`, { method: "POST", body }),
      type ? "Tipe kamar diperbarui" : "Tipe kamar ditambahkan",
    );
    if (ok) {
      await reload();
      onClose();
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={type ? `Edit tipe ${type.name}` : "Tambah tipe kamar"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button loading={saving} onClick={save}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama tipe" error={errors.name}>
          <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Premium" />
        </Field>
        <Field label="Harga per bulan (Rp)" error={errors.monthlyPrice}>
          <Input value={v.monthlyPrice} onChange={(e) => setV({ ...v, monthlyPrice: e.target.value })} inputMode="numeric" placeholder="1400000" />
        </Field>
        <Field label="Ukuran" error={errors.size}>
          <Input value={v.size} onChange={(e) => setV({ ...v, size: e.target.value })} placeholder="3 x 4 m" />
        </Field>
        <div className="flex items-end pb-2.5">
          <Switch checked={v.isActive} onChange={(c) => setV({ ...v, isActive: c })} label="Tampil di website" />
        </div>
        <Field label="Deskripsi" error={errors.description} className="sm:col-span-2">
          <Textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} rows={3} />
        </Field>
        <Field label="Fasilitas kamar" hint="Ketik lalu Enter. Contoh: AC, Kamar mandi dalam, Kasur 160x200." className="sm:col-span-2">
          <TagInput value={v.facilities} onChange={(f) => setV({ ...v, facilities: f })} placeholder="AC" />
        </Field>
      </div>
    </Dialog>
  );
}

// ---------- Tambah kamar ----------

function AddRoomsDialog({ type, onClose, reload }: { type: AdminRoomType | null; onClose: () => void; reload: Reload }) {
  const [numbers, setNumbers] = useState("");
  const [floor, setFloor] = useState("");
  const { saving, errors, run } = useAction();
  const parsed = parseRoomNumbers(numbers);

  async function save() {
    if (!type) return;
    const ok = await run(
      () => api(`/admin/room-types/${type.id}/rooms`, { method: "POST", body: JSON.stringify({ numbers: parsed, floor: floor || null }) }),
      `${parsed.length} kamar ditambahkan`,
    );
    if (ok) {
      await reload();
      setNumbers("");
      setFloor("");
      onClose();
    }
  }

  return (
    <Dialog
      open={!!type}
      onClose={onClose}
      title={`Tambah kamar · ${type?.name ?? ""}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button loading={saving} disabled={parsed.length === 0} onClick={save}>
            Tambah {parsed.length || ""} kamar
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Nomor kamar" error={errors.numbers} hint="Pisahkan dengan koma, atau pakai rentang: 101-105, A1-A4.">
          <Input value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder="101-105" autoFocus />
        </Field>
        <Field label="Lantai (opsional)" error={errors.floor}>
          <Input type="number" min={0} value={floor} onChange={(e) => setFloor(e.target.value)} inputMode="numeric" />
        </Field>
        {parsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {parsed.map((n) => (
              <span key={n} className="rounded-lg bg-mint px-2.5 py-1 text-sm font-semibold text-mint-ink">
                {n}
              </span>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ---------- Edit kamar ----------

function RoomDialog({ room, onClose, reload }: { room: AdminRoom | null; onClose: () => void; reload: Reload }) {
  const { confirm } = useFeedback();
  const initial = { number: room?.number ?? "", floor: room?.floor?.toString() ?? "", status: room?.status ?? "AVAILABLE", notes: room?.notes ?? "" };
  const [v, setV] = useState(initial);
  const [last, setLast] = useState(room);
  if (room !== last) {
    setLast(room);
    setV(initial);
  }
  const { saving, errors, run } = useAction();

  async function save() {
    if (!room) return;
    const ok = await run(
      () => api(`/admin/rooms/${room.id}`, { method: "PUT", body: JSON.stringify({ ...v, floor: v.floor || null }) }),
      `Kamar ${v.number} disimpan`,
    );
    if (ok) {
      await reload();
      onClose();
    }
  }

  async function remove() {
    if (!room) return;
    if (!(await confirm({ title: `Hapus kamar ${room.number}?`, text: "Kamar akan dihapus permanen.", confirmLabel: "Hapus", danger: true }))) return;
    if (await run(() => api(`/admin/rooms/${room.id}`, { method: "DELETE" }), "Kamar dihapus")) {
      await reload();
      onClose();
    }
  }

  return (
    <Dialog
      open={!!room}
      onClose={onClose}
      title={`Kamar ${room?.number ?? ""}`}
      footer={
        <>
          {!room?.hasActiveTenancy && (
            <Button variant="ghost" className="mr-auto text-red-600" onClick={remove}>
              <Trash2 className="size-4" /> Hapus
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button loading={saving} onClick={save}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomor kamar" error={errors.number}>
          <Input value={v.number} onChange={(e) => setV({ ...v, number: e.target.value })} />
        </Field>
        <Field label="Lantai" error={errors.floor}>
          <Input type="number" min={0} value={v.floor} onChange={(e) => setV({ ...v, floor: e.target.value })} />
        </Field>
        <Field label="Status" error={errors.status} className="sm:col-span-2">
          <Select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as RoomStatus })}>
            {(Object.keys(roomStatusLabel) as RoomStatus[]).map((s) => (
              <option key={s} value={s}>
                {roomStatusLabel[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Catatan" error={errors.notes} hint="Misal: AC sedang diservis." className="sm:col-span-2">
          <Input value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  );
}

// ---------- Tab ----------

export function RoomsTab({ kos, reload }: { kos: AdminKosDetail; reload: Reload }) {
  const { toast, confirm } = useFeedback();
  const [typeDialog, setTypeDialog] = useState<{ open: boolean; type: AdminRoomType | null }>({ open: false, type: null });
  const [addRoomsFor, setAddRoomsFor] = useState<AdminRoomType | null>(null);
  const [editRoom, setEditRoom] = useState<AdminRoom | null>(null);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<number | null>(null);

  async function act(fn: () => Promise<unknown>, success: string) {
    try {
      await fn();
      await reload();
      toast(success);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal", "error");
    }
  }

  async function onFiles(files: FileList | null) {
    const id = uploadTarget.current;
    if (!files?.length || !id) return;
    setUploadingFor(id);
    await act(() => uploadPhotos(`/admin/room-types/${id}/photos`, [...files]), `${files.length} foto ditambahkan`);
    setUploadingFor(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {kos.roomTypes.length} tipe · {kos.roomTypes.reduce((s, t) => s + t.rooms.length, 0)} kamar
        </p>
        <Button onClick={() => setTypeDialog({ open: true, type: null })}>
          <Plus className="size-4" /> Tipe kamar
        </Button>
      </div>

      {kos.roomTypes.length === 0 && (
        <EmptyState
          title="Belum ada tipe kamar"
          text="Buat tipe kamar dulu (misal Standar, Premium), lalu tambahkan nomor-nomor kamarnya."
          action={<Button onClick={() => setTypeDialog({ open: true, type: null })}>Tambah tipe kamar</Button>}
        />
      )}

      {kos.roomTypes.map((t) => (
        <section key={t.id} className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold">{t.name}</h3>
                {!t.isActive && (
                  <span className="flex items-center gap-1 rounded-md bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">
                    <EyeOff className="size-3" /> Disembunyikan
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-soft">
                <span className="font-semibold text-brand-700">{price(t.monthlyPrice)}</span>/bulan{t.size && ` · ${t.size}`}
              </p>
              {t.facilities && t.facilities.length > 0 && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{t.facilities.join(" · ")}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => setTypeDialog({ open: true, type: t })} className="rounded-full p-2 hover:bg-subtle" aria-label="Edit tipe">
                <Pencil className="size-4" />
              </button>
              <button
                onClick={async () => {
                  if (
                    await confirm({
                      title: `Hapus tipe ${t.name}?`,
                      text: `Tipe ini beserta ${t.rooms.length} kamar dan fotonya akan dihapus permanen.`,
                      confirmLabel: "Hapus",
                      danger: true,
                    })
                  )
                    act(() => api(`/admin/room-types/${t.id}`, { method: "DELETE" }), "Tipe kamar dihapus");
                }}
                className="rounded-full p-2 text-red-600 hover:bg-red-50"
                aria-label="Hapus tipe"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          {/* Foto tipe kamar */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-4">
            {t.photos.map((p, i) => (
              <div key={p.id} className="relative shrink-0">
                <img src={p.url} alt="" className="h-24 w-32 rounded-lg object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 text-[10px] font-bold">UTAMA</span>}
                <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                  {i > 0 && (
                    <button
                      onClick={() => act(() => api(`/admin/room-types/${t.id}/photos/${p.id}/primary`, { method: "POST" }), "Foto utama diperbarui")}
                      className="grid size-6 place-items-center rounded-full bg-white/90"
                      aria-label="Jadikan foto utama"
                    >
                      <Star className="size-3" />
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (await confirm({ title: "Hapus foto?", text: "Foto dihapus dari tipe kamar ini.", confirmLabel: "Hapus", danger: true }))
                        act(() => api(`/admin/room-types/${t.id}/photos/${p.id}`, { method: "DELETE" }), "Foto dihapus");
                    }}
                    className="grid size-6 place-items-center rounded-full bg-white/90 text-red-600"
                    aria-label="Hapus foto"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                uploadTarget.current = t.id;
                fileInput.current?.click();
              }}
              disabled={uploadingFor === t.id}
              className="grid h-24 w-32 shrink-0 place-items-center rounded-lg border-2 border-dashed border-line text-xs text-ink-soft hover:border-brand-400 disabled:opacity-50"
            >
              <span className="flex flex-col items-center gap-1">
                <ImagePlus className="size-5 text-brand-400" />
                {uploadingFor === t.id ? "Mengupload…" : "Tambah foto"}
              </span>
            </button>
          </div>

          {/* Kamar */}
          <div className="border-t border-line bg-subtle/60 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Kamar ({t.rooms.length})</p>
              <button onClick={() => setAddRoomsFor(t)} className="flex items-center gap-1 text-sm font-semibold text-brand-600">
                <Plus className="size-4" /> Tambah kamar
              </button>
            </div>
            {t.rooms.length === 0 ? (
              <p className="text-sm text-ink-soft">Belum ada kamar. Tambahkan nomor kamar agar bisa disewakan.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {t.rooms.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setEditRoom(r)}
                    className={`rounded-xl border px-2 py-2.5 text-center transition active:scale-95 ${roomStatusStyle[r.status]}`}
                  >
                    <span className="block font-bold">{r.number}</span>
                    <span className="block text-[10px] font-medium">{roomStatusLabel[r.status]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => (onFiles(e.target.files), (e.target.value = ""))} />
      <RoomTypeDialog
        kosId={kos.id}
        type={typeDialog.type}
        open={typeDialog.open}
        onClose={() => setTypeDialog({ open: false, type: null })}
        reload={reload}
      />
      <AddRoomsDialog type={addRoomsFor} onClose={() => setAddRoomsFor(null)} reload={reload} />
      <RoomDialog room={editRoom} onClose={() => setEditRoom(null)} reload={reload} />
    </div>
  );
}

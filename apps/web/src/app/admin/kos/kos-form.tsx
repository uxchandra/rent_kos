"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button, Card, Field, Input, Select, Switch, TagInput, Textarea } from "@/components/admin/ui";
import { ApiError } from "@/lib/client-api";
import type { AdminKosDetail } from "@/lib/admin-types";
import type { KosGender } from "@/lib/types";

export type KosFormValues = {
  name: string;
  slug: string;
  tagline: string;
  area: string;
  areaImageCredit: string;
  description: string;
  address: string;
  city: string;
  province: string;
  latitude: string;
  longitude: string;
  gender: KosGender;
  facilities: string[];
  rules: string;
  nearby: { name: string; distance: string }[];
  whatsapp: string;
  defaultDeposit: string;
  billingDueDays: string;
  isPublished: boolean;
  comingSoon: boolean;
};

export const emptyKos: KosFormValues = {
  name: "",
  slug: "",
  tagline: "",
  area: "",
  areaImageCredit: "",
  description: "",
  address: "",
  city: "",
  province: "",
  latitude: "",
  longitude: "",
  gender: "CAMPUR",
  facilities: [],
  rules: "",
  nearby: [],
  whatsapp: "",
  defaultDeposit: "0",
  billingDueDays: "7",
  isPublished: false,
  comingSoon: false,
};

export function kosToForm(k: AdminKosDetail): KosFormValues {
  return {
    name: k.name,
    slug: k.slug,
    tagline: k.tagline ?? "",
    area: k.area ?? "",
    areaImageCredit: k.areaImageCredit ?? "",
    description: k.description ?? "",
    address: k.address,
    city: k.city,
    province: k.province ?? "",
    latitude: k.latitude?.toString() ?? "",
    longitude: k.longitude?.toString() ?? "",
    gender: k.gender,
    facilities: k.facilities ?? [],
    rules: k.rules ?? "",
    nearby: k.nearby ?? [],
    whatsapp: k.whatsapp ? `0${k.whatsapp.slice(2)}` : "",
    defaultDeposit: String(k.defaultDeposit),
    billingDueDays: String(k.billingDueDays),
    isPublished: k.isPublished,
    comingSoon: k.comingSoon,
  };
}

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/smartkos/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Ubah nilai form menjadi body JSON yang diharapkan API. */
function toPayload(v: KosFormValues) {
  return {
    ...v,
    latitude: v.latitude ? Number(v.latitude) : null,
    longitude: v.longitude ? Number(v.longitude) : null,
    defaultDeposit: Number(v.defaultDeposit.replace(/\D/g, "")) || 0,
    billingDueDays: Number(v.billingDueDays) || 7,
    nearby: v.nearby.filter((n) => n.name.trim() && n.distance.trim()),
  };
}

export function KosForm({
  initial,
  isOwner,
  isNew,
  onSubmit,
}: {
  initial: KosFormValues;
  isOwner: boolean;
  isNew?: boolean;
  onSubmit: (payload: ReturnType<typeof toPayload>) => Promise<void>;
}) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [coords, setCoords] = useState("");

  const set = <K extends keyof KosFormValues>(key: K, value: KosFormValues[K]) => setV((s) => ({ ...s, [key]: value }));

  function applyCoords(text: string) {
    setCoords(text);
    const m = text.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) setV((s) => ({ ...s, latitude: m[1], longitude: m[2] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      await onSubmit(toPayload(v));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setFormError(err.errors ? "Periksa kembali isian yang ditandai merah." : err.message);
      } else setFormError("Tidak dapat terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-20 md:pb-0">
      <Card>
        <h2 className="mb-5 font-bold">Informasi dasar</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama cabang" error={errors.name} className="sm:col-span-2">
            <Input
              value={v.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", toSlug(e.target.value));
              }}
              placeholder="SmartKos Seturan"
              required
            />
          </Field>
          <Field
            label="Alamat website"
            error={errors.slug}
            hint={isOwner ? "Huruf kecil, angka, dan strip. Mengubah slug akan mengubah link cabang." : "Hanya Owner yang bisa mengubah."}
          >
            <div className="flex items-center rounded-xl border border-border bg-muted focus-within:border-primary">
              <span className="pl-3.5 text-sm text-muted-foreground">smartkos.com/</span>
              <input
                value={v.slug}
                disabled={!isOwner}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase());
                }}
                className="w-full bg-transparent py-2.5 pr-3.5 text-base outline-none disabled:text-muted-foreground sm:text-sm"
                required
              />
            </div>
          </Field>
          <Field label="Khusus" error={errors.gender}>
            <Select value={v.gender} onChange={(e) => set("gender", e.target.value as KosGender)}>
              <option value="PUTRI">Putri</option>
              <option value="PUTRA">Putra</option>
              <option value="CAMPUR">Campur</option>
            </Select>
          </Field>
          <Field label="Tagline" error={errors.tagline} hint="Satu kalimat singkat yang muncul di bawah nama." className="sm:col-span-2">
            <Input value={v.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Kos putri tenang dekat UGM & UNY" />
          </Field>
          <Field label="Nama daerah" error={errors.area} hint="Judul kartu cabang di beranda. Kosongkan untuk memakai nama kota.">
            <Input value={v.area} onChange={(e) => set("area", e.target.value)} placeholder="Madiun" />
          </Field>
          <Field label="Kredit foto daerah" error={errors.areaImageCredit} hint="Wajib diisi jika foto daerah dari Wikimedia atau sumber lain.">
            <Input value={v.areaImageCredit} onChange={(e) => set("areaImageCredit", e.target.value)} placeholder="Foto: Nama, CC BY 4.0, via Wikimedia Commons" />
          </Field>
          <Field label="Deskripsi" error={errors.description} className="sm:col-span-2">
            <Textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={5} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-5 font-bold">Lokasi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Alamat lengkap" error={errors.address} className="sm:col-span-2">
            <Input value={v.address} onChange={(e) => set("address", e.target.value)} required />
          </Field>
          <Field label="Kota" error={errors.city}>
            <Input value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Yogyakarta" required />
          </Field>
          <Field label="Provinsi" error={errors.province}>
            <Input value={v.province} onChange={(e) => set("province", e.target.value)} />
          </Field>
          <Field
            label="Titik peta"
            hint="Di Google Maps, tekan lama/klik kanan lokasi kos, salin angka koordinatnya, lalu tempel di sini."
            error={errors.latitude ?? errors.longitude}
            className="sm:col-span-2"
          >
            <div className="flex items-center gap-2">
              <MapPin className="size-5 shrink-0 text-foreground" />
              <Input value={coords} onChange={(e) => applyCoords(e.target.value)} placeholder="-7.7712, 110.4105" />
            </div>
            {v.latitude && v.longitude && (
              <span className="mt-1.5 block text-xs text-emerald-700">
                Tersimpan: {v.latitude}, {v.longitude} ·{" "}
                <a href={`https://www.google.com/maps?q=${v.latitude},${v.longitude}`} target="_blank" className="underline">
                  cek di peta
                </a>
              </span>
            )}
          </Field>
        </div>

        <p className="mb-2 mt-6 text-sm font-medium">Tempat terdekat</p>
        <div className="space-y-2">
          {v.nearby.map((n, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={n.name}
                placeholder="Universitas Gadjah Mada"
                onChange={(e) => set("nearby", v.nearby.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <Input
                value={n.distance}
                placeholder="1,2 km"
                className="w-28! shrink-0"
                onChange={(e) => set("nearby", v.nearby.map((x, j) => (j === i ? { ...x, distance: e.target.value } : x)))}
              />
              <button
                type="button"
                onClick={() => set("nearby", v.nearby.filter((_, j) => j !== i))}
                className="shrink-0 rounded-xl px-2 text-muted-foreground hover:bg-muted hover:text-red-600"
                aria-label="Hapus"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" className="px-2!" onClick={() => set("nearby", [...v.nearby, { name: "", distance: "" }])}>
            <Plus className="size-4" /> Tambah tempat
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-5 font-bold">Fasilitas & peraturan</h2>
        <div className="grid gap-4">
          <Field label="Fasilitas bersama" hint="Ketik lalu tekan Enter. Contoh: WiFi 100 Mbps, Dapur bersama, Parkir motor.">
            <TagInput value={v.facilities} onChange={(f) => set("facilities", f)} placeholder="WiFi 100 Mbps" />
          </Field>
          <Field label="Peraturan kos" hint="Satu peraturan per baris." error={errors.rules}>
            <Textarea value={v.rules} onChange={(e) => set("rules", e.target.value)} rows={5} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-5 font-bold">Kontak & pembayaran</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="WhatsApp pengelola" error={errors.whatsapp}>
            <Input value={v.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} inputMode="tel" placeholder="081234567890" />
          </Field>
          <Field label="Deposit (Rp)" error={errors.defaultDeposit} hint="Isi 0 jika tanpa deposit.">
            <Input value={v.defaultDeposit} onChange={(e) => set("defaultDeposit", e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Jatuh tempo tagihan" error={errors.billingDueDays} hint="Hari setelah tagihan terbit.">
            <Input type="number" min={1} max={28} value={v.billingDueDays} onChange={(e) => set("billingDueDays", e.target.value)} />
          </Field>
        </div>
        {isOwner && (
          <div className="mt-6 rounded-xl bg-muted p-4">
            <Switch checked={v.isPublished} onChange={(c) => set("isPublished", c)} label="Tayangkan di website" />
            <p className="mt-1 pl-14 text-xs text-muted-foreground">Jika mati, cabang tidak muncul di website publik.</p>
            <div className="mt-4 border-t border-border pt-4">
              <Switch checked={v.comingSoon} onChange={(c) => set("comingSoon", c)} label="Segera hadir" />
              <p className="mt-1 pl-14 text-xs text-muted-foreground">Cabang tampil dengan label &quot;Segera hadir&quot;, tapi kamarnya belum bisa dicari atau diajukan sewa.</p>
            </div>
          </div>
        )}
      </Card>

      {formError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

      <div className="fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <Button type="submit" loading={saving} className="w-full md:w-auto">
          {isNew ? "Simpan cabang" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}

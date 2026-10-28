"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, Field, Input, PageHeader, useFeedback } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/client-api";

export default function AkunPage() {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [v, setV] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (v.newPassword !== v.confirm) return setErrors({ confirm: ["Konfirmasi password tidak sama"] });
    setSaving(true);
    setErrors({});
    try {
      await api("/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword: v.currentPassword, newPassword: v.newPassword }) });
      toast("Password berhasil diubah");
      setV({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.errors ?? { currentPassword: [err.message] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Akun saya" />
      <Card className="mb-5">
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-2 text-sm">{user.role === "OWNER" ? "Owner · semua cabang" : `Admin · ${user.kos.map((k) => k.name).join(", ")}`}</p>
      </Card>
      <Card>
        <h2 className="mb-5 font-bold">Ganti password</h2>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Password saat ini" error={errors.currentPassword}>
            <Input type="password" value={v.currentPassword} onChange={(e) => setV({ ...v, currentPassword: e.target.value })} autoComplete="current-password" required />
          </Field>
          <Field label="Password baru" error={errors.newPassword} hint="Minimal 8 karakter.">
            <Input type="password" value={v.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} autoComplete="new-password" required />
          </Field>
          <Field label="Ulangi password baru" error={errors.confirm}>
            <Input type="password" value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} autoComplete="new-password" required />
          </Field>
          <Button type="submit" loading={saving} className="justify-self-start">
            Simpan password
          </Button>
        </form>
      </Card>
    </div>
  );
}

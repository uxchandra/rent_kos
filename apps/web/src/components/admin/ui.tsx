"use client";

import { createContext, use, useCallback, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast as sonner } from "sonner";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/client-api";
import { Button as UiButton } from "@/components/ui/button";
import { Input as UiInput } from "@/components/ui/input";
import { Textarea as UiTextarea } from "@/components/ui/textarea";
import { Switch as UiSwitch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog as UiDialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Kit admin: pembungkus tipis komponen shadcn/ui dengan API lama, supaya halaman tidak perlu diubah satu per satu.

// ---------- Tombol ----------

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
const buttonVariant = { primary: "default", secondary: "outline", danger: "destructive", ghost: "ghost" } as const;

export function Button({
  variant = "primary",
  loading = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <UiButton {...props} variant={buttonVariant[variant]} disabled={loading || props.disabled}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </UiButton>
  );
}

// ---------- Form ----------

export function Field({
  label,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  error?: string[] | string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <label className={cn("grid gap-2", className)}>
      <Label asChild>
        <span>{label}</span>
      </Label>
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <UiInput {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <UiTextarea rows={4} {...props} />;
}

/** Select bawaan browser bergaya input shadcn (dipakai dengan <option>). */
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
    />
  );
}

/** Input daftar teks (fasilitas, dll): ketik lalu Enter atau koma. */
export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const items = draft
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !value.includes(s));
    if (items.length) onChange([...value, ...items]);
    setDraft("");
  };
  return (
    <div className="rounded-lg border border-input p-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="rounded-full hover:text-foreground" aria-label={`Hapus ${tag}`}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={add}
          placeholder={value.length ? "" : placeholder}
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <Label className={cn("font-normal", disabled ? "opacity-50" : "cursor-pointer")}>
      <UiSwitch checked={checked} onCheckedChange={onChange} disabled={disabled} />
      {label}
    </Label>
  );
}

// ---------- Layout ----------

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

/** Kartu berisi bebas (tanpa header/footer); untuk kartu bertingkat pakai `@/components/ui/card`. */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10 sm:p-6", className)}>{children}</div>;
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Dialog ----------

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <UiDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn("flex max-h-[92dvh] flex-col gap-0 p-0", size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <DialogFooter className="m-0 px-5 py-4">{footer}</DialogFooter>}
      </DialogContent>
    </UiDialog>
  );
}

// ---------- Konfirmasi & toast ----------

type ConfirmState = { title: string; text: string; confirmLabel: string; danger: boolean; resolve: (ok: boolean) => void } | null;

const FeedbackContext = createContext<{
  toast: (message: string, type?: "success" | "error") => void;
  confirm: (opts: { title: string; text: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
} | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const toast = useCallback((message: string, type: "success" | "error" = "success") => {
    if (type === "error") sonner.error(message);
    else sonner.success(message);
  }, []);

  const confirm = useCallback(
    (opts: { title: string; text: string; confirmLabel?: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) => setConfirmState({ confirmLabel: "Ya, lanjutkan", danger: false, ...opts, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  return (
    <FeedbackContext value={{ toast, confirm }}>
      {children}
      <Toaster theme="light" position="top-center" richColors />
      <AlertDialog open={!!confirmState} onOpenChange={(o) => !o && close(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmState?.text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction variant={confirmState?.danger ? "destructive" : "default"} onClick={() => close(true)}>
              {confirmState?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FeedbackContext>
  );
}

export function useFeedback() {
  const ctx = use(FeedbackContext);
  if (!ctx) throw new Error("useFeedback harus di dalam FeedbackProvider");
  return ctx;
}

/** Simpan form: tangkap error validasi per field, selain itu tampilkan toast. */
export function useSave() {
  const { toast } = useFeedback();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
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
  return { errors, saving, run };
}

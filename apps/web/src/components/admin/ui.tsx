"use client";

import { createContext, use, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";

// ---------- Tombol ----------

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "border border-line bg-white text-ink hover:border-ink",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-muted hover:bg-subtle hover:text-ink",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
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
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {message ? <span className="mt-1 block text-xs text-red-600">{message}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// text-base di HP agar iOS tidak auto-zoom saat input difokus.
const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 sm:text-sm";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
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
    <div className="rounded-xl border border-line bg-white p-2 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-lavender py-1 pl-3 pr-1.5 text-sm text-brand-800">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="rounded-full p-0.5 hover:bg-brand-200" aria-label={`Hapus ${tag}`}>
              <X className="size-3.5" />
            </button>
          </span>
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
          className="min-w-32 flex-1 bg-transparent px-1.5 py-1 text-base outline-none sm:text-sm"
        />
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand-600" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-5.5" : "left-0.5"}`} />
      </button>
      <span className="text-sm">{label}</span>
    </label>
  );
}

// ---------- Layout ----------

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <Loader2 className="size-7 animate-spin text-brand-500" />
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-cream/50 px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Dialog (bottom sheet di HP, modal di desktop) ----------

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label={title}>
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Tutup" />
      <div
        className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-semibold">{title}</p>
          <button onClick={onClose} className="-mr-2 rounded-full p-2 hover:bg-subtle" aria-label="Tutup">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:pb-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ---------- Konfirmasi & toast ----------

type Toast = { id: number; type: "success" | "error"; message: string };
type ConfirmState = { title: string; text: string; confirmLabel: string; danger: boolean; resolve: (ok: boolean) => void } | null;

const FeedbackContext = createContext<{
  toast: (message: string, type?: Toast["type"]) => void;
  confirm: (opts: { title: string; text: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
} | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const confirm = useCallback(
    (opts: { title: string; text: string; confirmLabel?: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) =>
        setConfirmState({ confirmLabel: "Ya, lanjutkan", danger: false, ...opts, resolve }),
      ),
    [],
  );

  const close = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  return (
    <FeedbackContext value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg">
            {t.type === "success" ? <CheckCircle2 className="size-4 shrink-0 text-emerald-400" /> : <XCircle className="size-4 shrink-0 text-red-400" />}
            {t.message}
          </div>
        ))}
      </div>
      <Dialog
        open={!!confirmState}
        onClose={() => close(false)}
        title={confirmState?.title ?? ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              Batal
            </Button>
            <Button variant={confirmState?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {confirmState?.confirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">{confirmState?.text}</p>
      </Dialog>
    </FeedbackContext>
  );
}

export function useFeedback() {
  const ctx = use(FeedbackContext);
  if (!ctx) throw new Error("useFeedback harus di dalam FeedbackProvider");
  return ctx;
}

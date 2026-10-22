import { waLink } from "@/lib/format";
import { site } from "@/lib/site";

/** Tombol WhatsApp melayang di pojok kanan bawah. `raised` = naik di HP agar tidak menutupi bar bawah. */
export function WhatsAppFab({
  phone = site.whatsapp,
  message = "Halo SmartKos, saya mau tanya soal kamar.",
  raised = false,
}: {
  phone?: string;
  message?: string;
  raised?: boolean;
}) {
  return (
    <a
      href={waLink(phone, message)}
      target="_blank"
      rel="noopener"
      aria-label="Chat via WhatsApp"
      className={`group fixed right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_8px_24px_-6px_rgb(0_0_0/0.35)] transition hover:scale-105 sm:right-6 sm:bottom-6 lg:py-3 lg:pl-4 lg:pr-5 ${
        raised ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6" : "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
      }`}
    >
      <svg viewBox="0 0 32 32" className="size-7 shrink-0 fill-current" aria-hidden>
        <path d="M16.04 3C9 3 3.3 8.7 3.3 15.74c0 2.25.6 4.45 1.72 6.38L3.2 28.8l6.85-1.8a12.7 12.7 0 0 0 6 1.52h.01c7.03 0 12.74-5.71 12.74-12.75 0-3.4-1.33-6.6-3.73-9.01A12.66 12.66 0 0 0 16.04 3Zm0 23.37h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.07 1.07 1.09-3.96-.25-.41a10.56 10.56 0 0 1-1.62-5.62c0-5.85 4.77-10.61 10.65-10.61 2.84 0 5.5 1.11 7.51 3.12a10.54 10.54 0 0 1 3.11 7.5c0 5.86-4.77 10.62-10.62 10.62Zm5.83-7.95c-.32-.16-1.89-.93-2.18-1.04-.3-.1-.5-.16-.72.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59a9.6 9.6 0 0 1-1.78-2.21c-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.25 3.44 5.46 4.82.76.33 1.36.53 1.82.68.77.24 1.46.2 2.01.12.61-.09 1.89-.77 2.16-1.52.26-.75.26-1.39.18-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
      <span className="hidden text-sm font-semibold lg:inline">Chat kami</span>
    </a>
  );
}

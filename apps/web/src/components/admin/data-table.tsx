import { cn } from "@/lib/utils";
import { Table } from "@/components/ui/table";

/**
 * Data admin tampil sebagai tabel di md ke atas, dan sebagai kartu/daftar di HP.
 * Pakai keduanya berdampingan: <DesktopTable>…</DesktopTable> + <MobileList>…</MobileList>.
 */
export function DesktopTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("hidden overflow-hidden rounded-xl border border-border bg-card md:block", className)}>
      <Table className="[&_td]:py-3 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
        {children}
      </Table>
    </div>
  );
}

export function MobileList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("md:hidden", className)}>{children}</div>;
}

/** Sel berisi dua baris: teks utama + keterangan kecil. */
export function CellStack({ title, sub, className }: { title: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="truncate font-medium">{title}</div>
      {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

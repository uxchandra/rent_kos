"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download, MessageCircle } from "lucide-react";
import { Button, Card, EmptyState, PageHeader, Select, Spinner } from "@/components/admin/ui";
import { dateShort, price, priceCompact, waLink } from "@/lib/format";
import type { AdminKosSummary, Report } from "@/lib/admin-types";

// Warna seri (divalidasi dengan validator palet dataviz terhadap latar putih).
// Oranye di bawah kontras 3:1, jadi angka lengkap selalu tersedia di tabel bulanan.
const COLOR_PAID = "#7539e6";
const COLOR_OPEN = "#d98a1a";

const monthShort = (m: number) => new Date(Date.UTC(2000, m - 1, 1)).toLocaleDateString("id-ID", { month: "short", timeZone: "UTC" });
const monthLong = (m: number) => new Date(Date.UTC(2000, m - 1, 1)).toLocaleDateString("id-ID", { month: "long", timeZone: "UTC" });
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");

/** Batas atas sumbu yang "bulat" (1, 2, 2,5, 5 × 10ⁿ) dengan 4 garis bantu. */
function niceScale(max: number) {
  if (max <= 0) return { top: 1_000_000, ticks: [0, 250_000, 500_000, 750_000, 1_000_000] };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= raw)!;
  const top = step * Math.ceil(max / step);
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}

const axisLabel = (n: number) =>
  n === 0 ? "0" : n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt` : `${n / 1000} rb`;

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-4! sm:p-5!">
      <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
      <p className="mt-1 truncate text-xl font-bold sm:text-2xl">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted">{sub}</p>
    </Card>
  );
}

function BillingChart({ months }: { months: Report["months"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const { top, ticks } = niceScale(Math.max(...months.map((m) => m.billed)));
  const h = (n: number) => `${(n / top) * 100}%`;
  const active = hover === null ? null : months[hover];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: COLOR_PAID }} /> Lunas
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: COLOR_OPEN }} /> Belum lunas
        </span>
      </div>
      <div className="relative h-56">
        {/* Garis bantu & label sumbu Y */}
        {ticks.map((t) => (
          <div key={t} className="pointer-events-none absolute inset-x-0 flex items-center" style={{ bottom: h(t) }}>
            <span className="w-12 translate-y-1/2 pr-2 text-right text-[11px] text-muted">{axisLabel(t)}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-12 right-0 flex">
          {months.map((m, i) => {
            const open = m.billed - m.collected;
            return (
              <button
                key={m.month}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => setHover(hover === i ? null : i)}
                aria-label={`${monthLong(m.month)}: ditagih ${price(m.billed)}, lunas ${price(m.collected)}`}
                className={`relative flex flex-1 flex-col items-center justify-end rounded-md outline-none transition ${hover === i ? "bg-subtle" : ""}`}
              >
                <span className="flex h-full w-full max-w-6 flex-col justify-end gap-0.5">
                  {open > 0 && <span className="w-full rounded-t-[4px]" style={{ height: h(open), background: COLOR_OPEN }} />}
                  {m.collected > 0 && (
                    <span className={`w-full ${open > 0 ? "" : "rounded-t-[4px]"}`} style={{ height: h(m.collected), background: COLOR_PAID }} />
                  )}
                </span>
              </button>
            );
          })}
          {active && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-48 rounded-xl border border-line bg-white p-3 text-xs shadow-lg"
              style={{ left: `${((hover! + 0.5) / 12) * 100}%`, transform: `translateX(${hover! > 6 ? "-100%" : "0"})` }}
            >
              <p className="mb-1.5 text-sm font-semibold">{monthLong(active.month)}</p>
              <p className="flex justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="size-2 rounded-sm" style={{ background: COLOR_PAID }} /> Lunas
                </span>
                {price(active.collected)}
              </p>
              <p className="flex justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="size-2 rounded-sm" style={{ background: COLOR_OPEN }} /> Belum lunas
                </span>
                {price(active.billed - active.collected)}
              </p>
              <p className="mt-1.5 flex justify-between gap-3 border-t border-line pt-1.5 font-semibold">
                <span>Ditagih</span>
                {price(active.billed)}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex pl-12">
        {months.map((m) => (
          <span key={m.month} className="flex-1 pt-2 text-center text-[11px] text-muted">
            {monthShort(m.month)}
          </span>
        ))}
      </div>
    </div>
  );
}

function downloadCsv(report: Report, kosLabel: string) {
  const header = ["Bulan", "Ditagih", "Lunas", "Belum lunas", "Kas masuk sewa", "Kas masuk deposit", "Penghuni masuk", "Penghuni keluar"];
  const rows = report.months.map((m) => [
    `${monthLong(m.month)} ${report.year}`,
    m.billed,
    m.collected,
    m.billed - m.collected,
    m.cashRent,
    m.cashDeposit,
    m.moveIns,
    m.moveOuts,
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-${kosLabel}-${report.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanPage() {
  const [year, setYear] = useState<number | null>(null);
  const [kosId, setKosId] = useState<number | null>(null);
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (kosId) params.set("kosId", String(kosId));
  const { data } = useSWR<{ data: Report }>(`/admin/reports${params.size ? `?${params}` : ""}`);
  const { data: kosData } = useSWR<{ data: AdminKosSummary[] }>("/admin/kos");

  const r = data?.data;
  const kosList = kosData?.data ?? [];
  const sum = (k: keyof Report["months"][number]) => r?.months.reduce((s, m) => s + m[k], 0) ?? 0;
  const billed = sum("billed");
  const collected = sum("collected");
  const years = r ? Array.from({ length: r.currentYear - r.firstYear + 1 }, (_, i) => r.currentYear - i) : [];
  const kosLabel = kosId ? (kosList.find((k) => k.id === kosId)?.slug ?? "cabang") : "semua";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Laporan"
        description="Penagihan sewa, uang masuk, dan tunggakan."
        actions={
          r && (
            <Button variant="secondary" onClick={() => downloadCsv(r, kosLabel)}>
              <Download className="size-4" /> CSV
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Select value={r?.year ?? ""} onChange={(e) => setYear(Number(e.target.value))} className="w-auto!" aria-label="Tahun">
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
        {kosList.length > 1 && (
          <Select value={kosId ?? ""} onChange={(e) => setKosId(e.target.value ? Number(e.target.value) : null)} className="w-auto!" aria-label="Cabang">
            <option value="">Semua cabang</option>
            {kosList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {!r ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat label={`Sewa masuk ${r.year}`} value={priceCompact(sum("cashRent"))} sub={`+ deposit ${priceCompact(sum("cashDeposit"))}`} />
            <Stat label="Tingkat penagihan" value={pct(collected, billed)} sub={`${priceCompact(collected)} dari ${priceCompact(billed)}`} />
            <Stat label="Tunggakan saat ini" value={priceCompact(r.snapshot.overdueAmount)} sub={`${r.arrears.length} penghuni lewat jatuh tempo`} />
            <Stat label="Deposit ditahan" value={priceCompact(r.snapshot.depositsHeld)} sub={`dari ${r.snapshot.activeTenants} penghuni aktif`} />
          </div>

          <Card className="mt-6">
            <h2 className="font-bold">Tagihan sewa per bulan</h2>
            <p className="mb-5 text-sm text-muted">Berdasarkan periode tagihan. Ketuk atau arahkan kursor ke bulan untuk rinciannya.</p>
            {billed === 0 ? <EmptyState title={`Belum ada tagihan di ${r.year}`} /> : <BillingChart months={r.months} />}
          </Card>

          <Card className="mt-6 p-0! sm:p-0!">
            <h2 className="px-5 pt-5 font-bold sm:px-6">Rincian bulanan</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm tabular-nums">
                <thead className="text-left text-xs text-muted">
                  <tr className="border-b border-line">
                    <th className="px-5 py-2 font-medium sm:px-6">Bulan</th>
                    <th className="px-3 py-2 text-right font-medium">Ditagih</th>
                    <th className="px-3 py-2 text-right font-medium">Lunas</th>
                    <th className="px-3 py-2 text-right font-medium">Belum lunas</th>
                    <th className="px-3 py-2 text-right font-medium">Kas sewa</th>
                    <th className="px-3 py-2 text-right font-medium">Kas deposit</th>
                    <th className="px-5 py-2 text-right font-medium sm:px-6">Masuk / keluar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {r.months.map((m) => (
                    <tr key={m.month}>
                      <td className="px-5 py-2.5 sm:px-6">{monthLong(m.month)}</td>
                      <td className="px-3 py-2.5 text-right">{m.billed ? price(m.billed) : "–"}</td>
                      <td className="px-3 py-2.5 text-right">{m.collected ? price(m.collected) : "–"}</td>
                      <td className="px-3 py-2.5 text-right">{m.billed - m.collected ? price(m.billed - m.collected) : "–"}</td>
                      <td className="px-3 py-2.5 text-right">{m.cashRent ? price(m.cashRent) : "–"}</td>
                      <td className="px-3 py-2.5 text-right">{m.cashDeposit ? price(m.cashDeposit) : "–"}</td>
                      <td className="px-5 py-2.5 text-right sm:px-6">{m.moveIns || m.moveOuts ? `+${m.moveIns} / −${m.moveOuts}` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-line font-semibold">
                  <tr>
                    <td className="px-5 py-3 sm:px-6">Total</td>
                    <td className="px-3 py-3 text-right">{price(billed)}</td>
                    <td className="px-3 py-3 text-right">{price(collected)}</td>
                    <td className="px-3 py-3 text-right">{price(billed - collected)}</td>
                    <td className="px-3 py-3 text-right">{price(sum("cashRent"))}</td>
                    <td className="px-3 py-3 text-right">{price(sum("cashDeposit"))}</td>
                    <td className="px-5 py-3 text-right sm:px-6">
                      +{sum("moveIns")} / −{sum("moveOuts")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="px-5 pb-5 pt-3 text-xs text-muted sm:px-6">
              &ldquo;Kas&rdquo; dihitung dari tanggal bayar, sehingga bisa berbeda dari kolom lunas (misal tagihan Oktober yang dibayar di November).
            </p>
          </Card>

          {r.kos.length > 1 && (
            <Card className="mt-6 p-0! sm:p-0!">
              <h2 className="px-5 pt-5 font-bold sm:px-6">Per cabang · {r.year}</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm tabular-nums">
                  <thead className="text-left text-xs text-muted">
                    <tr className="border-b border-line">
                      <th className="px-5 py-2 font-medium sm:px-6">Cabang</th>
                      <th className="px-3 py-2 text-right font-medium">Okupansi kini</th>
                      <th className="px-3 py-2 text-right font-medium">Ditagih</th>
                      <th className="px-3 py-2 text-right font-medium">Lunas</th>
                      <th className="px-5 py-2 text-right font-medium sm:px-6">Penagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {r.kos.map((k) => (
                      <tr key={k.id}>
                        <td className="px-5 py-2.5 font-medium sm:px-6">{k.name}</td>
                        <td className="px-3 py-2.5 text-right">
                          {pct(k.occupied, k.totalRooms)}{" "}
                          <span className="text-muted">
                            ({k.occupied}/{k.totalRooms})
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">{price(k.billed)}</td>
                        <td className="px-3 py-2.5 text-right">{price(k.collected)}</td>
                        <td className="px-5 py-2.5 text-right sm:px-6">{pct(k.collected, k.billed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pb-2" />
            </Card>
          )}

          <h2 className="mb-3 mt-8 text-lg font-bold">Tunggakan</h2>
          {r.arrears.length === 0 ? (
            <EmptyState title="Tidak ada tunggakan" text="Semua tagihan yang lewat jatuh tempo sudah dibayar." />
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {r.arrears.map((a) => (
                <div key={a.tenancyId} className="flex items-center gap-4 p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lavender text-sm font-bold text-brand-700">{a.roomNumber}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {a.name}
                      {a.ended && <span className="ml-2 rounded-md bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-muted">Sudah keluar</span>}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {a.kosName} · {a.count} tagihan · sejak {dateShort(a.oldestDue)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-red-600">{price(a.amount)}</p>
                  {a.phone && (
                    <a
                      href={waLink(
                        a.phone,
                        `Halo ${a.name}, kami mengingatkan masih ada ${a.count} tagihan sewa yang belum dibayar sebesar ${price(a.amount)}. Mohon segera diselesaikan. Terima kasih.`,
                      )}
                      target="_blank"
                      rel="noopener"
                      className="shrink-0 rounded-full p-2.5 hover:bg-subtle"
                      aria-label={`WhatsApp ${a.name}`}
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

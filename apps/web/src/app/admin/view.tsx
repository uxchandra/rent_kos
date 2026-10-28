"use client";

import Link from "next/link";
import useSWR from "swr";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { AlertTriangleIcon, ArrowRightIcon, BedDoubleIcon, ClipboardListIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { dateShort, price, priceCompact } from "@/lib/format";
import type { BookingStatus, Dashboard } from "@/lib/admin-types";

const monthShort = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("id-ID", { month: "short", timeZone: "UTC" });

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

const bookingStatus: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING: { label: "Baru", variant: "default" },
  APPROVED: { label: "Disetujui", variant: "secondary" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  CANCELLED: { label: "Batal", variant: "outline" },
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data } = useSWR<{ data: Dashboard }>("/admin/dashboard");
  const d = data?.data;
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description={user.role === "OWNER" ? "Ringkasan semua cabang SmartKos." : "Ringkasan cabang yang Anda kelola."}
      />

      {!d ? (
        <Spinner />
      ) : d.kos.length === 0 ? (
        <EmptyState title="Belum ada cabang" text="Anda belum ditugaskan ke cabang mana pun. Hubungi Owner." />
      ) : (
        <div className="grid gap-4">
          <SummaryCards d={d} />
          <div className="grid gap-4 lg:grid-cols-3">
            <RevenueChart d={d} />
            <RoomStatusChart d={d} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <OccupancyByBranch d={d} />
            <InvoicesThisMonth d={d} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <ActivityChart d={d} />
            <OverdueList d={d} />
          </div>
          <RecentBookings d={d} />
        </div>
      )}
    </div>
  );
}

// ---------- Kartu ringkasan ----------

function SummaryCards({ d }: { d: Dashboard }) {
  const occupancy = percent(d.totals.occupied, d.totals.totalRooms);
  const [prev, current] = d.trend.slice(-2);
  const cashDelta = prev?.cashIn ? Math.round(((current.cashIn - prev.cashIn) / prev.cashIn) * 100) : null;
  const toHandle = d.totals.pendingBookings + d.totals.pendingPayments;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Okupansi</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">{occupancy}%</CardTitle>
          <CardAction>
            <BedDoubleIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Progress value={occupancy} />
          <p className="text-xs text-muted-foreground">
            {d.totals.occupied} dari {d.totals.totalRooms} kamar terisi · {d.totals.available} kosong
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Uang masuk bulan ini</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">{priceCompact(current?.cashIn ?? 0)}</CardTitle>
          <CardAction>
            {cashDelta === null ? (
              <WalletIcon className="size-4 text-muted-foreground" />
            ) : (
              <Badge variant="outline">
                {cashDelta >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {cashDelta >= 0 ? "+" : ""}
                {cashDelta}%
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Potensi sewa {priceCompact(d.totals.potentialRevenue)}/bulan dari kamar terisi</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Tunggakan</CardDescription>
          <CardTitle className={`text-2xl font-semibold tabular-nums ${d.totals.overdueCount ? "text-destructive" : ""}`}>
            {priceCompact(d.totals.overdueAmount)}
          </CardTitle>
          <CardAction>
            <AlertTriangleIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {d.totals.overdueCount ? `${d.totals.overdueCount} tagihan lewat jatuh tempo` : "Tidak ada tagihan yang telat"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Perlu ditindak</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">{toHandle}</CardTitle>
          <CardAction>
            <ClipboardListIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link href="/admin/booking" className="hover:text-foreground hover:underline">
            {d.totals.pendingBookings} booking baru
          </Link>
          <Link href="/admin/pembayaran" className="hover:text-foreground hover:underline">
            {d.totals.pendingPayments} pembayaran dicek
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Grafik ----------

const revenueConfig = {
  billed: { label: "Ditagih", color: "var(--chart-2)" },
  collected: { label: "Terkumpul", color: "var(--chart-1)" },
} satisfies ChartConfig;

function RevenueChart({ d }: { d: Dashboard }) {
  const rows = d.trend.map((t) => ({ label: monthShort(t.year, t.month), billed: t.billed, collected: t.collected }));
  const totalBilled = d.trend.reduce((s, t) => s + t.billed, 0);
  const totalCollected = d.trend.reduce((s, t) => s + t.collected, 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Pendapatan sewa</CardTitle>
        <CardDescription>Tagihan sewa vs yang sudah lunas, 6 bulan terakhir</CardDescription>
        <CardAction className="text-right">
          <p className="text-lg font-semibold tabular-nums">{percent(totalCollected, totalBilled)}%</p>
          <p className="text-xs text-muted-foreground">tingkat koleksi</p>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={rows} margin={{ left: 4, right: 12 }}>
            <defs>
              {(["billed", "collected"] as const).map((key) => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => priceCompact(v)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={tooltipRupiah} />} />
            <Area dataKey="billed" type="monotone" stroke="var(--color-billed)" fill="url(#fill-billed)" strokeWidth={2} />
            <Area dataKey="collected" type="monotone" stroke="var(--color-collected)" fill="url(#fill-collected)" strokeWidth={2} />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const roomStatusConfig = {
  count: { label: "Kamar" },
  occupied: { label: "Terisi", color: "var(--chart-1)" },
  available: { label: "Kosong", color: "var(--chart-2)" },
  maintenance: { label: "Perbaikan", color: "var(--chart-4)" },
} satisfies ChartConfig;

function RoomStatusChart({ d }: { d: Dashboard }) {
  const rows = (["occupied", "available", "maintenance"] as const)
    .map((status) => ({ status, count: d.totals[status], fill: `var(--color-${status})` }))
    .filter((r) => r.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status kamar</CardTitle>
        <CardDescription>{d.totals.kos} cabang</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={roomStatusConfig} className="mx-auto aspect-square max-h-60">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="status" />} />
            <Pie data={rows} dataKey="count" nameKey="status" innerRadius={60} strokeWidth={4}>
              <Label
                content={({ viewBox }) =>
                  viewBox && "cx" in viewBox ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-semibold">
                        {d.totals.totalRooms}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                        kamar
                      </tspan>
                    </text>
                  ) : null
                }
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="status" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const occupancyConfig = {
  occupied: { label: "Terisi", color: "var(--chart-1)" },
  available: { label: "Kosong", color: "var(--chart-2)" },
  maintenance: { label: "Perbaikan", color: "var(--chart-4)" },
} satisfies ChartConfig;

function OccupancyByBranch({ d }: { d: Dashboard }) {
  const rows = d.kos.map((k) => ({ name: k.name.replace("SmartKos ", ""), occupied: k.occupied, available: k.available, maintenance: k.maintenance }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Okupansi per cabang</CardTitle>
        <CardDescription>Jumlah kamar menurut status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={occupancyConfig} className="aspect-auto w-full" style={{ height: Math.max(180, rows.length * 40 + 40) }}>
          <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 12 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={110} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="occupied" stackId="a" fill="var(--color-occupied)" radius={[4, 0, 0, 4]} />
            <Bar dataKey="maintenance" stackId="a" fill="var(--color-maintenance)" />
            <Bar dataKey="available" stackId="a" fill="var(--color-available)" radius={[0, 4, 4, 0]} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function InvoicesThisMonth({ d }: { d: Dashboard }) {
  const m = d.thisMonth;
  const rows = [
    { label: "Lunas", amount: m.paid, count: m.paidCount, color: "var(--chart-1)" },
    { label: "Menunggu verifikasi", amount: m.waiting, count: m.waitingCount, color: "var(--chart-3)" },
    { label: "Belum jatuh tempo", amount: m.unpaid, count: m.unpaidCount, color: "var(--chart-2)" },
    { label: "Telat", amount: m.overdue, count: m.overdueCount, color: "var(--destructive)" },
  ];
  const now = d.trend.at(-1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tagihan sewa {now ? monthShort(now.year, now.month) : "bulan ini"}</CardTitle>
        <CardDescription>Total ditagih {price(m.billed)}</CardDescription>
        <CardAction className="text-right">
          <p className="text-lg font-semibold tabular-nums">{percent(m.paid, m.billed)}%</p>
          <p className="text-xs text-muted-foreground">sudah lunas</p>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5">
        {m.billed > 0 ? (
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {rows.map((r) => (
              <div key={r.label} style={{ width: `${(r.amount / m.billed) * 100}%`, background: r.color }} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada tagihan sewa untuk bulan ini.</p>
        )}
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 text-sm">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: r.color }} />
              <span className="flex-1 text-muted-foreground">{r.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{r.count} tagihan</span>
              <span className="w-28 text-right font-medium tabular-nums">{price(r.amount)}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/admin/tagihan" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Lihat semua tagihan <ArrowRightIcon />
        </Link>
      </CardFooter>
    </Card>
  );
}

const activityConfig = {
  bookings: { label: "Booking masuk", color: "var(--chart-2)" },
  moveIns: { label: "Penghuni masuk", color: "var(--chart-1)" },
  moveOuts: { label: "Penghuni keluar", color: "var(--chart-5)" },
} satisfies ChartConfig;

function ActivityChart({ d }: { d: Dashboard }) {
  const rows = d.trend.map((t) => ({ label: monthShort(t.year, t.month), bookings: t.bookings, moveIns: t.moveIns, moveOuts: t.moveOuts }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Booking & penghuni</CardTitle>
        <CardDescription>{d.totals.activeTenants} penghuni aktif saat ini</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={activityConfig} className="aspect-auto h-64 w-full">
          <BarChart data={rows} margin={{ left: -16, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
            <Bar dataKey="moveIns" fill="var(--color-moveIns)" radius={4} />
            <Bar dataKey="moveOuts" fill="var(--color-moveOuts)" radius={4} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---------- Daftar ----------

function OverdueList({ d }: { d: Dashboard }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tagihan telat</CardTitle>
        <CardDescription>Jatuh tempo paling lama</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {d.overdue.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Semua tagihan aman. 🎉</p>
        ) : (
          <ul className="grid gap-4">
            {d.overdue.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.tenantName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.kosName.replace("SmartKos ", "")} · Kamar {i.roomNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums">{priceCompact(i.amount)}</p>
                  <p className="text-xs text-destructive">telat {i.daysLate} hari</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {d.totals.overdueCount > d.overdue.length && (
        <CardFooter>
          <Link href="/admin/tagihan" className={buttonVariants({ variant: "outline", size: "sm" })}>
            +{d.totals.overdueCount - d.overdue.length} lainnya <ArrowRightIcon />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

function RecentBookings({ d }: { d: Dashboard }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking terbaru</CardTitle>
        <CardDescription>5 permintaan terakhir dari website</CardDescription>
        <CardAction>
          <Link href="/admin/booking" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Semua booking <ArrowRightIcon />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {d.recentBookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Belum ada booking.</p>
        ) : (
          <ul className="divide-y">
            {d.recentBookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.kosName.replace("SmartKos ", "")} · {b.roomTypeName}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Masuk {dateShort(b.moveInDate)}</p>
                <Badge variant={bookingStatus[b.status].variant}>{bookingStatus[b.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function tooltipRupiah(value: unknown, name: unknown) {
  const label = revenueConfig[name as keyof typeof revenueConfig]?.label ?? String(name);
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{price(Number(value))}</span>
    </div>
  );
}

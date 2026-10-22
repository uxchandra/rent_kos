"use client";

/* eslint-disable @next/next/no-img-element -- foto dari /uploads */
import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusiness, Check, GraduationCap } from "lucide-react";

const personas = [
  {
    id: "mahasiswa",
    label: "Mahasiswa",
    icon: GraduationCap,
    title: "Untuk mahasiswa",
    sub: "Fokus kuliah, urusan kos biar kami yang pegang",
    photo: "/uploads/seed/jogja-std-2.jpg",
    points: ["Dekat kampus negeri & swasta", "Meja belajar & WiFi kencang", "Kos putri / putra terpisah", "Harga mulai di bawah Rp1 juta"],
  },
  {
    id: "pekerja",
    label: "Pekerja",
    icon: BriefcaseBusiness,
    title: "Untuk pekerja",
    sub: "Pulang kerja tinggal istirahat, semuanya sudah siap",
    photo: "/uploads/seed/jakarta-exec-1.jpg",
    points: ["Dekat MRT & perkantoran", "Housekeeping mingguan", "Akses kartu 24 jam", "Lounge untuk kerja dari rumah"],
  },
];

export function PersonaTabs() {
  const [active, setActive] = useState(personas[0].id);
  const p = personas.find((x) => x.id === active)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr_auto]">
      <img src={p.photo} alt="" className="aspect-4/3 w-full rounded-2xl object-cover lg:aspect-auto lg:h-full" />
      <div className="rounded-2xl border border-line bg-white p-7">
        <h3 className="text-2xl font-bold">{p.title}</h3>
        <p className="mt-1 text-muted">{p.sub}</p>
        <ul className="mt-6 space-y-3">
          {p.points.map((pt) => (
            <li key={pt} className="flex items-center gap-3 text-sm">
              <Check className="size-4 shrink-0 text-brand-600" /> {pt}
            </li>
          ))}
        </ul>
        <Link href="/kamar" className="mt-7 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Lihat kamar
        </Link>
      </div>
      <div className="order-first flex gap-2 lg:order-none lg:flex-col">
        {personas.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex flex-1 items-center justify-between gap-6 rounded-xl px-5 py-3 text-sm font-semibold transition lg:flex-none ${
              active === id ? "bg-brand-600 text-white" : "bg-subtle text-muted hover:text-ink"
            }`}
          >
            {label} <Icon className="size-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getKosList } from "@/lib/public-api";
import { site } from "@/lib/site";

export async function SiteFooter() {
  "use cache";
  const kosList = await getKosList();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-subtle text-sm">
      <div className="mx-auto grid max-w-350 gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <h3 className="font-semibold">Cabang SmartKos</h3>
          <ul className="mt-4 space-y-3 text-muted">
            {kosList.map((k) => (
              <li key={k.slug}>
                <Link href={`/${k.slug}`} className="hover:underline">
                  {k.name}, {k.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Penghuni</h3>
          <ul className="mt-4 space-y-3 text-muted">
            <li>
              <Link href="/login" className="hover:underline">
                Masuk akun penghuni
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:underline">
                Pertanyaan umum
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Bantuan</h3>
          <ul className="mt-4 space-y-3 text-muted">
            <li>WhatsApp {site.phoneDisplay}</li>
            <li>{site.email}</li>
            <li>{site.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-350 px-4 py-6 text-muted sm:px-6">
          © {year} {site.name} · Kos bulanan di {kosList.map((k) => k.city).join(", ")}
        </p>
      </div>
    </footer>
  );
}

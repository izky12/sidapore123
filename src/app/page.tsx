import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ServiceLocation } from "@/lib/types";

const LAYANAN = [
  {
    kunci: "depot",
    judul: "Depot Isi Ulang",
    tagline: "Galon diantar, tinggal telepon",
    deskripsi:
      "Air minum isi ulang higienis, diantar langsung ke rumah atau kos. Cukup kirim nama, WhatsApp, dan share lokasi — kurir kami yang urus sisanya.",
    cta: { href: "/pesan-air", label: "Pesan Galon Sekarang" },
    aksen: "teal",
  },
  {
    kunci: "kos",
    judul: "Kos-kosan Sidapore",
    tagline: "Kamar nyaman, harga bersahabat",
    deskripsi:
      "Kamar kos bulanan lengkap dengan fasilitas dasar, dekat area kampus dan perkantoran. Tanyakan ketersediaan kamar lewat form pendaftaran.",
    cta: { href: "/kamar", label: "Cek Ketersediaan Kamar" },
    aksen: "amber",
  },
  {
    kunci: "laundry",
    judul: "Laundry Sidapore",
    tagline: "Cuci kiloan, wangi & rapi",
    deskripsi:
      "Layanan cuci-setrika kiloan dengan estimasi selesai jelas. Daftar sekali, langganan bulanan bisa diatur belakangan.",
    cta: { href: "/laundry", label: "Pesan Laundry Sekarang" },
    aksen: "teal",
  },
] as const;

const KATEGORI_LABEL: Record<ServiceLocation["kategori"], string> = {
  depot: "Depot Air",
  kos: "Kos-kosan",
  laundry: "Laundry",
};

export default async function HomePage() {
  const supabase = createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("aktif", true)
    .order("created_at", { ascending: false });

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-teal-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6">
          <img src="/icons/icon-192.png" alt="Sidapore" className="h-10 w-10 rounded-lg" />
          <Link href="/login" className="text-sm font-medium text-teal-600 hover:underline">
            Login Staff/Admin →
          </Link>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-8 md:pb-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-600">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Air &middot; Tempat Tinggal &middot; Laundry — satu nama: Sidapore
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
            Tiga kebutuhan harian,
            <br />
            <span className="text-teal-500">satu layanan</span> yang datang ke Anda.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/70">
            Sidapore mengurus air minum isi ulang, kamar kos, dan laundry
            warga sekitar — dipesan lewat WhatsApp, diantar oleh kurir kami sendiri.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pesan-air" className="btn-primary">
              Pesan Air Galon
            </Link>
            <Link href="/daftar" className="btn-outline">
              Daftar Pelanggan Baru
            </Link>
          </div>
        </div>

        {/* signature: tiga "aliran" layanan sebagai divider bawah hero */}
        <div className="flex h-3 w-full">
          <div className="flex-1 bg-teal-500" />
          <div className="flex-1 bg-amber-400" />
          <div className="flex-1 bg-teal-700" />
        </div>
      </section>

      {/* LAYANAN */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          Pilih layanan Sidapore
        </h2>
        <p className="mt-2 text-ink/60">
          Setiap layanan punya tim sendiri, jadi pesanan Anda ditangani orang yang tepat.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {LAYANAN.map((l) => (
            <article key={l.kunci} className="card flex flex-col">
              <div
                className={
                  "mb-4 h-1.5 w-10 rounded-full " +
                  (l.aksen === "amber" ? "bg-amber-400" : "bg-teal-500")
                }
              />
              <h3 className="font-display text-xl font-semibold text-ink">
                {l.judul}
              </h3>
              <p className="mt-1 text-sm font-medium text-teal-600">{l.tagline}</p>
              <p className="mt-3 flex-1 text-sm text-ink/70">{l.deskripsi}</p>
              <Link
                href={l.cta.href}
                className={l.aksen === "amber" ? "btn-amber mt-6" : "btn-primary mt-6"}
              >
                {l.cta.label}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* CARA KERJA */}
      <section className="border-t border-teal-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Cara pesan air galon
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            <li className="card">
              <span className="font-display text-3xl font-bold text-teal-500">1</span>
              <p className="mt-2 text-sm text-ink/70">
                Isi nama, nomor WhatsApp, dan jumlah galon di form pesanan.
              </p>
            </li>
            <li className="card">
              <span className="font-display text-3xl font-bold text-teal-500">2</span>
              <p className="mt-2 text-sm text-ink/70">
                Bagikan lokasi Google Maps supaya kurir tidak salah alamat.
              </p>
            </li>
            <li className="card">
              <span className="font-display text-3xl font-bold text-teal-500">3</span>
              <p className="mt-2 text-sm text-ink/70">
                Tim depot menyiapkan pesanan, kurir mengantar sampai depan pintu.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* LOKASI LAYANAN */}
      {locations && locations.length > 0 && (
        <section className="border-t border-teal-100 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="font-display text-2xl font-semibold text-ink">Lokasi Layanan Kami</h2>
            <p className="mt-2 text-ink/60">Area yang saat ini sudah kami layani.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {(locations as ServiceLocation[]).map((l) => (
                <div key={l.id} className="card">
                  <span className="badge bg-teal-50 text-teal-600">{KATEGORI_LABEL[l.kategori]}</span>
                  <p className="mt-2 font-display font-semibold text-ink">{l.nama}</p>
                  <p className="mt-1 text-sm text-ink/60">{l.alamat}</p>
                  {l.maps_link && (
                    <a href={l.maps_link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-teal-600 hover:underline">
                      Buka peta →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-10 text-sm text-ink/50">
        <img src="/icons/icon-192.png" alt="Sidapore" className="h-8 w-8 rounded-md" />
        © {new Date().getFullYear()} Sidapore. Depot Isi Ulang, Kos-kosan &amp; Laundry.
      </footer>
    </main>
  );
}

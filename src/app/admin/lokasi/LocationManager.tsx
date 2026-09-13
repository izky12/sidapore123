"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ServiceLocation } from "@/lib/types";

const KATEGORI_LABEL: Record<ServiceLocation["kategori"], string> = {
  depot: "Depot Air",
  kos: "Kos-kosan",
  laundry: "Laundry",
};

export default function LocationManager({ locations }: { locations: ServiceLocation[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [kategori, setKategori] = useState<ServiceLocation["kategori"]>("depot");
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("locations").insert({
      kategori,
      nama,
      alamat,
      maps_link: mapsLink || null,
    });
    setLoading(false);
    setNama("");
    setAlamat("");
    setMapsLink("");
    router.refresh();
  }

  async function toggleAktif(id: string, aktif: boolean) {
    await supabase.from("locations").update({ aktif: !aktif }).eq("id", id);
    router.refresh();
  }

  async function hapus(id: string) {
    if (!confirm("Hapus lokasi ini? Tindakan ini tidak bisa dibatalkan.")) return;
    await supabase.from("locations").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={submit} className="card h-fit space-y-4">
        <h2 className="font-display text-lg font-semibold text-ink">Tambah Lokasi</h2>
        <div>
          <label className="label">Kategori</label>
          <select className="input" value={kategori} onChange={(e) => setKategori(e.target.value as ServiceLocation["kategori"])}>
            {Object.entries(KATEGORI_LABEL).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Nama lokasi</label>
          <input required className="input" placeholder="Contoh: Sidapore Cabang Merdeka" value={nama} onChange={(e) => setNama(e.target.value)} />
        </div>
        <div>
          <label className="label">Alamat</label>
          <textarea required className="input" rows={3} value={alamat} onChange={(e) => setAlamat(e.target.value)} />
        </div>
        <div>
          <label className="label">Link Google Maps (opsional)</label>
          <input className="input" placeholder="https://maps.google.com/..." value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Menyimpan..." : "Tambah Lokasi"}
        </button>
      </form>

      <div className="card">
        <h2 className="font-display text-lg font-semibold text-ink">Daftar Lokasi</h2>
        <div className="mt-4 space-y-3">
          {locations.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 rounded-lg border border-teal-100 p-3">
              <div>
                <span className="badge bg-teal-50 text-teal-600">{KATEGORI_LABEL[l.kategori]}</span>
                <p className="mt-1 font-medium text-ink">{l.nama}</p>
                <p className="text-sm text-ink/60">{l.alamat}</p>
                {l.maps_link && (
                  <a href={l.maps_link} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">
                    Buka peta
                  </a>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className={"badge " + (l.aktif ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-500")}>
                  {l.aktif ? "Tampil" : "Disembunyikan"}
                </span>
                <button onClick={() => toggleAktif(l.id, l.aktif)} className="text-xs font-medium text-teal-600 hover:underline">
                  {l.aktif ? "Sembunyikan" : "Tampilkan"}
                </button>
                <button onClick={() => hapus(l.id)} className="text-xs font-medium text-red-500 hover:underline">
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {locations.length === 0 && <p className="py-6 text-center text-ink/40">Belum ada lokasi ditambahkan.</p>}
        </div>
      </div>
    </div>
  );
}

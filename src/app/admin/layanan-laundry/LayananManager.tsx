"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LayananLaundry } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

export default function LayananManager({ layananList }: { layananList: LayananLaundry[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState<number | "">("");
  const [satuan, setSatuan] = useState("kg");
  const [loading, setLoading] = useState(false);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    if (!nama) return;
    setLoading(true);
    await supabase.from("layanan_laundry").insert({
      nama,
      harga: harga === "" ? null : harga,
      satuan,
      urutan: layananList.length,
    });
    setLoading(false);
    setNama("");
    setHarga("");
    router.refresh();
  }

  async function update(id: string, patch: Partial<LayananLaundry>) {
    await supabase.from("layanan_laundry").update(patch).eq("id", id);
    router.refresh();
  }

  async function hapus(id: string) {
    if (!confirm("Hapus layanan ini?")) return;
    await supabase.from("layanan_laundry").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={tambah} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Nama layanan</label>
          <input required className="input w-48" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Cuci + Setrika" />
        </div>
        <div>
          <label className="label">Harga (Rp)</label>
          <input type="number" className="input w-32" value={harga} onChange={(e) => setHarga(e.target.value ? Number(e.target.value) : "")} />
        </div>
        <div>
          <label className="label">Satuan</label>
          <input className="input w-24" value={satuan} onChange={(e) => setSatuan(e.target.value)} placeholder="kg" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Menyimpan..." : "Tambah Layanan"}
        </button>
      </form>

      <div className="overflow-x-auto">
        <ScrollHint />
        <table className="w-full text-left text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">Harga</th>
              <th className="py-2 pr-4">Satuan</th>
              <th className="py-2 pr-4">Aktif</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {layananList.map((l) => (
              <tr key={l.id} className="border-t border-teal-50">
                <td className="py-2 pr-4">
                  <input
                    defaultValue={l.nama}
                    className="input w-40 py-1.5"
                    onBlur={(e) => e.target.value !== l.nama && update(l.id, { nama: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    defaultValue={l.harga ?? ""}
                    className="input w-28 py-1.5"
                    onBlur={(e) => update(l.id, { harga: e.target.value ? Number(e.target.value) : null })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    defaultValue={l.satuan}
                    className="input w-20 py-1.5"
                    onBlur={(e) => e.target.value !== l.satuan && update(l.id, { satuan: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <input type="checkbox" className="h-4 w-4" defaultChecked={l.aktif} onChange={(e) => update(l.id, { aktif: e.target.checked })} />
                </td>
                <td className="py-2 pr-4">
                  <button onClick={() => hapus(l.id)} className="text-sm text-red-500 hover:underline">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {layananList.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink/40">Belum ada layanan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

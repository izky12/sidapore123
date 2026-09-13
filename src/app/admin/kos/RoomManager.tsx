"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROOM_STATUS_LABEL, type KosRoom, type KosRoomStatus } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function RoomManager({ rooms }: { rooms: KosRoom[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [noKamar, setNoKamar] = useState("");
  const [tipe, setTipe] = useState("");
  const [harga, setHarga] = useState<number | "">("");
  const [fasilitas, setFasilitas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function tambahKamar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.from("kos_rooms").insert({
      no_kamar: noKamar,
      tipe: tipe || null,
      harga_bulanan: Number(harga) || 0,
      fasilitas: fasilitas || null,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNoKamar("");
    setTipe("");
    setHarga("");
    setFasilitas("");
    router.refresh();
  }

  async function ubahStatus(room: KosRoom, status: KosRoomStatus) {
    if (status !== "terisi") {
      const { data: penyewaAktif } = await supabase
        .from("kos_tenants")
        .select("nama")
        .eq("room_id", room.id)
        .eq("status", "aktif")
        .maybeSingle();
      if (penyewaAktif) {
        alert(
          `Kamar ${room.no_kamar} masih punya penyewa aktif (${penyewaAktif.nama}). ` +
            `Hapus atau nonaktifkan penyewanya dulu di menu Data Penyewa sebelum ubah status kamar ini.`
        );
        router.refresh(); // reset tampilan dropdown yang sempat berubah visual
        return;
      }
    }
    await supabase.from("kos_rooms").update({ status }).eq("id", room.id);
    router.refresh();
  }

  async function hapusKamar(room: KosRoom) {
    if (!confirm(`Hapus kamar ${room.no_kamar}?`)) return;
    await supabase.from("kos_rooms").delete().eq("id", room.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={tambahKamar} className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">No. Kamar</label>
          <input required className="input w-24" value={noKamar} onChange={(e) => setNoKamar(e.target.value)} />
        </div>
        <div>
          <label className="label">Tipe (opsional)</label>
          <input className="input w-32" placeholder="Standar / AC" value={tipe} onChange={(e) => setTipe(e.target.value)} />
        </div>
        <div>
          <label className="label">Harga / bulan</label>
          <input
            required
            type="number"
            className="input w-32"
            value={harga}
            onChange={(e) => setHarga(e.target.value ? Number(e.target.value) : "")}
          />
        </div>
        <div>
          <label className="label">Fasilitas (opsional)</label>
          <input className="input w-48" placeholder="Kasur, lemari, kamar mandi dalam" value={fasilitas} onChange={(e) => setFasilitas(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Menyimpan..." : "Tambah Kamar"}
        </button>
        {error && <p className="w-full text-sm text-red-500">{error}</p>}
      </form>

      <div className="card overflow-x-auto">
        <ScrollHint />
        <table className="w-full text-left text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="py-2 pr-4">Kamar</th>
              <th className="py-2 pr-4">Tipe</th>
              <th className="py-2 pr-4">Harga / bulan</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} className="border-t border-teal-50">
                <td className="py-3 pr-4 font-medium">{r.no_kamar}</td>
                <td className="py-3 pr-4">{r.tipe ?? "-"}</td>
                <td className="py-3 pr-4">{formatRupiah(r.harga_bulanan)}</td>
                <td className="py-3 pr-4">
                  <select
                    className="input py-1 text-sm"
                    value={r.status}
                    onChange={(e) => ubahStatus(r, e.target.value as KosRoomStatus)}
                  >
                    {Object.entries(ROOM_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3">
                  <button onClick={() => hapusKamar(r)} className="text-sm font-medium text-red-500 hover:underline">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink/40">
                  Belum ada kamar terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/40">
        Ubah status langsung tampil ke pengunjung situs di halaman /kamar tanpa perlu refresh.
      </p>
    </div>
  );
}

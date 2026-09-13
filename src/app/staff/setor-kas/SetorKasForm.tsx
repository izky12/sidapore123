"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SetoranKas } from "@/lib/types";
import { VERIFIKASI_LABEL } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function SetorKasForm({
  staffId,
  sudahSetorHariIni,
  riwayat,
}: {
  staffId: string;
  sudahSetorHariIni: boolean;
  riwayat: SetoranKas[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [kasFisik, setKasFisik] = useState<number | "">("");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (kasFisik === "") return;
    setLoading(true);
    setError("");

    const { error } = await supabase.from("setoran_kas").insert({
      staff_id: staffId,
      kas_fisik: Number(kasFisik),
      catatan: catatan || null,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setKasFisik("");
    setCatatan("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {sudahSetorHariIni ? (
        <div className="card">
          <p className="text-sm text-ink/70">
            Anda sudah menyetor kas hari ini. Tunggu verifikasi dari admin.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Total uang tunai di tangan (Rp)</label>
            <input
              type="number"
              required
              min={0}
              className="input"
              value={kasFisik}
              onChange={(e) => setKasFisik(e.target.value ? Number(e.target.value) : "")}
              placeholder="Hitung semua uang tunai hasil laundry hari ini"
            />
          </div>
          <div>
            <label className="label">Catatan (opsional)</label>
            <textarea
              className="input"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: ada uang kembalian kurang dari pelanggan"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Menyimpan..." : "Setor Kas Hari Ini"}
          </button>
        </form>
      )}

      <div className="card">
        <h2 className="font-display text-base font-semibold text-ink">Riwayat Setoran</h2>
        <div className="mt-3 overflow-x-auto">
          <ScrollHint />
          <table className="w-full text-left text-sm">
            <thead className="text-ink/50">
              <tr>
                <th className="py-2 pr-4">Tanggal</th>
                <th className="py-2 pr-4">Kas Fisik</th>
                <th className="py-2 pr-4">Kas Sistem</th>
                <th className="py-2 pr-4">Selisih</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((s) => (
                <tr key={s.id} className="border-t border-teal-50">
                  <td className="py-2 pr-4">{new Date(s.tanggal).toLocaleDateString("id-ID")}</td>
                  <td className="py-2 pr-4">{formatRupiah(s.kas_fisik)}</td>
                  <td className="py-2 pr-4">{formatRupiah(s.kas_sistem ?? 0)}</td>
                  <td className={"py-2 pr-4 font-medium " + (Number(s.selisih) === 0 ? "text-teal-600" : "text-red-500")}>
                    {formatRupiah(Number(s.selisih ?? 0))}
                  </td>
                  <td className="py-2">
                    <span
                      className={
                        "badge " +
                        (s.status === "cocok"
                          ? "bg-teal-50 text-teal-600"
                          : s.status === "selisih"
                          ? "bg-red-50 text-red-500"
                          : "bg-amber-400/20 text-amber-500")
                      }
                    >
                      {VERIFIKASI_LABEL[s.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-ink/40">
                    Belum ada riwayat setoran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

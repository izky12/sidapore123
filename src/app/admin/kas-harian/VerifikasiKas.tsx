"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SetoranKas, Profile } from "@/lib/types";
import { VERIFIKASI_LABEL } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function VerifikasiKas({
  setoran,
  staffMap,
}: {
  setoran: SetoranKas[];
  staffMap: Record<string, Profile>;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function verifikasi(s: SetoranKas, status: "cocok" | "selisih") {
    setLoadingId(s.id);
    let catatan_verifikasi: string | null = null;
    if (status === "selisih") {
      catatan_verifikasi = prompt("Catatan selisih (misalnya alasan atau tindak lanjut):", s.catatan_verifikasi ?? "") ?? null;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("setoran_kas")
      .update({
        status,
        catatan_verifikasi,
        diverifikasi_oleh: user?.id,
        diverifikasi_at: new Date().toISOString(),
      })
      .eq("id", s.id);

    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="card overflow-x-auto">
      <ScrollHint />
      <table className="w-full text-left text-sm">
        <thead className="text-ink/50">
          <tr>
            <th className="py-2 pr-4">Tanggal</th>
            <th className="py-2 pr-4">Staff</th>
            <th className="py-2 pr-4">Kas Fisik</th>
            <th className="py-2 pr-4">Kas Sistem</th>
            <th className="py-2 pr-4">Selisih</th>
            <th className="py-2 pr-4">Catatan Staff</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {setoran.map((s) => {
            const selisih = Number(s.selisih ?? 0);
            return (
              <tr key={s.id} className="border-t border-teal-50 align-top">
                <td className="py-3 pr-4">{new Date(s.tanggal).toLocaleDateString("id-ID")}</td>
                <td className="py-3 pr-4 font-medium">{staffMap[s.staff_id]?.full_name ?? "-"}</td>
                <td className="py-3 pr-4">{formatRupiah(s.kas_fisik)}</td>
                <td className="py-3 pr-4">{formatRupiah(s.kas_sistem ?? 0)}</td>
                <td className={"py-3 pr-4 font-semibold " + (selisih === 0 ? "text-teal-600" : "text-red-500")}>
                  {formatRupiah(selisih)}
                </td>
                <td className="py-3 pr-4 max-w-[180px] text-ink/60">{s.catatan ?? "-"}</td>
                <td className="py-3 pr-4">
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
                  {s.catatan_verifikasi && (
                    <p className="mt-1 max-w-[160px] text-xs text-ink/50">{s.catatan_verifikasi}</p>
                  )}
                </td>
                <td className="py-3">
                  {s.status === "menunggu" && (
                    <div className="flex flex-col gap-1.5">
                      <button
                        disabled={loadingId === s.id}
                        onClick={() => verifikasi(s, "cocok")}
                        className="text-xs font-medium text-teal-600 hover:underline"
                      >
                        Tandai Cocok
                      </button>
                      <button
                        disabled={loadingId === s.id}
                        onClick={() => verifikasi(s, "selisih")}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Tandai Selisih
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {setoran.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center text-ink/40">
                Belum ada setoran kas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";
import type { SetoranKas } from "@/lib/types";
import SetorKasForm from "./SetorKasForm";

export default async function SetorKasPage() {
  const profile = await getProfile();
  if (!profile || !["staff_depot", "staff_laundry", "kurir"].includes(profile.role)) redirect("/staff");

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: riwayat } = await supabase
    .from("setoran_kas")
    .select("*")
    .eq("staff_id", profile.id)
    .order("tanggal", { ascending: false })
    .limit(30);

  const sudahSetorHariIni = (riwayat ?? []).some((s) => s.tanggal === today);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Setor Kas Harian</h1>
      <p className="mt-1 text-sm text-ink/60">
        Hitung semua uang tunai yang Anda pegang hari ini (penjualan kasir, COD, atau pembayaran pelanggan), lalu setor untuk diverifikasi admin.
      </p>
      <div className="mt-6">
        <SetorKasForm
          staffId={profile.id}
          sudahSetorHariIni={sudahSetorHariIni}
          riwayat={(riwayat ?? []) as SetoranKas[]}
        />
      </div>
    </div>
  );
}

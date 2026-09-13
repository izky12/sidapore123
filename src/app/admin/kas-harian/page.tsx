import { createClient } from "@/lib/supabase/server";
import type { SetoranKas, Profile } from "@/lib/types";
import VerifikasiKas from "./VerifikasiKas";

export default async function AdminKasHarianPage() {
  const supabase = createClient();

  const { data: setoran } = await supabase
    .from("setoran_kas")
    .select("*")
    .order("tanggal", { ascending: false })
    .limit(60);

  const { data: staffList } = await supabase.from("profiles").select("*");
  const staffMap: Record<string, Profile> = {};
  for (const s of (staffList ?? []) as Profile[]) staffMap[s.id] = s;

  const belumDiverifikasi = ((setoran ?? []) as SetoranKas[]).filter((s) => s.status === "menunggu").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Verifikasi Kas Harian</h1>
      <p className="mt-1 text-sm text-ink/60">
        Bandingkan setoran tunai fisik dari staff laundry dengan pencatatan sistem.
      </p>
      {belumDiverifikasi > 0 && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-sm font-medium text-amber-500">
          {belumDiverifikasi} setoran menunggu verifikasi
        </p>
      )}
      <div className="mt-6">
        <VerifikasiKas setoran={(setoran ?? []) as SetoranKas[]} staffMap={staffMap} />
      </div>
    </div>
  );
}

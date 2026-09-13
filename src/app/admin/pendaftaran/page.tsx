import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";
import LeadList from "./LeadList";

export default async function AdminPendaftaranPage() {
  const supabase = createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*, kos_rooms(no_kamar)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Pendaftaran & Pemesanan Masuk</h1>
      <p className="mt-1 text-sm text-ink/60">
        Semua pemesanan kamar kos, laundry, dan minat depot dari form publik masuk ke sini.
      </p>
      <div className="mt-6 card">
        <LeadList leads={(leads ?? []) as Lead[]} />
      </div>
    </div>
  );
}

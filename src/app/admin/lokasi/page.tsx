import { createClient } from "@/lib/supabase/server";
import type { ServiceLocation } from "@/lib/types";
import LocationManager from "./LocationManager";

export default async function AdminLokasiPage() {
  const supabase = createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Lokasi Layanan</h1>
      <p className="mt-1 text-sm text-ink/60">
        Tambahkan area/lokasi yang dilayani — akan tampil ke calon pelanggan di halaman utama.
      </p>
      <div className="mt-6">
        <LocationManager locations={(locations ?? []) as ServiceLocation[]} />
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import type { LayananLaundry } from "@/lib/types";
import LayananManager from "./LayananManager";

export default async function AdminLayananLaundryPage() {
  const supabase = createClient();
  const { data: layanan } = await supabase
    .from("layanan_laundry")
    .select("*")
    .order("urutan", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Jenis Layanan Laundry</h1>
      <p className="mt-1 text-sm text-ink/60">
        Kelola daftar layanan yang muncul di form pesan laundry online (mis. Cuci + Setrika, Cuci Basah, dll).
      </p>
      <div className="mt-6 card">
        <LayananManager layananList={(layanan ?? []) as LayananLaundry[]} />
      </div>
    </div>
  );
}

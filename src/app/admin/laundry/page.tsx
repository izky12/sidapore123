import { createClient } from "@/lib/supabase/server";
import type { LaundryOrder, Profile } from "@/lib/types";
import LaundryList from "./LaundryList";
import NewLaundryOrder from "./NewLaundryOrder";

export default async function AdminLaundryPage() {
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("laundry_orders")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: staffList } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "staff_laundry")
    .eq("active", true);

  const { data: kurirList } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "kurir")
    .eq("active", true);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Laundry</h1>
      <p className="mt-1 text-sm text-ink/60">Kelola pesanan cuci-setrika dan tugaskan ke staff laundry.</p>

      <div className="mt-6 card">
        <h2 className="font-display text-base font-semibold text-ink">Tambah Pesanan (Walk-in)</h2>
        <div className="mt-3">
          <NewLaundryOrder />
        </div>
      </div>

      <div className="mt-6 card">
        <LaundryList
          orders={(orders ?? []) as LaundryOrder[]}
          staffList={(staffList ?? []) as Profile[]}
          kurirList={(kurirList ?? []) as Profile[]}
        />
      </div>
    </div>
  );
}

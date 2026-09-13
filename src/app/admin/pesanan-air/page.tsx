import { createClient } from "@/lib/supabase/server";
import type { WaterOrder, Profile } from "@/lib/types";
import OrderList from "./OrderList";

export default async function AdminPesananAirPage() {
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("water_orders")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: kurirList } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "kurir")
    .eq("active", true);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Pesanan Air Galon</h1>
      <p className="mt-1 text-sm text-ink/60">Tetapkan harga, tugaskan kurir, dan pantau statusnya.</p>
      <div className="mt-6 card">
        <OrderList orders={(orders ?? []) as WaterOrder[]} kurirList={(kurirList ?? []) as Profile[]} />
      </div>
    </div>
  );
}

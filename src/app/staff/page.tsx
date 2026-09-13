import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";
import type { WaterOrder, LaundryOrder, Profile, LayananLaundry } from "@/lib/types";
import TaskBoard from "./TaskBoard";

export default async function StaffPage() {
  const profile = await getProfile();
  const supabase = createClient();

  let waterOrders: WaterOrder[] = [];
  let laundryOrders: LaundryOrder[] = [];
  let laundryJemputTugas: LaundryOrder[] = [];
  let laundryAntarTugas: LaundryOrder[] = [];
  let kurirList: Profile[] = [];
  let layananList: LayananLaundry[] = [];

  if (profile?.role === "staff_depot") {
    const { data } = await supabase
      .from("water_orders")
      .select("*")
      .in("status", ["baru", "diverifikasi", "ditugaskan", "terkirim"])
      .order("created_at", { ascending: true });
    waterOrders = (data ?? []) as WaterOrder[];

    const { data: kurirData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "kurir")
      .eq("active", true);
    kurirList = (kurirData ?? []) as Profile[];
  }

  if (profile?.role === "kurir") {
    const { data } = await supabase
      .from("water_orders")
      .select("*")
      .eq("assigned_kurir_id", profile.id)
      .in("status", ["ditugaskan", "dikirim"])
      .order("created_at", { ascending: true });
    waterOrders = (data ?? []) as WaterOrder[];

    const { data: jemputData } = await supabase
      .from("laundry_orders")
      .select("*")
      .eq("assigned_kurir_jemput_id", profile.id)
      .eq("jemput_selesai", false)
      .order("created_at", { ascending: true });
    laundryJemputTugas = (jemputData ?? []) as LaundryOrder[];

    const { data: antarData } = await supabase
      .from("laundry_orders")
      .select("*")
      .eq("assigned_kurir_id", profile.id)
      .eq("antar_jemput", true)
      .eq("status", "siap_diambil")
      .order("created_at", { ascending: true });
    laundryAntarTugas = (antarData ?? []) as LaundryOrder[];
  }

  if (profile?.role === "staff_laundry") {
    const { data } = await supabase
      .from("laundry_orders")
      .select("*")
      .in("status", ["baru", "diproses", "siap_diambil"])
      .order("created_at", { ascending: true });
    laundryOrders = (data ?? []) as LaundryOrder[];

    const { data: kurirData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "kurir")
      .eq("active", true);
    kurirList = (kurirData ?? []) as Profile[];

    const { data: layananData } = await supabase
      .from("layanan_laundry")
      .select("*")
      .eq("aktif", true)
      .order("urutan", { ascending: true });
    layananList = (layananData ?? []) as LayananLaundry[];
  }

  return (
    <TaskBoard
      role={profile?.role ?? "customer"}
      waterOrders={waterOrders}
      laundryOrders={laundryOrders}
      laundryJemputTugas={laundryJemputTugas}
      laundryAntarTugas={laundryAntarTugas}
      kurirList={kurirList}
      layananList={layananList}
    />
  );
}

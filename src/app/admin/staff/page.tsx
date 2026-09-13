import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import StaffManager from "./StaffManager";

export default async function AdminStaffPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "customer")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Staff & Role</h1>
      <p className="mt-1 text-sm text-ink/60">
        Buat akun untuk staff depot, staff laundry, dan kurir pengantar galon.
      </p>
      <div className="mt-6">
        <StaffManager staff={(data ?? []) as Profile[]} />
      </div>
    </div>
  );
}

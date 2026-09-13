import { createClient } from "@/lib/supabase/server";
import type { KosRoom } from "@/lib/types";
import KamarRealtime from "./KamarRealtime";

export const metadata = { title: "Cek Kamar Kos" };

export default async function KamarPage() {
  const supabase = createClient();
  const { data: rooms } = await supabase
    .from("kos_rooms")
    .select("*")
    .order("no_kamar", { ascending: true });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
        Status kamar realtime
      </p>
      <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">Cek Kamar Kos</h1>
      <p className="mt-3 max-w-xl text-ink/70">
        Status di bawah langsung update begitu admin mengubahnya — tidak perlu muat ulang halaman.
      </p>

      <div className="mt-10">
        <KamarRealtime initialRooms={(rooms ?? []) as KosRoom[]} />
      </div>
    </main>
  );
}

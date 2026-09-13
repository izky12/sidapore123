import { createClient } from "@/lib/supabase/server";
import type { KosPayment, KosRoom, KosTenant } from "@/lib/types";
import KosManager from "./KosManager";
import RoomManager from "./RoomManager";
import KosRekapBulanan from "./KosRekapBulanan";

export default async function AdminKosPage() {
  const supabase = createClient();
  const { data: tenants } = await supabase
    .from("kos_tenants")
    .select("*")
    .order("no_kamar", { ascending: true });

  const { data: rooms } = await supabase
    .from("kos_rooms")
    .select("*")
    .order("no_kamar", { ascending: true });

  // riwayat: tanggal bayar, siapa (penyewa), kamar berapa — untuk cetak ulang struk
  const { data: payments } = await supabase
    .from("kos_payments")
    .select("*, kos_tenants(nama, no_kamar)")
    .order("tgl_bayar", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  // rekap bulan berjalan: siapa saja yang sudah/belum bayar periode ini
  const periodeIni = new Date().toISOString().slice(0, 7);
  const { data: paymentsBulanIni } = await supabase
    .from("kos_payments")
    .select("tenant_id, jumlah")
    .eq("periode", periodeIni);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Rekap & Pengingat Bulan Ini</h2>
        <p className="mt-1 text-sm text-ink/60">
          Ringkasan kamar yang sudah/belum bayar sewa untuk periode {periodeIni}.
        </p>
        <div className="mt-6">
          <KosRekapBulanan
            tenants={(tenants ?? []) as KosTenant[]}
            paymentsBulanIni={(paymentsBulanIni ?? []) as { tenant_id: string; jumlah: number }[]}
            periode={periodeIni}
          />
        </div>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Kelola Kamar</h1>
        <p className="mt-1 text-sm text-ink/60">
          Daftar kamar & status ketersediaan — tampil realtime ke pengunjung di halaman publik /kamar.
        </p>
        <div className="mt-6">
          <RoomManager rooms={(rooms ?? []) as KosRoom[]} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Data Penyewa</h2>
        <p className="mt-1 text-sm text-ink/60">
          Kelola data penyewa dan catat pembayaran bulanan — otomatis masuk ke laporan keuangan.
        </p>
        <div className="mt-6">
          <KosManager
            tenants={(tenants ?? []) as KosTenant[]}
            rooms={(rooms ?? []) as KosRoom[]}
            payments={(payments ?? []) as KosPayment[]}
          />
        </div>
      </div>
    </div>
  );
}

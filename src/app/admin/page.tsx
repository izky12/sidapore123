import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function AdminDashboard() {
  const supabase = createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startStr = startOfMonth.toISOString().slice(0, 10);

  const { data: txBulanIni } = await supabase
    .from("transactions")
    .select("*")
    .gte("tgl", startStr)
    .order("tgl", { ascending: false });

  const tx = (txBulanIni ?? []) as Transaction[];

  const totalPerSumber = { depot: 0, laundry: 0, kos: 0, lainnya: 0 } as Record<string, number>;
  let totalMasuk = 0;
  let totalKeluar = 0;

  for (const t of tx) {
    if (t.jenis === "masuk") {
      totalMasuk += Number(t.jumlah);
      totalPerSumber[t.sumber] += Number(t.jumlah);
    } else {
      totalKeluar += Number(t.jumlah);
    }
  }

  const { data: pesananAktif } = await supabase
    .from("water_orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["baru", "diproses", "dikirim"]);

  const { data: laundryAktif } = await supabase
    .from("laundry_orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["baru", "diproses"]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Ringkasan Keuangan</h1>
      <p className="mt-1 text-sm text-ink/60">Bulan berjalan, per {new Date().toLocaleDateString("id-ID")}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="card">
          <p className="text-xs font-medium uppercase text-ink/50">Total Pemasukan</p>
          <p className="mt-2 font-display text-2xl font-bold text-teal-600">{formatRupiah(totalMasuk)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-ink/50">Total Pengeluaran</p>
          <p className="mt-2 font-display text-2xl font-bold text-red-500">{formatRupiah(totalKeluar)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-ink/50">Pesanan Air Aktif</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {(pesananAktif as unknown as { length: number })?.length ?? 0}
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-ink/50">Laundry Berjalan</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {(laundryAktif as unknown as { length: number })?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-ink/60">Pemasukan Depot</p>
          <p className="mt-2 font-display text-xl font-bold text-ink">{formatRupiah(totalPerSumber.depot)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-ink/60">Pemasukan Laundry</p>
          <p className="mt-2 font-display text-xl font-bold text-ink">{formatRupiah(totalPerSumber.laundry)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-ink/60">Pemasukan Kos</p>
          <p className="mt-2 font-display text-xl font-bold text-ink">{formatRupiah(totalPerSumber.kos)}</p>
        </div>
      </div>

      <div className="mt-8 card">
        <h2 className="font-display text-lg font-semibold text-ink">Transaksi Terbaru</h2>
        <div className="mt-4 overflow-x-auto">
          <ScrollHint />
          <table className="w-full text-left text-sm">
            <thead className="text-ink/50">
              <tr>
                <th className="py-2 pr-4">Tanggal</th>
                <th className="py-2 pr-4">Sumber</th>
                <th className="py-2 pr-4">Deskripsi</th>
                <th className="py-2 pr-4">Jenis</th>
                <th className="py-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {tx.slice(0, 15).map((t) => (
                <tr key={t.id} className="border-t border-teal-50">
                  <td className="py-2 pr-4">{new Date(t.tgl).toLocaleDateString("id-ID")}</td>
                  <td className="py-2 pr-4 capitalize">{t.sumber}</td>
                  <td className="py-2 pr-4">{t.deskripsi}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        "badge " +
                        (t.jenis === "masuk" ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-500")
                      }
                    >
                      {t.jenis}
                    </span>
                  </td>
                  <td className="py-2 font-medium">{formatRupiah(Number(t.jumlah))}</td>
                </tr>
              ))}
              {tx.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-ink/40">
                    Belum ada transaksi bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

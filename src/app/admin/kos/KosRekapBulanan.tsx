import type { KosTenant } from "@/lib/types";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function waLink(noWa: string, nama: string, periode: string, harga: number) {
  const nomor = noWa.replace(/[^0-9]/g, "").replace(/^0/, "62");
  const pesan = `Halo ${nama}, mengingatkan untuk pembayaran sewa kos periode ${periode} sebesar ${formatRupiah(
    harga
  )}. Terima kasih.`;
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}

export default function KosRekapBulanan({
  tenants,
  paymentsBulanIni,
  periode,
}: {
  tenants: KosTenant[];
  paymentsBulanIni: { tenant_id: string; jumlah: number }[];
  periode: string;
}) {
  const aktif = tenants.filter((t) => t.status === "aktif");
  const sudahBayarIds = new Set(paymentsBulanIni.map((p) => p.tenant_id));
  const sudahBayar = aktif.filter((t) => sudahBayarIds.has(t.id));
  const belumBayar = aktif.filter((t) => !sudahBayarIds.has(t.id));
  const totalTerkumpul = paymentsBulanIni.reduce((s, p) => s + Number(p.jumlah), 0);
  const totalPotensi = aktif.reduce((s, t) => s + Number(t.harga_bulanan), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="card">
          <p className="text-xs font-medium uppercase text-ink/50">Kamar Aktif</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{aktif.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-ink/50">Sudah Bayar</p>
          <p className="mt-2 font-display text-2xl font-bold text-teal-600">{sudahBayar.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-ink/50">Belum Bayar</p>
          <p className="mt-2 font-display text-2xl font-bold text-red-500">{belumBayar.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-ink/50">Terkumpul / Potensi</p>
          <p className="mt-2 font-display text-lg font-bold text-ink">
            {formatRupiah(totalTerkumpul)} <span className="text-sm font-normal text-ink/40">/ {formatRupiah(totalPotensi)}</span>
          </p>
        </div>
      </div>

      {belumBayar.length > 0 && (
        <div className="card border border-red-100 bg-red-50/40">
          <h3 className="font-display text-base font-semibold text-ink">⏰ Pengingat: belum bayar periode {periode}</h3>
          <p className="mt-1 text-xs text-ink/60">
            Daftar kamar yang belum tercatat pembayarannya bulan ini. Klik &quot;Ingatkan via WA&quot; untuk kirim
            pesan pengingat cepat (belum otomatis, masih manual per klik).
          </p>
          <ul className="mt-3 divide-y divide-red-100">
            {belumBayar.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium text-ink">{t.no_kamar}</span> — {t.nama} ·{" "}
                  {formatRupiah(t.harga_bulanan)}
                </span>
                <a
                  href={waLink(t.no_wa, t.nama, periode, t.harga_bulanan)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-teal-600 hover:underline"
                >
                  Ingatkan via WA
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {belumBayar.length === 0 && aktif.length > 0 && (
        <p className="text-sm text-teal-600">✅ Semua kamar aktif sudah bayar periode {periode}.</p>
      )}
    </div>
  );
}

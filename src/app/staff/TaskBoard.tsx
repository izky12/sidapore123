"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { WaterOrder, LaundryOrder, OrderStatus, UserRole, MetodeBayar, Profile, LayananLaundry } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const color =
    status === "selesai"
      ? "bg-teal-50 text-teal-600"
      : status === "batal"
      ? "bg-red-50 text-red-500"
      : "bg-amber-400/20 text-amber-500";
  return <span className={"badge " + color}>{STATUS_LABEL[status]}</span>;
}

function MetodeBayarPicker({ value, onChange }: { value: MetodeBayar; onChange: (m: MetodeBayar) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("tunai")}
        className={
          "rounded-lg border px-3 py-2.5 text-sm font-medium " +
          (value === "tunai" ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
        }
      >
        Tunai
      </button>
      <button
        type="button"
        onClick={() => onChange("digital")}
        className={
          "rounded-lg border px-3 py-2.5 text-sm font-medium " +
          (value === "digital" ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
        }
      >
        Digital (QRIS/Transfer)
      </button>
    </div>
  );
}

function SetorKasLink() {
  return (
    <a href="/staff/setor-kas" className="btn-outline shrink-0">
      Setor Kas Hari Ini
    </a>
  );
}

export default function TaskBoard({
  role,
  waterOrders,
  laundryOrders,
  laundryJemputTugas = [],
  laundryAntarTugas = [],
  kurirList = [],
  layananList = [],
}: {
  role: UserRole;
  waterOrders: WaterOrder[];
  laundryOrders: LaundryOrder[];
  laundryJemputTugas?: LaundryOrder[];
  laundryAntarTugas?: LaundryOrder[];
  kurirList?: Profile[];
  layananList?: LayananLaundry[];
}) {
  const supabase = createClient();
  const router = useRouter();

  async function setWaterStatus(id: string, status: OrderStatus) {
    await supabase.from("water_orders").update({ status }).eq("id", id);
    router.refresh();
  }

  async function simpanHargaAir(id: string, harga: number) {
    await supabase.from("water_orders").update({ harga }).eq("id", id);
    router.refresh();
  }

  async function limpahkanKeKurir(id: string, kurirId: string) {
    if (!kurirId) return;
    await supabase.from("water_orders").update({ assigned_kurir_id: kurirId, status: "ditugaskan" }).eq("id", id);
    router.refresh();
  }

  // Kurir konfirmasi COD saat serah terima -> pemasukan otomatis tercatat atas nama kurir.
  async function konfirmasiBayarAir(id: string, metode: MetodeBayar) {
    await supabase
      .from("water_orders")
      .update({ metode_bayar: metode, dibayar: true, dibayar_at: new Date().toISOString(), status: "terkirim" })
      .eq("id", id);
    router.refresh();
  }

  // Staff depot verifikasi akhir. Kalau belum dibayar (mis. ambil di tempat), staff yang menagih.
  async function selesaikanAir(id: string, sudahDibayar: boolean, harga: number | null, metode?: MetodeBayar) {
    if (sudahDibayar) {
      await supabase.from("water_orders").update({ status: "selesai" }).eq("id", id);
    } else {
      if (!harga || harga <= 0) return;
      await supabase
        .from("water_orders")
        .update({
          harga,
          metode_bayar: metode ?? "tunai",
          dibayar: true,
          dibayar_at: new Date().toISOString(),
          status: "selesai",
        })
        .eq("id", id);
    }
    router.refresh();
  }

  async function setLaundryStatus(id: string, status: OrderStatus) {
    await supabase.from("laundry_orders").update({ status }).eq("id", id);
    router.refresh();
  }

  async function terimaBayaranLaundry(id: string, harga: number, metode: MetodeBayar) {
    await supabase
      .from("laundry_orders")
      .update({
        harga,
        metode_bayar: metode,
        dibayar: true,
        dibayar_at: new Date().toISOString(),
        status: "selesai",
      })
      .eq("id", id);
    router.refresh();
  }

  // Staff menugaskan kurir untuk menjemput cucian pelanggan.
  async function tugaskanKurirJemput(id: string, kurirId: string) {
    if (!kurirId) return;
    await supabase.from("laundry_orders").update({ assigned_kurir_jemput_id: kurirId }).eq("id", id);
    router.refresh();
  }

  // Kurir konfirmasi sudah menjemput. Jika bayar disepakati saat jemput, tagih sekalian.
  async function kurirSudahJemput(id: string, dibayarSekarang: boolean, harga?: number, metode?: MetodeBayar) {
    const patch: Record<string, unknown> = { jemput_selesai: true };
    if (dibayarSekarang && harga) {
      patch.harga = harga;
      patch.metode_bayar = metode ?? "tunai";
      patch.dibayar = true;
      patch.dibayar_at = new Date().toISOString();
    }
    await supabase.from("laundry_orders").update(patch).eq("id", id);
    router.refresh();
  }

  // Staff menandai cucian selesai & siap diambil/diantar. Jika perlu kurir antar, tugaskan sekalian.
  async function cucianSiapDiambil(id: string, kurirAntarId: string | null, harga: number | null) {
    const patch: Record<string, unknown> = { status: "siap_diambil" };
    if (kurirAntarId) patch.assigned_kurir_id = kurirAntarId;
    if (harga) patch.harga = harga;
    await supabase.from("laundry_orders").update(patch).eq("id", id);
    router.refresh();
  }

  // Kurir konfirmasi sudah mengantar balik ke pelanggan (+ tagih bila belum dibayar).
  async function kurirSudahAntar(id: string, sudahDibayar: boolean, harga: number, metode?: MetodeBayar) {
    if (sudahDibayar) {
      await supabase.from("laundry_orders").update({ status: "selesai" }).eq("id", id);
    } else {
      await supabase
        .from("laundry_orders")
        .update({
          harga,
          metode_bayar: metode ?? "tunai",
          dibayar: true,
          dibayar_at: new Date().toISOString(),
          status: "selesai",
        })
        .eq("id", id);
    }
    router.refresh();
  }

  if (role === "staff_depot") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Pesanan Air — Verifikasi &amp; Limpahkan</h1>
            <p className="text-sm text-ink/60">
              Set harga saat verifikasi, limpahkan ke kurir, lalu verifikasi akhir setelah kurir konfirmasi terkirim.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <SetorKasLink />
            <a href="/staff/kasir" className="btn-outline">
              Kasir (POS)
            </a>
          </div>
        </div>
        {waterOrders.map((o) => (
          <WaterDepotCard
            key={o.id}
            order={o}
            kurirList={kurirList}
            onSimpanHarga={(h) => simpanHargaAir(o.id, h)}
            onVerifikasi={() => setWaterStatus(o.id, "diverifikasi")}
            onLimpahkan={(kurirId) => limpahkanKeKurir(o.id, kurirId)}
            onSelesaikan={(sudahDibayar, harga, metode) => selesaikanAir(o.id, sudahDibayar, harga, metode)}
          />
        ))}
        {waterOrders.length === 0 && <p className="text-ink/40">Tidak ada pesanan yang perlu ditindaklanjuti.</p>}
      </div>
    );
  }

  if (role === "kurir") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Tugas Pengantaran</h1>
            <p className="text-sm text-ink/60">Pesanan galon yang ditugaskan ke Anda. Tagih &amp; konfirmasi bayar saat serah terima.</p>
          </div>
          <SetorKasLink />
        </div>
        {waterOrders.map((o) => (
          <KurirWaterCard key={o.id} order={o} onMulaiAntar={() => setWaterStatus(o.id, "dikirim")} onKonfirmasiBayar={(m) => konfirmasiBayarAir(o.id, m)} />
        ))}
        {waterOrders.length === 0 && <p className="text-ink/40">Belum ada tugas pengantaran air.</p>}

        {laundryJemputTugas.length > 0 && (
          <div className="space-y-3 border-t border-teal-100 pt-4">
            <h2 className="font-display text-lg font-semibold text-ink">Tugas Jemput Laundry</h2>
            {laundryJemputTugas.map((o) => (
              <KurirJemputCard key={o.id} order={o} onSudahJemput={(bayar, harga, metode) => kurirSudahJemput(o.id, bayar, harga, metode)} />
            ))}
          </div>
        )}

        {laundryAntarTugas.length > 0 && (
          <div className="space-y-3 border-t border-teal-100 pt-4">
            <h2 className="font-display text-lg font-semibold text-ink">Tugas Antar Laundry</h2>
            {laundryAntarTugas.map((o) => (
              <KurirAntarCard key={o.id} order={o} onSudahAntar={(dibayar, harga, metode) => kurirSudahAntar(o.id, dibayar, harga, metode)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (role === "staff_laundry") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Pesanan Laundry</h1>
            <p className="text-sm text-ink/60">Perbarui status cucian dan catat pembayaran pelanggan.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <SetorKasLink />
            <a href="/staff/kasir" className="btn-outline">
              Kasir (POS)
            </a>
          </div>
        </div>
        {laundryOrders.filter((o) => o.metode_ambil === "dijemput" && !o.jemput_selesai).length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">Perlu Dijemput</h2>
            {laundryOrders
              .filter((o) => o.metode_ambil === "dijemput" && !o.jemput_selesai)
              .map((o) => (
                <JemputAssignCard key={o.id} order={o} kurirList={kurirList} onTugaskan={(kurirId) => tugaskanKurirJemput(o.id, kurirId)} />
              ))}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">Antrian Cucian</h2>
          {laundryOrders
            .filter((o) => o.jemput_selesai)
            .map((o) => (
              <LaundryTaskCard
                key={o.id}
                order={o}
                kurirList={kurirList}
                layananList={layananList}
                onSetStatus={setLaundryStatus}
                onTerimaBayaran={terimaBayaranLaundry}
                onSiapDiambil={(kurirAntarId, harga) => cucianSiapDiambil(o.id, kurirAntarId, harga)}
              />
            ))}
          {laundryOrders.filter((o) => o.jemput_selesai).length === 0 && <p className="text-ink/40">Tidak ada pesanan laundry aktif.</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Selamat datang</h1>
      <p className="mt-2 text-ink/60">
        Untuk mengelola keuangan dan staff, silakan buka <a href="/admin" className="text-teal-600 hover:underline">Panel Admin</a>.
      </p>
    </div>
  );
}

function WaterDepotCard({
  order,
  kurirList,
  onSimpanHarga,
  onVerifikasi,
  onLimpahkan,
  onSelesaikan,
}: {
  order: WaterOrder;
  kurirList: Profile[];
  onSimpanHarga: (harga: number) => void;
  onVerifikasi: () => void;
  onLimpahkan: (kurirId: string) => void;
  onSelesaikan: (sudahDibayar: boolean, harga: number | null, metode?: MetodeBayar) => void;
}) {
  const [kurirId, setKurirId] = useState(order.assigned_kurir_id ?? "");
  const [harga, setHarga] = useState<number | "">(order.harga ?? "");
  const [showBayar, setShowBayar] = useState(false);
  const [metode, setMetode] = useState<MetodeBayar>("tunai");

  return (
    <div className="card flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="flex-1">
        <p className="font-medium text-ink">{order.nama} &middot; {order.jumlah_galon} galon</p>
        <p className="text-sm text-ink/60">{order.no_wa}</p>
        <a href={order.lokasi_maps} target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:underline">
          Lihat lokasi
        </a>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status={order.status} />
          {order.dibayar && (
            <span className="badge bg-teal-50 text-teal-600">
              Dibayar {order.metode_bayar === "tunai" ? "Tunai" : "Digital"}
            </span>
          )}
        </div>

        {(order.status === "baru" || order.status === "diverifikasi") && (
          <div className="mt-3 w-40">
            <label className="label">Harga (Rp)</label>
            <input
              type="number"
              min={0}
              className="input py-1.5"
              value={harga}
              onChange={(e) => setHarga(e.target.value ? Number(e.target.value) : "")}
              onBlur={() => harga !== "" && onSimpanHarga(Number(harga))}
            />
          </div>
        )}
      </div>

      {order.status === "baru" && (
        <button onClick={onVerifikasi} disabled={harga === "" || Number(harga) <= 0} className="btn-primary shrink-0">
          Verifikasi Pesanan
        </button>
      )}

      {order.status === "diverifikasi" && (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <select className="input py-1.5" value={kurirId} onChange={(e) => setKurirId(e.target.value)}>
            <option value="">Pilih kurir</option>
            {kurirList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.full_name}
              </option>
            ))}
          </select>
          <button onClick={() => onLimpahkan(kurirId)} disabled={!kurirId} className="btn-primary">
            Limpahkan ke Kurir
          </button>
        </div>
      )}

      {order.status === "ditugaskan" && (
        <p className="shrink-0 text-sm text-ink/50">Menunggu kurir mulai antar.</p>
      )}
      {order.status === "dikirim" && (
        <p className="shrink-0 text-sm text-ink/50">Sedang diantar kurir.</p>
      )}

      {order.status === "terkirim" && !showBayar && (
        <button
          onClick={() => (order.dibayar ? onSelesaikan(true, order.harga) : setShowBayar(true))}
          className="btn-primary shrink-0"
        >
          {order.dibayar ? "Verifikasi & Selesaikan" : "Tagih & Selesaikan"}
        </button>
      )}

      {order.status === "terkirim" && showBayar && !order.dibayar && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSelesaikan(false, Number(harga), metode);
            setShowBayar(false);
          }}
          className="w-full max-w-xs shrink-0 space-y-3 rounded-lg border border-teal-100 bg-teal-50/40 p-4"
        >
          <div>
            <label className="label">Jumlah diterima (Rp)</label>
            <input
              type="number"
              required
              min={1}
              className="input"
              value={harga}
              onChange={(e) => setHarga(e.target.value ? Number(e.target.value) : "")}
              autoFocus
            />
          </div>
          <MetodeBayarPicker value={metode} onChange={setMetode} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Simpan &amp; Selesaikan</button>
            <button type="button" onClick={() => setShowBayar(false)} className="btn-outline">Batal</button>
          </div>
        </form>
      )}
    </div>
  );
}

function KurirWaterCard({
  order,
  onMulaiAntar,
  onKonfirmasiBayar,
}: {
  order: WaterOrder;
  onMulaiAntar: () => void;
  onKonfirmasiBayar: (metode: MetodeBayar) => void;
}) {
  const [showBayar, setShowBayar] = useState(false);
  const [metode, setMetode] = useState<MetodeBayar>("tunai");

  return (
    <div className="card">
      <p className="font-medium text-ink">{order.nama} &middot; {order.jumlah_galon} galon</p>
      <p className="text-sm text-ink/60">WA: {order.no_wa}</p>
      {order.harga != null && <p className="text-sm font-medium text-ink">Tagihan: {formatRupiah(order.harga)}</p>}
      <a href={order.lokasi_maps} target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:underline">
        Buka lokasi di Maps
      </a>
      <div className="mt-2"><StatusBadge status={order.status} /></div>

      {order.status === "ditugaskan" && (
        <div className="mt-3">
          <button onClick={onMulaiAntar} className="btn-outline">Mulai Antar</button>
        </div>
      )}

      {order.status === "dikirim" && !showBayar && (
        <div className="mt-3">
          <button onClick={() => setShowBayar(true)} className="btn-primary">Terima Bayaran &amp; Konfirmasi Terkirim</button>
        </div>
      )}

      {order.status === "dikirim" && showBayar && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onKonfirmasiBayar(metode);
            setShowBayar(false);
          }}
          className="mt-3 space-y-3 rounded-lg border border-teal-100 bg-teal-50/40 p-4"
        >
          <p className="text-sm text-ink/70">Konfirmasi metode pembayaran yang diterima dari pelanggan:</p>
          <MetodeBayarPicker value={metode} onChange={setMetode} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Konfirmasi Terkirim &amp; Dibayar</button>
            <button type="button" onClick={() => setShowBayar(false)} className="btn-outline">Batal</button>
          </div>
        </form>
      )}
    </div>
  );
}

// Kalkulator harga otomatis: staff tinggal pilih layanan (tarif diatur admin
// di /admin/layanan-laundry) + isi berat, harga langsung terhitung — tidak
// perlu mengira-ngira atau menghitung manual di kepala/kalkulator terpisah.
function KalkulatorHargaLaundry({
  layananList,
  onHitung,
}: {
  layananList: LayananLaundry[];
  onHitung: (harga: number) => void;
}) {
  const [layananId, setLayananId] = useState("");
  const [jumlah, setJumlah] = useState<number | "">("");

  if (layananList.length === 0) return null;

  const layanan = layananList.find((l) => l.id === layananId);
  const hasil = layanan?.harga != null && jumlah !== "" ? Math.round(layanan.harga * Number(jumlah)) : null;

  return (
    <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/60 p-3">
      <p className="text-xs font-medium text-ink/60">
        Kalkulator otomatis — pilih layanan &amp; isi {layanan?.satuan === "pasang" ? "jumlah" : "berat"}, harga terhitung sendiri
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div>
          <label className="label text-xs">Layanan</label>
          <select className="input py-1.5 text-sm" value={layananId} onChange={(e) => setLayananId(e.target.value)}>
            <option value="">Pilih layanan</option>
            {layananList.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nama} ({l.harga != null ? formatRupiah(l.harga) : "-"}/{l.satuan})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs">{layanan?.satuan === "pasang" ? "Jumlah (pasang)" : "Berat (kg)"}</label>
          <input
            type="number"
            min={0}
            step="0.1"
            className="input w-24 py-1.5 text-sm"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : "")}
          />
        </div>
        <button
          type="button"
          disabled={hasil === null}
          onClick={() => hasil !== null && onHitung(hasil)}
          className="btn-outline py-1.5 text-sm"
        >
          {hasil !== null ? `Pakai ${formatRupiah(hasil)}` : "Hitung"}
        </button>
      </div>
    </div>
  );
}

function LaundryTaskCard({
  order,
  kurirList,
  layananList = [],
  onSetStatus,
  onTerimaBayaran,
  onSiapDiambil,
}: {
  order: LaundryOrder;
  kurirList: Profile[];
  layananList?: LayananLaundry[];
  onSetStatus: (id: string, status: OrderStatus) => void;
  onTerimaBayaran: (id: string, harga: number, metode: MetodeBayar) => void;
  onSiapDiambil: (kurirAntarId: string | null, harga: number | null) => void;
}) {
  const [showBayar, setShowBayar] = useState(false);
  const [showSelesai, setShowSelesai] = useState(false);
  const [jumlah, setJumlah] = useState(order.harga ?? "");
  const [metode, setMetode] = useState<MetodeBayar>("tunai");
  const [kurirAntarId, setKurirAntarId] = useState(order.assigned_kurir_id ?? "");

  function submitBayar(e: React.FormEvent) {
    e.preventDefault();
    if (!jumlah || Number(jumlah) <= 0) return;
    onTerimaBayaran(order.id, Number(jumlah), metode);
    setShowBayar(false);
  }

  const waLink = `https://wa.me/${order.no_wa.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Halo ${order.nama}, laundry Anda (${order.jenis_layanan}) sudah selesai${order.antar_jemput ? " dan sedang diantar kurir." : ", silakan diambil ya."}`
  )}`;

  return (
    <div className="card">
      <p className="font-medium text-ink">
        {order.nama} &middot; {order.jenis_layanan}
      </p>
      <p className="text-sm text-ink/60">WA: {order.no_wa}</p>
      {order.antar_jemput && <p className="text-xs text-ink/50">Antar-jemput &middot; Ongkir {formatRupiah(order.ongkir)}</p>}
      <div className="mt-2 flex items-center gap-2">
        <StatusBadge status={order.status} />
        {order.dibayar && (
          <span className="badge bg-teal-50 text-teal-600">
            Dibayar {order.metode_bayar === "tunai" ? "Tunai" : "Digital"}
          </span>
        )}
      </div>

      {order.status === "siap_diambil" && (
        <a href={waLink} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-teal-600 hover:underline">
          Kabari pelanggan lewat WA
        </a>
      )}

      {!showBayar && !showSelesai && (
        <div className="mt-3 flex flex-wrap gap-2">
          {order.status === "baru" && (
            <button onClick={() => onSetStatus(order.id, "diproses")} className="btn-outline">
              Mulai Cuci
            </button>
          )}
          {order.status === "diproses" && !order.antar_jemput && (
            <button onClick={() => setShowBayar(true)} className="btn-primary">
              Selesai &amp; Terima Bayaran
            </button>
          )}
          {order.status === "diproses" && order.antar_jemput && (
            <button onClick={() => setShowSelesai(true)} className="btn-primary">
              Cucian Selesai — Siap Diantar
            </button>
          )}
          {order.status === "siap_diambil" && !order.dibayar && (
            <button onClick={() => setShowBayar(true)} className="btn-outline">
              Catat Pembayaran Manual
            </button>
          )}
        </div>
      )}

      {showSelesai && order.antar_jemput && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!order.dibayar && (!jumlah || Number(jumlah) <= 0)) return;
            onSiapDiambil(kurirAntarId || null, jumlah ? Number(jumlah) : null);
            setShowSelesai(false);
          }}
          className="mt-4 space-y-3 rounded-lg border border-teal-100 bg-teal-50/40 p-4"
        >
          {!order.dibayar && (
            <div className="space-y-2">
              <label className="label">Harga layanan (Rp) — untuk ditagih kurir saat antar</label>
              <input
                type="number"
                required
                min={1}
                className="input"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : "")}
                autoFocus
              />
              <KalkulatorHargaLaundry layananList={layananList} onHitung={(harga) => setJumlah(harga)} />
            </div>
          )}
          <div>
            <label className="label">Kurir antar</label>
            <select className="input" value={kurirAntarId} onChange={(e) => setKurirAntarId(e.target.value)}>
              <option value="">Pilih kurir</option>
              {kurirList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={!kurirAntarId} className="btn-primary">
              Tugaskan &amp; Siap Antar
            </button>
            <button type="button" onClick={() => setShowSelesai(false)} className="btn-outline">
              Batal
            </button>
          </div>
        </form>
      )}

      {showBayar && (
        <form onSubmit={submitBayar} className="mt-4 space-y-3 rounded-lg border border-teal-100 bg-teal-50/40 p-4">
          <div>
            <label className="label">Jumlah diterima — harga layanan (Rp)</label>
            <input
              type="number"
              required
              min={1}
              className="input"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : "")}
              autoFocus
            />
            <div className="mt-2">
              <KalkulatorHargaLaundry layananList={layananList} onHitung={(harga) => setJumlah(harga)} />
            </div>
            {order.ongkir > 0 && (
              <p className="mt-1 text-xs text-ink/50">
                + Ongkir {formatRupiah(order.ongkir)} otomatis ditambahkan ke pemasukan (total {formatRupiah(Number(jumlah || 0) + order.ongkir)}).
              </p>
            )}
          </div>
          <MetodeBayarPicker value={metode} onChange={setMetode} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Simpan &amp; Selesaikan
            </button>
            <button type="button" onClick={() => setShowBayar(false)} className="btn-outline">
              Batal
            </button>
          </div>
          {metode === "tunai" && (
            <p className="text-xs text-ink/50">
              Pembayaran tunai akan dihitung otomatis di setoran kas harian Anda.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function JemputAssignCard({
  order,
  kurirList,
  onTugaskan,
}: {
  order: LaundryOrder;
  kurirList: Profile[];
  onTugaskan: (kurirId: string) => void;
}) {
  const [kurirId, setKurirId] = useState(order.assigned_kurir_jemput_id ?? "");

  return (
    <div className="card flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <p className="font-medium text-ink">{order.nama} &middot; {order.jenis_layanan}</p>
        <p className="text-sm text-ink/60">WA: {order.no_wa}</p>
        {order.lokasi_jemput && (
          <a href={order.lokasi_jemput} target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:underline">
            Lihat lokasi jemput
          </a>
        )}
        {order.assigned_kurir_jemput_id && <p className="mt-1 text-xs text-amber-500">Menunggu kurir menjemput.</p>}
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <select className="input py-1.5" value={kurirId} onChange={(e) => setKurirId(e.target.value)}>
          <option value="">Pilih kurir</option>
          {kurirList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.full_name}
            </option>
          ))}
        </select>
        <button onClick={() => onTugaskan(kurirId)} disabled={!kurirId} className="btn-primary">
          Tugaskan
        </button>
      </div>
    </div>
  );
}

function KurirJemputCard({
  order,
  onSudahJemput,
}: {
  order: LaundryOrder;
  onSudahJemput: (dibayarSekarang: boolean, harga?: number, metode?: MetodeBayar) => void;
}) {
  const [showBayar, setShowBayar] = useState(false);
  const [jumlah, setJumlah] = useState<number | "">("");
  const [metode, setMetode] = useState<MetodeBayar>("tunai");
  const perluTagihSekarang = order.bayar_saat === "jemput" && !order.dibayar;

  return (
    <div className="card">
      <p className="font-medium text-ink">{order.nama} &middot; {order.jenis_layanan}</p>
      <p className="text-sm text-ink/60">WA: {order.no_wa}</p>
      {order.lokasi_jemput && (
        <a href={order.lokasi_jemput} target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:underline">
          Buka lokasi di Maps
        </a>
      )}
      {perluTagihSekarang && <p className="mt-1 text-xs text-amber-500">Tagih pembayaran saat jemput.</p>}

      {!showBayar && (
        <div className="mt-3">
          <button
            onClick={() => (perluTagihSekarang ? setShowBayar(true) : onSudahJemput(false))}
            className="btn-primary"
          >
            Sudah Dijemput
          </button>
        </div>
      )}

      {showBayar && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!jumlah || Number(jumlah) <= 0) return;
            onSudahJemput(true, Number(jumlah), metode);
            setShowBayar(false);
          }}
          className="mt-3 space-y-3 rounded-lg border border-teal-100 bg-teal-50/40 p-4"
        >
          <div>
            <label className="label">Jumlah diterima (Rp)</label>
            <input
              type="number"
              required
              min={1}
              className="input"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : "")}
              autoFocus
            />
          </div>
          <MetodeBayarPicker value={metode} onChange={setMetode} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Simpan &amp; Konfirmasi Jemput</button>
            <button type="button" onClick={() => setShowBayar(false)} className="btn-outline">Batal</button>
          </div>
        </form>
      )}
    </div>
  );
}

function KurirAntarCard({
  order,
  onSudahAntar,
}: {
  order: LaundryOrder;
  onSudahAntar: (sudahDibayar: boolean, harga: number, metode?: MetodeBayar) => void;
}) {
  const [showBayar, setShowBayar] = useState(false);
  const [jumlah, setJumlah] = useState<number | "">(order.harga ?? "");
  const [metode, setMetode] = useState<MetodeBayar>("tunai");

  return (
    <div className="card">
      <p className="font-medium text-ink">{order.nama} &middot; {order.jenis_layanan}</p>
      <p className="text-sm text-ink/60">WA: {order.no_wa}</p>
      {order.harga != null && (
        <p className="text-sm font-medium text-ink">Tagihan: {formatRupiah(order.harga + (order.ongkir ?? 0))}</p>
      )}
      <div className="mt-2">
        {order.dibayar ? (
          <span className="badge bg-teal-50 text-teal-600">Sudah dibayar</span>
        ) : (
          <span className="badge bg-amber-400/20 text-amber-500">Belum dibayar</span>
        )}
      </div>

      {!showBayar && (
        <div className="mt-3">
          <button
            onClick={() => (order.dibayar ? onSudahAntar(true, order.harga ?? 0) : setShowBayar(true))}
            className="btn-primary"
          >
            {order.dibayar ? "Konfirmasi Terkirim" : "Antar & Terima Bayaran"}
          </button>
        </div>
      )}

      {showBayar && !order.dibayar && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!jumlah || Number(jumlah) <= 0) return;
            onSudahAntar(false, Number(jumlah), metode);
            setShowBayar(false);
          }}
          className="mt-3 space-y-3 rounded-lg border border-teal-100 bg-teal-50/40 p-4"
        >
          <div>
            <label className="label">Jumlah diterima (Rp)</label>
            <input
              type="number"
              required
              min={1}
              className="input"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : "")}
              autoFocus
            />
          </div>
          <MetodeBayarPicker value={metode} onChange={setMetode} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Simpan &amp; Selesaikan</button>
            <button type="button" onClick={() => setShowBayar(false)} className="btn-outline">Batal</button>
          </div>
        </form>
      )}
    </div>
  );
}

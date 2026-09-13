"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { KosPayment, KosRoom, KosTenant } from "@/lib/types";
import PrintReceiptButton from "@/components/PrintReceiptButton";
import Modal from "@/components/Modal";
import ScrollHint from "@/components/ScrollHint";
import type { ReceiptData } from "@/lib/print/escpos";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}



type ModalState =
  | { mode: "hapus"; tenant: KosTenant }
  | { mode: "bayar"; tenant: KosTenant }
  | { mode: "edit"; tenant: KosTenant }
  | null;

export default function KosManager({
  tenants,
  rooms,
  payments,
}: {
  tenants: KosTenant[];
  rooms: KosRoom[];
  payments: KosPayment[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const kamarKosong = rooms.filter((r) => r.status === "tersedia");

  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [strukTerakhir, setStrukTerakhir] = useState<ReceiptData | null>(null);

  const [modal, setModal] = useState<ModalState>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  // form pembayaran
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [jumlahBayar, setJumlahBayar] = useState<number | "">("");
  // form edit
  const [editNama, setEditNama] = useState("");
  const [editNoWa, setEditNoWa] = useState("");
  const [editHarga, setEditHarga] = useState<number | "">("");

  function bukaModalBayar(t: KosTenant) {
    setPeriode(new Date().toISOString().slice(0, 7));
    setJumlahBayar(t.harga_bulanan);
    setModalError("");
    setModal({ mode: "bayar", tenant: t });
  }

  function bukaModalEdit(t: KosTenant) {
    setEditNama(t.nama);
    setEditNoWa(t.no_wa);
    setEditHarga(t.harga_bulanan);
    setModalError("");
    setModal({ mode: "edit", tenant: t });
  }

  function tutupModal() {
    setModal(null);
    setModalError("");
  }

  async function tambahPenyewa(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      setFormError("Pilih kamar dulu.");
      return;
    }
    setLoading(true);
    // Untuk penyewa walk-in (langsung datang tanpa isi form pendaftaran).
    // Kamar otomatis ditandai "terisi" oleh sistem begitu ini tersimpan.
    const { error } = await supabase.from("kos_tenants").insert({
      nama,
      no_wa: noWa,
      no_kamar: room.no_kamar,
      room_id: room.id,
      harga_bulanan: room.harga_bulanan,
    });
    setLoading(false);
    if (error) {
      setFormError(
        error.message.includes("kos_tenants_satu_penyewa_aktif_per_kamar")
          ? "Kamar ini sudah ada penyewa aktifnya."
          : error.message
      );
      return;
    }
    setNama("");
    setNoWa("");
    setRoomId("");
    router.refresh();
  }

  async function submitBayar() {
    if (modal?.mode !== "bayar") return;
    const tenant = modal.tenant;
    if (!periode.trim()) {
      setModalError("Isi periode dulu (format YYYY-MM).");
      return;
    }
    const jumlah = Number(jumlahBayar);
    if (!jumlah || jumlah <= 0) {
      setModalError("Isi jumlah yang valid.");
      return;
    }
    setModalLoading(true);
    // Insert ini = konfirmasi admin bahwa uang sudah diterima.
    // Otomatis masuk ke ledger kas (transactions) lewat trigger database.
    const { error } = await supabase.from("kos_payments").insert({
      tenant_id: tenant.id,
      periode: periode.trim(),
      jumlah,
    });
    setModalLoading(false);
    if (error) {
      setModalError("Gagal mencatat pembayaran: " + error.message);
      return;
    }
    setStrukTerakhir({
      toko: "Sidapore",
      judul: "Kos-kosan",
      nomor: `Kamar ${tenant.no_kamar}`,
      items: [{ label: `Sewa bulan ${periode} - ${tenant.nama}`, harga: jumlah }],
      total: jumlah,
      metode: "Tunai/Transfer",
    });
    tutupModal();
    router.refresh();
  }

  async function submitEdit() {
    if (modal?.mode !== "edit") return;
    if (!editNama.trim() || !editNoWa.trim() || !editHarga) {
      setModalError("Semua kolom wajib diisi.");
      return;
    }
    setModalLoading(true);
    const { error } = await supabase
      .from("kos_tenants")
      .update({ nama: editNama.trim(), no_wa: editNoWa.trim(), harga_bulanan: Number(editHarga) })
      .eq("id", modal.tenant.id);
    setModalLoading(false);
    if (error) {
      setModalError("Gagal menyimpan: " + error.message);
      return;
    }
    tutupModal();
    router.refresh();
  }

  async function submitHapus() {
    if (modal?.mode !== "hapus") return;
    setModalLoading(true);
    const { error } = await supabase.from("kos_tenants").delete().eq("id", modal.tenant.id);
    setModalLoading(false);
    if (error) {
      setModalError("Gagal menghapus penyewa: " + error.message);
      return;
    }
    tutupModal();
    router.refresh();
  }

  function cetakUlang(p: KosPayment) {
    setStrukTerakhir({
      toko: "Sidapore",
      judul: "Kos-kosan",
      nomor: `Kamar ${p.kos_tenants?.no_kamar ?? "-"}`,
      items: [
        {
          label: `Sewa bulan ${p.periode} - ${p.kos_tenants?.nama ?? "-"} (bayar ${formatTanggal(p.tgl_bayar)})`,
          harga: p.jumlah,
        },
      ],
      total: p.jumlah,
      metode: "Tunai/Transfer",
    });
  }

  return (
    <div className="kasir-screen space-y-6">
      <form onSubmit={tambahPenyewa} className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Nama penyewa</label>
          <input required className="input w-40" value={nama} onChange={(e) => setNama(e.target.value)} />
        </div>
        <div>
          <label className="label">No. WA</label>
          <input required className="input w-36" value={noWa} onChange={(e) => setNoWa(e.target.value)} />
        </div>
        <div>
          <label className="label">Kamar</label>
          <select required className="input w-40" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">Pilih kamar kosong</option>
            {kamarKosong.map((r) => (
              <option key={r.id} value={r.id}>
                {r.no_kamar} — {formatRupiah(r.harga_bulanan)}/bln
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Menyimpan..." : "Tambah Penyewa"}
        </button>
        {formError && <p className="w-full text-sm text-red-500">{formError}</p>}
        {kamarKosong.length === 0 && (
          <p className="w-full text-xs text-ink/40">
            Tidak ada kamar berstatus &quot;Tersedia&quot; di menu Kelola Kamar. Penyewa juga otomatis tercatat di
            sini kalau pendaftaran di menu Pendaftaran &amp; Pemesanan ditandai &quot;Deal&quot;.
          </p>
        )}
      </form>

      <div className="card overflow-x-auto">
        <ScrollHint />
        <table className="w-full text-left text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="py-2 pr-4">Kamar</th>
              <th className="py-2 pr-4">Penyewa</th>
              <th className="py-2 pr-4">WA</th>
              <th className="py-2 pr-4">Harga / bulan</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-teal-50">
                <td className="py-3 pr-4 font-medium">{t.no_kamar}</td>
                <td className="py-3 pr-4">{t.nama}</td>
                <td className="py-3 pr-4">{t.no_wa}</td>
                <td className="py-3 pr-4">{formatRupiah(t.harga_bulanan)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={"badge " + (t.status === "aktif" ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-500")}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="py-3 space-x-3 whitespace-nowrap">
                  <button onClick={() => bukaModalBayar(t)} className="text-sm font-medium text-teal-600 hover:underline">
                    Catat bayar
                  </button>
                  <button onClick={() => bukaModalEdit(t)} className="text-sm font-medium text-ink/60 hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setModalError("");
                      setModal({ mode: "hapus", tenant: t });
                    }}
                    className="text-sm font-medium text-red-500 hover:underline"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink/40">
                  Belum ada penyewa kos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {strukTerakhir && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-ink">Struk pembayaran siap dicetak</p>
            <p className="text-sm text-ink/60">
              {strukTerakhir.nomor} &middot; {formatRupiah(strukTerakhir.total)}
            </p>
          </div>
          <PrintReceiptButton receipt={strukTerakhir} />
        </div>
      )}

      <div>
        <h3 className="font-display text-lg font-bold text-ink">Riwayat Pembayaran</h3>
        <p className="mt-1 text-sm text-ink/60">
          Semua pembayaran kos yang sudah dikonfirmasi admin — otomatis sudah masuk kas. Bisa cetak ulang struknya
          kalau butuh (untuk dicap manual).
        </p>
        <div className="card mt-3 overflow-x-auto">
          <ScrollHint />
          <table className="w-full text-left text-sm">
            <thead className="text-ink/50">
              <tr>
                <th className="py-2 pr-4">Tanggal Bayar</th>
                <th className="py-2 pr-4">Penyewa</th>
                <th className="py-2 pr-4">Kamar</th>
                <th className="py-2 pr-4">Periode</th>
                <th className="py-2 pr-4">Jumlah</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-teal-50">
                  <td className="py-3 pr-4">{formatTanggal(p.tgl_bayar)}</td>
                  <td className="py-3 pr-4">{p.kos_tenants?.nama ?? "-"}</td>
                  <td className="py-3 pr-4 font-medium">{p.kos_tenants?.no_kamar ?? "-"}</td>
                  <td className="py-3 pr-4">{p.periode}</td>
                  <td className="py-3 pr-4">{formatRupiah(p.jumlah)}</td>
                  <td className="py-3">
                    <button onClick={() => cetakUlang(p)} className="text-sm font-medium text-teal-600 hover:underline">
                      Cetak ulang
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-ink/40">
                    Belum ada pembayaran tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.mode === "bayar" && (
        <Modal title={`Catat Pembayaran — Kamar ${modal.tenant.no_kamar}`} onClose={tutupModal}>
          <div className="space-y-3">
            <div>
              <label className="label">Periode (YYYY-MM)</label>
              <input className="input w-full" value={periode} onChange={(e) => setPeriode(e.target.value)} />
            </div>
            <div>
              <label className="label">Jumlah dibayar (Rp)</label>
              <input
                type="number"
                className="input w-full"
                value={jumlahBayar}
                onChange={(e) => setJumlahBayar(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            {modalError && <p className="text-sm text-red-500">{modalError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={tutupModal} className="btn-outline">
                Batal
              </button>
              <button type="button" onClick={submitBayar} disabled={modalLoading} className="btn-primary">
                {modalLoading ? "Menyimpan..." : "Simpan Pembayaran"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.mode === "edit" && (
        <Modal title={`Edit Penyewa — Kamar ${modal.tenant.no_kamar}`} onClose={tutupModal}>
          <div className="space-y-3">
            <div>
              <label className="label">Nama</label>
              <input className="input w-full" value={editNama} onChange={(e) => setEditNama(e.target.value)} />
            </div>
            <div>
              <label className="label">No. WA</label>
              <input className="input w-full" value={editNoWa} onChange={(e) => setEditNoWa(e.target.value)} />
            </div>
            <div>
              <label className="label">Harga / bulan</label>
              <input
                type="number"
                className="input w-full"
                value={editHarga}
                onChange={(e) => setEditHarga(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            {modalError && <p className="text-sm text-red-500">{modalError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={tutupModal} className="btn-outline">
                Batal
              </button>
              <button type="button" onClick={submitEdit} disabled={modalLoading} className="btn-primary">
                {modalLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.mode === "hapus" && (
        <Modal title="Hapus Penyewa" onClose={tutupModal}>
          <div className="space-y-3">
            <p className="text-sm text-ink/70">
              Hapus penyewa <span className="font-semibold">{modal.tenant.nama}</span> (Kamar{" "}
              {modal.tenant.no_kamar})? Seluruh riwayat pembayarannya akan ikut terhapus permanen (tidak bisa
              dibatalkan), dan kamar otomatis kembali berstatus &quot;Tersedia&quot;.
            </p>
            {modalError && <p className="text-sm text-red-500">{modalError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={tutupModal} className="btn-outline">
                Batal
              </button>
              <button
                type="button"
                onClick={submitHapus}
                disabled={modalLoading}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {modalLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

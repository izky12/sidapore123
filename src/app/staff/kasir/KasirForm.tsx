"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PrintReceiptButton from "@/components/PrintReceiptButton";
import type { ReceiptData } from "@/lib/print/escpos";
import { queueTransaction, flushQueue, getQueuedTransactions, type QueuedTransaction } from "@/lib/offlineQueue";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function KasirForm({
  role,
  staffId,
  staffName,
}: {
  role: "staff_depot" | "staff_laundry";
  staffId: string;
  staffName: string;
}) {
  const supabase = createClient();
  const isDepot = role === "staff_depot";

  const [nama, setNama] = useState("");
  const [qty, setQty] = useState<number | "">(isDepot ? 1 : "");
  const [hargaSatuan, setHargaSatuan] = useState<number | "">("");
  const [layanan, setLayanan] = useState("Cuci + Setrika");
  const [metode, setMetode] = useState<"Tunai" | "Digital">("Tunai");
  const [saving, setSaving] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const jumlah = isDepot
    ? Number(qty || 0) * Number(hargaSatuan || 0)
    : Number(hargaSatuan || 0);

  async function insertToServer(tx: QueuedTransaction): Promise<boolean> {
    const { error } = await supabase.from("transactions").insert({
      sumber: tx.sumber,
      jenis: tx.jenis,
      jumlah: tx.jumlah,
      deskripsi: tx.deskripsi,
      created_by: tx.created_by,
      metode_bayar: tx.metode_bayar,
    });
    return !error;
  }

  async function refreshPending() {
    const list = await getQueuedTransactions();
    setPendingCount(list.length);
  }

  async function trySync() {
    const synced = await flushQueue(insertToServer);
    if (synced > 0) await refreshPending();
  }

  useEffect(() => {
    // service worker sudah didaftarkan global di root layout (mendukung semua halaman offline)
    setOnline(navigator.onLine);
    refreshPending();

    function handleOnline() {
      setOnline(true);
      trySync();
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function bayarDanCetak(e: React.FormEvent) {
    e.preventDefault();
    if (jumlah <= 0) return;
    setSaving(true);

    const deskripsi = isDepot
      ? `Penjualan galon${nama ? " - " + nama : ""} (${qty} galon)`
      : `${layanan}${nama ? " - " + nama : ""}`;

    const tx: QueuedTransaction = {
      id: crypto.randomUUID(),
      sumber: isDepot ? "depot" : "laundry",
      jenis: "masuk",
      jumlah,
      deskripsi,
      created_by: staffId,
      created_at: new Date().toISOString(),
      metode_bayar: metode === "Tunai" ? "tunai" : "digital",
    };

    if (navigator.onLine) {
      const ok = await insertToServer(tx);
      if (!ok) await queueTransaction(tx); // gagal walau online (mis. server bermasalah) -> tetap simpan lokal
    } else {
      await queueTransaction(tx);
    }
    await refreshPending();

    const receipt: ReceiptData = {
      toko: "Sidapore",
      judul: isDepot ? "Depot Isi Ulang" : "Laundry",
      items: isDepot
        ? [{ label: "Air Galon", qty: Number(qty) || 1, harga: jumlah }]
        : [{ label: layanan, harga: jumlah }],
      total: jumlah,
      metode,
      kasir: staffName,
      catatan: !navigator.onLine ? "* Transaksi tersimpan offline, sinkron otomatis" : undefined,
    };
    setLastReceipt(receipt);

    setSaving(false);
    setNama("");
    setHargaSatuan("");
    if (isDepot) setQty(1);
  }

  return (
    <div className="kasir-screen space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Kasir — {isDepot ? "Depot" : "Laundry"}</h1>
          <p className="text-sm text-ink/60">Transaksi tunai/digital langsung, cetak struk ke printer bluetooth.</p>
        </div>
        <div className="text-right text-xs">
          <span className={"font-medium " + (online ? "text-teal-600" : "text-amber-500")}>
            {online ? "● Online" : "● Offline"}
          </span>
          {pendingCount > 0 && <p className="text-ink/50">{pendingCount} transaksi belum tersinkron</p>}
        </div>
      </div>

      <div className="kasir-grid">
        <form onSubmit={bayarDanCetak} className="card space-y-4">
          <div>
            <label className="label">Nama pelanggan (opsional)</label>
            <input className="input" value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>

          {isDepot ? (
            <div className="flex flex-wrap gap-3">
              <div className="w-32 flex-1 sm:flex-none">
                <label className="label">Jumlah galon</label>
                <input
                  type="number"
                  min={1}
                  required
                  className="input"
                  value={qty}
                  onChange={(e) => setQty(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div className="w-36 flex-1 sm:flex-none">
                <label className="label">Harga / galon</label>
                <input
                  type="number"
                  min={0}
                  required
                  className="input"
                  value={hargaSatuan}
                  onChange={(e) => setHargaSatuan(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[10rem] flex-1">
                <label className="label">Jenis layanan</label>
                <input className="input" value={layanan} onChange={(e) => setLayanan(e.target.value)} />
              </div>
              <div className="w-36 flex-1 sm:flex-none">
                <label className="label">Total harga</label>
                <input
                  type="number"
                  min={0}
                  required
                  className="input"
                  value={hargaSatuan}
                  onChange={(e) => setHargaSatuan(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Metode pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              {(["Tunai", "Digital"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetode(m)}
                  className={
                    "rounded-lg border px-3 py-2.5 text-sm font-medium " +
                    (metode === m ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <p className="text-lg font-semibold text-ink">Total: {formatRupiah(jumlah || 0)}</p>

          <button type="submit" disabled={saving || jumlah <= 0} className="btn-primary w-full">
            {saving ? "Menyimpan..." : "Bayar & Siapkan Struk"}
          </button>
        </form>

        <div className="space-y-4">
          {lastReceipt ? (
            <div className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">Struk siap dicetak</p>
                <p className="text-sm text-ink/60">
                  {formatRupiah(lastReceipt.total)} &middot; {lastReceipt.metode}
                </p>
              </div>
              <PrintReceiptButton receipt={lastReceipt} />
            </div>
          ) : (
            <div className="card hidden text-sm text-ink/40 lg:block">Struk akan muncul di sini setelah bayar.</div>
          )}

          <p className="text-xs text-ink/40">
            Struk dicetak langsung ke printer thermal bluetooth (tidak perlu internet). Transaksi otomatis
            tersinkron ke server begitu koneksi kembali.
          </p>
        </div>
      </div>
    </div>
  );
}

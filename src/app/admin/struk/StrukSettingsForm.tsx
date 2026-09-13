"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_STRUK_SETTINGS,
  getStrukSettings,
  saveStrukSettings,
  type StrukSettings,
} from "@/lib/print/strukSettings";
import { connectPrinter, disconnectPrinter, isPrinterConnected } from "@/lib/print/bluetoothPrinter";
import PrintReceiptButton from "@/components/PrintReceiptButton";
import type { ReceiptData } from "@/lib/print/escpos";

export default function StrukSettingsForm() {
  const [form, setForm] = useState<StrukSettings>(DEFAULT_STRUK_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [printerStatus, setPrinterStatus] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setForm(getStrukSettings());
  }, []);

  function update<K extends keyof StrukSettings>(key: K, value: StrukSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    saveStrukSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function sambungkanPrinter() {
    setConnecting(true);
    setPrinterStatus("");
    const res = await connectPrinter();
    setPrinterStatus(res.ok ? "Printer tersambung ✓" : res.error || "Gagal menyambungkan printer.");
    setConnecting(false);
  }

  const contohStruk: ReceiptData = {
    toko: form.toko,
    judul: "Contoh Struk",
    items: [
      { label: "Air Galon", qty: 2, harga: 12000 },
      { label: "Cuci + Setrika", harga: 15000 },
    ],
    total: 27000,
    metode: "Tunai",
    kasir: "Contoh Kasir",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
      <form onSubmit={simpan} className="card space-y-4">
        <div>
          <label className="label">Nama toko / usaha</label>
          <input className="input" value={form.toko} onChange={(e) => update("toko", e.target.value)} />
        </div>
        <div>
          <label className="label">Alamat (opsional, tampil di struk)</label>
          <input className="input" value={form.alamat} onChange={(e) => update("alamat", e.target.value)} />
        </div>
        <div>
          <label className="label">No. telepon / WA (opsional)</label>
          <input className="input" value={form.telepon} onChange={(e) => update("telepon", e.target.value)} />
        </div>
        <div>
          <label className="label">Teks footer struk</label>
          <input className="input" value={form.footer} onChange={(e) => update("footer", e.target.value)} />
        </div>
        <div>
          <label className="label">Lebar kertas printer</label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { v: 32, t: "58mm (32 karakter)" },
                { v: 48, t: "80mm (48 karakter)" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => update("lebarKertas", opt.v)}
                className={
                  "rounded-lg border px-3 py-2.5 text-sm font-medium " +
                  (form.lebarKertas === opt.v
                    ? "border-teal-500 bg-teal-100 text-teal-700"
                    : "border-teal-100 text-ink/60")
                }
              >
                {opt.t}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto">
          {saved ? "Tersimpan ✓" : "Simpan Pengaturan"}
        </button>
      </form>

      <div className="space-y-4">
        <div className="card space-y-3">
          <p className="font-medium text-ink">Printer Bluetooth</p>
          <p className="text-sm text-ink/60">
            {isPrinterConnected() ? "Printer sedang tersambung." : "Belum ada printer tersambung."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={sambungkanPrinter} disabled={connecting} className="btn-outline text-sm">
              {connecting ? "Menyambungkan..." : "Sambungkan Printer"}
            </button>
            <button
              type="button"
              onClick={() => {
                disconnectPrinter();
                setPrinterStatus("Printer diputus.");
              }}
              className="btn-outline text-sm"
            >
              Putuskan
            </button>
          </div>
          {printerStatus && <p className="text-xs text-ink/50">{printerStatus}</p>}
        </div>

        <div className="card space-y-3">
          <p className="font-medium text-ink">Coba cetak struk</p>
          <p className="text-sm text-ink/60">Simpan pengaturan dulu, lalu tes cetak untuk melihat hasilnya.</p>
          <PrintReceiptButton receipt={contohStruk} label="Test Print" />
        </div>
      </div>
    </div>
  );
}

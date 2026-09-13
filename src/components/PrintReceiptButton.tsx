"use client";

import { useState } from "react";
import { buildReceipt, type ReceiptData } from "@/lib/print/escpos";
import { printBytes, isPrinterConnected } from "@/lib/print/bluetoothPrinter";
import { getStrukSettings } from "@/lib/print/strukSettings";

export default function PrintReceiptButton({ receipt, label = "Cetak Struk" }: { receipt: ReceiptData; label?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function cetak() {
    setStatus("loading");
    setError("");
    // gabungkan dengan Pengaturan Struk (nama toko/alamat/footer/lebar kertas kustom)
    const s = getStrukSettings();
    const bytes = buildReceipt({
      ...receipt,
      toko: s.toko || receipt.toko,
      alamat: receipt.alamat ?? s.alamat,
      telepon: receipt.telepon ?? s.telepon,
      footer: receipt.footer ?? s.footer,
      lebarKertas: receipt.lebarKertas ?? s.lebarKertas,
    });
    const res = await printBytes(bytes);
    if (!res.ok) {
      setStatus("error");
      setError(res.error ?? "Gagal mencetak.");
      return;
    }
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={cetak} disabled={status === "loading"} className="btn-outline text-sm">
        {status === "loading" ? "Mencetak..." : status === "ok" ? "Terkirim ✓" : label}
      </button>
      {status === "error" && <p className="text-xs text-red-500">{error}</p>}
      {isPrinterConnected() && status === "idle" && <p className="text-xs text-teal-600">Printer tersambung</p>}
    </div>
  );
}

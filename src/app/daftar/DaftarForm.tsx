"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LeadJenis } from "@/lib/types";

const PILIHAN: { value: LeadJenis; label: string }[] = [
  { value: "depot", label: "Depot Isi Ulang Air" },
  { value: "kos", label: "Kos-kosan" },
  { value: "laundry", label: "Laundry" },
];

export default function DaftarForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const defaultJenis = (params.get("jenis") as LeadJenis) || "depot";
  const roomId = params.get("room");
  const kamarLabel = params.get("kamar");

  const [jenis, setJenis] = useState<LeadJenis>(defaultJenis);
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState(kamarLabel ? `Kamar dipilih: ${kamarLabel}` : "");
  const [status, setStatus] = useState<"idle" | "loading" | "sukses" | "error">("idle");
  const [pesanError, setPesanError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setPesanError("");

    const { error } = await supabase.from("leads").insert({
      jenis,
      nama,
      no_wa: noWa,
      alamat: alamat || null,
      catatan: catatan || null,
      kos_room_id: roomId || null,
    });

    if (error) {
      setStatus("error");
      setPesanError(error.message);
      return;
    }
    setStatus("sukses");
  }

  if (status === "sukses") {
    return (
      <div className="card text-center">
        <h2 className="font-display text-xl font-semibold text-teal-600">
          Pendaftaran diterima
        </h2>
        <p className="mt-2 text-ink/70">
          Terima kasih, {nama}. Pesanan Anda sudah masuk ke admin kami dan akan
          segera diproses. Tim kami akan menghubungi WhatsApp {noWa} untuk
          langkah selanjutnya.
        </p>
        <a
          href={`https://wa.me/${noWa.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="btn-outline mt-6"
        >
          Lanjut Ngobrol via WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      {kamarLabel && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          Anda memesan Kamar {kamarLabel}. Lengkapi data di bawah untuk melanjutkan.
        </p>
      )}
      <div>
        <label className="label">Saya tertarik dengan</label>
        <div className="grid grid-cols-3 gap-2">
          {PILIHAN.map((p) => (
            <button
              type="button"
              key={p.value}
              disabled={!!roomId}
              onClick={() => setJenis(p.value)}
              className={
                "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors " +
                (jenis === p.value
                  ? "border-teal-500 bg-teal-50 text-teal-600"
                  : "border-teal-100 text-ink/60 hover:border-teal-300")
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="nama">
          Nama lengkap
        </label>
        <input
          id="nama"
          required
          className="input"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="wa">
          Nomor WhatsApp
        </label>
        <input
          id="wa"
          required
          type="tel"
          inputMode="numeric"
          className="input"
          placeholder="08xxxxxxxxxx"
          value={noWa}
          onChange={(e) => setNoWa(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="alamat">
          Alamat / area (opsional)
        </label>
        <input
          id="alamat"
          className="input"
          placeholder="Contoh: dekat Jalan Merdeka"
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="catatan">
          Catatan (opsional)
        </label>
        <textarea
          id="catatan"
          className="input"
          rows={3}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          Gagal mendaftar: {pesanError}
        </p>
      )}

      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Mengirim..." : "Daftar Sekarang"}
      </button>
    </form>
  );
}

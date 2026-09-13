"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PesanAirForm() {
  const supabase = createClient();
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [catatan, setCatatan] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sukses" | "error">("idle");
  const [pesanError, setPesanError] = useState("");

  async function ambilLokasiOtomatis() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLokasi(`https://maps.google.com/?q=${latitude},${longitude}`);
      },
      () => {
        // biarkan user isi manual kalau ditolak
      }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setPesanError("");

    const { error } = await supabase.from("water_orders").insert({
      nama,
      no_wa: noWa,
      lokasi_maps: lokasi,
      jumlah_galon: jumlah,
      catatan: catatan || null,
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
          Pesanan diterima
        </h2>
        <p className="mt-2 text-ink/70">
          Terima kasih, {nama}. Tim depot akan memproses pesanan {jumlah} galon
          Anda dan kurir akan menghubungi WhatsApp {noWa} sebelum berangkat.
        </p>
        <a
          href={`https://wa.me/${noWa.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="btn-outline mt-6"
        >
          Konfirmasi lewat WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="nama">
          Nama
        </label>
        <input
          id="nama"
          required
          className="input"
          placeholder="Nama penerima"
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
        <label className="label" htmlFor="jumlah">
          Jumlah galon
        </label>
        <input
          id="jumlah"
          required
          type="number"
          min={1}
          max={20}
          className="input"
          value={jumlah}
          onChange={(e) => setJumlah(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="label" htmlFor="lokasi">
          Share lokasi (Google Maps)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="lokasi"
            required
            className="input"
            placeholder="Tempel link share lokasi Google Maps"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
          />
          <button
            type="button"
            onClick={ambilLokasiOtomatis}
            className="btn-outline whitespace-nowrap"
          >
            Pakai lokasi saya
          </button>
        </div>
        <p className="mt-1.5 text-xs text-ink/50">
          Di Google Maps: tekan lama titik lokasi Anda → Bagikan → salin link, lalu tempel di sini.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="catatan">
          Catatan (opsional)
        </label>
        <textarea
          id="catatan"
          className="input"
          rows={3}
          placeholder="Contoh: rumah pagar hijau, titip di depan"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          Pesanan gagal dikirim: {pesanError}
        </p>
      )}

      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Mengirim..." : "Kirim Pesanan"}
      </button>
    </form>
  );
}

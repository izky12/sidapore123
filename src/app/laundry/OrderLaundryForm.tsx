"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LayananLaundry, MetodeAmbil, MetodeBayar, BayarSaat } from "@/lib/types";

export default function OrderLaundryForm({ layananList }: { layananList: LayananLaundry[] }) {
  const supabase = createClient();

  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [layananId, setLayananId] = useState(layananList[0]?.id ?? "");
  const [metodeAmbil, setMetodeAmbil] = useState<MetodeAmbil>("antar_sendiri");
  const [lokasiJemput, setLokasiJemput] = useState("");
  const [antarKembali, setAntarKembali] = useState(false);
  const [metodeBayar, setMetodeBayar] = useState<MetodeBayar>("tunai");
  const [bayarSaat, setBayarSaat] = useState<BayarSaat>("antar");
  const [catatan, setCatatan] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "sukses" | "error">("idle");
  const [pesanError, setPesanError] = useState("");

  const antarJemput = metodeAmbil === "dijemput" ? true : antarKembali;

  function ambilLokasiOtomatis() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLokasiJemput(`https://maps.google.com/?q=${latitude},${longitude}`);
      },
      () => {}
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (metodeAmbil === "dijemput" && !lokasiJemput) {
      setStatus("error");
      setPesanError("Share lokasi jemput dulu ya.");
      return;
    }
    setStatus("loading");
    setPesanError("");

    const layanan = layananList.find((l) => l.id === layananId);

    const { error } = await supabase.from("laundry_orders").insert({
      nama,
      no_wa: noWa,
      jenis_layanan: layanan?.nama ?? "Cuci + Setrika",
      layanan_id: layananId || null,
      metode_ambil: metodeAmbil,
      lokasi_jemput: metodeAmbil === "dijemput" ? lokasiJemput : null,
      antar_jemput: antarJemput,
      metode_bayar: metodeBayar,
      bayar_saat: metodeBayar === "tunai" && antarJemput ? bayarSaat : null,
      jemput_selesai: metodeAmbil === "antar_sendiri",
      via_online: true,
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
        <h2 className="font-display text-xl font-semibold text-teal-600">Pesanan diterima</h2>
        <p className="mt-2 text-ink/70">
          Terima kasih, {nama}. Tim laundry akan segera memproses pesanan Anda
          {metodeAmbil === "dijemput" ? " dan mengarahkan kurir untuk menjemput" : ""}.
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
        <label className="label" htmlFor="nama">Nama</label>
        <input id="nama" required className="input" placeholder="Nama Anda" value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="wa">Nomor WhatsApp</label>
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
        <label className="label" htmlFor="layanan">Jenis layanan</label>
        <select id="layanan" required className="input" value={layananId} onChange={(e) => setLayananId(e.target.value)}>
          {layananList.length === 0 && <option value="">Cuci + Setrika</option>}
          {layananList.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nama}
              {l.harga ? ` — Rp${l.harga.toLocaleString("id-ID")}/${l.satuan}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="label">Cucian mau bagaimana?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMetodeAmbil("dijemput")}
            className={
              "rounded-lg border px-3 py-2.5 text-sm font-medium " +
              (metodeAmbil === "dijemput" ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
            }
          >
            Dijemput Kurir
          </button>
          <button
            type="button"
            onClick={() => setMetodeAmbil("antar_sendiri")}
            className={
              "rounded-lg border px-3 py-2.5 text-sm font-medium " +
              (metodeAmbil === "antar_sendiri" ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
            }
          >
            Antar Sendiri
          </button>
        </div>
      </div>

      {metodeAmbil === "dijemput" && (
        <div>
          <label className="label" htmlFor="lokasi">Share lokasi jemput (Google Maps)</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="lokasi"
              required
              className="input"
              placeholder="Tempel link share lokasi Google Maps"
              value={lokasiJemput}
              onChange={(e) => setLokasiJemput(e.target.value)}
            />
            <button type="button" onClick={ambilLokasiOtomatis} className="btn-outline whitespace-nowrap">
              Pakai lokasi saya
            </button>
          </div>
          <p className="mt-1.5 text-xs text-ink/50">
            Kurir akan menjemput ke lokasi ini, mencuci, dan mengantar kembali setelah selesai. Ongkir ditentukan tim laundry.
          </p>
        </div>
      )}

      {metodeAmbil === "antar_sendiri" && (
        <div className="flex items-center gap-2">
          <input
            id="antarKembali"
            type="checkbox"
            className="h-4 w-4"
            checked={antarKembali}
            onChange={(e) => setAntarKembali(e.target.checked)}
          />
          <label htmlFor="antarKembali" className="text-sm text-ink/70">
            Antar cucian sendiri, tapi minta diantar kurir setelah selesai (+ongkir)
          </label>
        </div>
      )}

      <div>
        <p className="label">Metode bayar</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMetodeBayar("digital")}
            className={
              "rounded-lg border px-3 py-2.5 text-sm font-medium " +
              (metodeBayar === "digital" ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
            }
          >
            QRIS
          </button>
          <button
            type="button"
            onClick={() => setMetodeBayar("tunai")}
            className={
              "rounded-lg border px-3 py-2.5 text-sm font-medium " +
              (metodeBayar === "tunai" ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
            }
          >
            Bayar di Kurir
          </button>
        </div>
        {metodeBayar === "digital" && (
          <p className="mt-1.5 text-xs text-ink/50">Kode QRIS akan dikonfirmasi tim laundry lewat WhatsApp.</p>
        )}
      </div>

      {metodeBayar === "tunai" && antarJemput && (
        <div>
          <p className="label">Bayar kapan?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBayarSaat("jemput")}
              className={
                "rounded-lg border px-3 py-2.5 text-sm font-medium " +
                (bayarSaat === "jemput" ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
              }
            >
              Saat Dijemput
            </button>
            <button
              type="button"
              onClick={() => setBayarSaat("antar")}
              className={
                "rounded-lg border px-3 py-2.5 text-sm font-medium " +
                (bayarSaat === "antar" ? "border-teal-500 bg-teal-100 text-teal-700" : "border-teal-100 text-ink/60")
              }
            >
              Saat Laundry Diantar Selesai
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="catatan">Catatan (opsional)</label>
        <textarea id="catatan" className="input" rows={3} placeholder="Contoh: rumah pagar hijau" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">Pesanan gagal dikirim: {pesanError}</p>
      )}

      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Mengirim..." : "Kirim Pesanan"}
      </button>
    </form>
  );
}

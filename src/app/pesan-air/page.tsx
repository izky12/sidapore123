import type { Metadata } from "next";
import PesanAirForm from "./PesanAirForm";

export const metadata: Metadata = {
  title: "Pesan Air Galon",
  description:
    "Pesan isi ulang galon Sidapore. Isi nama, nomor WhatsApp, dan share lokasi Google Maps — kurir kami antar sampai depan pintu.",
};

export default function PesanAirPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Pesan Air Galon</h1>
      <p className="mt-2 text-ink/60">
        Isi form di bawah, tim depot akan segera memproses pesanan Anda.
      </p>
      <div className="mt-8">
        <PesanAirForm />
      </div>
    </main>
  );
}

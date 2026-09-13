import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { LayananLaundry } from "@/lib/types";
import OrderLaundryForm from "./OrderLaundryForm";

export const metadata: Metadata = {
  title: "Pesan Laundry",
  description:
    "Pesan laundry Sidapore online. Pilih dijemput kurir atau antar sendiri, pilih metode bayar QRIS atau bayar di kurir.",
};

export default async function LaundryOrderPage() {
  const supabase = createClient();
  const { data: layanan } = await supabase
    .from("layanan_laundry")
    .select("*")
    .eq("aktif", true)
    .order("urutan", { ascending: true });

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Pesan Laundry</h1>
      <p className="mt-2 text-ink/60">
        Isi form di bawah. Tim laundry kami akan memproses pesanan Anda.
      </p>
      <div className="mt-8">
        <OrderLaundryForm layananList={(layanan ?? []) as LayananLaundry[]} />
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewLaundryOrder() {
  const supabase = createClient();
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [jenis, setJenis] = useState("Cuci + Setrika");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("laundry_orders").insert({ nama, no_wa: noWa, jenis_layanan: jenis });
    setLoading(false);
    setNama("");
    setNoWa("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Nama pelanggan</label>
        <input required className="input w-48" value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>
      <div>
        <label className="label">No. WA</label>
        <input required className="input w-40" value={noWa} onChange={(e) => setNoWa(e.target.value)} />
      </div>
      <div>
        <label className="label">Jenis layanan</label>
        <input className="input w-48" value={jenis} onChange={(e) => setJenis(e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Menyimpan..." : "Tambah Pesanan"}
      </button>
    </form>
  );
}

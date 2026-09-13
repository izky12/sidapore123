"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUS_LABEL } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

const JENIS_LABEL: Record<Lead["jenis"], string> = {
  kos: "Kos-kosan",
  laundry: "Laundry",
  depot: "Depot Air",
};

export default function LeadList({ leads }: { leads: Lead[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateStatus(lead: Lead, status: LeadStatus) {
    setSavingId(lead.id);

    // kalau kamar kos di-deal-kan: buat data penyewa otomatis (sekali saja),
    // kamar akan ikut ditandai "terisi" otomatis oleh trigger database.
    // Setelah ini admin tinggal buka menu "Kelola Kamar" > Data Penyewa
    // untuk mencatat pembayaran saat penyewa bayar di tempat.
    if (status === "deal" && lead.jenis === "kos" && lead.kos_room_id) {
      const { data: sudahAda } = await supabase
        .from("kos_tenants")
        .select("id")
        .eq("dari_lead_id", lead.id)
        .maybeSingle();

      if (!sudahAda) {
        const { data: room } = await supabase
          .from("kos_rooms")
          .select("no_kamar, harga_bulanan, status")
          .eq("id", lead.kos_room_id)
          .single();

        if (room && room.status === "terisi") {
          alert("Kamar ini sudah ditempati penyewa lain. Batal ditandai Deal — cek dulu di menu Kelola Kamar.");
          setSavingId(null);
          return;
        }

        if (room) {
          const { error } = await supabase.from("kos_tenants").insert({
            nama: lead.nama,
            no_wa: lead.no_wa,
            no_kamar: room.no_kamar,
            room_id: lead.kos_room_id,
            harga_bulanan: room.harga_bulanan,
            dari_lead_id: lead.id,
          });
          if (error) {
            alert("Gagal membuat data penyewa: " + error.message);
            setSavingId(null);
            return;
          }
        }
      }
    }

    await supabase.from("leads").update({ status }).eq("id", lead.id);

    // kalau lead kos yang sudah Deal dibatalkan, nonaktifkan penyewanya juga
    // (kamar otomatis balik "tersedia" lewat trigger) — riwayat bayar tetap aman.
    if (status === "batal" && lead.jenis === "kos") {
      await supabase
        .from("kos_tenants")
        .update({ status: "nonaktif" })
        .eq("dari_lead_id", lead.id)
        .eq("status", "aktif");
    }

    setSavingId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <ScrollHint />
      <table className="w-full text-left text-sm">
        <thead className="text-ink/50">
          <tr>
            <th className="py-2 pr-4">Jenis</th>
            <th className="py-2 pr-4">Nama</th>
            <th className="py-2 pr-4">WA</th>
            <th className="py-2 pr-4">Detail</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-teal-50 align-top">
              <td className="py-3 pr-4">
                <span className="badge bg-teal-50 text-teal-600">{JENIS_LABEL[l.jenis]}</span>
              </td>
              <td className="py-3 pr-4 font-medium">{l.nama}</td>
              <td className="py-3 pr-4">
                <a
                  href={`https://wa.me/${l.no_wa.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-600 hover:underline"
                >
                  {l.no_wa}
                </a>
              </td>
              <td className="py-3 pr-4 text-ink/70">
                {l.kos_rooms?.no_kamar && <p>Kamar {l.kos_rooms.no_kamar}</p>}
                {l.alamat && <p>{l.alamat}</p>}
                {l.catatan && <p className="text-xs text-ink/50">{l.catatan}</p>}
              </td>
              <td className="py-3 pr-4">
                <select
                  className="input w-40 py-1.5"
                  value={l.status}
                  disabled={savingId === l.id}
                  onChange={(e) => updateStatus(l, e.target.value as LeadStatus)}
                >
                  {Object.entries(LEAD_STATUS_LABEL).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-ink/40">
                Belum ada pendaftaran masuk.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

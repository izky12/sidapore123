"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LaundryOrder, Profile } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

export default function LaundryList({
  orders,
  staffList,
  kurirList,
}: {
  orders: LaundryOrder[];
  staffList: Profile[];
  kurirList: Profile[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateOrder(id: string, patch: Partial<LaundryOrder>) {
    setSavingId(id);
    await supabase.from("laundry_orders").update(patch).eq("id", id);
    setSavingId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <ScrollHint />
      <table className="w-full text-left text-sm">
        <thead className="text-ink/50">
          <tr>
            <th className="py-2 pr-4">Pelanggan</th>
            <th className="py-2 pr-4">WA</th>
            <th className="py-2 pr-4">Layanan</th>
            <th className="py-2 pr-4">Ambil</th>
            <th className="py-2 pr-4">Berat (kg)</th>
            <th className="py-2 pr-4">Harga (Rp)</th>
            <th className="py-2 pr-4">Antar-Jemput</th>
            <th className="py-2 pr-4">Ongkir (Rp)</th>
            <th className="py-2 pr-4">Kurir Jemput</th>
            <th className="py-2 pr-4">Kurir Antar</th>
            <th className="py-2 pr-4">Staff</th>
            <th className="py-2 pr-4">Pembayaran</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-teal-50 align-top">
              <td className="py-3 pr-4 font-medium">{o.nama}</td>
              <td className="py-3 pr-4">{o.no_wa}</td>
              <td className="py-3 pr-4">{o.jenis_layanan}</td>
              <td className="py-3 pr-4">
                {o.metode_ambil === "dijemput" ? (
                  <div>
                    <span className="badge bg-amber-400/20 text-amber-500">Dijemput</span>
                    {o.lokasi_jemput && (
                      <a href={o.lokasi_jemput} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-teal-600 hover:underline">
                        Lihat lokasi
                      </a>
                    )}
                    <p className="mt-1 text-xs text-ink/40">{o.jemput_selesai ? "Sudah dijemput" : "Belum dijemput"}</p>
                  </div>
                ) : (
                  <span className="badge bg-ink/5 text-ink/50">Antar sendiri</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <input
                  type="number"
                  defaultValue={o.berat_kg ?? ""}
                  className="input w-20 py-1.5"
                  onBlur={(e) => updateOrder(o.id, { berat_kg: e.target.value ? Number(e.target.value) : null })}
                />
              </td>
              <td className="py-3 pr-4">
                <input
                  type="number"
                  defaultValue={o.harga ?? ""}
                  className="input w-28 py-1.5"
                  onBlur={(e) => updateOrder(o.id, { harga: e.target.value ? Number(e.target.value) : null })}
                />
              </td>
              <td className="py-3 pr-4">
                <input
                  type="checkbox"
                  defaultChecked={o.antar_jemput}
                  className="h-4 w-4"
                  onChange={(e) => updateOrder(o.id, { antar_jemput: e.target.checked })}
                />
              </td>
              <td className="py-3 pr-4">
                <input
                  type="number"
                  defaultValue={o.ongkir ?? 0}
                  className="input w-24 py-1.5"
                  onBlur={(e) => updateOrder(o.id, { ongkir: e.target.value ? Number(e.target.value) : 0 })}
                />
              </td>
              <td className="py-3 pr-4">
                {o.metode_ambil === "dijemput" ? (
                  <select
                    className="input w-36 py-1.5"
                    defaultValue={o.assigned_kurir_jemput_id ?? ""}
                    onChange={(e) => updateOrder(o.id, { assigned_kurir_jemput_id: e.target.value || null })}
                  >
                    <option value="">Belum ditugaskan</option>
                    {kurirList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-ink/30">—</span>
                )}
              </td>
              <td className="py-3 pr-4">
                {o.antar_jemput ? (
                  <select
                    className="input w-36 py-1.5"
                    defaultValue={o.assigned_kurir_id ?? ""}
                    onChange={(e) => updateOrder(o.id, { assigned_kurir_id: e.target.value || null })}
                  >
                    <option value="">Belum ditugaskan</option>
                    {kurirList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-ink/30">—</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <select
                  className="input w-40 py-1.5"
                  defaultValue={o.assigned_staff_id ?? ""}
                  onChange={(e) => updateOrder(o.id, { assigned_staff_id: e.target.value || null })}
                >
                  <option value="">Belum ditugaskan</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 pr-4">
                {o.dibayar ? (
                  <span className="badge bg-teal-50 text-teal-600">
                    {o.metode_bayar === "tunai" ? "Tunai" : "Digital"}
                  </span>
                ) : (
                  <span className="badge bg-ink/5 text-ink/40">Belum bayar</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <select
                  className="input w-32 py-1.5"
                  value={o.status}
                  disabled={savingId === o.id}
                  onChange={(e) => updateOrder(o.id, { status: e.target.value as LaundryOrder["status"] })}
                >
                  {Object.entries(STATUS_LABEL).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={13} className="py-6 text-center text-ink/40">
                Belum ada pesanan laundry.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

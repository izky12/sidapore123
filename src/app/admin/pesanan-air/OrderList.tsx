"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { WaterOrder, Profile } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

export default function OrderList({ orders, kurirList }: { orders: WaterOrder[]; kurirList: Profile[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateOrder(id: string, patch: Partial<WaterOrder>) {
    setSavingId(id);
    await supabase.from("water_orders").update(patch).eq("id", id);
    setSavingId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <ScrollHint />
      <table className="w-full text-left text-sm">
        <thead className="text-ink/50">
          <tr>
            <th className="py-2 pr-4">Pemesan</th>
            <th className="py-2 pr-4">WA</th>
            <th className="py-2 pr-4">Galon</th>
            <th className="py-2 pr-4">Lokasi</th>
            <th className="py-2 pr-4">Harga (Rp)</th>
            <th className="py-2 pr-4">Kurir</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-teal-50 align-top">
              <td className="py-3 pr-4 font-medium">{o.nama}</td>
              <td className="py-3 pr-4">{o.no_wa}</td>
              <td className="py-3 pr-4">{o.jumlah_galon}</td>
              <td className="py-3 pr-4">
                <a href={o.lokasi_maps} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
                  Buka peta
                </a>
              </td>
              <td className="py-3 pr-4">
                <input
                  type="number"
                  defaultValue={o.harga ?? ""}
                  placeholder="0"
                  className="input w-28 py-1.5"
                  onBlur={(e) => updateOrder(o.id, { harga: e.target.value ? Number(e.target.value) : null })}
                />
              </td>
              <td className="py-3 pr-4">
                <select
                  className="input w-40 py-1.5"
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
              </td>
              <td className="py-3 pr-4">
                <select
                  className="input w-32 py-1.5"
                  value={o.status}
                  disabled={savingId === o.id}
                  onChange={(e) => updateOrder(o.id, { status: e.target.value as WaterOrder["status"] })}
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
              <td colSpan={7} className="py-6 text-center text-ink/40">
                Belum ada pesanan air.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ROOM_STATUS_LABEL, type KosRoom } from "@/lib/types";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const STATUS_STYLE: Record<KosRoom["status"], string> = {
  tersedia: "bg-teal-50 text-teal-600",
  terisi: "bg-red-50 text-red-500",
  maintenance: "bg-amber-50 text-amber-600",
};

export default function KamarRealtime({ initialRooms }: { initialRooms: KosRoom[] }) {
  const [rooms, setRooms] = useState<KosRoom[]>(initialRooms);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("kos_rooms_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kos_rooms" },
        (payload) => {
          setRooms((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== (payload.old as KosRoom).id);
            }
            const next = payload.new as KosRoom;
            const exists = prev.some((r) => r.id === next.id);
            const updated = exists ? prev.map((r) => (r.id === next.id ? next : r)) : [...prev, next];
            return updated.sort((a, b) => a.no_kamar.localeCompare(b.no_kamar));
          });
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const tersedia = rooms.filter((r) => r.status === "tersedia").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink/60">
          <span className="font-semibold text-teal-600">{tersedia}</span> dari {rooms.length} kamar tersedia
        </p>
        <span className={"text-xs font-medium " + (live ? "text-teal-600" : "text-ink/40")}>
          {live ? "● Terhubung realtime" : "Menghubungkan..."}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((r) => (
          <div key={r.id} className="card flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-lg font-bold text-ink">Kamar {r.no_kamar}</p>
              {r.tipe && <p className="text-sm text-ink/60">{r.tipe}</p>}
              {r.fasilitas && <p className="mt-1 text-xs text-ink/50">{r.fasilitas}</p>}
              <p className="mt-2 text-sm font-medium text-ink">{formatRupiah(r.harga_bulanan)} / bulan</p>
              <span className={"badge mt-2 inline-block " + STATUS_STYLE[r.status]}>{ROOM_STATUS_LABEL[r.status]}</span>
            </div>
            {r.status === "tersedia" ? (
              <Link
                href={`/daftar?jenis=kos&room=${r.id}&kamar=${encodeURIComponent(r.no_kamar)}`}
                className="btn-amber shrink-0 text-center"
              >
                Pesan Kamar Ini
              </Link>
            ) : (
              <button disabled className="btn-outline shrink-0 cursor-not-allowed opacity-50">
                Tidak Tersedia
              </button>
            )}
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="col-span-2 py-10 text-center text-ink/40">Belum ada kamar terdaftar.</p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserRole } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";
import ScrollHint from "@/components/ScrollHint";

const ROLE_OPTIONS: UserRole[] = ["staff_depot", "staff_laundry", "kurir", "admin"];

export default function StaffManager({ staff }: { staff: Profile[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("staff_depot");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone, email, password, role }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Gagal membuat akun staff");
      return;
    }

    setFullName("");
    setPhone("");
    setEmail("");
    setPassword("");
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/admin/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    router.refresh();
  }

  async function hapusUser(id: string, nama: string) {
    if (!confirm(`Hapus akun "${nama}" secara permanen? Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await fetch("/api/admin/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error ?? "Gagal menghapus akun");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={submit} className="card h-fit space-y-4">
        <h2 className="font-display text-lg font-semibold text-ink">Tambah Akun Staff</h2>

        <div>
          <label className="label">Nama lengkap</label>
          <input required className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">No. WhatsApp</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Email (untuk login)</label>
          <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password awal</label>
          <input required type="password" minLength={6} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Membuat..." : "Buat Akun"}
        </button>
      </form>

      <div className="card">
        <h2 className="font-display text-lg font-semibold text-ink">Daftar Staff</h2>
        <div className="mt-4 overflow-x-auto">
          <ScrollHint />
          <table className="w-full text-left text-sm">
            <thead className="text-ink/50">
              <tr>
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">WhatsApp</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-teal-50">
                  <td className="py-2 pr-4 font-medium">{s.full_name}</td>
                  <td className="py-2 pr-4">{s.phone ?? "-"}</td>
                  <td className="py-2 pr-4">
                    <span className="badge bg-teal-50 text-teal-600">{ROLE_LABEL[s.role]}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={"badge " + (s.active ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-500")}>
                      {s.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleActive(s.id, s.active)}
                        className="text-sm font-medium text-teal-600 hover:underline"
                      >
                        {s.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => hapusUser(s.id, s.full_name)}
                        className="text-sm font-medium text-red-500 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-ink/40">
                    Belum ada staff.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

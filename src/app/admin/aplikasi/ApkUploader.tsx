"use client";

import { useEffect, useState } from "react";

type Release = {
  url: string;
  version_label: string | null;
  original_name: string;
  size_bytes: number;
  created_at: string;
} | null;

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function ApkUploader() {
  const [release, setRelease] = useState<Release>(null);
  const [loadingRelease, setLoadingRelease] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  function loadRelease() {
    setLoadingRelease(true);
    fetch("/api/apk")
      .then((r) => r.json())
      .then((d) => setRelease(d.release ?? null))
      .catch(() => {})
      .finally(() => setLoadingRelease(false));
  }

  useEffect(() => {
    loadRelease();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    if (versionLabel.trim()) formData.append("version_label", versionLabel.trim());

    const res = await fetch("/api/admin/apk", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setMsg({ type: "error", text: data.error ?? "Gagal upload" });
      return;
    }
    setMsg({ type: "ok", text: "Berhasil diupload. Pelanggan sekarang akan mengunduh versi ini." });
    setFile(null);
    setVersionLabel("");
    loadRelease();
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-sm font-medium text-ink/70">Versi yang aktif sekarang</p>
        {loadingRelease ? (
          <p className="mt-1 text-sm text-ink/40">Memuat...</p>
        ) : release ? (
          <div className="mt-1 space-y-1">
            <p className="font-medium text-ink">
              {release.version_label ? `v${release.version_label}` : release.original_name} · {formatSize(release.size_bytes)}
            </p>
            <p className="text-xs text-ink/50">Diupload {formatTanggal(release.created_at)}</p>
            <a href={release.url} target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:underline">
              Buka link download
            </a>
          </div>
        ) : (
          <p className="mt-1 text-sm text-ink/40">Belum ada APK yang diupload.</p>
        )}
      </div>

      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div>
          <label className="label">File APK (.apk)</label>
          <input
            type="file"
            accept=".apk"
            required
            className="input py-1.5"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="label">Label versi (opsional, contoh: 1.2.0)</label>
          <input
            type="text"
            className="input"
            placeholder="1.2.0"
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
          />
        </div>

        {msg && <p className={"text-sm " + (msg.type === "error" ? "text-red-500" : "text-teal-600")}>{msg.text}</p>}

        <button type="submit" disabled={uploading || !file} className="btn-primary self-start">
          {uploading ? "Mengupload..." : "Upload & Aktifkan"}
        </button>
        <p className="text-xs text-ink/40">
          Rilis lama tidak dihapus (tetap tersimpan), tapi link download di seluruh situs otomatis
          mengarah ke rilis terbaru begitu upload selesai.
        </p>
      </form>
    </div>
  );
}

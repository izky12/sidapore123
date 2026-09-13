"use client";

import { useEffect, useState } from "react";

export default function SeoSettings() {
  const [snippet, setSnippet] = useState("");
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/seo")
      .then((r) => r.json())
      .then((d) => setSnippet(d.value ?? ""))
      .catch(() => {});
  }, []);

  async function save() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snippet }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMsg({ type: "error", text: data.error ?? "Gagal menyimpan" });
      return;
    }
    setMsg({ type: "ok", text: "Tersimpan." });
  }

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-ink/70">Kode verifikasi dari Google</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-teal-100 px-3 py-2 text-sm font-mono"
          rows={3}
          placeholder='<meta name="google-site-verification" content="..." />'
          value={snippet}
          onChange={(e) => setSnippet(e.target.value)}
        />
      </div>

      <p className="text-xs text-ink/40">
        Halaman ini hanya bisa diakses admin yang sudah login — tidak perlu kunci tambahan lagi.
      </p>

      {msg && (
        <p className={"text-sm " + (msg.type === "error" ? "text-red-500" : "text-teal-600")}>{msg.text}</p>
      )}

      <button
        onClick={save}
        disabled={loading}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 self-start"
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  );
}

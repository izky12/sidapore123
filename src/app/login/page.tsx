"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const errParam = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    errParam === "nonaktif" ? "Akun Anda dinonaktifkan. Hubungi admin." : ""
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const redirect = params.get("redirect");
    if (redirect) {
      router.push(redirect);
    } else if (profile?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/staff");
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Masuk..." : "Masuk"}
      </button>
      <Link
        href="/"
        className="block w-full rounded-lg border border-teal-100 py-2.5 text-center text-sm font-medium text-ink/70 hover:bg-teal-50"
      >
        ← Kembali ke Beranda
      </Link>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <img src="/icons/icon-192.png" alt="Sidapore" className="mb-4 h-14 w-14 rounded-xl" />
      <h1 className="font-display text-2xl font-bold text-ink">Masuk Sidapore</h1>
      <p className="mt-2 text-sm text-ink/60">
        Untuk admin, staff depot, staff laundry, dan kurir.
      </p>
      <div className="mt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

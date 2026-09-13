import type { Metadata } from "next";
import { Suspense } from "react";
import DaftarForm from "./DaftarForm";

export const metadata: Metadata = {
  title: "Daftar Pelanggan Baru",
  description:
    "Daftar sebagai pelanggan baru Sidapore untuk kos-kosan, laundry, atau depot isi ulang air.",
};

export default function DaftarPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">
        Daftar Pelanggan Baru
      </h1>
      <p className="mt-2 text-ink/60">
        Untuk kos-kosan, laundry, atau depot isi ulang air Sidapore.
      </p>
      <div className="mt-8">
        <Suspense>
          <DaftarForm />
        </Suspense>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Ringkasan & Keuangan" },
  { href: "/admin/panduan", label: "📘 Cara Pakai" },
  { href: "/admin/pendaftaran", label: "Pendaftaran Masuk" },
  { href: "/admin/pesanan-air", label: "Pesanan Air" },
  { href: "/admin/laundry", label: "Laundry" },
  { href: "/admin/layanan-laundry", label: "Jenis Layanan Laundry" },
  { href: "/admin/kas-harian", label: "Verifikasi Kas Harian" },
  { href: "/admin/kos", label: "Kos-kosan" },
  { href: "/admin/lokasi", label: "Lokasi Layanan" },
  { href: "/admin/struk", label: "Pengaturan Struk" },
  { href: "/admin/aplikasi", label: "📱 Aplikasi (APK)" },
  { href: "/admin/staff", label: "Staff & Role" },
  { href: "/admin/seo", label: "Verifikasi SEO" },
];

export default function AdminNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center gap-2.5">
          <img src="/icons/icon-192.png" alt="Sidapore" className="h-9 w-9 rounded-lg" />
          <div>
            <p className="font-display text-lg font-bold">Sidapore</p>
            <p className="text-xs text-teal-100/80">Panel Admin</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Buka menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-teal-600 md:hidden"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      <nav className={`${open ? "flex" : "hidden"} flex-col gap-1 px-3 pb-4 md:flex md:pb-6`}>
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={
                "whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium " +
                (active ? "bg-teal-600 text-white" : "text-teal-50 hover:bg-teal-600")
              }
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Modal from "./Modal";
import type { UserRole } from "@/lib/types";

type Item = { href: string; label: string; icon: React.ReactNode };

const ICON = {
  home: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L22.28 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  ),
  droplet: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c3 4 6 7.5 6 11a6 6 0 11-12 0c0-3.5 3-7 6-11z" />
  ),
  bed: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18v-9a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 9v9M3.75 18h16.5M3.75 18v2.25M20.25 18v2.25M6 12.75h4.5v-3A1.5 1.5 0 009 8.25H7.5A1.5 1.5 0 006 9.75v3z" />
  ),
  shirt: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75L5.25 6l1.5 3-2.25 1.5v9.75h15V10.5L17.25 9l1.5-3-3-2.25-3.75 1.875L8.25 3.75z" />
  ),
  clipboard: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75h6a1.5 1.5 0 011.5 1.5v.75h1.5A1.5 1.5 0 0119.5 7.5v12A1.5 1.5 0 0118 21H6a1.5 1.5 0 01-1.5-1.5v-12A1.5 1.5 0 016 6h1.5V5.25a1.5 1.5 0 011.5-1.5zM9 9.75h6M9 13.5h6M9 17.25h3.75" />
  ),
  wallet: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5v-9zM3 9.75h18M15.75 14.25h2.25" />
  ),
  truck: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h9v9h-9v-9zM12.75 10.5h3.75l3 3v2.25h-6.75v-5.25zM6.75 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.25 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
  ),
  userPlus: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.5a4.5 4.5 0 00-9 0M10.5 11.25a3 3 0 100-6 3 3 0 000 6zM18.75 9v4.5m2.25-2.25h-4.5" />
  ),
  more: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM21 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  ),
};

function Icon({ path, active }: { path: React.ReactNode; active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      className="h-6 w-6"
    >
      {path}
    </svg>
  );
}

function NavLink({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={
        "flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium " +
        (active ? "text-teal-700" : "text-ink/45")
      }
    >
      <Icon path={item.icon} active={active} />
      {item.label}
    </Link>
  );
}

const PUBLIC_ITEMS: Item[] = [
  { href: "/", label: "Home", icon: ICON.home },
  { href: "/pesan-air", label: "Air", icon: ICON.droplet },
  { href: "/kamar", label: "Kos", icon: ICON.bed },
  { href: "/laundry", label: "Laundry", icon: ICON.shirt },
  { href: "/daftar", label: "Daftar", icon: ICON.userPlus },
];

const ADMIN_PRIMARY: Item[] = [
  { href: "/admin", label: "Ringkasan", icon: ICON.home },
  { href: "/admin/pendaftaran", label: "Daftar", icon: ICON.userPlus },
  { href: "/admin/pesanan-air", label: "Air", icon: ICON.droplet },
  { href: "/admin/laundry", label: "Laundry", icon: ICON.shirt },
];

const ADMIN_MORE: Item[] = [
  { href: "/admin/kos", label: "Kos-kosan", icon: ICON.bed },
  { href: "/admin/layanan-laundry", label: "Jenis Layanan Laundry", icon: ICON.shirt },
  { href: "/admin/kas-harian", label: "Verifikasi Kas Harian", icon: ICON.wallet },
  { href: "/admin/lokasi", label: "Lokasi Layanan", icon: ICON.truck },
  { href: "/admin/struk", label: "Pengaturan Struk", icon: ICON.clipboard },
  { href: "/admin/staff", label: "Staff & Role", icon: ICON.userPlus },
  { href: "/admin/aplikasi", label: "Aplikasi (APK)", icon: ICON.clipboard },
  { href: "/admin/seo", label: "Verifikasi SEO", icon: ICON.clipboard },
  { href: "/admin/panduan", label: "Cara Pakai", icon: ICON.clipboard },
];

export default function BottomNav({ role }: { role: UserRole | null | undefined }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  if (pathname === "/login") {
    // halaman login sudah punya tombol "Kembali ke Beranda" sendiri
    return null;
  }

  const isAdmin = pathname.startsWith("/admin");
  const isStaff = pathname.startsWith("/staff");

  let items: Item[];
  let moreItems: Item[] | null = null;

  if (isAdmin) {
    items = ADMIN_PRIMARY;
    moreItems = ADMIN_MORE;
  } else if (isStaff) {
    const staffItems: Item[] = [{ href: "/staff", label: "Tugas", icon: ICON.clipboard }];
    if (role === "staff_depot" || role === "staff_laundry") {
      staffItems.push({ href: "/staff/kasir", label: "Kasir", icon: ICON.wallet });
    }
    if (role === "staff_depot" || role === "staff_laundry" || role === "kurir") {
      staffItems.push({ href: "/staff/setor-kas", label: "Setor Kas", icon: ICON.truck });
    }
    items = staffItems;
  } else {
    items = PUBLIC_ITEMS;
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-teal-100 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
          />
        ))}
        {moreItems && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium text-ink/45"
          >
            <Icon path={ICON.more} active={false} />
            Lainnya
          </button>
        )}
      </nav>

      {moreOpen && moreItems && (
        <Modal title="Menu Lainnya" onClose={() => setMoreOpen(false)}>
          <div className="grid grid-cols-3 gap-3">
            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-teal-100 px-2 py-3 text-center text-xs font-medium text-ink/70 hover:bg-teal-50"
              >
                <Icon path={item.icon} active={false} />
                {item.label}
              </Link>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

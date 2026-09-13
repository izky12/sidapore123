import type { Metadata, Viewport } from "next";
import "./globals.css";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/getProfile";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallAppBanner from "@/components/InstallAppBanner";
import BottomNav from "@/components/BottomNav";

export const revalidate = 300; // cek ulang kode verifikasi tiap 5 menit

async function getGoogleVerification() {
  try {
    const { data } = await createAdminClient()
      .from("site_settings")
      .select("value")
      .eq("key", "google_site_verification")
      .single();
    const snippet = data?.value?.trim() || "";
    // ambil isi content="..." saja, lalu render lewat <meta> asli React (bukan innerHTML)
    const match = snippet.match(/content=["']([^"']+)["']/i);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

export const metadata: Metadata = {
  metadataBase: new URL("https://sidapore.example.com"),
  title: {
    default: "Sidapore — Depot Isi Ulang, Kos-kosan & Laundry",
    template: "%s · Sidapore",
  },
  description:
    "Sidapore melayani isi ulang air minum, kos-kosan, dan laundry dalam satu layanan terpercaya. Pesan galon antar, cek kamar kos, dan titip laundry mudah lewat WhatsApp.",
  keywords: [
    "depot isi ulang air",
    "kos kosan",
    "laundry",
    "Sidapore",
    "isi ulang galon antar",
    "laundry kiloan",
  ],
  openGraph: {
    title: "Sidapore — Depot Isi Ulang, Kos-kosan & Laundry",
    description:
      "Satu layanan untuk kebutuhan air minum, tempat tinggal, dan laundry Anda.",
    type: "website",
    locale: "id_ID",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sidapore",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F6E63",
  // "any" agar halaman kasir (laundry/depot/kos) bisa dipakai dalam mode landscape di HP/tablet
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleVerificationContent = await getGoogleVerification();
  const profile = await getProfile();

  return (
    <html lang="id">
      <head>
        {googleVerificationContent && (
          <meta name="google-site-verification" content={googleVerificationContent} />
        )}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink font-body antialiased pb-16 md:pb-0">
        <ServiceWorkerRegister />
        <InstallAppBanner />
        {children}
        <BottomNav role={profile?.role} />
      </body>
    </html>
  );
}

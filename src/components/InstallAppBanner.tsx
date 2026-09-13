"use client";

import { useEffect, useState } from "react";

// Alert "Download Aplikasi" — tampil di tiap halaman (termasuk tiap refresh)
// KECUALI:
//   1) pelanggan sudah pernah klik "Download" sebelumnya (disimpan permanen
//      di localStorage, tidak akan muncul lagi di perangkat itu), ATAU
//   2) website sedang dibuka DARI aplikasi yang sudah ter-install (mode PWA
//      "standalone" di Android/desktop, atau "navigator.standalone" di iOS).
//
// Catatan istilah: aplikasi ini adalah PWA (Progressive Web App), bukan file
// .apk terpisah — "Download" di sini berarti "Install ke layar utama" lewat
// prompt instalasi bawaan browser (Android/Chrome) atau instruksi manual
// (iOS Safari, yang tidak punya prompt otomatis).

const STORAGE_KEY = "sidapore_apk_alert_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  const displayModeStandalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(displayModeStandalone || iosStandalone);
}

export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);

  useEffect(() => {
    // Jangan tampil sama sekali kalau sudah berjalan sebagai aplikasi ter-install.
    if (isStandalonePwa()) return;

    // Jangan tampil kalau pelanggan sudah pernah klik Download di perangkat ini.
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    const ua = window.navigator.userAgent;
    setIsIos(/iphone|ipad|ipod/i.test(ua));

    fetch("/api/apk")
      .then((r) => r.json())
      .then((d) => setApkUrl(d.release?.url ?? null))
      .catch(() => {});

    setVisible(true);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Kalau instalasi berhasil (lewat prompt browser ATAU menu browser manual),
    // matikan alert permanen juga — tidak perlu ganggu lagi setelah ter-install.
    function onAppInstalled() {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
    }
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  function handleDownloadClick() {
    // Klik dianggap "sudah download" sesuai instruksi — alert tidak muncul
    // lagi di perangkat ini apa pun hasilnya, supaya tidak mengganggu terus.
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);

    // Kalau admin sudah upload file APK asli, biarkan browser mengunduhnya
    // lewat href (lihat tombol di bawah) — fungsi ini hanya jadi fallback
    // untuk prompt instalasi PWA saat belum ada APK yang diupload.
    if (apkUrl) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else if (isIos) {
      alert(
        "Di iPhone/iPad: ketuk ikon Share (kotak dengan panah ke atas) di Safari, lalu pilih \"Add to Home Screen\" untuk memasang aplikasi Sidapore."
      );
    } else {
      alert(
        "Buka menu browser (titik tiga di pojok), lalu pilih \"Install App\" / \"Add to Home Screen\" untuk memasang aplikasi Sidapore."
      );
    }
  }

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-ink shadow-sm">
      <span>📲 Pasang aplikasi Sidapore di HP Anda untuk akses lebih cepat!</span>
      <div className="flex shrink-0 items-center gap-2">
        {apkUrl ? (
          <a
            href={apkUrl}
            download
            onClick={handleDownloadClick}
            className="rounded-md bg-ink px-3 py-1 text-xs font-semibold text-white"
          >
            Download
          </a>
        ) : (
          <button
            onClick={handleDownloadClick}
            className="rounded-md bg-ink px-3 py-1 text-xs font-semibold text-white"
          >
            Download
          </button>
        )}
        <button
          onClick={() => setVisible(false)}
          aria-label="Tutup"
          className="px-1 text-ink/60"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

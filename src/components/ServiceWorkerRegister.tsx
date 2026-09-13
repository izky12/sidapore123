"use client";

import { useEffect } from "react";

// Didaftarkan sekali di root layout supaya SEMUA halaman (bukan cuma kasir) tahan
// dibuka ulang/refresh tanpa internet, lalu otomatis update begitu ada build baru.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              // versi baru siap dipakai di load berikutnya
              worker.postMessage("SKIP_WAITING");
            }
          });
        });
      })
      .catch(() => {});
  }, []);

  return null;
}

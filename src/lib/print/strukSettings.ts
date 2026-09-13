"use client";

// Pengaturan struk kustom, disimpan di localStorage per perangkat (tidak perlu internet).
// Dipakai otomatis oleh PrintReceiptButton agar semua kasir (Depot/Laundry/Kos) konsisten.

const KEY = "sidapore-struk-settings";

export interface StrukSettings {
  toko: string;
  alamat: string;
  telepon: string;
  footer: string;
  lebarKertas: 32 | 48;
}

export const DEFAULT_STRUK_SETTINGS: StrukSettings = {
  toko: "Sidapore",
  alamat: "",
  telepon: "",
  footer: "Terima kasih!",
  lebarKertas: 32,
};

export function getStrukSettings(): StrukSettings {
  if (typeof window === "undefined") return DEFAULT_STRUK_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STRUK_SETTINGS;
    return { ...DEFAULT_STRUK_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STRUK_SETTINGS;
  }
}

export function saveStrukSettings(settings: StrukSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}

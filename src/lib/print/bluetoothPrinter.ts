"use client";

// Menghubungkan & mengirim data ke printer thermal Bluetooth (BLE) merek apapun.
// Mendaftarkan beberapa UUID service umum yang dipakai printer thermal mobile murah,
// lalu memindai semua service/characteristic untuk menemukan jalur tulis yang bisa dipakai.

const KNOWN_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // umum di banyak printer thermal BLE
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb", // serial-over-BLE umum (HM-10 dkk)
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

let cachedDevice: BluetoothDevice | null = null;
let cachedChar: BluetoothRemoteGATTCharacteristic | null = null;

function supported() {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}

async function findWritableCharacteristic(server: BluetoothRemoteGATTServer) {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    const chars = await service.getCharacteristics();
    for (const c of chars) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        return c;
      }
    }
  }
  return null;
}

export async function connectPrinter(): Promise<{ ok: boolean; error?: string }> {
  if (!supported()) {
    return { ok: false, error: "Browser ini tidak mendukung Bluetooth (pakai Chrome di Android)." };
  }
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_SERVICES,
    });
    const server = await device.gatt?.connect();
    if (!server) return { ok: false, error: "Gagal konek ke printer." };

    const char = await findWritableCharacteristic(server);
    if (!char) return { ok: false, error: "Printer terhubung tapi jalur kirim data tidak ditemukan." };

    cachedDevice = device;
    cachedChar = char;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghubungkan printer." };
  }
}

export function isPrinterConnected() {
  return !!(cachedDevice?.gatt?.connected && cachedChar);
}

export function disconnectPrinter() {
  cachedDevice?.gatt?.disconnect();
  cachedDevice = null;
  cachedChar = null;
}

export async function printBytes(bytes: Uint8Array): Promise<{ ok: boolean; error?: string }> {
  if (!isPrinterConnected()) {
    const res = await connectPrinter();
    if (!res.ok) return res;
  }
  try {
    // banyak printer BLE cuma terima potongan kecil (~180 byte) per tulisan
    const CHUNK = 180;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const chunk = bytes.slice(i, i + CHUNK);
      if (cachedChar!.properties.writeWithoutResponse) {
        await cachedChar!.writeValueWithoutResponse(chunk);
      } else {
        await cachedChar!.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 30));
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal mencetak." };
  }
}

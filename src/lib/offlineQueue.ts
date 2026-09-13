"use client";

// Antrean transaksi offline (IndexedDB). Dipakai kasir laundry/depot saat sinyal hilang:
// transaksi tetap tersimpan di HP, struk tetap bisa dicetak (bluetooth tidak butuh internet),
// lalu otomatis terkirim ke server begitu online lagi.

const DB_NAME = "sidapore-offline";
const STORE = "outbox";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface QueuedTransaction {
  id: string;
  sumber: "depot" | "laundry";
  jenis: "masuk";
  jumlah: number;
  deskripsi: string;
  created_by: string;
  created_at: string;
  metode_bayar: "tunai" | "digital";
}

export async function queueTransaction(tx: QueuedTransaction) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(tx);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function getQueuedTransactions(): Promise<QueuedTransaction[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readonly");
    const req = t.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedTransaction[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedTransaction(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

// dipanggil supabase client dari komponen agar tidak circular import
export async function flushQueue(insertFn: (tx: QueuedTransaction) => Promise<boolean>) {
  const pending = await getQueuedTransactions();
  let synced = 0;
  for (const tx of pending) {
    const ok = await insertFn(tx);
    if (ok) {
      await removeQueuedTransaction(tx.id);
      synced++;
    }
  }
  return synced;
}

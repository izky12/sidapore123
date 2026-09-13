// Encoder ESC/POS minimal — cukup untuk struk kasir (tanpa dependensi luar)

export interface ReceiptItem {
  label: string;
  qty?: number;
  harga?: number;
}

export interface ReceiptData {
  toko: string;
  judul: string; // mis. "Depot Isi Ulang" / "Laundry" / "Kos-kosan"
  nomor?: string; // no. transaksi/kamar
  items: ReceiptItem[];
  total: number;
  metode?: string;
  kasir?: string;
  catatan?: string;
  // Kustomisasi struk (diisi otomatis dari Pengaturan Struk admin, lihat strukSettings.ts)
  alamat?: string;
  telepon?: string;
  footer?: string;
  lebarKertas?: 32 | 48; // 32 = thermal 58mm, 48 = thermal 80mm
}

function formatRupiah(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

const ESC = 0x1b;
const GS = 0x1d;

class EscPosBuilder {
  private bytes: number[] = [];

  raw(...b: number[]) {
    this.bytes.push(...b);
    return this;
  }
  text(s: string) {
    for (let i = 0; i < s.length; i++) this.bytes.push(s.charCodeAt(i) & 0xff);
    return this;
  }
  line(s = "") {
    return this.text(s).raw(0x0a);
  }
  init() {
    return this.raw(ESC, 0x40);
  }
  align(a: "left" | "center" | "right") {
    const n = a === "center" ? 1 : a === "right" ? 2 : 0;
    return this.raw(ESC, 0x61, n);
  }
  bold(on: boolean) {
    return this.raw(ESC, 0x45, on ? 1 : 0);
  }
  size(big: boolean) {
    return this.raw(GS, 0x21, big ? 0x11 : 0x00);
  }
  feed(n = 1) {
    return this.raw(ESC, 0x64, n);
  }
  cut() {
    return this.raw(GS, 0x56, 0x00);
  }
  toBytes() {
    return new Uint8Array(this.bytes);
  }
}

function baris2Kolom(kiri: string, kanan: string, lebar: number) {
  const spasi = Math.max(1, lebar - kiri.length - kanan.length);
  return kiri + " ".repeat(spasi) + kanan;
}

function bungkusTeks(teks: string, lebar: number): string[] {
  const kata = teks.split(" ");
  const hasil: string[] = [];
  let baris = "";
  for (const k of kata) {
    const coba = baris ? baris + " " + k : k;
    if (coba.length > lebar) {
      if (baris) hasil.push(baris);
      baris = k;
    } else {
      baris = coba;
    }
  }
  if (baris) hasil.push(baris);
  return hasil;
}

export function buildReceipt(data: ReceiptData): Uint8Array {
  const lebar = data.lebarKertas ?? 32;
  const b = new EscPosBuilder();
  b.init();
  b.align("center").bold(true).size(true).line(data.toko);
  b.size(false).bold(false);
  if (data.alamat) bungkusTeks(data.alamat, lebar).forEach((l) => b.line(l));
  if (data.telepon) b.line(data.telepon);
  b.line(data.judul);
  if (data.nomor) b.line(data.nomor);
  b.line(new Date().toLocaleString("id-ID"));
  b.align("left").line("-".repeat(lebar));

  for (const it of data.items) {
    const qty = it.qty && it.qty > 1 ? `${it.qty}x ` : "";
    b.line(qty + it.label);
    if (it.harga !== undefined) {
      b.line(baris2Kolom("", formatRupiah(it.harga), lebar));
    }
  }

  b.line("-".repeat(lebar));
  b.bold(true).line(baris2Kolom("TOTAL", formatRupiah(data.total), lebar)).bold(false);
  if (data.metode) b.line("Bayar: " + data.metode);
  if (data.kasir) b.line("Kasir: " + data.kasir);
  if (data.catatan) b.line(data.catatan);
  b.align("center").line("");
  bungkusTeks(data.footer || "Terima kasih!", lebar).forEach((l) => b.line(l));
  b.feed(3).cut();

  return b.toBytes();
}

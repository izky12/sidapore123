# Audit Pra-Beta — Sidapore

## 🔴 KRITIS — perbaiki sebelum beta (risiko data/uang)

1. **RLS `transactions` bisa di-insert siapa saja.**
   `create policy "system insert transactions" on transactions for insert with check (true);`
   Ini tabel ledger kas. Karena `anon key` publik (nempel di kode browser), siapa pun bisa panggil Supabase REST API langsung dan menyuntik baris palsu ke laporan keuangan (pemasukan/pengeluaran ngawur), tanpa lewat aplikasi sama sekali. Perlu dibatasi: idealnya insert transactions hanya lewat trigger (`security definer`, sudah begitu) — policy publik `with check(true)` untuk role `anon`/`authenticated` seharusnya **dihapus**, ganti jadi hanya bisa diisi lewat fungsi trigger (yang jalan sebagai `security definer`, tidak butuh policy insert terpisah untuk role user biasa) atau dibatasi `using (auth.role() = 'service_role')`.

2. **Insert publik ke `water_orders` / `laundry_orders` / `leads` tidak dibatasi kolom** (`with check (true)`).
   Orang bisa kirim request langsung ke Supabase (bukan lewat form) dan isi field apa saja termasuk `status`, `dibayar`, `assigned_kurir_id`, dll — bisa bikin pesanan palsu "selesai/dibayar" nongol di list staff. Saran: batasi `with check` supaya insert publik hanya boleh set `status='baru'` dan `dibayar=false` (kolom lain biar default).

3. **Tidak ada validasi harga di sisi server** untuk laundry/air — kalau field harga bisa diisi dari client (perlu dicek `NewLaundryOrder.tsx` & `PesanAirForm.tsx`), pastikan harga final selalu ditentukan/dikoreksi staff, bukan dari input publik mentah-mentah, karena itu langsung mempengaruhi kas.

## 🟠 ALUR & LOGIKA

4. **README belum sinkron** dengan perubahan kos terbaru (migration 0010 & 0011 belum disebut di langkah setup). Kalau tester ikut README apa adanya, tabel `kos_tenants.room_id` tidak akan ada dan fitur kos akan error. **Perlu update README** sebelum kirim ke tester, atau minimal kasih instruksi manual: jalankan migration 0001 → 0011 berurutan.
5. Status lead `"batal"` untuk kos: kalau lead sudah sempat di-"Deal" (tenant sudah dibuat, kamar terisi), lalu admin ubah status ke `batal`, **tidak ada logika yang membatalkan tenant/kamar-nya lagi** — harus dihapus manual di menu Data Penyewa. Ini agak membingungkan kalau tidak didokumentasikan ke admin/tester.
6. Kamar `maintenance` — begitu admin set status kamar ke `maintenance` sementara ada tenant aktif terhubung ke kamar itu, tidak konsisten (tenant masih ada tapi kamar bukan `terisi`). Edge case kecil, tapi bisa membingungkan tampilan publik.
7. Belum ada fitur **edit** data penyewa (ubah nama/WA/harga kalau salah ketik) — saat ini cuma tambah & hapus. Kalau typo, solusinya hapus lalu tambah ulang (riwayat pembayaran ikut hilang kalau dihapus).

## 🟡 UI / RESPONSIVITAS

8. Form publik `OrderLaundryForm.tsx` dan `PesanAirForm.tsx` **tidak punya class responsive (`sm:`/`md:`)** sama sekali — cek tampilannya di layar HP kecil (<360px), kemungkinan padding/lebar kurang pas dibanding halaman lain yang sudah dirapikan.
9. Semua tabel admin (termasuk yang baru saya buat: Data Penyewa & Riwayat Pembayaran) pakai `overflow-x-auto` — bisa discroll di HP, tapi tidak ada indikasi visual "geser ke kanan", tester mungkin tidak sadar ada kolom terpotong.
10. Dialog konfirmasi pakai `confirm()`/`prompt()` bawaan browser (hapus penyewa, catat bayar, catat kamar) — fungsional tapi terlihat kasar/tidak sesuai desain, dan **tidak muncul sama sekali di beberapa in-app WebView** (mis. WA browser). Kalau tester akan buka link dari WhatsApp, ini berisiko form tidak jalan.

## 🟢 PANDUAN PEMAKAIAN

11. **Belum ada panduan pemakaian untuk admin** di dalam aplikasi (semua ada di README, bukan di UI). Untuk beta tester non-teknis, pertimbangkan halaman singkat "Cara Pakai" di `/admin` atau tooltip di tiap menu — terutama alur kos yang baru (Deal → otomatis jadi penyewa → Catat Pembayaran → struk).
12. Perlu skenario uji tertulis untuk tester (mis. daftar 5 langkah: cek kamar → daftar/temu admin → dicatat penyewa → bayar → cek struk & riwayat) supaya mereka tahu apa yang harus dicoba.

## 🔵 FITUR YANG MASIH KOSONG

13. Tidak ada laporan/rekap keuangan bulanan khusus kos (baru ada riwayat mentah). Kalau pemilik usaha mau lihat "berapa kamar yang sudah bayar bulan ini", harus hitung manual dari tabel.
14. Tidak ada reminder/pengingat jatuh tempo sewa bulanan (fitur lanjutan, bukan blocker beta).
15. Backup: pastikan pemilik tahu cara export data dari Supabase (Table Editor → Export CSV) sebelum tester mulai coba-coba, jaga-jaga data beta perlu direset.

---

**Prioritas sebelum rilis ke tester:** perbaiki #1 dan #2 dulu (keamanan data keuangan), lalu update README (#4), sisanya bisa jalan paralel sambil beta berjalan.

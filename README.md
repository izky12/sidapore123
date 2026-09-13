# Sidapore — Depot Isi Ulang, Kos-kosan & Laundry

Website Next.js (App Router) + Supabase untuk tiga unit usaha Sidapore, dengan
dua tampilan (Pelanggan & Admin/Staff) dan role-based access control.

## Struktur peran

| Role            | Akses                                                             |
|-----------------|--------------------------------------------------------------------|
| `admin`         | Semua data, keuangan gabungan, kelola staff & role                |
| `staff_depot`   | Siapkan pesanan air (`baru` → `diproses`)                         |
| `kurir`         | Antar galon yang ditugaskan (`diproses` → `dikirim` → `selesai`)  |
| `staff_laundry` | Proses pesanan laundry (`baru` → `diproses` → `selesai`)          |
| `customer`      | Default untuk siapa pun yang mendaftar akun sendiri (tidak dipakai di alur ini, disiapkan untuk pengembangan lanjutan seperti riwayat pesanan) |

Pelanggan **tidak perlu login** untuk memesan air atau mendaftar sebagai
pelanggan baru — form publik langsung menulis ke tabel `water_orders` / `leads`.
Login hanya dipakai admin, staff, dan kurir.

---

## 1. Setup Supabase (gratis) — langkah demi langkah

### 1.1 Buat project

1. Buka https://supabase.com, login/daftar (paket **Free** sudah cukup untuk mulai).
2. Klik **New Project**.
3. Isi nama project (bebas, misal `sidapore`), buat/pilih **Database Password**
   yang kuat dan **catat/simpan password ini di tempat aman** (password
   manager, bukan cuma di kepala) — ini beda dari password login Supabase
   Dashboard kamu, dan kalau lupa, cara satu-satunya adalah reset lewat
   Project Settings (tidak bisa "lihat lagi" password lama).
4. Pilih region terdekat (misal Singapore untuk Indonesia), klik **Create
   new project**. Tunggu 1-2 menit sampai provisioning selesai.

### 1.2 Jalankan semua migration SQL, berurutan

1. Di sidebar kiri Supabase, klik **SQL Editor**.
2. Klik **New query**.
3. Buka file `supabase/migrations/0001_init.sql` di komputer kamu, salin
   **seluruh isinya**, tempel ke SQL Editor, klik **Run** (atau Ctrl+Enter).
   Pastikan hasilnya "Success. No rows returned" (atau sejenisnya) — kalau
   ada tulisan merah/error, **berhenti dan jangan lanjut ke file berikutnya**
   sampai errornya diperbaiki.
4. Ulangi langkah yang sama untuk setiap file, **wajib berurutan sesuai
   nomor**, satu per satu:
   - `0002_kas_harian.sql`
   - `0003_site_settings.sql`
   - `0004_kos_rooms.sql`
   - `0005_pemesanan_lokasi_delete.sql`
   - `0006_fix_rls_kurir_laundry_ongkir.sql`
   - `0007_alur_pemasukan_dan_kas.sql`
   - `0008_laundry_online.sql`
   - `0009_fix_kurir_lihat_laundry.sql`
   - `0010_kos_alur_terpadu.sql`
   - `0011_hapus_penyewa_lepas_kamar.sql`
   - `0012_perketat_rls_publik.sql`
   - `0013_hapus_password_hardcode_seo.sql`
   - `0014_upload_apk.sql`
5. Setelah semua 14 file dijalankan tanpa error, cek di **Table Editor**
   (sidebar kiri) — harus muncul tabel-tabel seperti `profiles`,
   `water_orders`, `laundry_orders`, `leads`, `kos_rooms`, `kos_tenants`,
   `transactions`, `layanan_laundry`, `site_settings`, `app_releases`, dsb.

> Kenapa harus manual satu-satu dan bukan sekali jalan semua file? Supaya
> kalau ada error di tengah, kamu tahu persis migration mana yang bermasalah
> — dan supaya urutannya tidak tertukar (beberapa migration mengubah fungsi
> yang dibuat migration sebelumnya).

### 1.3 Catat kredensial API

1. Di sidebar kiri, klik ikon gerigi **Project Settings**, lalu **API**.
2. Catat 3 nilai ini (akan dipakai di langkah 2):
   - **Project URL** → nanti jadi `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key (di bagian "Project API keys") → jadi
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (di bagian yang sama, klik "Reveal" dulu) → jadi
     `SUPABASE_SERVICE_ROLE_KEY`. ⚠️ **Ini rahasia** — kunci ini bisa baca/tulis
     semua data tanpa batas (bypass semua RLS). Jangan pernah taruh di kode
     yang jalan di browser, jangan commit ke Git, jangan kasih prefix
     `NEXT_PUBLIC_`.

### 1.4 Buat akun admin pertama (wajib manual, 2 langkah)

Tidak ada cara otomatis membuat admin pertama — ini satu-satunya pintu masuk,
jadi lakukan persis begini:

1. Di sidebar kiri, klik **Authentication** → tab **Users** → tombol
   **Add user** → **Create new user**.
2. Isi **Email** dan **Password** untuk akun admin kamu, klik **Create user**.
   Sistem otomatis membuat baris terkait di tabel `profiles` lewat trigger,
   tapi role-nya masih default `customer`.
3. Salin **User UID** akun yang baru dibuat (ada di kolom paling kiri daftar
   user, bentuknya seperti `a1b2c3d4-...`).
4. Buka lagi **SQL Editor** → **New query**, tempel dan jalankan (ganti UUID
   di bawah dengan UID yang kamu salin):
   ```sql
   update profiles set role = 'admin' where id = 'TEMPEL-UUID-DI-SINI';
   ```
5. Selesai — email & password tadi itulah yang dipakai login di `/login`
   sebagai admin.

### 1.5 Ganti password SEO lock lama (kalau pakai project lama)

Kalau kamu melanjutkan dari database lama yang masih punya migration
`0003` versi lama, password `Sidapore65463VT` yang sempat tertanam di kode
sumber itu sudah dianggap **bocor**. Migration `0013` sudah menghapus lapisan
password itu sepenuhnya — sekarang halaman `/admin/seo` cukup dilindungi
login admin biasa (Supabase Auth), tidak perlu password kedua lagi. Tidak ada
langkah tambahan yang perlu kamu lakukan di sini selain menjalankan migration
`0013` seperti di langkah 1.2 — cukup pastikan sudah dijalankan.

### 1.6 Staff lain (bukan admin) dibuat lewat website, bukan Supabase

Setelah admin pertama aktif, **jangan** buat akun staff/kurir lain lewat
Supabase Dashboard lagi. Caranya:

1. Login di `/login` pakai akun admin.
2. Buka **Panel Admin → Staff & Role**.
3. Isi nama, email, password, pilih role (`staff_depot` / `kurir` /
   `staff_laundry`), klik simpan. Ini otomatis memanggil
   `SUPABASE_SERVICE_ROLE_KEY` di server, jadi pastikan variabel itu sudah
   terisi (lihat langkah 2 & 3) sebelum mencoba fitur ini.

---

## 2. Setup lokal — langkah demi langkah

1. Buka terminal, masuk ke folder project ini, lalu jalankan:
   ```bash
   npm install
   ```
   Tunggu sampai selesai (bisa beberapa menit tergantung koneksi).
2. Salin file environment contoh:
   ```bash
   cp .env.example .env.local
   ```
3. Buka `.env.local` dengan text editor, isi 3 baris dengan nilai dari
   langkah 1.3 di atas:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
   ```
   Simpan file.
4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
5. Buka browser ke `http://localhost:3000`.
6. Coba login di `/login` pakai akun admin yang dibuat di langkah 1.4 — kalau
   berhasil masuk ke `/admin`, setup lokal sudah benar.

---

## 3. Deploy ke Netlify (gratis) — langkah demi langkah

1. Push seluruh isi folder project ini ke repository GitHub baru (private
   atau public, terserah).
2. Login ke https://app.netlify.com.
3. Klik **Add new site → Import an existing project**.
4. Pilih **GitHub**, izinkan akses, lalu pilih repo yang tadi kamu push.
5. Build settings biasanya sudah otomatis terisi dari `netlify.toml`
   (build command `npm run build`, publish directory `.next`, plugin
   `@netlify/plugin-nextjs` otomatis terpasang untuk mendukung App Router +
   API routes lewat Netlify Functions) — kalau kosong, isi manual sesuai itu.
6. **Sebelum** klik Deploy, buka **Site settings → Environment variables**
   → **Add a variable**, tambahkan 3 variabel satu-satu (nilai sama seperti
   `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Klik **Deploy site**. Tunggu proses build (beberapa menit), pantau log
   build kalau ada error.
8. Setelah selesai, buka domain gratis `*.netlify.app` yang diberikan, coba
   login admin untuk memastikan semua tersambung ke Supabase dengan benar.
9. (Opsional) Untuk domain sendiri (misal `sidapore.id`): **Domain
   management → Add a domain**, ikuti instruksi mengarahkan DNS domain kamu
   ke Netlify.
10. Kalau nanti mengaktifkan **Cloudflare Turnstile** (captcha, opsional —
    lihat bagian 5), jangan lupa daftarkan domain Netlify/custom domain kamu
    ke **Allowed Hostnames** di dashboard Cloudflare Turnstile, karena
    Turnstile menolak domain yang belum terdaftar.

---

## 4. Alur bisnis singkat

**Pesan air (publik, tanpa login):**
`/pesan-air` → isi nama, WA, share lokasi Maps, jumlah galon → masuk ke
`water_orders` status `baru`.

**Depot → Kurir:**
`staff_depot` login di `/login` → `/staff` menampilkan pesanan `baru`, tandai
`diproses` setelah galon disiapkan. Admin menugaskan kurir dari
`/admin/pesanan-air`. `kurir` login → `/staff` menampilkan tugas miliknya,
tandai `dikirim` lalu `selesai`. Begitu `selesai` **dan** harga sudah diisi
admin, trigger database otomatis mencatat pemasukan ke `transactions`.

**Laundry, kalkulator harga otomatis & pembayaran:** `staff_laundry` yang
menyelesaikan cucian juga yang menerima pembayaran langsung dari pelanggan —
di `/staff`, form "Selesai & Terima Bayaran" (dan "Siap Diantar") sekarang
punya **kalkulator otomatis**: staff tinggal pilih jenis layanan (tarif
per-kg/per-pasang diatur admin di `/admin/layanan-laundry`) dan isi berat,
lalu klik "Pakai" — harga langsung terisi tanpa perlu hitung manual. Field
harga tetap bisa diedit manual kalau perlu penyesuaian. Setelah disimpan,
sistem otomatis menandai pesanan `selesai` dan mencatat pemasukan (trigger
yang sama seperti sebelumnya). Admin tetap bisa mengoreksi harga manual di
`/admin/laundry` bila perlu.

**Rekonsiliasi kas harian (tunai fisik vs sistem):** setiap staff laundry
menghitung total uang tunai di tangan di akhir hari dan menyetorkannya lewat
`/staff/setor-kas`. Sistem otomatis menjumlahkan seluruh pembayaran tunai yang
tercatat hari itu (`kas_sistem`) dan membandingkannya dengan setoran fisik
staff (`kas_fisik`) — selisihnya dihitung otomatis oleh database. Admin
memverifikasi tiap setoran di `/admin/kas-harian`, menandainya **Cocok** atau
**Ada Selisih** (dengan catatan tindak lanjut). Satu staff hanya bisa menyetor
1 kali per tanggal (`unique (staff_id, tanggal)`), dan staff hanya bisa
melihat/menyetor datanya sendiri — perbandingan lintas staff hanya terlihat
oleh admin.

**Kos-kosan:** cek ketersediaan kamar publik di `/kamar` (realtime) → tamu
klik "Pesan Kamar Ini" → isi form minat di `/daftar` (masuk ke `leads`) →
tamu ketemu langsung/bayar di tempat → admin tandai lead **Deal** di
`/admin/pendaftaran` (ini otomatis membuat data penyewa & menandai kamar
`terisi` — tidak perlu input ulang manual). Admin lanjut ke `/admin/kos` untuk
"Catat Pembayaran" (ini titik konfirmasinya) → otomatis tercatat sebagai
pemasukan di `transactions` dan bisa cetak struk. Penyewa walk-in tanpa lewat
form `/daftar` juga bisa langsung ditambahkan admin di `/admin/kos` (pilih
kamar dari dropdown kamar kosong).

Catatan perilaku yang perlu diketahui admin/tester:
- Kalau lead kos yang sudah **Deal** kemudian diubah ke **Batal**, sistem
  otomatis menonaktifkan penyewa terkait (kamar balik jadi `tersedia`),
  riwayat pembayaran (kalau ada) tetap tersimpan untuk arsip.
- Kamar yang punya penyewa **aktif** tidak bisa diubah manual ke
  `tersedia`/`maintenance` dari `/admin/kos` (Kelola Kamar) — sistem akan
  menolak dan minta hapus/nonaktifkan penyewanya dulu, supaya status kamar
  publik selalu sinkron dengan data penyewa sebenarnya.
- Data penyewa bisa diedit (nama/WA/harga) langsung dari `/admin/kos` kalau
  ada salah ketik, tidak perlu hapus-tambah ulang (menghapus akan ikut
  menghapus riwayat pembayarannya).

**Pendaftaran pelanggan baru** (`/daftar`): form publik untuk minat kos,
laundry, atau depot — masuk ke tabel `leads`, hanya admin yang bisa melihat
dan menindaklanjuti (misalnya follow-up WhatsApp manual).

**Alert "Pasang Aplikasi" (PWA):** muncul di atas tiap halaman, tiap kali
direfresh, kecuali (a) pengunjung sudah pernah klik tombol "Download" di
perangkat itu, atau (b) situs sedang dibuka dari aplikasi yang sudah
ter-install. Kalau admin sudah upload file APK (lihat bagian 5), tombol
Download langsung mengunduh file itu; kalau belum, tombol memicu prompt
install PWA bawaan browser (atau instruksi manual untuk iOS).

---

## 5. Panduan fitur khusus (langkah demi langkah)

### 5.1 Upload/ganti APK aplikasi Android

1. Login sebagai admin, buka **Panel Admin → 📱 Aplikasi (APK)**.
2. Klik **Choose file**, pilih file `.apk` dari komputer kamu (maksimal
   150MB).
3. (Opsional) isi **Label versi**, contoh: `1.2.0`.
4. Klik **Upload & Aktifkan**. Setelah selesai, halaman menampilkan versi
   yang sedang aktif beserta link download-nya.
5. Rilis lama tidak terhapus otomatis (tetap tersimpan di Supabase Storage
   bucket `apk` untuk arsip/rollback manual), tapi link download di seluruh
   situs (termasuk alert "Pasang Aplikasi") otomatis mengarah ke rilis
   **terbaru** begitu upload selesai — tidak perlu ubah kode apa pun.

### 5.2 Mengaktifkan Turnstile (captcha, opsional tapi disarankan)

1. Buka https://dash.cloudflare.com → menu **Turnstile** → **Add widget**.
2. Isi nama widget, **Domain**: tambahkan domain Netlify kamu (contoh
   `sidapore.netlify.app`) dan `localhost` (untuk testing lokal). Widget
   Mode: **Managed**.
3. Setelah dibuat, salin **Site Key**, tempel ke `.env.local` (lokal) dan ke
   Environment variables Netlify (produksi):
   ```
   VITE_TURNSTILE_SITE_KEY=0xAAAAAAAAAAAAAAAAAAAAAA
   ```
4. Kalau nanti menambah custom domain sendiri, jangan lupa tambahkan domain
   itu juga ke **Allowed Hostnames** widget yang sama di Cloudflare — kalau
   lupa, akan muncul error `Turnstile Error: 110200` (domain not authorized)
   dan form (login/daftar/booking/kirim bukti bayar) tetap berfungsi tapi
   tanpa verifikasi captcha (cuma rate limit IP yang aktif).
5. Kalau dikosongkan sepenuhnya, semua form tetap berfungsi normal tanpa
   captcha (fallback aman, bukan wajib diisi untuk situs bisa jalan).

### 5.3 Mengatur verifikasi Google Search Console (SEO)

1. Login sebagai admin, buka **Panel Admin → Verifikasi SEO**.
2. Tempel kode `<meta name="google-site-verification" content="...">` persis
   seperti yang diberikan Google Search Console.
3. Klik **Simpan**. Halaman ini sudah cukup dilindungi oleh login admin —
   tidak perlu password tambahan lagi (lihat bagian 1.5).

---

## 6. Catatan teknis

- **SEO**: metadata per halaman sudah diatur lewat Next.js Metadata API
  (`layout.tsx`, `pesan-air/page.tsx`, dll). Untuk hasil maksimal, ganti
  `metadataBase` di `src/app/layout.tsx` dengan domain asli setelah live.
- **RLS ketat**: pelanggan hanya bisa `insert`, tidak bisa membaca pesanan
  orang lain. Staff hanya melihat data sesuai lingkupnya. Data kos & keuangan
  gabungan hanya bisa dibaca `admin`.
- **Auto-posting keuangan**: dilakukan oleh trigger Postgres
  (`post_water_income`, `post_laundry_income`, `post_kos_income`) — bukan di
  kode frontend — supaya laporan keuangan tidak bisa "dilewati" dari sisi
  client.
- **Storage**: satu bucket public (`apk`) untuk file APK yang diupload admin.
  Upload/hapus hanya lewat API route yang memakai `SUPABASE_SERVICE_ROLE_KEY`
  di server — tidak ada policy insert/delete untuk role lain, jadi bucket
  ini aman dari upload sembarangan meski bucket-nya public untuk **dibaca**.
- Semua tabel & kolom pakai bahasa Indonesia agar konsisten dengan operasional
  tim di lapangan.

---

## 7. Pengembangan lanjutan yang bisa ditambahkan

- Notifikasi WhatsApp otomatis (via WA Business API / Fonnte) saat status
  pesanan berubah.
- Riwayat pesanan untuk pelanggan yang login (`role: customer`).
- Export laporan keuangan bulanan ke PDF/Excel dari `/admin`.
- Reminder jatuh tempo sewa kos (cron job Supabase Edge Function).
- Validasi harga sisi server untuk pesanan laundry/air (saat ini harga masih
  bisa dikirim dari form — pertimbangkan menambah pengecekan di database
  atau API route sebelum go-live penuh).

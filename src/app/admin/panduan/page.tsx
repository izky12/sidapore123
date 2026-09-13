function Langkah({ no, judul, isi }: { no: number; judul: string; isi: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
        {no}
      </div>
      <div>
        <p className="font-medium text-ink">{judul}</p>
        <p className="text-sm text-ink/60">{isi}</p>
      </div>
    </div>
  );
}

export default function PanduanPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">📘 Cara Pakai (untuk Admin)</h1>
        <p className="mt-1 text-sm text-ink/60">
          Ringkasan alur kerja sehari-hari. Kalau ada yang membingungkan saat coba-coba (beta), tanya saja ke
          developer — halaman ini bisa diperbaiki.
        </p>
      </div>

      {/* ALUR KOS */}
      <div className="card">
        <h2 className="font-display text-lg font-bold text-ink">🏠 Alur Kos-kosan</h2>
        <p className="mt-1 text-sm text-ink/60">
          Ada 2 cara penyewa masuk ke sistem: lewat pendaftaran online (calon penyewa isi form di halaman publik),
          atau ditambahkan manual oleh admin (penyewa walk-in).
        </p>
        <div className="mt-5 space-y-4">
          <Langkah
            no={1}
            judul="Cek kamar kosong"
            isi='Menu "Kos-kosan" → bagian "Kelola Kamar" menunjukkan kamar mana yang "Tersedia", "Terisi", atau "Perbaikan". Status ini juga tampil realtime ke pengunjung di halaman publik /kamar.'
          />
          <Langkah
            no={2}
            judul='Calon penyewa mendaftar, atau admin catat langsung'
            isi='Kalau lewat form publik, pendaftaran akan muncul di menu "Pendaftaran Masuk" dengan status "Baru". Kalau penyewa datang langsung (walk-in), admin bisa isi form "Tambah Penyewa" di menu Kos-kosan tanpa lewat pendaftaran.'
          />
          <Langkah
            no={3}
            judul='Ubah status jadi "Deal"'
            isi='Di menu "Pendaftaran Masuk", setelah dikonfirmasi kamar & harganya, ubah status lead menjadi "Deal". Sistem otomatis membuat data penyewa baru dan menandai kamar terkait sebagai "Terisi" — tidak perlu input ulang manual.'
          />
          <Langkah
            no={4}
            judul="Catat Pembayaran"
            isi='Tiap penyewa bayar bulanan, buka menu "Kos-kosan" → tabel "Data Penyewa" → klik "Catat bayar" pada baris penyewa tsb. Isi periode (format YYYY-MM, misal 2026-08) dan jumlah yang diterima, lalu simpan.'
          />
          <Langkah
            no={5}
            judul="Struk otomatis muncul"
            isi='Setelah pembayaran disimpan, kartu struk langsung muncul di bawah tabel dan bisa dicetak (tombol cetak). Pembayaran juga otomatis masuk ke "Riwayat Pembayaran" dan ke laporan keuangan (Ringkasan) — tidak perlu dicatat dua kali.'
          />
        </div>
        <div className="mt-5 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-medium">Catatan penting:</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>
              Kalau lead sudah pernah di-&quot;Deal&quot; lalu diubah jadi &quot;Batal&quot;, penyewa &amp; status kamarnya
              <b> tidak otomatis</b> ikut dibatalkan — hapus manual di tabel Data Penyewa kalau memang batal sewa.
            </li>
            <li>
              Menghapus penyewa akan ikut menghapus seluruh riwayat pembayarannya secara permanen. Pastikan yakin
              sebelum menghapus.
            </li>
          </ul>
        </div>
      </div>

      {/* ALUR LAUNDRY & AIR (ringkas) */}
      <div className="card">
        <h2 className="font-display text-lg font-bold text-ink">🧺 Alur Laundry & 💧 Pesan Air (ringkas)</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-ink">Laundry</p>
            <p className="text-sm text-ink/60">
              Pesanan masuk (online atau dicatat staff) → status berjalan dari &quot;Baru&quot; → &quot;Diproses&quot;
              → &quot;Siap Diambil/Diantar&quot; → &quot;Selesai&quot;. Pembayaran ditandai &quot;Dibayar&quot; oleh
              staff/kasir, dan otomatis masuk laporan keuangan.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Pesan Air</p>
            <p className="text-sm text-ink/60">
              Pesanan masuk → ditugaskan ke kurir → dikirim → diverifikasi kurir sebagai &quot;Terkirim&quot;.
              Pembayaran (tunai/digital) dicatat lalu otomatis masuk laporan keuangan.
            </p>
          </div>
        </div>
      </div>

      {/* SKENARIO UJI TESTER */}
      <div className="card">
        <h2 className="font-display text-lg font-bold text-ink">✅ Skenario Uji untuk Tester (5 Langkah)</h2>
        <p className="mt-1 text-sm text-ink/60">
          Kalau kamu tester beta yang baru pertama kali coba, ikuti langkah ini secara berurutan untuk menguji alur
          kos dari awal sampai akhir.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink/80">
          <li>Buka halaman publik <b>/kamar</b> — cek ada kamar berstatus &quot;Tersedia&quot;.</li>
          <li>
            Daftar sebagai calon penyewa lewat halaman publik <b>/daftar</b>, ATAU minta admin menambahkan kamu
            langsung lewat menu Kos-kosan (simulasi walk-in).
          </li>
          <li>
            Sebagai admin: buka <b>Pendaftaran Masuk</b>, ubah status pendaftaranmu jadi &quot;Deal&quot; — cek
            di menu <b>Kos-kosan</b> apakah namamu otomatis muncul sebagai penyewa dan kamar berubah jadi
            &quot;Terisi&quot;.
          </li>
          <li>
            Klik <b>Catat bayar</b> pada baris penyewa tsb, isi periode &amp; jumlah, simpan.
          </li>
          <li>
            Cek struk yang muncul (coba cetak/lihat preview), lalu cek juga apakah pembayaran tsb sudah muncul di{" "}
            <b>Riwayat Pembayaran</b> dan di angka <b>Pemasukan Kos</b> pada halaman Ringkasan Keuangan.
          </li>
        </ol>
      </div>

      {/* BACKUP DATA */}
      <div className="card">
        <h2 className="font-display text-lg font-bold text-ink">💾 Backup Data Sebelum Tester Coba-coba</h2>
        <p className="mt-1 text-sm text-ink/60">
          Karena ini masih tahap beta, ada kemungkinan data perlu direset kalau tester salah input atau untuk
          uji coba ulang. Backup dulu data penting lewat Supabase (bukan lewat aplikasi ini):
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink/80">
          <li>
            Login ke <b>supabase.com</b> → buka project Sidapore → menu <b>Table Editor</b> di sidebar kiri.
          </li>
          <li>
            Pilih tabel yang mau dibackup (misalnya <code>kos_tenants</code>, <code>kos_payments</code>,{" "}
            <code>transactions</code>, <code>laundry_orders</code>, <code>water_orders</code>, <code>leads</code>).
          </li>
          <li>
            Klik tombol <b>Export</b> (biasanya di kanan atas tabel) → pilih <b>Export to CSV</b>. File akan
            terunduh ke komputer.
          </li>
          <li>Ulangi untuk tiap tabel penting. Simpan file CSV-nya di folder yang aman (misal Google Drive).</li>
          <li>
            Lakukan ini <b>sebelum</b> mulai sesi testing tiap kali, terutama kalau data mau di-reset/dihapus
            setelahnya.
          </li>
        </ol>
      </div>
    </div>
  );
}

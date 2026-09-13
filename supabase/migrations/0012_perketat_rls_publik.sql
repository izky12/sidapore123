-- =========================================================
-- 0012 — Perketat RLS insert publik (celah keamanan data/kas):
--   1) transactions: HAPUS policy insert publik. Ledger kas cuma boleh
--      terisi lewat trigger database (security definer, jalan sebagai
--      owner function = bukan role publik, jadi tetap bisa insert
--      walau tanpa policy untuk anon/authenticated).
--   2) water_orders / laundry_orders / leads: insert publik dibatasi
--      supaya cuma boleh bikin pesanan berstatus awal (belum diproses,
--      belum dibayar, belum ditugaskan) — tidak bisa suntik pesanan
--      palsu "selesai & dibayar" langsung lewat API.
-- =========================================================

-- ---------- 1) transactions ----------
-- Kasir (staff_depot/staff_laundry) memang insert transaksi manual langsung
-- dari /staff/kasir (lihat KasirForm.tsx) — jadi TIDAK bisa dihapus total,
-- tapi harus dibatasi: hanya staff/admin yang login, dan created_by wajib
-- dirinya sendiri (tidak bisa mengatasnamakan staff lain). Publik/anon sama
-- sekali tidak kebagian akses insert.
drop policy if exists "system insert transactions" on transactions;
create policy "staff kasir insert transaksi sendiri" on transactions for insert
  with check (
    my_role() in ('admin', 'staff_depot', 'staff_laundry', 'kurir')
    and created_by = auth.uid()
  );
-- Catatan: trigger auto-posting (post_water_income, post_laundry_income,
-- post_kos_income) tetap bisa insert walau created_by = kurir/staff lain
-- (mis. water_orders yang dibayar kurir), karena function-nya security
-- definer (owner = postgres) sehingga RLS di atas tidak berlaku untuknya.

-- ---------- 2) water_orders: batasi kolom saat insert publik ----------
drop policy if exists "publik buat pesanan air" on water_orders;
create policy "publik buat pesanan air" on water_orders for insert
  with check (
    status = 'baru'
    and dibayar = false
    and harga is null
    and assigned_kurir_id is null
  );

-- ---------- 3) laundry_orders: batasi kolom saat insert publik ----------
drop policy if exists "publik/karyawan buat pesanan laundry" on laundry_orders;
create policy "publik/karyawan buat pesanan laundry" on laundry_orders for insert
  with check (
    status = 'baru'
    and dibayar = false
    and harga is null
    and ongkir = 0
    and assigned_staff_id is null
    and assigned_kurir_id is null
    and assigned_kurir_jemput_id is null
  );

-- ---------- 4) leads: batasi status awal saat insert publik ----------
drop policy if exists "publik daftar lead" on leads;
create policy "publik daftar lead" on leads for insert
  with check (status = 'baru');

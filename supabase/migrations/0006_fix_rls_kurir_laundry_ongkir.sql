-- =========================================================
-- 0006 — perbaikan RLS agar staff depot bisa pilih kurir,
-- tambah fitur antar-jemput & ongkir untuk laundry
-- =========================================================

-- staff depot & staff laundry perlu lihat daftar kurir untuk menugaskan pengantaran
drop policy if exists "staff lihat kurir" on profiles;
create policy "staff lihat kurir" on profiles for select
  using (my_role() in ('staff_depot', 'staff_laundry') and role = 'kurir');

-- kolom antar-jemput & ongkir untuk laundry (disesuaikan admin per pesanan)
alter table laundry_orders add column if not exists ongkir numeric(12,2) not null default 0;
alter table laundry_orders add column if not exists antar_jemput boolean not null default false;
alter table laundry_orders add column if not exists assigned_kurir_id uuid references profiles(id) on delete set null;

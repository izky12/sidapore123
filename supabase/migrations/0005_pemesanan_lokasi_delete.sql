-- =========================================================
-- 0005 — perbaikan alur pemesanan kos, alur verifikasi galon,
-- fitur lokasi layanan, dan dukungan hapus user permanen
-- =========================================================

-- ---------- 1) leads: hubungkan pendaftaran kos ke kamar yang dipilih ----------
alter table leads add column if not exists kos_room_id uuid references kos_rooms(id) on delete set null;

-- ---------- 2) status baru untuk alur verifikasi pesanan galon ----------
-- baru -> diverifikasi (staff depot) -> ditugaskan (limpah ke kurir) -> dikirim (kurir antar)
-- -> terkirim (verifikasi kurir) -> selesai (verifikasi akhir staff depot, masuk ke admin)
alter type order_status add value if not exists 'diverifikasi';
alter type order_status add value if not exists 'ditugaskan';
alter type order_status add value if not exists 'terkirim';

-- ---------- 3) tabel lokasi layanan (tampil ke calon pelanggan) ----------
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  kategori text not null default 'depot', -- depot | kos | laundry
  nama text not null,
  alamat text not null,
  maps_link text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

alter table locations enable row level security;

drop policy if exists "publik lihat lokasi aktif" on locations;
create policy "publik lihat lokasi aktif" on locations for select
  using (aktif = true or my_role() = 'admin');

drop policy if exists "admin kelola lokasi" on locations for all;
drop policy if exists "admin kelola lokasi" on locations;
create policy "admin kelola lokasi" on locations for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- ---------- 4) longgarkan foreign key agar profil/user bisa dihapus permanen ----------
alter table water_orders drop constraint if exists water_orders_customer_id_fkey;
alter table water_orders add constraint water_orders_customer_id_fkey
  foreign key (customer_id) references profiles(id) on delete set null;

alter table water_orders drop constraint if exists water_orders_assigned_kurir_id_fkey;
alter table water_orders add constraint water_orders_assigned_kurir_id_fkey
  foreign key (assigned_kurir_id) references profiles(id) on delete set null;

alter table laundry_orders drop constraint if exists laundry_orders_customer_id_fkey;
alter table laundry_orders add constraint laundry_orders_customer_id_fkey
  foreign key (customer_id) references profiles(id) on delete set null;

alter table laundry_orders drop constraint if exists laundry_orders_assigned_staff_id_fkey;
alter table laundry_orders add constraint laundry_orders_assigned_staff_id_fkey
  foreign key (assigned_staff_id) references profiles(id) on delete set null;

alter table kos_payments drop constraint if exists kos_payments_dicatat_oleh_fkey;
alter table kos_payments add constraint kos_payments_dicatat_oleh_fkey
  foreign key (dicatat_oleh) references profiles(id) on delete set null;

alter table transactions drop constraint if exists transactions_created_by_fkey;
alter table transactions add constraint transactions_created_by_fkey
  foreign key (created_by) references profiles(id) on delete set null;

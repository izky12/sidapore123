-- =========================================================
-- 0008 — Pesanan laundry online: katalog layanan (admin-managed),
-- pilih dijemput kurir / antar sendiri, share lokasi jemput,
-- metode bayar QRIS / COD (bisa bayar saat jemput atau saat antar),
-- kurir jemput terpisah dari kurir antar, status "siap_diambil".
-- =========================================================

-- status baru: cucian selesai, menunggu diambil pelanggan / diantar kurir
alter type order_status add value if not exists 'siap_diambil';

-- ---------- katalog jenis layanan laundry (diatur admin) ----------
create table layanan_laundry (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  harga numeric(12,2),
  satuan text not null default 'kg',
  aktif boolean not null default true,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table layanan_laundry enable row level security;

create policy "publik lihat layanan aktif" on layanan_laundry for select
  using (aktif = true);
create policy "staff laundry lihat semua layanan" on layanan_laundry for select
  using (my_role() in ('admin','staff_laundry'));
create policy "admin kelola layanan" on layanan_laundry for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- ---------- kolom baru laundry_orders ----------
alter table laundry_orders add column if not exists layanan_id uuid references layanan_laundry(id) on delete set null;
alter table laundry_orders add column if not exists metode_ambil text not null default 'antar_sendiri'
  check (metode_ambil in ('dijemput','antar_sendiri'));
alter table laundry_orders add column if not exists lokasi_jemput text;
alter table laundry_orders add column if not exists bayar_saat text
  check (bayar_saat in ('jemput','antar'));
alter table laundry_orders add column if not exists assigned_kurir_jemput_id uuid references profiles(id) on delete set null;
alter table laundry_orders add column if not exists jemput_selesai boolean not null default true;
alter table laundry_orders add column if not exists via_online boolean not null default false;

-- ---------- kurir boleh update pesanan yang ditugaskan ke dirinya (jemput / antar) ----------
drop policy if exists "kurir update laundry ditugaskan" on laundry_orders;
create policy "kurir update laundry ditugaskan" on laundry_orders for update
  using (my_role() = 'kurir' and (assigned_kurir_jemput_id = auth.uid() or assigned_kurir_id = auth.uid()));

-- ---------- pemasukan laundry: penagih = siapa yang benar-benar terima uang ----------
create or replace function post_laundry_income() returns trigger as $$
declare
  v_created_by uuid;
begin
  if new.dibayar = true and old.dibayar is distinct from true and new.harga is not null then
    v_created_by := case
      when new.bayar_saat = 'jemput' then coalesce(new.assigned_kurir_jemput_id, new.assigned_staff_id)
      else coalesce(new.assigned_kurir_id, new.assigned_staff_id, new.assigned_kurir_jemput_id)
    end;
    insert into transactions (sumber, jenis, jumlah, deskripsi, referensi_id, created_by, metode_bayar)
    values (
      'laundry', 'masuk', new.harga + coalesce(new.ongkir, 0), 'Laundry - ' || new.nama, new.id,
      v_created_by, coalesce(new.metode_bayar, 'tunai')
    );
  end if;
  return new;
end; $$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_laundry_income on laundry_orders;
create trigger trg_laundry_income
  after update on laundry_orders
  for each row execute procedure post_laundry_income();

-- seed contoh layanan (admin bisa edit/hapus lewat panel)
insert into layanan_laundry (nama, harga, satuan, urutan) values
  ('Cuci + Setrika', 8000, 'kg', 1),
  ('Cuci Basah (tanpa setrika)', 6000, 'kg', 2),
  ('Setrika Saja', 5000, 'kg', 3),
  ('Cuci Sepatu', 25000, 'pasang', 4);

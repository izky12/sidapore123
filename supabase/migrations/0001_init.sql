-- =========================================================
-- SIDAPORE — skema awal (Depot Isi Ulang, Kos-kosan, Laundry)
-- Jalankan di Supabase SQL Editor / supabase db push
-- =========================================================

-- ---------- ENUM ----------
create type user_role as enum ('admin', 'staff_depot', 'staff_laundry', 'kurir', 'customer');
create type order_status as enum ('baru', 'diproses', 'dikirim', 'selesai', 'batal');
create type lead_jenis as enum ('kos', 'laundry', 'depot');
create type lead_status as enum ('baru', 'dihubungi', 'deal', 'batal');
create type tx_sumber as enum ('kos', 'laundry', 'depot', 'lainnya');
create type tx_jenis as enum ('masuk', 'keluar');
create type kos_status as enum ('aktif', 'nonaktif');

-- ---------- PROFILES (1 baris per auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'customer',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Auto-create profile saat user baru daftar (default role customer)
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Pelanggan'),
    new.raw_user_meta_data->>'phone',
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- LEADS (pendaftaran pelanggan baru: kos / laundry / depot) ----------
create table leads (
  id uuid primary key default gen_random_uuid(),
  jenis lead_jenis not null,
  nama text not null,
  no_wa text not null,
  alamat text,
  catatan text,
  status lead_status not null default 'baru',
  created_at timestamptz not null default now()
);

-- ---------- WATER ORDERS (pesan galon) ----------
create table water_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  nama text not null,
  no_wa text not null,
  lokasi_maps text not null, -- link share lokasi Google Maps
  jumlah_galon int not null default 1,
  catatan text,
  harga numeric(12,2),
  status order_status not null default 'baru',
  assigned_kurir_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  diproses_at timestamptz,
  dikirim_at timestamptz,
  selesai_at timestamptz
);

-- ---------- LAUNDRY ORDERS ----------
create table laundry_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  nama text not null,
  no_wa text not null,
  jenis_layanan text not null default 'Cuci + Setrika',
  berat_kg numeric(6,2),
  harga numeric(12,2),
  catatan text,
  status order_status not null default 'baru',
  assigned_staff_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  selesai_at timestamptz
);

-- ---------- KOS: PENYEWA ----------
create table kos_tenants (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  no_wa text not null,
  no_kamar text not null,
  harga_bulanan numeric(12,2) not null,
  tgl_masuk date not null default current_date,
  status kos_status not null default 'aktif',
  created_at timestamptz not null default now()
);

-- ---------- KOS: PEMBAYARAN ----------
create table kos_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references kos_tenants(id) on delete cascade,
  periode text not null, -- format 'YYYY-MM'
  jumlah numeric(12,2) not null,
  tgl_bayar date not null default current_date,
  dicatat_oleh uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- KEUANGAN (ledger gabungan, sumber kebenaran laporan admin) ----------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  sumber tx_sumber not null,
  jenis tx_jenis not null,
  jumlah numeric(12,2) not null,
  deskripsi text,
  referensi_id uuid, -- id water_orders / laundry_orders / kos_payments (bebas, tanpa FK ketat)
  tgl date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- Auto-posting ke transactions saat order selesai / pembayaran kos dicatat
-- =========================================================
create function post_water_income() returns trigger as $$
begin
  if new.status = 'selesai' and old.status is distinct from 'selesai' and new.harga is not null then
    insert into transactions (sumber, jenis, jumlah, deskripsi, referensi_id, created_by)
    values ('depot', 'masuk', new.harga, 'Isi ulang galon - ' || new.nama, new.id, new.assigned_kurir_id);
  end if;
  return new;
end; $$ language plpgsql security definer set search_path = public;

create trigger trg_water_income
  after update on water_orders
  for each row execute procedure post_water_income();

create function post_laundry_income() returns trigger as $$
begin
  if new.status = 'selesai' and old.status is distinct from 'selesai' and new.harga is not null then
    insert into transactions (sumber, jenis, jumlah, deskripsi, referensi_id, created_by)
    values ('laundry', 'masuk', new.harga, 'Laundry - ' || new.nama, new.id, new.assigned_staff_id);
  end if;
  return new;
end; $$ language plpgsql security definer set search_path = public;

create trigger trg_laundry_income
  after update on laundry_orders
  for each row execute procedure post_laundry_income();

create function post_kos_income() returns trigger as $$
begin
  insert into transactions (sumber, jenis, jumlah, deskripsi, referensi_id, created_by)
  values ('kos', 'masuk', new.jumlah, 'Sewa kos periode ' || new.periode, new.id, new.dicatat_oleh);
  return new;
end; $$ language plpgsql security definer set search_path = public;

create trigger trg_kos_income
  after insert on kos_payments
  for each row execute procedure post_kos_income();

-- =========================================================
-- HELPER: ambil role user yang sedang login
-- =========================================================
create function my_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table leads enable row level security;
alter table water_orders enable row level security;
alter table laundry_orders enable row level security;
alter table kos_tenants enable row level security;
alter table kos_payments enable row level security;
alter table transactions enable row level security;

-- ---- profiles ----
create policy "lihat profil sendiri" on profiles for select using (id = auth.uid());
create policy "admin lihat semua profil" on profiles for select using (my_role() = 'admin');
create policy "admin kelola staff" on profiles for insert with check (my_role() = 'admin');
create policy "admin update role" on profiles for update using (my_role() = 'admin');
create policy "user update profil sendiri" on profiles for update using (id = auth.uid());

-- ---- leads: publik boleh insert (form pendaftaran tanpa login), hanya admin boleh lihat ----
create policy "publik daftar lead" on leads for insert with check (true);
create policy "admin lihat leads" on leads for select using (my_role() = 'admin');
create policy "admin update leads" on leads for update using (my_role() = 'admin');

-- ---- water_orders ----
create policy "publik buat pesanan air" on water_orders for insert with check (true);
create policy "customer lihat pesanan sendiri" on water_orders for select
  using (customer_id = auth.uid());
create policy "staff depot & kurir & admin lihat semua pesanan air" on water_orders for select
  using (my_role() in ('admin','staff_depot','kurir'));
create policy "staff depot & admin update pesanan air" on water_orders for update
  using (my_role() in ('admin','staff_depot'));
create policy "kurir update status kirim" on water_orders for update
  using (my_role() = 'kurir' and assigned_kurir_id = auth.uid());

-- ---- laundry_orders ----
create policy "publik/karyawan buat pesanan laundry" on laundry_orders for insert with check (true);
create policy "customer lihat laundry sendiri" on laundry_orders for select
  using (customer_id = auth.uid());
create policy "staff laundry & admin lihat semua laundry" on laundry_orders for select
  using (my_role() in ('admin','staff_laundry'));
create policy "staff laundry & admin update laundry" on laundry_orders for update
  using (my_role() in ('admin','staff_laundry'));

-- ---- kos_tenants & kos_payments: admin only (data sensitif keuangan) ----
create policy "admin kelola kos_tenants" on kos_tenants for all
  using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin kelola kos_payments" on kos_payments for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- ---- transactions: admin only ----
create policy "admin lihat transactions" on transactions for select using (my_role() = 'admin');
create policy "system insert transactions" on transactions for insert with check (true);

-- =========================================================
-- SEED contoh akun admin: buat manual lewat Supabase Auth,
-- lalu jalankan ini untuk menaikkan role-nya jadi admin:
--   update profiles set role = 'admin' where id = '<UUID_USER>';
-- =========================================================

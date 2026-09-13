-- =========================================================
-- SIDAPORE — tambahan: pembayaran laundry & rekonsiliasi kas harian
-- Jalankan setelah 0001_init.sql
-- =========================================================

create type metode_bayar as enum ('tunai', 'digital');
create type verifikasi_status as enum ('menunggu', 'cocok', 'selisih');

-- ---------- Tandai pembayaran di laundry_orders ----------
alter table laundry_orders
  add column metode_bayar metode_bayar,
  add column dibayar boolean not null default false,
  add column dibayar_at timestamptz;

-- ---------- SETORAN KAS HARIAN (per staff, per tanggal) ----------
create table setoran_kas (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references profiles(id),
  tanggal date not null default current_date,
  kas_fisik numeric(12,2) not null,      -- hasil hitung uang tunai fisik oleh staff
  kas_sistem numeric(12,2),               -- otomatis: total tunai tercatat sistem hari itu
  selisih numeric(12,2) generated always as (kas_fisik - coalesce(kas_sistem, 0)) stored,
  catatan text,                           -- catatan dari staff (opsional)
  status verifikasi_status not null default 'menunggu',
  catatan_verifikasi text,
  diverifikasi_oleh uuid references profiles(id),
  diverifikasi_at timestamptz,
  created_at timestamptz not null default now(),
  unique (staff_id, tanggal)
);

-- Hitung otomatis total kas tunai sistem untuk staff pada tanggal tertentu.
-- Saat ini hanya menghitung dari laundry_orders (staff laundry menerima bayaran tunai).
-- Bisa diperluas ke water_orders bila kurir juga menyetor kas nanti.
create function hitung_kas_sistem(p_staff uuid, p_tanggal date) returns numeric as $$
  select coalesce(sum(harga), 0)
  from laundry_orders
  where assigned_staff_id = p_staff
    and metode_bayar = 'tunai'
    and dibayar = true
    and dibayar_at::date = p_tanggal;
$$ language sql stable security definer set search_path = public;

create function set_kas_sistem() returns trigger as $$
begin
  if new.kas_sistem is null then
    new.kas_sistem := hitung_kas_sistem(new.staff_id, new.tanggal);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_set_kas_sistem
  before insert on setoran_kas
  for each row execute procedure set_kas_sistem();

-- ---------- RLS ----------
alter table setoran_kas enable row level security;

create policy "staff lihat setoran sendiri" on setoran_kas for select
  using (staff_id = auth.uid());
create policy "staff buat setoran sendiri" on setoran_kas for insert
  with check (staff_id = auth.uid());
create policy "admin lihat semua setoran" on setoran_kas for select
  using (my_role() = 'admin');
create policy "admin verifikasi setoran" on setoran_kas for update
  using (my_role() = 'admin');

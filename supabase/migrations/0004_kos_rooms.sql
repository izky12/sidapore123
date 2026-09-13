-- =========================================================
-- KAMAR KOS — inventaris kamar untuk ditampilkan realtime ke publik
-- (terpisah dari kos_tenants yang berisi data penyewa/keuangan, admin-only)
-- =========================================================

create type kos_room_status as enum ('tersedia', 'terisi', 'maintenance');

create table kos_rooms (
  id uuid primary key default gen_random_uuid(),
  no_kamar text not null unique,
  tipe text,
  harga_bulanan numeric(12,2) not null,
  fasilitas text,
  status kos_room_status not null default 'tersedia',
  updated_at timestamptz not null default now()
);

alter table kos_rooms enable row level security;

-- publik boleh lihat daftar & status kamar (untuk cek ketersediaan realtime)
create policy "publik lihat kamar" on kos_rooms for select using (true);

-- hanya admin yang boleh tambah/ubah/hapus kamar
create policy "admin kelola kamar" on kos_rooms for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- trigger: update updated_at tiap kali status/data berubah
create function touch_kos_room() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

create trigger trg_touch_kos_room
  before update on kos_rooms
  for each row execute procedure touch_kos_room();

-- aktifkan Supabase Realtime untuk tabel ini
alter publication supabase_realtime add table kos_rooms;

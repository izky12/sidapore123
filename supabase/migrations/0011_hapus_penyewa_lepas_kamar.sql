-- =========================================================
-- 0011 — Saat data penyewa DIHAPUS, kamar otomatis balik "tersedia"
-- lagi (kalau tadinya terisi oleh penyewa itu). Riwayat pembayaran
-- (kos_payments) sudah otomatis ikut terhapus karena FK-nya
-- "on delete cascade" (lihat 0001_init.sql) — jadi tidak perlu
-- migration tambahan untuk itu, database tidak menumpuk data usang.
-- =========================================================

create or replace function release_kos_room_on_delete() returns trigger as $$
begin
  if old.room_id is not null then
    update kos_rooms set status = 'tersedia' where id = old.room_id and status = 'terisi';
  end if;
  return old;
end; $$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_release_kos_room_on_delete on kos_tenants;
create trigger trg_release_kos_room_on_delete
  after delete on kos_tenants
  for each row execute procedure release_kos_room_on_delete();

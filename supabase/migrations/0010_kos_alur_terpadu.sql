-- =========================================================
-- 0010 — Menyatukan alur kos: Pendaftaran (leads) & Data Penyewa
-- (kos_tenants) sekarang SELALU terhubung ke kos_rooms lewat room_id,
-- dan status kamar (tersedia/terisi) di-sync OTOMATIS oleh trigger —
-- bukan lagi 2 tempat terpisah yang harus diisi manual satu-satu.
--
-- Alur final: cek ketersediaan (/kamar) -> daftar minat / ketemu
-- langsung -> bayar di tempat -> admin catat penyewa & pembayaran
-- (ini konfirmasinya) -> otomatis masuk kas (transactions) -> selesai.
-- =========================================================

alter table kos_tenants add column if not exists room_id uuid references kos_rooms(id);
alter table kos_tenants add column if not exists dari_lead_id uuid references leads(id);

-- best-effort backfill data lama: cocokkan lewat no_kamar
update kos_tenants t set room_id = r.id
from kos_rooms r
where t.room_id is null and t.no_kamar = r.no_kamar;

-- ---------------------------------------------------------
-- Trigger: status kos_rooms mengikuti status kos_tenants,
-- supaya "Tambah Penyewa" manual maupun "Deal" dari Pendaftaran
-- SAMA-SAMA otomatis menandai kamar terisi/tersedia lagi.
-- ---------------------------------------------------------
create or replace function sync_kos_room_status() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if new.room_id is not null and new.status = 'aktif' then
      update kos_rooms set status = 'terisi' where id = new.room_id;
    end if;
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if new.status = 'nonaktif' and old.status is distinct from 'nonaktif' and new.room_id is not null then
      update kos_rooms set status = 'tersedia' where id = new.room_id and status = 'terisi';
    elsif new.status = 'aktif' and old.status is distinct from 'aktif' and new.room_id is not null then
      update kos_rooms set status = 'terisi' where id = new.room_id;
    end if;
    return new;
  end if;

  return new;
end; $$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_sync_kos_room_status on kos_tenants;
create trigger trg_sync_kos_room_status
  after insert or update on kos_tenants
  for each row execute procedure sync_kos_room_status();

-- cegah kamar yang sama di-deal-kan dua kali jadi 2 penyewa aktif
create unique index if not exists kos_tenants_satu_penyewa_aktif_per_kamar
  on kos_tenants (room_id) where (status = 'aktif' and room_id is not null);

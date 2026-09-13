-- =========================================================
-- 0014 — Fitur upload APK oleh admin, supaya user bisa
-- download aplikasi Android Sidapore langsung dari web.
-- =========================================================

-- Bucket khusus, public (supaya link download bisa diakses siapa saja
-- tanpa login) — tapi upload/hapus HANYA lewat API admin (service role
-- key), jadi tidak perlu bikin policy insert/update/delete untuk publik.
insert into storage.buckets (id, name, public)
values ('apk', 'apk', true)
on conflict (id) do nothing;

drop policy if exists "publik boleh baca file apk" on storage.objects;
create policy "publik boleh baca file apk"
  on storage.objects for select
  using (bucket_id = 'apk');

-- Metadata rilis terbaru (versi, ukuran, kapan diupload, nama file asli).
-- File .apk fisiknya di Storage; tabel ini cuma untuk info tampilan.
create table if not exists app_releases (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  original_name text not null,
  version_label text,
  size_bytes bigint not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table app_releases enable row level security;

drop policy if exists "publik boleh lihat riwayat rilis" on app_releases;
create policy "publik boleh lihat riwayat rilis"
  on app_releases for select
  using (true);
-- insert/delete tabel ini hanya lewat API admin (service role key),
-- jadi tidak perlu policy insert/update/delete untuk role lain.

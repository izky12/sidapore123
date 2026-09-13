-- =========================================================
-- SITE SETTINGS — kode verifikasi Google Search Console + kunci akses
-- (versi perbaikan: pgcrypto di Supabase ada di skema "extensions",
--  bukan "public", jadi crypt()/gen_salt() harus di-qualify)
-- =========================================================

drop function if exists set_google_verification(text);
drop function if exists verify_seo_lock(text);
drop table if exists site_settings;

create extension if not exists pgcrypto with schema extensions;

create table site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- value awal kosong; ganti lewat halaman /admin/seo (perlu kunci)
-- kunci disimpan dalam bentuk hash (bcrypt), TIDAK dalam bentuk teks asli
insert into site_settings (key, value) values
  ('google_site_verification', ''),
  ('seo_lock_hash', extensions.crypt('Sidapore65463VT', extensions.gen_salt('bf')));

alter table site_settings enable row level security;

-- publik hanya boleh membaca tag verifikasi (untuk ditampilkan di <head>)
create policy "public read google verification"
  on site_settings for select
  using (key = 'google_site_verification');

-- fungsi verifikasi kunci — dipanggil dari server (API route), password asli tidak pernah disimpan
create function verify_seo_lock(pw text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from site_settings
    where key = 'seo_lock_hash' and value = extensions.crypt(pw, value)
  );
$$;

-- update nilai google_site_verification (dipanggil setelah kunci terverifikasi)
create function set_google_verification(new_value text)
returns void
language sql
security definer
set search_path = public
as $$
  update site_settings set value = new_value, updated_at = now()
  where key = 'google_site_verification';
$$;

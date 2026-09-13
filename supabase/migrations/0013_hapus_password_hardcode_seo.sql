-- =========================================================
-- 0013 — Hapus kunci SEO yang password-nya sempat tertulis mentah
-- di migration 0003 (celah keamanan: password bocor kalau file ini
-- pernah dibagikan/di-commit). Akses /admin/seo sudah dilindungi
-- oleh login admin asli (Supabase Auth + cek role di requireAdmin()),
-- jadi kunci tambahan ini redundan sekaligus merepotkan klien
-- (harus ingat 2 password). Diganti: cukup login admin, tanpa kunci
-- kedua sama sekali.
-- =========================================================

drop function if exists verify_seo_lock(text);

-- drop lalu buat ulang lebih aman daripada alter parsial,
-- karena tabel ini cuma berisi 1 baris data non-sensitif (tag verifikasi Google)
drop table if exists site_settings;

create table site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into site_settings (key, value) values
  ('google_site_verification', '');

alter table site_settings enable row level security;

create policy "public read google verification"
  on site_settings for select
  using (key = 'google_site_verification');

-- update nilai google_site_verification — dipanggil dari server (API route)
-- setelah requireAdmin() memastikan pemanggilnya benar admin yang login.
create or replace function set_google_verification(new_value text)
returns void
language sql
security definer
set search_path = public
as $$
  update site_settings set value = new_value, updated_at = now()
  where key = 'google_site_verification';
$$;

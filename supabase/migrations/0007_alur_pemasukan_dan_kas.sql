-- =========================================================
-- 0007 — Menyatukan alur pemasukan (kasir POS + pesanan air/laundry
-- yang lewat staff -> kurir -> staff -> admin) ke satu ledger
-- `transactions`, dan memperluas setor kas harian ke staff depot & kurir.
-- =========================================================

-- ---------- 1) kolom pembayaran untuk water_orders (mirror laundry) ----------
alter table water_orders add column if not exists metode_bayar metode_bayar;
alter table water_orders add column if not exists dibayar boolean not null default false;
alter table water_orders add column if not exists dibayar_at timestamptz;

-- ---------- 2) tandai metode bayar pada ledger transactions ----------
alter table transactions add column if not exists metode_bayar metode_bayar;

-- ---------- 3) posting otomatis dipicu oleh KONFIRMASI PEMBAYARAN (dibayar),
--    bukan sekadar perubahan status. created_by = siapa yang pegang uangnya
--    (kurir kalau COD diantar, staff kalau bayar di tempat / kasir).
-- =========================================================
create or replace function post_water_income() returns trigger as $$
begin
  if new.dibayar = true and old.dibayar is distinct from true and new.harga is not null then
    insert into transactions (sumber, jenis, jumlah, deskripsi, referensi_id, created_by, metode_bayar)
    values (
      'depot', 'masuk', new.harga, 'Isi ulang galon - ' || new.nama, new.id,
      coalesce(new.assigned_kurir_id, new.customer_id), coalesce(new.metode_bayar, 'tunai')
    );
  end if;
  return new;
end; $$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_water_income on water_orders;
create trigger trg_water_income
  after update on water_orders
  for each row execute procedure post_water_income();

create or replace function post_laundry_income() returns trigger as $$
begin
  if new.dibayar = true and old.dibayar is distinct from true and new.harga is not null then
    insert into transactions (sumber, jenis, jumlah, deskripsi, referensi_id, created_by, metode_bayar)
    values (
      'laundry', 'masuk', new.harga + coalesce(new.ongkir, 0), 'Laundry - ' || new.nama, new.id,
      coalesce(new.assigned_staff_id, new.assigned_kurir_id), coalesce(new.metode_bayar, 'tunai')
    );
  end if;
  return new;
end; $$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_laundry_income on laundry_orders;
create trigger trg_laundry_income
  after update on laundry_orders
  for each row execute procedure post_laundry_income();

-- ---------- 4) kas_sistem sekarang dihitung dari SATU sumber kebenaran
--    (ledger transactions) supaya penjualan kasir POS manual dan pemasukan
--    otomatis dari pesanan sama-sama terhitung, tidak lagi hanya laundry_orders.
-- =========================================================
create or replace function hitung_kas_sistem(p_staff uuid, p_tanggal date) returns numeric as $$
  select coalesce(sum(jumlah), 0)
  from transactions
  where created_by = p_staff
    and jenis = 'masuk'
    and metode_bayar = 'tunai'
    and tgl = p_tanggal;
$$ language sql stable security definer set search_path = public;

-- ---------- 5) setor kas harian kini berlaku untuk staff_depot & kurir juga,
--    tidak hanya staff_laundry (mereka juga pegang uang tunai COD).
-- =========================================================
drop policy if exists "staff buat setoran sendiri" on setoran_kas;
create policy "staff buat setoran sendiri" on setoran_kas for insert
  with check (staff_id = auth.uid() and my_role() in ('staff_depot','staff_laundry','kurir'));

-- ---------- 6) transactions: staff yang bersangkutan juga boleh lihat
--    transaksi miliknya sendiri (bukan cuma admin), untuk transparansi kasir.
-- =========================================================
drop policy if exists "staff lihat transaksi sendiri" on transactions;
create policy "staff lihat transaksi sendiri" on transactions for select
  using (created_by = auth.uid());

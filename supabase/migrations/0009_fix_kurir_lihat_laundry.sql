-- =========================================================
-- 0009 — fix: kurir tidak bisa lihat pesanan laundry yang
-- ditugaskan ke dirinya (belum ada policy SELECT untuk kurir,
-- hanya UPDATE, jadi query kurir selalu kosong).
-- =========================================================
drop policy if exists "kurir lihat laundry ditugaskan" on laundry_orders;
create policy "kurir lihat laundry ditugaskan" on laundry_orders for select
  using (my_role() = 'kurir' and (assigned_kurir_jemput_id = auth.uid() or assigned_kurir_id = auth.uid()));

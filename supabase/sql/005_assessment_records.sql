-- 評估紀錄主表（含所有量表欄位與 RLS）
-- 若表已存在則補齊缺少的欄位；若不存在則完整建立

create table if not exists public.assessment_records (
  id           uuid        primary key default gen_random_uuid(),
  resident_id  uuid        not null references public.residents(id) on delete cascade,
  created_at   timestamptz not null default now(),
  month_key    text        not null,             -- 'yyyy-mm'

  -- 基本量測
  weight_kg    numeric,
  eat10_score  int,
  mna_score    numeric,
  rsst_score   int,
  chewing_score int,
  spmsq_errors int,

  -- JSONB 欄位（舊量表遺留）
  swallow_screen jsonb,
  swallow_30s    jsonb,

  -- 護理評估（SPMSQ 全欄位、Pataka 等）
  nursing_data jsonb,

  -- 備註
  notes text
);

-- 補齊可能在早期建表時未加入的欄位
alter table public.assessment_records
  add column if not exists eat10_score   int,
  add column if not exists mna_score     numeric,
  add column if not exists rsst_score    int,
  add column if not exists chewing_score int,
  add column if not exists spmsq_errors  int,
  add column if not exists swallow_screen jsonb,
  add column if not exists swallow_30s   jsonb,
  add column if not exists nursing_data  jsonb,
  add column if not exists notes         text,
  add column if not exists weight_kg     numeric;

-- RLS
alter table public.assessment_records enable row level security;

-- 已登入使用者可查詢所有紀錄
drop policy if exists assessment_records_select_authenticated on public.assessment_records;
create policy assessment_records_select_authenticated
  on public.assessment_records
  for select
  to authenticated
  using (true);

-- 已登入使用者可新增紀錄
drop policy if exists assessment_records_insert_authenticated on public.assessment_records;
create policy assessment_records_insert_authenticated
  on public.assessment_records
  for insert
  to authenticated
  with check (true);

-- 已登入使用者可更新紀錄
drop policy if exists assessment_records_update_authenticated on public.assessment_records;
create policy assessment_records_update_authenticated
  on public.assessment_records
  for update
  to authenticated
  using (true);

-- 已登入使用者可刪除紀錄
drop policy if exists assessment_records_delete_authenticated on public.assessment_records;
create policy assessment_records_delete_authenticated
  on public.assessment_records
  for delete
  to authenticated
  using (true);

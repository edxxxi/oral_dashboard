create extension if not exists pgcrypto;

-- 評估量表主檔
create table if not exists public.assessment_scales (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 評估量表題目
create table if not exists public.assessment_scale_items (
  id uuid primary key default gen_random_uuid(),
  scale_id uuid not null references public.assessment_scales(id) on delete cascade,
  item_no int not null,
  prompt text not null,
  help_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scale_id, item_no)
);

-- 評估量表選項（可選；像 RSST 這種數值輸入量表可不放）
create table if not exists public.assessment_scale_options (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.assessment_scale_items(id) on delete cascade,
  option_no int not null,
  label text not null,
  score numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, option_no)
);

drop trigger if exists trg_assessment_scales_updated_at on public.assessment_scales;
create trigger trg_assessment_scales_updated_at
before update on public.assessment_scales
for each row execute function public.set_updated_at();

drop trigger if exists trg_assessment_scale_items_updated_at on public.assessment_scale_items;
create trigger trg_assessment_scale_items_updated_at
before update on public.assessment_scale_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_assessment_scale_options_updated_at on public.assessment_scale_options;
create trigger trg_assessment_scale_options_updated_at
before update on public.assessment_scale_options
for each row execute function public.set_updated_at();

alter table public.assessment_scales enable row level security;
alter table public.assessment_scale_items enable row level security;
alter table public.assessment_scale_options enable row level security;

drop policy if exists assessment_scales_select_authenticated on public.assessment_scales;
create policy assessment_scales_select_authenticated
on public.assessment_scales
for select
to authenticated
using (true);

drop policy if exists assessment_scale_items_select_authenticated on public.assessment_scale_items;
create policy assessment_scale_items_select_authenticated
on public.assessment_scale_items
for select
to authenticated
using (true);

drop policy if exists assessment_scale_options_select_authenticated on public.assessment_scale_options;
create policy assessment_scale_options_select_authenticated
on public.assessment_scale_options
for select
to authenticated
using (true);

-- ===== 量表主檔 =====
insert into public.assessment_scales (code, name, description)
values
  ('EAT10', 'EAT-10 吞嚥能力篩檢', '10 題，單題 0-4 分，總分 >= 3 為吞嚥障礙風險'),
  ('MNA_SF', 'MNA-SF 簡易營養篩檢表', '6 題，滿分 14 分，總分 <= 11 為營養不良風險'),
  ('SPMSQ', 'SPMSQ 簡易精神狀態檢查', '10 題，依教育程度以答錯題數判定認知狀態'),
  ('RSST', 'RSST 重複唾液吞嚥測試', '30 秒吞嚥次數，<= 2 次為吞嚥障礙風險')
on conflict (code) do update
set name = excluded.name,
    description = excluded.description;

-- ===== EAT-10 =====
insert into public.assessment_scale_items (scale_id, item_no, prompt)
select s.id, v.item_no, v.prompt
from public.assessment_scales s
join (
  values
    (1, '吞嚥問題讓我的體重減輕(嚴重者需加做 MNA-SF)'),
    (2, '因為吞嚥問題不能在外面用餐'),
    (3, '我喝飲料/水很費力'),
    (4, '我吃固體食物很費力'),
    (5, '我吞藥丸很費力'),
    (6, '吞嚥會感覺到痛'),
    (7, '因為吞嚥問題不能享受用餐'),
    (8, '吞嚥後感覺喉嚨有食物卡著(嚴重者需加做 MNA-SF)'),
    (9, '當我進食的時候會咳嗽(嚴重者需加做 MNA-SF)'),
    (10, '吞嚥讓我感覺緊張有壓力')
) as v(item_no, prompt) on true
where s.code = 'EAT10'
on conflict (scale_id, item_no) do update
set prompt = excluded.prompt;

insert into public.assessment_scale_options (item_id, option_no, label, score)
select i.id, v.option_no, v.label, v.score
from public.assessment_scale_items i
join public.assessment_scales s on s.id = i.scale_id
join (
  values
    (1, '沒有', 0),
    (2, '很少', 1),
    (3, '偶爾', 2),
    (4, '經常', 3),
    (5, '嚴重', 4)
) as v(option_no, label, score) on true
where s.code = 'EAT10'
on conflict (item_id, option_no) do update
set label = excluded.label,
    score = excluded.score;

-- ===== MNA-SF =====
insert into public.assessment_scale_items (scale_id, item_no, prompt)
select s.id, v.item_no, v.prompt
from public.assessment_scales s
join (
  values
    (1, '三個月內有沒有因為食慾不振、消化問題、咀嚼或吞嚥困難而減少食量'),
    (2, '三個月內體重下降的情況'),
    (3, '活動能力'),
    (4, '三個月內有沒有受到心理創傷或患上急性疾病'),
    (5, '精神心理問題'),
    (6, '身體質量指數 (BMI) (kg/m²)')
) as v(item_no, prompt) on true
where s.code = 'MNA_SF'
on conflict (scale_id, item_no) do update
set prompt = excluded.prompt;

insert into public.assessment_scale_options (item_id, option_no, label, score)
select i.id, v.option_no, v.label, v.score
from public.assessment_scale_items i
join public.assessment_scales s on s.id = i.scale_id
join (
  values
    (1, 1, '食量嚴重減少', 0),
    (1, 2, '食量中度減少', 1),
    (1, 3, '食量沒有改變', 2),
    (2, 1, '體重下降超過 3 公斤', 0),
    (2, 2, '不知道', 1),
    (2, 3, '體重下降 1―3 公斤', 2),
    (2, 4, '體重沒有下降', 3),
    (3, 1, '需長期臥床或坐輪椅', 0),
    (3, 2, '可以下床或離開輪椅，但不能外出', 1),
    (3, 3, '可以外出', 2),
    (4, 1, '有', 0),
    (4, 2, '沒有', 2),
    (5, 1, '嚴重癡呆或抑鬱', 0),
    (5, 2, '輕度癡呆', 1),
    (5, 3, '沒有精神心理問題', 2),
    (6, 1, 'BMI 低於 19', 0),
    (6, 2, 'BMI 19 至低於 21', 1),
    (6, 3, 'BMI 21 至低於 23', 2),
    (6, 4, 'BMI 相等或大於 23', 3)
) as v(item_no, option_no, label, score)
  on v.item_no = i.item_no
where s.code = 'MNA_SF'
on conflict (item_id, option_no) do update
set label = excluded.label,
    score = excluded.score;

-- ===== SPMSQ =====
insert into public.assessment_scale_items (scale_id, item_no, prompt, help_text)
select s.id, v.item_no, v.prompt, '答錯請勾選；總錯誤題數依教育程度判定'
from public.assessment_scales s
join (
  values
    (1, '今天是幾年幾月幾日？'),
    (2, '今天是星期幾？'),
    (3, '這裡是什麼地方？'),
    (4, '你的電話號碼是幾號？ (或 4A. 你住在什麼地方？)'),
    (5, '你幾歲了？'),
    (6, '你的生日是哪一天？'),
    (7, '現任總統是誰？'),
    (8, '前任總統是誰？'),
    (9, '你媽媽叫什麼名字？'),
    (10, '從 20 減 3 開始算，一直減下去。')
) as v(item_no, prompt) on true
where s.code = 'SPMSQ'
on conflict (scale_id, item_no) do update
set prompt = excluded.prompt,
    help_text = excluded.help_text;

insert into public.assessment_scale_options (item_id, option_no, label, score)
select i.id, v.option_no, v.label, v.score
from public.assessment_scale_items i
join public.assessment_scales s on s.id = i.scale_id
join (
  values
    (1, '答對', 0),
    (2, '答錯', 1)
) as v(option_no, label, score) on true
where s.code = 'SPMSQ'
on conflict (item_id, option_no) do update
set label = excluded.label,
    score = excluded.score;

-- ===== RSST =====
insert into public.assessment_scale_items (scale_id, item_no, prompt, help_text)
select s.id, 1, '30 秒內喉結上下移動（吞嚥）次數', '若次數 <= 2，判定可能有吞嚥障礙風險'
from public.assessment_scales s
where s.code = 'RSST'
on conflict (scale_id, item_no) do update
set prompt = excluded.prompt,
    help_text = excluded.help_text;

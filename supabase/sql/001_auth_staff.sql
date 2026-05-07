-- 1) 工作人員帳號資料（角色/啟用狀態）
create table if not exists public.staff_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'nurse', 'dietitian', 'caregiver', 'slp')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_staff_accounts_updated_at on public.staff_accounts;
create trigger trg_staff_accounts_updated_at
before update on public.staff_accounts
for each row execute function public.set_updated_at();

-- 2) RLS：一般使用者只看自己；主管可看全部
alter table public.staff_accounts enable row level security;

drop policy if exists staff_select_own on public.staff_accounts;
create policy staff_select_own
on public.staff_accounts
for select
to authenticated
using (auth.uid() = id);

drop policy if exists staff_select_admin_all on public.staff_accounts;
create policy staff_select_admin_all
on public.staff_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.staff_accounts s
    where s.id = auth.uid()
      and s.role = 'admin'
      and s.active = true
  )
);

-- 3) 建立第一個主管（先在 Supabase Dashboard > Auth 建立使用者）
-- 將下列 email/name 換成你的主管帳號資料後執行一次。
-- insert into public.staff_accounts (id, email, name, role, active)
-- select id, email, '主管', 'admin', true
-- from auth.users
-- where email = 'admin@your-domain.com'
-- on conflict (id) do update
-- set email = excluded.email,
--     name = excluded.name,
--     role = excluded.role,
--     active = excluded.active;

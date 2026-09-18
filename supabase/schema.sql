-- 팀 프로젝트 역할 분담 앱 - Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 그대로 실행하세요.

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  title text not null,
  description text,
  assignee_ids uuid[] not null default '{}',
  due_date date,
  priority text check (priority in ('high', 'medium', 'low')),
  link text,
  status text not null check (status in ('todo', 'in_progress', 'done')) default 'todo',
  position integer not null default 0,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_team_idx on members (team_id);
-- 팀 내 동일 이름(대소문자 무시) 중복 등록 방지 (레이스 컨디션으로 인한 이중 클릭 등에도 안전)
create unique index if not exists members_team_id_lower_name_key on members (team_id, lower(name));
create index if not exists cards_team_status_idx on cards (team_id, status, position);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cards_set_updated_at on cards;
create trigger cards_set_updated_at
before update on cards
for each row execute function set_updated_at();

-- ---------- Realtime ----------
-- 카드/팀원 변경 사항을 다른 팀원 화면에 즉시 전파하기 위해 Realtime publication에 추가한다.
-- ALTER PUBLICATION ... ADD TABLE은 IF NOT EXISTS를 지원하지 않으므로, 이미 등록된 경우
-- 에러 없이 건너뛰도록 존재 여부를 먼저 확인한다 (재실행 시에도 안전하게 하기 위함).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cards'
  ) then
    alter publication supabase_realtime add table cards;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'members'
  ) then
    alter publication supabase_realtime add table members;
  end if;
end $$;

-- ---------- Row Level Security ----------
-- 이 앱은 로그인 없이 "추측 불가능한 초대 코드"로 팀 데이터를 보호한다 (PRD 비기능 요구사항).
-- teams 테이블은 invite_code로 전체 스캔되지 않도록 직접 SELECT를 막고,
-- 아래 RPC 함수(get_team_by_invite_code)를 통해서만 조회하도록 한다.
-- team_id(uuid)를 알고 있다는 사실 자체를 "초대 링크를 받은 사람"의 증표로 취급해
-- members/cards는 team_id 기준으로 anon 접근을 허용한다.

alter table teams enable row level security;
alter table members enable row level security;
alter table cards enable row level security;

drop policy if exists teams_insert_anyone on teams;
create policy teams_insert_anyone on teams
  for insert to anon, authenticated
  with check (true);

drop policy if exists teams_update_by_id on teams;
create policy teams_update_by_id on teams
  for update to anon, authenticated
  using (true)
  with check (true);

drop policy if exists members_select_by_team on members;
create policy members_select_by_team on members
  for select to anon, authenticated
  using (true);

drop policy if exists members_insert_by_team on members;
create policy members_insert_by_team on members
  for insert to anon, authenticated
  with check (true);

drop policy if exists members_delete_by_team on members;
create policy members_delete_by_team on members
  for delete to anon, authenticated
  using (true);

drop policy if exists cards_select_by_team on cards;
create policy cards_select_by_team on cards
  for select to anon, authenticated
  using (true);

drop policy if exists cards_insert_by_team on cards;
create policy cards_insert_by_team on cards
  for insert to anon, authenticated
  with check (true);

drop policy if exists cards_update_by_team on cards;
create policy cards_update_by_team on cards
  for update to anon, authenticated
  using (true)
  with check (true);

drop policy if exists cards_delete_by_team on cards;
create policy cards_delete_by_team on cards
  for delete to anon, authenticated
  using (true);

-- ---------- RPC: invite_code로 팀 조회 ----------
-- teams 테이블에 직접 SELECT 정책을 주지 않는 대신, invite_code가 정확히 일치할 때만
-- id/name을 반환하는 함수를 anon에게 노출한다. 이렇게 하면 전체 팀 목록 스캔을 막을 수 있다.
create or replace function get_team_by_invite_code(p_invite_code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select id, name from teams where invite_code = p_invite_code;
$$;

revoke all on function get_team_by_invite_code(text) from public;
grant execute on function get_team_by_invite_code(text) to anon, authenticated;

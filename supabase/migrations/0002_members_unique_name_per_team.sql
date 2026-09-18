-- 마이그레이션: 팀 내 동일 이름(대소문자 무시) 중복 등록 방지
-- Supabase SQL Editor에서 실행하세요.

-- 1) 기존에 쌓인 중복 팀원 행을 정리한다 (team_id + 이름별로 가장 먼저 등록된 행만 남김).
delete from members m
using members dup
where m.team_id = dup.team_id
  and lower(m.name) = lower(dup.name)
  and (m.created_at, m.id) > (dup.created_at, dup.id);

-- 2) 앞으로의 중복 등록을 DB 레벨에서 막는다 (레이스 컨디션으로 인한 이중 클릭 등에도 안전).
create unique index if not exists members_team_id_lower_name_key
  on members (team_id, lower(name));

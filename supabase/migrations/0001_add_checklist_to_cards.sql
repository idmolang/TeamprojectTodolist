-- 마이그레이션: cards 테이블에 체크리스트(서브 할일) 컬럼 추가
-- 이미 schema.sql을 실행해 teams/members/cards가 만들어진 기존 프로젝트에서
-- Supabase SQL Editor에 이 파일만 실행하면 됩니다. (신규 설치는 schema.sql에 이미 반영되어 있어 불필요)

alter table cards
  add column if not exists checklist jsonb not null default '[]'::jsonb;

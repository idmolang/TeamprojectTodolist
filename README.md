# 팀 프로젝트 역할 분담 보드

PRD(`팀 프로젝트 역할 분담 앱 PRD.md`)의 1차 MVP 사양을 구현한 칸반 보드입니다. React + TypeScript + Vite로 만든 프론트엔드와 Supabase(Postgres + Realtime)를 백엔드로 사용하며, 로그인 없이 초대 링크 + 이름 입력만으로 참여할 수 있습니다.

## 기술 스택

- **프론트엔드**: React 19 + TypeScript, Vite
- **드래그앤드롭**: @dnd-kit/core, @dnd-kit/sortable (마우스/터치 모두 지원)
- **백엔드**: Supabase (Postgres, Realtime, RLS) — 별도 서버 코드 없이 클라이언트에서 직접 연동

## 시작하기

### 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. 프로젝트의 **SQL Editor**에서 [`supabase/schema.sql`](supabase/schema.sql) 내용을 그대로 실행합니다. (teams/members/cards 테이블, RLS 정책, Realtime publication, invite_code 조회용 RPC 함수가 생성됩니다.)
3. **Project Settings > API**에서 `Project URL`과 `anon public` 키를 확인합니다.

### 2. 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

## 사용 흐름

1. 첫 방문자는 팀 이름과 팀원 이름을 입력해 보드를 생성합니다 (`teams`, `members` 테이블에 저장).
2. 생성 직후 URL이 `?team=<초대코드>` 형태로 바뀌며, 이 링크를 팀원에게 공유합니다.
3. 링크로 들어온 팀원은 이름을 입력(또는 목록에서 선택)해 참여합니다. 목록에 없는 이름이면 신규 팀원 등록 여부를 확인합니다.
4. 보드에서 카드를 생성/수정/삭제하고, 드래그(모바일은 터치 드래그)로 칼럼 간 이동 및 순서 변경을 할 수 있습니다.
5. 모든 변경 사항은 Supabase Realtime을 통해 같은 보드를 보는 다른 팀원 화면에 즉시 반영됩니다.

## 마감일 강조 규칙

- D-2 이상 남음: 기본 카드
- D-1 ~ D-day: 노란색 경고 표시
- 마감 초과 + 미완료: 빨간색 강조 + "지연" 배지 (색맹 사용자를 위해 텍스트 배지 병행)
- 완료 칼럼으로 이동: 마감 초과 여부와 무관하게 강조 해제
- 마감일 미입력: "마감 미정" 라벨

계산은 서버 배치 없이 클라이언트에서 렌더링 시점마다 수행합니다 (`src/lib/urgency.ts`).

## 보안 관련 참고

이 앱은 회원가입 없는 소규모 팀 협업 도구라는 PRD 전제에 따라, **추측 불가능한 초대 코드/팀 ID를 사실상의 접근 토큰**으로 사용합니다. `teams` 테이블은 RLS로 직접 SELECT를 막고 `get_team_by_invite_code` RPC로만 조회하도록 해 전체 팀 목록 스캔을 방지했지만, 사용자 인증 기반의 세밀한 접근 제어는 아닙니다. 더 엄격한 보안이 필요하다면 Supabase Auth 도입을 권장합니다.

## 프로젝트 구조

```
src/
  types.ts              # 도메인 타입 (Team, Member, CardRecord ...)
  lib/                  # supabase 클라이언트, urgency 계산, 초대코드 생성 등
  hooks/
    useTeamResolver.ts  # 초대 링크 해석 + 팀 생성/참여 흐름
    useBoardData.ts      # 카드/팀원 fetch + Realtime 구독 + CRUD
  components/
    CreateTeamScreen.tsx
    JoinTeamScreen.tsx
    BoardScreen.tsx      # 헤더 + DnD 보드 조립
    Column.tsx / SortableCard.tsx / CardView.tsx
    CardModal.tsx / MemberModal.tsx
supabase/schema.sql      # 테이블 + RLS + Realtime + RPC
```

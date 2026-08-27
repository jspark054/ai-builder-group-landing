-- ─────────────────────────────────────────────────────────────
-- 0008 — 빌더 셀프 수정의 컬럼 단위 제한
--
-- ⚠️ 아직 적용하지 않았습니다. Supabase SQL Editor 에서 실행해야 합니다.
--
-- 🔴 **A-06(빌더 개인 관리) 착수 전에 반드시 적용합니다.**
--
-- 근거 — 데이터모델 §4.2 정책 표 · §4.3 컬럼 단위 제한 · REQ-F-062 · REQ-N-011 ·
--        REQ-N-013 · POL-08
--
-- ── 무엇이 열려 있었나 ────────────────────────────────────────
-- 0002 가 `builder_update_own` · `project_update_own` 을 만들어 빌더가 **자기 행**을
-- 고칠 수 있게 열어 두었습니다. 그런데 데이터모델 §4.2 는 거기서 **특정 컬럼을 빼라**고
-- 규정합니다.
--
--   builder : slug · cohort · is_public · is_pinned · pin_order
--   project : slug · is_public · sort_order
--
-- 이 제한이 0002 에 들어가지 못한 채 ⚠️ 미구현 블록으로 남아 있었습니다.
-- 지금까지는 **빌더 셀프 편집 화면이 없어서** 실제 경로가 닫혀 있었을 뿐이고,
-- A-06 이 그 문을 엽니다.
--
-- 무게가 가장 큰 것은 `is_public` 입니다 — 빌더가 자기 프로필을 스스로 공개로 켤 수
-- 있게 되면 「공개 여부는 운영 권한자가 정한다」(REQ-F-062 · POL-08)가 그대로 뚫립니다.
-- `slug` 는 발행 후 변경 금지라(REQ-N-013) 링크와 색인이 함께 죽습니다.
--
-- ── 왜 트리거인가 ────────────────────────────────────────────
-- §4.3 이 권장한 `GRANT UPDATE (컬럼목록)` 은 **Supabase 에서 쓸 수 없습니다.**
-- GRANT 는 롤 단위인데 관리자와 빌더가 **둘 다 `authenticated`** 입니다 —
-- 롤로 가를 수 없으니 컬럼 목록을 다르게 줄 방법이 없습니다.
--
-- RLS 로도 안 됩니다. 정책은 행 단위이고 `WITH CHECK` 는 NEW 만 보므로
-- 「이 컬럼이 **안 바뀌었는지**」를 판정하지 못합니다. OLD 를 볼 수 있는 곳은
-- BEFORE UPDATE 트리거뿐입니다.
--
-- ── 통과시키는 경우 두 가지 ──────────────────────────────────
--   1. 관리자 (`is_admin()`)     — 전체 수정 권한이 있습니다 (§4.2)
--   2. `service_role` 접속       — RLS 자체를 우회하는 서버 전용 경로입니다.
--                                  마이그레이션 · 시드 · 운영 스크립트가 여기 옵니다.
--
-- `current_user` 로 봅니다. PostgREST 가 요청마다 `SET LOCAL ROLE` 로 롤을 바꾸므로
-- 이 값이 `anon` · `authenticated` · `service_role` 중 하나입니다.
-- `auth.role()` 같은 헬퍼에 기대지 않는 이유는 버전에 따라 이름이 달라지기 때문입니다.
--
-- 🔴 **이 두 함수에 `security definer` 를 붙이면 안 됩니다.** 그러면 `current_user` 가
--    호출자가 아니라 **함수 소유자**(postgres)로 나와 `service_role` 판별이 통째로
--    무력화됩니다 — 모든 요청이 소유자로 보여 관리자·빌더 구분도 함께 무너집니다.
--    트리거는 NEW·OLD 만 읽으므로 승격이 필요 없습니다. `is_admin()` 은 그 자체가
--    security definer 라 여기서 그냥 불러도 동작합니다.
--
-- ⚠ 익명(anon)은 여기까지 오지 못합니다. `builder` · `project` 에 anon UPDATE 정책이
--   아예 없어 RLS 단계에서 끊깁니다. 트리거는 그 뒤에 도는 2차 방어입니다.
--
-- ── 서버 액션과의 관계 ───────────────────────────────────────
-- §4.3 이 「둘 다 적용한다」로 규정했습니다. **DB 가 1차, 서버 액션이 2차**입니다.
-- A-06 의 서버 액션도 금지 컬럼을 패치에서 빼야 하고, 이 트리거는 그 코드에 구멍이
-- 나도 막습니다. 예외 문구에 `[column-guard]` 를 넣어 두었으니 앱이 그것으로 사용자
-- 문구를 만들 수 있습니다.
-- ─────────────────────────────────────────────────────────────

begin;

-- ── builder ──────────────────────────────────────────────────
create or replace function public.guard_builder_columns()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  -- service_role 은 RLS 를 우회하는 서버 전용 경로다. 운영 스크립트가 막히면 안 된다
  if current_user = 'service_role' then
    return new;
  end if;

  -- 관리자는 전체 수정 권한이 있다 (데이터모델 §4.2)
  if public.is_admin() then
    return new;
  end if;

  -- 여기까지 왔다면 빌더 본인이 자기 행을 고치는 경로다 (builder_update_own).
  -- `is distinct from` 을 쓰는 이유 — `<>` 는 한쪽이 NULL 이면 NULL 이라 비교가
  -- 조용히 통과한다. pin_order 는 NULL 이 정상값이다.
  if new.slug is distinct from old.slug then
    raise exception '[column-guard] 주소(slug)는 본인이 바꿀 수 없습니다.';
  end if;
  if new.cohort is distinct from old.cohort then
    raise exception '[column-guard] 기수는 본인이 바꿀 수 없습니다.';
  end if;
  if new.is_public is distinct from old.is_public then
    raise exception '[column-guard] 공개 여부는 운영 담당자만 바꿀 수 있습니다.';
  end if;
  if new.is_pinned is distinct from old.is_pinned then
    raise exception '[column-guard] 상단 고정은 운영 담당자만 바꿀 수 있습니다.';
  end if;
  if new.pin_order is distinct from old.pin_order then
    raise exception '[column-guard] 고정 순서는 운영 담당자만 바꿀 수 있습니다.';
  end if;

  -- 계정 연결은 어느 경우에도 본인이 건드리지 않는다. 여기가 바뀌면 남의 계정에
  -- 자기 프로필을 붙이거나 자기 프로필을 남에게 넘길 수 있다.
  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception '[column-guard] 계정 연결은 본인이 바꿀 수 없습니다.';
  end if;

  return new;
end $$;

comment on function public.guard_builder_columns() is
  '빌더 셀프 수정에서 slug · cohort · is_public · is_pinned · pin_order · auth_user_id 를 막는다. 데이터모델 §4.2 · §4.3';

drop trigger if exists builder_column_guard on public.builder;
create trigger builder_column_guard
  before update on public.builder
  for each row execute function public.guard_builder_columns();

-- ── project ──────────────────────────────────────────────────
-- 빌더는 `is_owner` 인 건만 고칠 수 있고(project_update_own), 거기서도 아래 셋은 제외다.
create or replace function public.guard_project_columns()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user = 'service_role' then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.slug is distinct from old.slug then
    raise exception '[column-guard] 주소(slug)는 대표 빌더가 바꿀 수 없습니다.';
  end if;
  if new.is_public is distinct from old.is_public then
    raise exception '[column-guard] 공개 여부는 운영 담당자만 바꿀 수 있습니다.';
  end if;
  if new.sort_order is distinct from old.sort_order then
    raise exception '[column-guard] 정렬 순서는 운영 담당자만 바꿀 수 있습니다.';
  end if;

  return new;
end $$;

comment on function public.guard_project_columns() is
  '대표 빌더의 프로젝트 수정에서 slug · is_public · sort_order 를 막는다. 데이터모델 §4.2 · §4.3';

drop trigger if exists project_column_guard on public.project;
create trigger project_column_guard
  before update on public.project
  for each row execute function public.guard_project_columns();

commit;

-- ─────────────────────────────────────────────────────────────
-- 적용 후 확인
--
-- 1) 트리거가 걸렸는지
--
--   select tgname, tgrelid::regclass
--   from pg_trigger
--   where tgname in ('builder_column_guard', 'project_column_guard');
--
-- 2) 관리자·service_role 경로가 막히지 않는지 — A-02 화면에서 빌더의 공개 토글을
--    한 번 켰다 끄면 됩니다. 막히면 트리거가 관리자까지 잡고 있는 것입니다.
--
-- 3) 빌더 경로는 A-06 이 붙어야 실측할 수 있습니다. 그전까지는 빌더 계정이 없어
--    (샘플 6명 전원 auth_user_id 가 NULL) 시나리오를 만들 수 없습니다.
--    A-06 착수 시 첫 계정을 연결하고 공개 토글을 시도해 거절되는 것을 확인합니다.
-- ─────────────────────────────────────────────────────────────

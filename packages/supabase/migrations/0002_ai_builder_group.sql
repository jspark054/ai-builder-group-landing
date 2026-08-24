-- ─────────────────────────────────────────────────────────────
-- 0002_ai_builder_group.sql — AI 빌더 그룹 랜딩 페이지 스키마
--
-- 근거: project-docs/확정문서/260811_4_06_데이터모델_...md (v1.2)
--       테이블 8종 · RLS 정책 · 인덱스를 그 문서대로 옮긴 것입니다.
--       문서에 없는 컬럼·테이블·트리거·함수를 추가하지 않았습니다.
--
-- 적용 방법 (0001 과 동일)
--   A) Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
--   B) supabase CLI:  supabase db push
--
-- 0001 의 posts 테이블은 건드리지 않습니다. 데이터모델에 posts 가 없어
-- 앞으로 쓰지 않을 뿐이고, 정리는 별도 작업입니다.
--
-- 0001 에 의존합니다 — public.set_updated_at() 을 재사용합니다.
-- 반드시 0001 다음에 적용하세요.
-- ─────────────────────────────────────────────────────────────

-- 0001 에서 이미 만들었지만, 이 파일만 떼어 실행해도 되도록 둡니다.
create extension if not exists "pgcrypto";

-- ═════════════════════════════════════════════════════════════
-- 1. 테이블
--
-- 생성 순서는 FK 의존성을 따릅니다.
--   course → admin_user → builder → project → category
--   → project_builder → project_category → insight
--
-- 공통 컬럼(문서 §1.4) — 모든 테이블에 id · created_at · updated_at 을 둡니다.
-- ═════════════════════════════════════════════════════════════

-- ── course — 교육 과정 (§3.6) ─────────────────────────────────
-- builder.course_id 가 참조하므로 가장 먼저 만듭니다.
create table if not exists public.course (
  id               uuid primary key default gen_random_uuid(),

  -- P-08 폐지로 공개 경로는 없어졌지만 관리 화면 식별에 계속 씁니다 (I-1).
  slug             text not null unique,
  title            text not null,
  description      text,
  -- 커리큘럼 항목 배열. P-07 카드를 펼쳤을 때 렌더합니다.
  -- JSON 구조는 미확정 — 과정 콘텐츠 수령 후 확정 (문서 §8-7).
  curriculum       jsonb not null default '[]'::jsonb,
  status           text not null default 'preparing'
                   constraint course_status_check check (status in ('open', 'preparing')),
  is_public        boolean not null default false,
  sort_order       int not null default 0,

  meta_title       text,
  meta_description text,
  og_image_url     text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.course is '교육 과정. 데이터모델 §3.6';
comment on column public.course.status is 'preparing 이면 렌더하지 않는다 (기능명세 §4.6)';

-- ── admin_user — 운영팀 계정 (§3.7) ───────────────────────────
-- is_admin() 이 이 테이블을 읽으므로 정책보다 먼저 만듭니다.
create table if not exists public.admin_user (
  id           uuid primary key default gen_random_uuid(),

  -- ON DELETE 규칙이 문서에 없어 기본값(NO ACTION)입니다.
  -- auth.users 행을 지우려면 이 행을 먼저 정리해야 합니다.
  auth_user_id uuid not null unique references auth.users (id),
  name         text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.admin_user is
  '운영팀 계정(복수). 이 테이블에 행이 있으면 admin 역할이다. 데이터모델 §3.7';

-- ── builder — 빌더 (§3.1) ─────────────────────────────────────
create table if not exists public.builder (
  id               uuid primary key default gen_random_uuid(),

  -- 계정 미발급 시 NULL. ON DELETE 규칙은 문서에 없습니다.
  auth_user_id     uuid unique references auth.users (id),
  -- 발행 후 변경 금지 (REQ-N-013). 자연어 한글을 허용하므로
  -- 문자 패턴 제약을 두지 않습니다 (IA §6.1).
  slug             text not null unique,
  display_name     text not null,
  name_type        text not null default 'nickname'
                   constraint builder_name_type_check check (name_type in ('real', 'nickname')),
  -- NULL 허용 — 미등록 시 이니셜 폴백 (POL-02).
  image_url        text,
  -- 이미지 등록 시 필수 (FN-A02-06). 이미지가 없을 수 있으므로 컬럼은 NULL 허용.
  image_alt        text,
  -- text 로 두면 '10기' < '2기' 로 정렬돼 목록이 깨집니다. 반드시 int.
  cohort           int not null,
  bio              text,
  -- [{ "title": "...", "org": "...", "period": "2024-2025" }]
  -- 표기 상한 5개는 화면 규칙(POL-05)이지 저장 제한이 아닙니다.
  career           jsonb not null default '[]'::jsonb,
  course_id        uuid references public.course (id),
  is_public        boolean not null default false,
  is_pinned        boolean not null default false,
  -- is_pinned = true 일 때만 유효합니다.
  pin_order        int,

  meta_title       text,
  meta_description text,
  -- 미입력 시 image_url 을 씁니다 (앱에서 처리).
  og_image_url     text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.builder is '빌더. 데이터모델 §3.1';
comment on column public.builder.cohort is '기수. 표기는 ${cohort}기. 정렬 때문에 int 로 둔다';

-- ── project — 프로젝트 (§3.2) ─────────────────────────────────
create table if not exists public.project (
  id               uuid primary key default gen_random_uuid(),

  slug             text not null unique,
  title            text not null,
  -- 카드 1~2줄 (FN-C01-03).
  summary          text not null,

  -- 본문 4문항. 단일 body 로 두면 4문항 구조가 관례가 되어 누락을 못 막습니다.
  -- 03 §4.3 이 이 4개를 그대로 h2 로 렌더합니다.
  body_what        text not null,
  body_why         text not null,
  body_how         text not null,
  body_result      text not null,

  -- 필수. 미등록 시 카드 렌더 제외 (POL-02).
  thumbnail_url    text not null,
  thumbnail_alt    text not null,

  live_url         text,
  link_grade       text not null default 'none'
                   constraint project_link_grade_check
                   check (link_grade in ('live', 'deploy', 'repo', 'video', 'none')),

  is_public        boolean not null default false,
  sort_order       int not null default 0,

  meta_title       text,
  meta_description text,
  og_image_url     text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.project is '프로젝트. 데이터모델 §3.2';
comment on column public.project.link_grade is
  'live/deploy/repo/video/none. none 이면 바로가기 버튼 미노출 (FN-C01-08)';

-- 길이 상한(title 60 · summary 120)을 CHECK 로 걸지 않습니다.
-- 문서 §8 이 "초과 시 저장을 막지 않고 경고만 한다"로 규정합니다.

-- ── category — 포트폴리오 분류 (§3.4) ─────────────────────────
create table if not exists public.category (
  id         uuid primary key default gen_random_uuid(),

  -- 필터 그룹 구분용. 계층을 만들지 않고 두 축을 한 목록으로 관리합니다.
  axis       text not null
             constraint category_axis_check check (axis in ('industry', 'service')),
  slug       text not null unique,
  name       text not null,
  -- 카드 표기 우선순위에도 씁니다 (C-01 최대 2개를 이 순서로 고릅니다).
  sort_order int not null default 0,
  is_public  boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.category is '포트폴리오 분류. 데이터모델 §3.4';

-- 초기 데이터 9건은 시딩하지 않습니다.
-- 문서 §3.4 가 axis·name 만 확정하고 slug 를 정의하지 않았는데,
-- slug 는 URL 이자 발행 후 변경 금지 대상이라 임의로 만들 수 없습니다.
--
--   axis = 'industry' : 교육 · 커머스 · 의료 · 금융 · 공공
--   axis = 'service'  : 랜딩 · 예약 · 대시보드 · 커뮤니티
--
-- slug 확정 후 별도 시드로 넣습니다.

-- ── project_builder — 담당 관계 N:M (§3.3) ────────────────────
create table if not exists public.project_builder (
  id         uuid primary key default gen_random_uuid(),

  project_id uuid not null references public.project (id) on delete cascade,
  -- RESTRICT — 빌더를 지우면 프로젝트의 담당자가 사라집니다.
  -- 담당 관계를 먼저 정리하도록 강제합니다.
  builder_id uuid not null references public.builder (id) on delete restrict,
  -- 대표 여부 (G-3b). 프로젝트당 정확히 1명은 아래 부분 유니크 인덱스가 강제합니다.
  is_owner   boolean not null default false,
  sort_order int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint project_builder_unique unique (project_id, builder_id)
);

comment on table public.project_builder is '프로젝트-빌더 담당 관계(N:M). 데이터모델 §3.3';

-- ── project_category — 분류 연결 N:M (§3.5) ───────────────────
create table if not exists public.project_category (
  id          uuid primary key default gen_random_uuid(),

  project_id  uuid not null references public.project (id) on delete cascade,
  -- RESTRICT — 사용 중인 분류를 지우면 프로젝트의 태그가 사라집니다.
  category_id uuid not null references public.category (id) on delete restrict,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint project_category_unique unique (project_id, category_id)
);

comment on table public.project_category is '프로젝트-분류 연결(N:M). 데이터모델 §3.5';

-- 축별 1개 제한도, 카드 표기 상한 2개도 DB 제약으로 두지 않습니다.
-- 문서 §3.5 가 "최대 2개"를 C-01 카드의 표기 규칙으로 규정했지 저장 제한으로 두지 않았습니다.

-- ── insight — 인사이트 글 (§3.6a) ─────────────────────────────
create table if not exists public.insight (
  id               uuid primary key default gen_random_uuid(),

  slug             text not null unique,
  title            text not null,
  -- 본문은 발주사가 작성합니다.
  body             text not null,
  category         text not null
                   constraint insight_category_check
                   check (category in ('before', 'process', 'people')),
  -- NOT NULL — REQ-F-095 가 익명·조직 명의 글을 금지합니다.
  -- RESTRICT 인 이유: CASCADE 면 빌더 삭제로 글이 사라지고,
  -- SET NULL 은 NOT NULL 위반입니다. 글을 먼저 정리하게 만듭니다.
  builder_id       uuid not null references public.builder (id) on delete restrict,
  -- 파생 값이지만 저장합니다 (§6 원칙의 명시적 예외).
  -- 본문에서 매번 첫 이미지를 파싱하면 목록 렌더 비용이 크고,
  -- OG 태그는 SSR 시점에 확정돼야 합니다. 본문 저장 시 함께 갱신합니다.
  cover_image_url  text,
  status           text not null default 'draft'
                   constraint insight_status_check
                   check (status in ('draft', 'review', 'published')),
  -- 발행 시각. 목록 정렬 기준이자 공개 조건의 한 축입니다.
  published_at     timestamptz,

  meta_title       text,
  meta_description text,
  og_image_url     text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- before · process · people 은 /insights/{category} 가 점유한 예약어입니다.
  -- 글 슬러그가 이 값이면 카테고리 목록이 가려집니다 (IA §4 예약어 규칙).
  -- A-07 입력 검증(FN-A07-04)과 이 CHECK 양쪽에 둡니다.
  --
  -- 슬러그 문자 규칙은 두지 않습니다 — IA §6.1 이 자연어(한글) 슬러그를
  -- 허용하므로 ASCII 전용 같은 패턴 제약을 걸면 안 됩니다.
  constraint insight_slug_not_reserved
    check (slug not in ('before', 'process', 'people'))
);

comment on table public.insight is '인사이트 글. 데이터모델 §3.6a';
comment on column public.insight.published_at is
  '공개 조건은 status = published 이고 published_at 이 있을 때. 그 외는 404';

-- ═════════════════════════════════════════════════════════════
-- 2. updated_at 트리거 (§1.4)
--
-- 함수는 0001 의 public.set_updated_at() 을 재사용합니다.
-- ═════════════════════════════════════════════════════════════

drop trigger if exists course_set_updated_at on public.course;
create trigger course_set_updated_at
  before update on public.course
  for each row execute function public.set_updated_at();

drop trigger if exists admin_user_set_updated_at on public.admin_user;
create trigger admin_user_set_updated_at
  before update on public.admin_user
  for each row execute function public.set_updated_at();

drop trigger if exists builder_set_updated_at on public.builder;
create trigger builder_set_updated_at
  before update on public.builder
  for each row execute function public.set_updated_at();

drop trigger if exists project_set_updated_at on public.project;
create trigger project_set_updated_at
  before update on public.project
  for each row execute function public.set_updated_at();

drop trigger if exists category_set_updated_at on public.category;
create trigger category_set_updated_at
  before update on public.category
  for each row execute function public.set_updated_at();

drop trigger if exists project_builder_set_updated_at on public.project_builder;
create trigger project_builder_set_updated_at
  before update on public.project_builder
  for each row execute function public.set_updated_at();

drop trigger if exists project_category_set_updated_at on public.project_category;
create trigger project_category_set_updated_at
  before update on public.project_category
  for each row execute function public.set_updated_at();

drop trigger if exists insight_set_updated_at on public.insight;
create trigger insight_set_updated_at
  before update on public.insight
  for each row execute function public.set_updated_at();

-- ═════════════════════════════════════════════════════════════
-- 3. 판정 함수 (§4.1)
--
-- 정책이 참조하므로 정책보다 먼저 정의합니다.
-- 두 함수 모두 RLS 가 걸린 테이블을 읽으므로 security definer 입니다.
-- ═════════════════════════════════════════════════════════════

create or replace function public.is_admin() returns boolean as $$
  select exists (select 1 from public.admin_user where auth_user_id = auth.uid());
$$ language sql security definer stable set search_path = public, pg_temp;

create or replace function public.my_builder_id() returns uuid as $$
  select id from public.builder where auth_user_id = auth.uid();
$$ language sql security definer stable set search_path = public, pg_temp;

comment on function public.is_admin() is
  'admin_user 에 행이 있으면 관리자. 데이터모델 §4.1';
comment on function public.my_builder_id() is
  '현재 로그인 사용자의 builder.id. 없으면 NULL. 데이터모델 §4.1';

-- ═════════════════════════════════════════════════════════════
-- 4. RLS
--
-- REQ-N-011 — 권한 경계를 서버에서 강제한다.
-- 프론트엔드 은닉으로 대체하지 않는다. DB 가 직접 막습니다.
--
-- 역할 매핑
--   익명   → anon
--   builder·admin → authenticated (Supabase 는 둘을 같은 롤로 봅니다)
--                   구분은 is_admin() · my_builder_id() 가 합니다.
-- ═════════════════════════════════════════════════════════════

alter table public.course           enable row level security;
alter table public.admin_user       enable row level security;
alter table public.builder          enable row level security;
alter table public.project          enable row level security;
alter table public.category         enable row level security;
alter table public.project_builder  enable row level security;
alter table public.project_category enable row level security;
alter table public.insight          enable row level security;

-- ─────────────────────────────────────────────────────────────
-- ⚠️ 미구현 — 컬럼 단위 UPDATE 제한 (문서 §4.2 · §4.3)
--
-- 문서는 빌더의 UPDATE 에서 아래 컬럼을 제외하라고 규정합니다.
--   builder : slug · cohort · is_public · is_pinned · pin_order
--   project : slug · is_public · sort_order
--
-- 아래 정책은 "어느 행을" 고칠 수 있는지(행 단위)까지만 강제합니다.
-- Postgres RLS 는 행 단위라 "이 컬럼 값이 안 바뀌었는지"를 볼 수 없습니다
-- (WITH CHECK 는 NEW 만 보고 OLD 를 참조하지 못합니다).
--
-- 문서 §4.3 은 GRANT UPDATE(컬럼목록) 을 권장하나, Supabase 에서는
-- admin 과 builder 가 모두 authenticated 롤이라 롤 단위 GRANT 로 둘을
-- 가를 수 없습니다.
--
-- 남은 방법은 BEFORE UPDATE 트리거뿐인데, 데이터모델 문서에 정의돼
-- 있지 않아 이 마이그레이션에서 만들지 않았습니다.
--
-- 현재 노출도 — 쓰기는 service role(관리자 서버 액션) 경유이고
-- 빌더 셀프 편집 화면(A-06)이 아직 없어 실제 경로는 열려 있지 않습니다.
-- A-06 착수 전에 반드시 닫아야 합니다.
-- 상세는 project-docs/260814_구현결정_박진선.md 참조.
-- ─────────────────────────────────────────────────────────────

-- ── builder ──────────────────────────────────────────────────
-- SELECT: admin 전체 · builder 전체 · 익명은 is_public 만
drop policy if exists builder_select_anon on public.builder;
create policy builder_select_anon
  on public.builder for select
  to anon
  using (is_public);

drop policy if exists builder_select_authenticated on public.builder;
create policy builder_select_authenticated
  on public.builder for select
  to authenticated
  using (true);

drop policy if exists builder_update_admin on public.builder;
create policy builder_update_admin
  on public.builder for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 빌더는 본인 행만. 컬럼 제한은 위 미구현 블록 참조.
drop policy if exists builder_update_own on public.builder;
create policy builder_update_own
  on public.builder for update
  to authenticated
  using (id = public.my_builder_id())
  with check (id = public.my_builder_id());

drop policy if exists builder_insert_admin on public.builder;
create policy builder_insert_admin
  on public.builder for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists builder_delete_admin on public.builder;
create policy builder_delete_admin
  on public.builder for delete
  to authenticated
  using (public.is_admin());

-- ── project ──────────────────────────────────────────────────
drop policy if exists project_select_anon on public.project;
create policy project_select_anon
  on public.project for select
  to anon
  using (is_public);

drop policy if exists project_select_authenticated on public.project;
create policy project_select_authenticated
  on public.project for select
  to authenticated
  using (true);

drop policy if exists project_update_admin on public.project;
create policy project_update_admin
  on public.project for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 대표(is_owner)인 건만. `and pb.is_owner` 한 줄을 지우면 전원 편집이 됩니다(G-3b).
drop policy if exists project_update_own on public.project;
create policy project_update_own
  on public.project for update
  to authenticated
  using (
    exists (
      select 1 from public.project_builder pb
      where pb.project_id = project.id
        and pb.builder_id = public.my_builder_id()
        and pb.is_owner
    )
  )
  with check (
    exists (
      select 1 from public.project_builder pb
      where pb.project_id = project.id
        and pb.builder_id = public.my_builder_id()
        and pb.is_owner
    )
  );

drop policy if exists project_insert_admin on public.project;
create policy project_insert_admin
  on public.project for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists project_delete_admin on public.project;
create policy project_delete_admin
  on public.project for delete
  to authenticated
  using (public.is_admin());

-- ── project_builder ──────────────────────────────────────────
-- 익명은 읽지 못합니다 (문서 §4.2 = ✕).
-- 공개 화면의 담당 빌더 표기는 서버 측 키로 조회하는 전제입니다.
drop policy if exists project_builder_select_authenticated on public.project_builder;
create policy project_builder_select_authenticated
  on public.project_builder for select
  to authenticated
  using (true);

drop policy if exists project_builder_all_admin on public.project_builder;
create policy project_builder_all_admin
  on public.project_builder for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── project_category ─────────────────────────────────────────
-- 익명은 공개 프로젝트분만 읽습니다.
drop policy if exists project_category_select_anon on public.project_category;
create policy project_category_select_anon
  on public.project_category for select
  to anon
  using (
    exists (
      select 1 from public.project p
      where p.id = project_category.project_id
        and p.is_public
    )
  );

drop policy if exists project_category_select_authenticated on public.project_category;
create policy project_category_select_authenticated
  on public.project_category for select
  to authenticated
  using (true);

drop policy if exists project_category_all_admin on public.project_category;
create policy project_category_all_admin
  on public.project_category for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── category ─────────────────────────────────────────────────
drop policy if exists category_select_anon on public.category;
create policy category_select_anon
  on public.category for select
  to anon
  using (is_public);

drop policy if exists category_select_authenticated on public.category;
create policy category_select_authenticated
  on public.category for select
  to authenticated
  using (true);

drop policy if exists category_write_admin on public.category;
create policy category_write_admin
  on public.category for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── course ───────────────────────────────────────────────────
drop policy if exists course_select_anon on public.course;
create policy course_select_anon
  on public.course for select
  to anon
  using (is_public);

drop policy if exists course_select_authenticated on public.course;
create policy course_select_authenticated
  on public.course for select
  to authenticated
  using (true);

drop policy if exists course_write_admin on public.course;
create policy course_write_admin
  on public.course for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── insight ──────────────────────────────────────────────────
-- 익명 공개 조건은 두 가지를 모두 만족할 때입니다.
--   status = 'published'  AND  published_at IS NOT NULL
-- 하나만 걸면 발행 시각 없는 글이 새거나, 예약 상태가 노출됩니다.
drop policy if exists insight_select_anon on public.insight;
create policy insight_select_anon
  on public.insight for select
  to anon
  using (
    status = 'published'
    and published_at is not null
  );

drop policy if exists insight_select_authenticated on public.insight;
create policy insight_select_authenticated
  on public.insight for select
  to authenticated
  using (true);

-- TODO(발주사확인): 쓰기 권한 범위
--   현재는 관리자 전용입니다. 발행이 곧 대외 콘텐츠가 되므로 2단 권한(A-1)의
--   범위를 넓히는 결정이 필요해 가장 좁게 시작합니다 (데이터모델 §4.2 주석).
--   빌더 작성으로 넓힐 때는 project 의 is_owner 패턴을 그대로 쓰면 됩니다 —
--   using 절에 `builder_id = public.my_builder_id()` 한 줄입니다.
drop policy if exists insight_insert_admin on public.insight;
create policy insight_insert_admin
  on public.insight for insert
  to authenticated
  with check (public.is_admin());

-- TODO(발주사확인): 쓰기 권한 범위
drop policy if exists insight_update_admin on public.insight;
create policy insight_update_admin
  on public.insight for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- TODO(발주사확인): 쓰기 권한 범위
drop policy if exists insight_delete_admin on public.insight;
create policy insight_delete_admin
  on public.insight for delete
  to authenticated
  using (public.is_admin());

-- ── admin_user ───────────────────────────────────────────────
-- 문서 §4.2 정책 표에 admin_user 행이 없습니다.
-- RLS 만 켜고 정책을 두지 않으면 service role 외에는 아무도 접근하지 못합니다.
-- is_admin() 은 security definer 라 정책 없이도 이 테이블을 읽습니다.
-- 계정 관리는 service role(관리자 서버 액션)로 합니다.

-- ═════════════════════════════════════════════════════════════
-- 5. 인덱스 (§5)
--
-- slug UNIQUE 는 위 테이블 정의의 unique 제약이 이미 인덱스를 만듭니다.
-- 여기에는 복합·부분 인덱스만 둡니다.
-- ═════════════════════════════════════════════════════════════

-- 빌더 목록 정렬 (FN-P05-02)
create index if not exists builder_list_order_idx
  on public.builder (is_public, is_pinned, pin_order);

-- 프로젝트 목록 정렬
create index if not exists project_list_order_idx
  on public.project (is_public, sort_order);

-- 2차 필터
create index if not exists project_category_category_id_idx
  on public.project_category (category_id);

-- 프로젝트당 대표는 정확히 1명
create unique index if not exists project_builder_owner_unique
  on public.project_builder (project_id)
  where is_owner;

-- 빌더 상세의 프로젝트 조회
create index if not exists project_builder_builder_id_idx
  on public.project_builder (builder_id);

-- 인사이트 목록 정렬 (FN-P12-01)
create index if not exists insight_status_published_at_idx
  on public.insight (status, published_at desc);

-- 카테고리 필터 (FN-P12-03)
create index if not exists insight_status_category_published_at_idx
  on public.insight (status, category, published_at desc);

-- 빌더별 작성 글 조회
create index if not exists insight_builder_id_idx
  on public.insight (builder_id);

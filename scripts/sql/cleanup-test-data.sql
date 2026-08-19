-- cleanup-test-data.sql — 테스트 데이터 삭제
--
-- ⚠ 되돌릴 수 없다. 실행 전 위쪽 확인 쿼리로 대상을 눈으로 확인한다.
-- 실행: Supabase SQL Editor. 순서를 지킨다 (project → builder).
--
-- ── FK 사실관계 (0002_ai_builder_group.sql:192-195 · 212-214)
--   project_builder.project_id  → project  ON DELETE **CASCADE**
--   project_builder.builder_id  → builder  ON DELETE **RESTRICT**
--   project_category.project_id → project  ON DELETE **CASCADE**
--
-- 즉 project 를 지우면 project_builder · project_category 는 **자동으로 함께 지워진다.**
-- 연결을 미리 지울 필요가 없다. RESTRICT 는 builder 쪽에만 걸려 있으므로
-- **project 를 먼저 지우고 builder 를 나중에 지우면** 걸리지 않는다.
--
-- kim-doyoung 은 auth_user_id 가 NULL 이고 insight 참조도 0건이라
-- 다른 곳을 깨뜨리지 않는다 (2026-08-19 실측).

-- ── 1. 삭제 대상 확인 ─────────────────────────────────────────
select 'project' as 대상, slug, title, is_public::text as 상태 from public.project
where slug in ('test-a', 'test-b', 'test-c', 'test-d')
union all
select 'builder', slug, display_name, is_public::text from public.builder
where slug = 'kim-doyoung';

-- 함께 사라지는 연결 (CASCADE)
select 'project_builder' as 테이블, p.slug as 프로젝트, b.slug as 상대
from public.project_builder pb
join public.project p on p.id = pb.project_id
join public.builder b on b.id = pb.builder_id
where p.slug in ('test-a', 'test-b', 'test-c', 'test-d')
union all
select 'project_category', p.slug, c.slug
from public.project_category pc
join public.project p on p.id = pc.project_id
join public.category c on c.id = pc.category_id
where p.slug in ('test-a', 'test-b', 'test-c', 'test-d');

-- ── 2. 삭제 ───────────────────────────────────────────────────
delete from public.project
where slug in ('test-a', 'test-b', 'test-c', 'test-d');

-- builder 는 project 삭제 뒤에 지운다. 순서를 바꾸면 RESTRICT 로 막힌다.
delete from public.builder
where slug = 'kim-doyoung';

-- ── 3. 결과 확인 ──────────────────────────────────────────────
select slug, title, link_grade, is_public, sort_order
from public.project
order by sort_order;

select slug, display_name, is_public from public.builder order by slug;

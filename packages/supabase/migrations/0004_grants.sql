-- ─────────────────────────────────────────────────────────────
-- 0004 — 테이블 권한(GRANT) 보정
--
-- ⚠️ 아직 적용하지 않았습니다. Supabase SQL Editor 에서 실행해야 합니다.
--
-- 왜 필요한가
--   프로젝트 생성 시 **"Automatically expose new tables" 를 해제**한 상태에서
--   0001 · 0002 를 실행했습니다 (devlog 8/16). 그 설정이 새 테이블에 기본 권한을
--   부여하는 이벤트 트리거라, 해당 테이블들은 anon · authenticated · service_role
--   어느 롤에도 테이블 권한이 없습니다.
--
--   RLS 정책 28건은 "어느 행을" 볼지만 정하고, "테이블에 접근할 수 있는지"는
--   GRANT 가 정합니다. 권한이 없으면 정책이 평가되기 전에 끊깁니다.
--
--     select ... from public.project
--     → 42501 permission denied for table project   (service role 도 동일)
--
--   실제로 2026-08-18 P-01 섹션 4 를 붙이자마자 이 오류로 `/` 가 500 이 났습니다.
--   0003(site_setting)은 설정이 켜진 뒤에 만들어져 정상 동작합니다.
--
-- 무엇을 주는가
--   Supabase 기본 권한과 같은 모양입니다. **행 필터는 그대로 RLS 가 담당**하고,
--   여기서는 테이블 접근 자체만 엽니다. 정책이 없는 롤은 GRANT 가 있어도 0행입니다.
--
--   anon           : 익명 SELECT 정책이 있는 테이블만 select
--   authenticated  : 정책이 있는 만큼 select · insert · update · delete
--   service_role   : 전체 (RLS 우회 · 서버 액션 경유 쓰기)
--
--   project_builder 는 **anon 에 주지 않습니다.** 익명 SELECT 정책이 없고,
--   차단이 의도한 설계입니다 (구현결정 「스키마 구현 결정」 §2).
-- ─────────────────────────────────────────────────────────────

begin;

-- ── anon — 공개 화면이 읽는 것만 ──────────────────────────────
grant select on public.builder          to anon;
grant select on public.project          to anon;
grant select on public.project_category to anon;
grant select on public.category         to anon;
grant select on public.course           to anon;
grant select on public.insight          to anon;
grant select on public.posts            to anon;

-- ── authenticated — 관리 화면(A-nn) 경로 ─────────────────────
grant select                         on public.builder          to authenticated;
grant insert, update, delete         on public.builder          to authenticated;
grant select                         on public.project          to authenticated;
grant insert, update, delete         on public.project          to authenticated;
grant select, insert, update, delete on public.project_builder  to authenticated;
grant select, insert, update, delete on public.project_category to authenticated;
grant select, insert, update, delete on public.category         to authenticated;
grant select, insert, update, delete on public.course           to authenticated;
grant select                         on public.insight          to authenticated;
grant insert, update, delete         on public.insight          to authenticated;
grant select                         on public.posts            to authenticated;

-- admin_user 는 롤에 직접 열지 않습니다.
-- is_admin() · my_builder_id() 가 security definer 라 함수 안에서만 읽힙니다.

-- ── service_role — 서버 전용 (RLS 우회) ──────────────────────
grant all on public.builder          to service_role;
grant all on public.project          to service_role;
grant all on public.project_builder  to service_role;
grant all on public.project_category to service_role;
grant all on public.category         to service_role;
grant all on public.course           to service_role;
grant all on public.insight          to service_role;
grant all on public.admin_user       to service_role;
grant all on public.posts            to service_role;

commit;

-- 확인 쿼리 — 적용 후 실행해 롤별 권한을 눈으로 봅니다.
--
--   select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type)
--   from information_schema.role_table_grants
--   where table_schema = 'public'
--     and grantee in ('anon', 'authenticated', 'service_role')
--   group by table_name, grantee
--   order by table_name, grantee;

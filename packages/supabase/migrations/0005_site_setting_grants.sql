-- ─────────────────────────────────────────────────────────────
-- 0005 — site_setting 테이블 권한(GRANT) 보정
--
-- ⚠️ 아직 적용하지 않았습니다. Supabase SQL Editor 에서 실행해야 합니다.
--
-- 왜 필요한가
--   0004 는 site_setting 을 제외했습니다. 머리말에 「0003(site_setting)은 설정이
--   켜진 뒤에 만들어져 정상 동작합니다」라고 적혀 있는데, **그 전제가 틀렸습니다.**
--   2026-08-18 REST 로 실측한 결과 anon · service_role 양쪽 모두 막혀 있습니다.
--
--     select value from public.site_setting
--     → 42501 permission denied for table site_setting
--       hint: GRANT SELECT ON public.site_setting TO anon;
--
--   0002 계열과 같은 원인입니다 — "Automatically expose new tables" 가 해제된
--   상태에서 만들어진 테이블에는 기본 권한이 붙지 않습니다. 0003 도 그 시점
--   안에 있었습니다.
--
--   이 권한이 없으면 C-03 문의 CTA 가 주소를 읽지 못해 화면이 500 이 됩니다
--   (섹션 4 를 붙였을 때와 같은 증상).
--
-- 무엇을 주는가
--   RLS 정책은 이미 `for select using (true)` 로 공개 읽기가 열려 있습니다.
--   여기서는 테이블 접근 자체만 엽니다.
--
--   authenticated 에는 **select 만** 줍니다. 쓰기 정책이 아직 없어
--   (devlog 8/18 — 관리 화면 착수 시 admin_user 방식에 맞춰 추가) insert·update 를
--   줘도 정책 단계에서 0행입니다. 정책과 함께 열어야 의도가 분명해집니다.
-- ─────────────────────────────────────────────────────────────

begin;

grant select on public.site_setting to anon;
grant select on public.site_setting to authenticated;
grant all    on public.site_setting to service_role;

commit;

-- 문의 폼 주소를 **우리 계정 폼**으로 교체한다 (8/23).
--
-- 0006 이 넣은 `Y0iItGK46B` 를 폐기한다. 그 값은 레퍼런스 사이트
-- (abg-landing-app.vercel.app)의 HTML 에서 긁어온 **남의 폼**이었다.
-- 소유 계정을 확인하지 못한 폼으로 리드를 보내면 접수된 문의를 우리가 열어볼 수
-- 없다. 0003 이 심었던 `JKqzYjCHCH`("AI 교육 및 컨설팅")도 마찬가지로 폐기 상태다.
--
-- 이번 값 `roCL30gje7` 은 **사용자 계정에서 새로 만든 폼**이다 (사용자 지시 8/23).
--   title        AI 빌더그룹
--   homepageUrl  https://abg-landing-jspark.vercel.app  ← 우리 배포본
--   필드         프로젝트 이름 · 회사명 · 이름 · 이메일 · 연락처 · 예산 ·
--                프로젝트 내용 + 개인정보 수집동의
--
-- 예산 항목은 플러그 폼 자체의 구성이다. 우리가 화면에 셀렉트를 덧붙인 것이
-- 아니므로 REQ-F-051(예산·일정·회사규모 셀렉트 추가 금지)에 걸리지 않는다.
--
-- 앞선 마이그레이션은 고치지 않는다 — 이미 적용된 파일이다. 새로 만든 DB 는
-- 0003 → 0006 → 0007 순으로 덮이므로 결과가 같다.

update public.site_setting
   set value      = 'https://www.pluuug.com/form/roCL30gje7',
       updated_at = now()
 where key = 'contact_form_url';

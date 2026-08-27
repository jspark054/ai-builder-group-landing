-- 0008 컬럼 가드 — 빌더 경로 검증
--
-- 화면으로는 시험할 수 없다. 빌더 UI(A-06)는 잠긴 컬럼을 애초에 보내지 않는다.
-- 그래서 빌더 세션을 흉내 내어 금지 컬럼을 직접 고쳐 본다.
--
-- 사용 — Supabase SQL Editor 에 이 파일 전체를 붙여넣고 Run.
--
-- rollback 으로 끝나므로 성공하든 실패하든 데이터는 바뀌지 않는다.
--
-- 기대 — (1)은 통과하고 (2)에서 다음 오류로 멈춘다.
--        [column-guard] 공개 여부는 운영 담당자만 바꿀 수 있습니다.
--        오류 없이 통과하면 빌더가 자기 프로필을 스스로 공개로 켤 수 있다는 뜻이다.
--
-- 대상 — 김도영(builder) · builder-test@builderschool.ai(auth)
--        다른 빌더로 시험하려면 아래 두 UUID 를 바꾼다.

begin;

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"6c45fa9d-04dc-4f12-99bb-8c962188d7dd","role":"authenticated"}';

-- (1) 허용된 컬럼 — 통과해야 정상
update public.builder
   set bio = bio
 where id = '6321e12f-6f2b-40ea-b870-6aef98f07184';

-- (2) 금지 컬럼 — 여기서 멈춰야 정상
update public.builder
   set is_public = false
 where id = '6321e12f-6f2b-40ea-b870-6aef98f07184';

rollback;

-- portfolio-categories.sql — 신규 5건에 분류(category) 연결
--
-- 실행: Supabase SQL Editor. portfolio-thumbnails.sql 을 먼저 돌린 뒤에 실행한다.
-- 멱등적이다 — on conflict do nothing 이라 여러 번 돌려도 중복되지 않는다.
--
-- 축은 industry(업종) · service(서비스형) 두 가지이고 9종이 전부다
-- (구현결정 8/17 §2 에서 slug 를 확정했다). 건당 industry 1 + service 1 을 기본으로 하되,
-- 맞는 값이 없으면 억지로 채우지 않고 1개만 둔다 — FN-C01-05 는 "최대 2개"이지 2개 필수가 아니다.
--
-- project_builder 는 연결하지 않는다. 1기 빌더는 이 프로젝트들의 실제 수행자가 아니므로
-- 수행 이력 표기가 허위가 된다 (8/17 §6 결정 2 유지).
--
-- 카드 표기는 category.sort_order 오름차순 앞 2개다 (lib/queries/project-cards.ts).
-- 두 축의 sort_order 가 겹치므로(양쪽 다 10·20·…) 동순위는 이름 가나다순으로 갈린다.

insert into public.project_category (project_id, category_id)
select p.id, c.id
from (values
  -- 항공권 검색 → 좌석 선택 → 결제. 상거래이자 예약 흐름이다.
  ('에어로케이',     'commerce'),
  ('에어로케이',     'booking'),

  -- 전자지급결제대행 · 간편결제 사업자. 산출물은 기업 소개 웹사이트다.
  ('나이스정보통신', 'finance'),
  ('나이스정보통신', 'landing'),

  -- 소상공인 광고 도구. service 4종(랜딩·예약·대시보드·커뮤니티)에
  -- "영상 제작 도구"에 해당하는 값이 없어 industry 1개만 둔다.
  ('우리동네광고',   'commerce'),

  -- 장기요양기관 운영·관리. 관리자 대시보드 + 종사자 화면 구조다.
  ('패밀리케어',     'healthcare'),
  ('패밀리케어',     'dashboard'),

  -- 독학기숙학원. 정보 확인과 입학 절차 안내가 목적인 사이트다.
  ('에듀셀파',       'education'),
  ('에듀셀파',       'landing')
) as v(project_slug, category_slug)
join public.project  p on p.slug = v.project_slug
join public.category c on c.slug = v.category_slug
on conflict on constraint project_category_unique do nothing;

-- 확인 — 건당 연결 수와 표기될 분류명
select p.slug,
       count(*) as 연결수,
       string_agg(c.name, ' · ' order by c.sort_order, c.name) as 분류
from public.project p
join public.project_category pc on pc.project_id = p.id
join public.category c on c.id = pc.category_id
where p.slug in ('에어로케이', '나이스정보통신', '우리동네광고', '패밀리케어', '에듀셀파')
group by p.slug
order by p.slug;

-- portfolio-builders.sql — 게재 5건에 담당 빌더(project_builder) 연결
--
-- 실행: Supabase SQL Editor. portfolio-thumbnails.sql 을 먼저 돌린 뒤에 실행한다.
-- 멱등적이다 — on conflict do nothing 이라 여러 번 돌려도 중복되지 않는다.
--
-- ⚠ 실제 적용은 2026-08-19 에 service_role + PostgREST 로 이미 끝났다 (10행).
--   이 파일은 같은 결과를 재현·검증하기 위한 기록이다.
--
-- 8/17 §6 결정 2(project_builder 를 연결하지 않는다)를 뒤집은 결과다.
-- 당시 근거는 실명 빌더에게 수행하지 않은 이력을 붙이면 허위 표기가 된다는 것이었다.
-- 이후 빌더 데이터를 익명 플레이스홀더(빌더 A~F)로 교체해 귀속될 실존 인물이
-- 없어졌고, 화면에도 임시 데이터 고지가 붙어 있다. 전제가 바뀌었으므로 연결한다.
-- 근거 전문은 project-docs/260814_구현결정_박진선.md 「담당 빌더 연결 (2026-08-19)」.
--
-- 각 프로젝트의 **첫 번째 빌더가 대표(is_owner)** 다.
-- 대표는 프로젝트당 1명만 허용된다 (project_builder_owner_unique · 부분 유니크 인덱스).
-- sort_order 는 대표 다음의 표시 순서다. C-01 은 is_owner → sort_order 로 정렬한다.
--
-- 나이스정보통신만 1명인 것은 의도한 구성이다 — FN-C01-04 인수 기준이
-- 단수 표기(「빌더 D」)와 복수 표기(「빌더 O 외 N명」)를 각각 확인하도록 요구한다.
--
-- 빌더별 담당 건수: A 2 · B 2 · C 1 · D 1 · E 2 · F 2 (합 10).
-- 전원 1건 이상이라 POL-02(0건 빌더 미노출)로 사라지는 빌더가 없다.

insert into public.project_builder (project_id, builder_id, is_owner, sort_order)
select p.id, b.id, v.is_owner, v.sort_order
from (values
  ('에어로케이',     'builder-a', true,   0),
  ('에어로케이',     'builder-b', false, 10),

  ('나이스정보통신', 'builder-d', true,   0),

  ('우리동네광고',   'builder-b', true,   0),
  ('우리동네광고',   'builder-e', false, 10),

  ('패밀리케어',     'builder-a', true,   0),
  ('패밀리케어',     'builder-f', false, 10),

  ('에듀셀파',       'builder-c', true,   0),
  ('에듀셀파',       'builder-e', false, 10),
  ('에듀셀파',       'builder-f', false, 20)
) as v(project_slug, builder_slug, is_owner, sort_order)
join public.project p on p.slug = v.project_slug
join public.builder b on b.slug = v.builder_slug
on conflict on constraint project_builder_unique do nothing;

-- 확인 1 — 프로젝트별 담당 인원과 C-01 에 찍힐 표기 (FN-C01-04)
select p.slug,
       count(*) as 담당수,
       string_agg(b.display_name, ' · ' order by pb.is_owner desc, pb.sort_order) as 빌더,
       case when count(*) = 1
            then min(b.display_name)
            else (array_agg(b.display_name order by pb.is_owner desc, pb.sort_order))[1]
                 || ' 외 ' || (count(*) - 1) || '명'
       end as 카드표기
from public.project p
join public.project_builder pb on pb.project_id = p.id
join public.builder b on b.id = pb.builder_id
group by p.slug
order by p.slug;

-- 확인 2 — 빌더별 담당 건수 (C-02 의 "N건" · POL-02 판정 근거)
select b.slug, b.display_name, count(pb.id) as 담당건수
from public.builder b
left join public.project_builder pb on pb.builder_id = b.id
group by b.slug, b.display_name
order by b.slug;

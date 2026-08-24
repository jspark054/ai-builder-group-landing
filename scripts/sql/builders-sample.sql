-- builders-sample.sql — 빌더 A~F 를 예행 샘플 6명으로 교체
--
-- 실행: Supabase SQL Editor. 선행 마이그레이션 없이 단독으로 돈다.
-- 멱등적이다 — on conflict 로 재실행해도 중복되지 않고 값만 갱신된다.
--
-- ── 전제 ────────────────────────────────────────────────────
-- 게재 5건은 발주사 실적이고 실제 참여한 빌더는 없다. 아래 6명은 **전원 가상**이다.
-- 실존 인물이 없으므로 허위 귀속이 아니다 — 8/17 §6 결정 2 를 뒤집은
-- portfolio-builders.sql:9 의 논리를 그대로 유지한다. 귀속될 실존 인물이
-- 생기는 시점(실빌더 전환)에 이 전제는 다시 뒤집힌다. 아래 「실빌더 전환」 참조.
--
-- ── 스키마를 늘리지 않는다 (하드룰 4) ───────────────────────
-- `project_builder.role`(역할 표기) · `builder.strength_tag`(카드 한 줄 라벨)을
-- 검토했으나 **둘 다 도입하지 않는다.** 데이터모델 §3.1 · §3.3 에 없는 컬럼이고
-- 확정문서는 수정 대상이 아니다. 문서를 못 고치는 이상 컬럼 추가는 하드룰 4 이탈이다.
--
--   role 은 **실빌더 전환 시점에 문서 정식 개정과 함께** 도입한다.
--   지금은 전원 가상 인물이라 역할 표기가 없어도 허위 귀속이 발생하지 않는다.
--
-- 그래서 이 파일은 **기존 컬럼만 쓴다.** 화면 변경도 따라오지 않는다.
--
-- ── 표기 수위 (POL-12) ──────────────────────────────────────
--   name_type = 'nickname'  — 스키마 허용값은 ('real','nickname') 두 개뿐이다.
--                             가상 인물이므로 'real' 을 쓰지 않는다.
--   image_url = 5명 등록 · 1명 미등록 (08-24)
--                             생성 인물 사진이라 실존 인물이 없고 초상권 대상도 없다.
--                             정책 「이미지 생성」이 생성 이미지를 허용하고, POL-09 의
--                             생성 금지 항목은 「후기 · 고객 발언」에 한정된다.
--                             **서재훈만 의도적으로 미등록이다** — POL-12 혼재와
--                             POL-02 이니셜 폴백을 화면에서 검증하기 위해서다.
--                             전원에게 넣으면 그 두 경로를 한 번도 타지 않는다.
--   image_alt = 이미지 등록 시 필수 (FN-A02-06). 표기명이 항상 이미지 옆에 있으므로
--                             장식 수식 없이 「{표기명} 프로필 사진」으로만 둔다.
--                             미등록 빌더는 image_alt 도 null 이다.
--   cohort    = 1           — **int 다.** '1기' 는 화면 표기이지 저장값이 아니다.
--                             text 로 두면 '10기' < '2기' 로 정렬돼 목록이 깨진다
--                             (데이터모델 §3.1 주의 · 0002 builder.cohort 주석).
--
-- 역할 구분은 `bio` 문장이 대신 받는다 — 데이터모델 §3.1 이 `bio` 를
-- 「≤200자 한 줄 소개」로 정의하고 있고, P-06 상세가 이 문장을 렌더한다.
-- C-02 카드는 `bio` 를 쓰지 않으므로 문장이 중간에서 끊길 일이 없다.
-- 「백엔드」·「QA」 같은 직군 태그도 별도 컬럼을 만들지 않고 `bio` 문장으로만 표현한다.
--
-- ── 인원 상한 (화면 제약) ───────────────────────────────────
-- **6명이 상한이다.** BuilderGrid.tsx 의 `MAX_DELAY_STEPS = 5` 가
-- `Math.min(index, 5)` 로 stagger 지연을 자르므로, 6명(index 0~5)까지는 전원이
-- 서로 다른 지연을 받는다. **7명째부터 index 6 이 5 로 눌려 6번째와 같은 시점에
-- 등장하고, 그 뒤로는 순차 등장이 사라진다.** 빌더를 더 늘리려면 그 상수를
-- 먼저 손봐야 한다.
-- P-01 섹션 5 는 고정 여부와 무관하게 전원 렌더다 (FN-P01-26 · FN-P01-35 6×2 그리드).
--
-- career 의 org 는 **업종 표기**다. 가상 인물에 실존 기업명을 붙이지 않는다.
--
-- ── 실빌더 전환 시 (REQ-N-013) ──────────────────────────────
-- 아래 slug 들은 **rename 하지 않는다.** 「발행 후 변경 금지」와 충돌한다.
-- 삭제 → 신규 insert 로 간다. 이 파일의 3단계(연결 삭제 → 빌더 삭제 → insert)를
-- 그대로 다시 쓰면 된다. 지금 builder-a~f 를 지우는 방식과 동일하다.
-- ─────────────────────────────────────────────────────────────

begin;

-- ═══ 1. 기존 플레이스홀더 제거 ═══════════════════════════════
--
-- 순서가 강제된다 — project_builder.builder_id 가 on delete restrict 라
-- 연결을 먼저 끊지 않으면 빌더 행이 지워지지 않는다 (데이터모델 §3.3).
-- 같은 트랜잭션 안에서 새 빌더 insert 까지 끝내므로, 빌더 목록이 0건이 되어
-- POL-02 로 섹션이 사라지는 중간 상태가 커밋되지 않는다.

delete from public.project_builder
where builder_id in (
  select id from public.builder
  where slug in ('builder-a','builder-b','builder-c','builder-d','builder-e','builder-f')
);

delete from public.builder
where slug in ('builder-a','builder-b','builder-c','builder-d','builder-e','builder-f');


-- ═══ 2. 예행 샘플 빌더 6명 ═══════════════════════════════════
--
-- slug 는 자연어 한글이다 (REQ-N-013 · IA §6.1). 프로젝트 슬러그
-- (에어로케이 · 에듀셀파 …)와 표기를 맞춘다.
-- 고정 2명(김도영 · 정하람)은 POL-07 셔플에서 제외되어 P-05 상단에 온다.
-- 나머지 4명(이서현 · 박준우 · 한지우 · 서재훈)은 일별 시드로 셔플된다.
-- P-01 섹션 5 는 고정 여부와 무관하게 **전원 6명을 렌더한다** (FN-P01-26 유지).

insert into public.builder (
  slug, display_name, name_type, cohort,
  image_url, image_alt,
  bio, career,
  is_public, is_pinned, pin_order
) values
  (
    '김도영', '김도영', 'nickname', 1,
    '/images/builders/kim-doyoung.webp', '김도영 프로필 사진',
    '화면을 빠르게 만들고, 만든 다음에도 고치기 쉬운 구조로 남기는 것에 관심이 많습니다.',
    '[{"title":"프론트엔드","org":"웹 에이전시","period":"2021-2023"},
      {"title":"프론트엔드","org":"커머스 스타트업","period":"2023-2024"}]'::jsonb,
    true, true, 1
  ),
  (
    '정하람', '정하람', 'nickname', 1,
    '/images/builders/jung-haram.webp', '정하람 프로필 사진',
    '예쁜 화면보다 흐름이 끊기지 않는 화면을 먼저 생각합니다.',
    '[{"title":"UI 디자인","org":"인하우스","period":"2020-2022"},
      {"title":"웹·앱 디자인","org":"프리랜스","period":"2022-2024"}]'::jsonb,
    true, true, 2
  ),
  (
    '이서현', '이서현', 'nickname', 1,
    '/images/builders/lee-seohyun.webp', '이서현 프로필 사진',
    '요구사항을 듣는 것과 문제를 정의하는 것은 다른 일이라고 생각합니다.',
    '[{"title":"서비스 기획","org":"SaaS 기업","period":"2019-2022"},
      {"title":"플랫폼 기획 리드","org":"플랫폼 기업","period":"2022-2024"}]'::jsonb,
    true, false, null
  ),
  (
    '박준우', '박준우', 'nickname', 1,
    '/images/builders/park-junwoo.webp', '박준우 프로필 사진',
    '데이터가 어디서 오고 어디로 가는지 그려두면 대부분의 버그가 미리 보입니다.',
    '[{"title":"백엔드 개발","org":"소프트웨어 기업","period":"2020-2023"},
      {"title":"데이터 파이프라인 구축","org":"데이터 플랫폼 기업","period":"2023-2024"}]'::jsonb,
    true, false, null
  ),
  (
    '한지우', '한지우', 'nickname', 1,
    '/images/builders/han-jiwoo.webp', '한지우 프로필 사진',
    '눈에 안 보이는 쪽이 무너지면 보이는 쪽도 같이 무너진다고 생각합니다.',
    '[{"title":"백엔드","org":"웹 서비스 기업","period":"2020-2022"},
      {"title":"백엔드","org":"커머스 플랫폼","period":"2022-2024"}]'::jsonb,
    true, false, null
  ),
  (
    -- **의도적 미등록이다.** POL-12 「실사 · 아바타 · 미등록 혼재를 정상으로
    -- 처리한다」와 POL-02 이니셜 폴백은 미등록이 최소 1건 있어야 화면에서
    -- 검증된다 (결정시트가 「그리드 붕괴 시 불합격」으로 걸어 둔 항목이다).
    -- 전원에게 사진을 넣으면 그 경로를 한 번도 타지 않는다.
    -- 비고정 · 담당 1건이라 고정 2명의 상단 노출에 영향이 없어 이쪽을 골랐다.
    -- 파일(`seo-jaehoon.webp`)은 지우지 않고 남겨 둔다 — 되돌리려면
    -- 이 두 값을 채우기만 하면 된다.
    '서재훈', '서재훈', 'nickname', 1,
    null, null,
    '만든 사람이 안 해보는 순서로 눌러보는 게 제 일입니다.',
    '[{"title":"QA","org":"소프트웨어 기업","period":"2021-2023"},
      {"title":"QA 리드","org":"웹·앱 개발사","period":"2023-2024"}]'::jsonb,
    true, false, null
  )
on conflict (slug) do update set
  display_name = excluded.display_name,
  name_type    = excluded.name_type,
  cohort       = excluded.cohort,
  image_url    = excluded.image_url,
  image_alt    = excluded.image_alt,
  bio          = excluded.bio,
  career       = excluded.career,
  is_public    = excluded.is_public,
  is_pinned    = excluded.is_pinned,
  pin_order    = excluded.pin_order,
  updated_at   = now();


-- ═══ 3. 담당 연결 12건 ═══════════════════════════════════════
--
-- id 를 하드코딩하지 않는다 — slug 로 join 한다.
-- 각 프로젝트의 **첫 줄이 대표(is_owner)** 다. 프로젝트당 정확히 1명만
-- 허용된다 (project_builder_owner_unique · 부분 유니크 인덱스).
-- sort_order 는 대표 다음의 표시 순서다. C-01 은 is_owner → sort_order 로 정렬한다.
--
-- 프로젝트 slug 는 DB 실제값이다 — 「NICE」·「Btv」가 아니라
-- '나이스정보통신' · '우리동네광고' 다 (portfolio-thumbnails.sql 기준).
--
-- **담당 인원을 1명 · 2명 · 3명으로 흩어 둔다.** FN-C01-04 인수 기준이 요구하는
-- C-01 표기 세 가지를 한 화면에서 모두 확인하기 위해서다.
--
--   패밀리케어 1명 → 「이서현」          단수
--   에듀셀파   2명 → 「이서현 외 1명」    외 1명
--   나머지 3건 3명 → 「김도영 외 2명」    외 2명
--
-- **패밀리케어와 에듀셀파에는 신규 2명을 붙이지 않는다.** 붙이면 단수·「외 1명」
-- 표기가 화면에서 사라져 세 가지 중 하나만 남는다.
--
-- 신규 3건은 전부 `is_owner = false` 다. 대표는 기존 지정을 유지하므로
-- project_builder_owner_unique(project_id) where is_owner 와 충돌하지 않는다.
--
-- 빌더별 담당 건수: 김도영 3 · 정하람 2 · 이서현 2 · 박준우 2 · 한지우 2 · 서재훈 1 (합 12).
-- 전원 1건 이상이라 POL-02(0건 빌더 미노출)로 사라지는 빌더가 없다.

insert into public.project_builder (project_id, builder_id, is_owner, sort_order)
select p.id, b.id, v.is_owner, v.sort_order
from (values
  ('에어로케이',     '김도영', true,   0),
  ('에어로케이',     '정하람', false, 10),
  ('에어로케이',     '한지우', false, 20),

  ('나이스정보통신', '김도영', true,   0),
  ('나이스정보통신', '박준우', false, 10),
  ('나이스정보통신', '한지우', false, 20),

  ('우리동네광고',   '김도영', true,   0),
  ('우리동네광고',   '정하람', false, 10),
  ('우리동네광고',   '서재훈', false, 20),

  ('패밀리케어',     '이서현', true,   0),

  ('에듀셀파',       '이서현', true,   0),
  ('에듀셀파',       '박준우', false, 10)
) as v(project_slug, builder_slug, is_owner, sort_order)
join public.project p on p.slug = v.project_slug
join public.builder b on b.slug = v.builder_slug
on conflict on constraint project_builder_unique do update set
  is_owner   = excluded.is_owner,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;


-- ═════ 검증 ═══════════════════════════════════════════════════

-- 확인 ① 빌더 6행 · 플레이스홀더 0행
select slug, display_name, name_type, cohort,
       image_url, image_alt,
       jsonb_array_length(career) as 이력수,
       is_public, is_pinned, pin_order
from public.builder
order by is_pinned desc, pin_order nulls last, slug;
-- 기대: 6행. 전원 name_type='nickname' · cohort=1
--       · image_url 5건 채워짐 · **서재훈만 null** (POL-12 혼재 · POL-02 폴백 검증)
--       · image_alt 는 image_url 과 짝이 맞아야 한다 (한쪽만 null 이면 안 된다)
--       · 이력수=2 · is_public=true. 김도영(pin 1) · 정하람(pin 2) 이 상단.
--       builder-a~f 가 한 행도 나오면 안 된다.
--       6행이 상한이다 — 머리말 「인원 상한」 참조 (MAX_DELAY_STEPS).

-- 확인 ② 연결 12행 · 프로젝트당 대표 1명
select p.slug as 프로젝트, b.display_name as 빌더, pb.is_owner, pb.sort_order
from public.project_builder pb
join public.project p on p.id = pb.project_id
join public.builder b on b.id = pb.builder_id
order by p.slug, pb.is_owner desc, pb.sort_order;
-- 기대: 12행. 프로젝트마다 is_owner=true 가 정확히 1행.
--       패밀리케어 1행 · 에듀셀파 2행 · 나머지 3건은 3행씩.
--       신규 3건(한지우 ×2 · 서재훈 ×1)은 전부 is_owner=false · sort_order=20.

-- 확인 ③ 빌더별 담당 건수 (C-02 「N건」 · POL-02 판정 근거)
select b.slug, b.display_name, count(pb.id) as 담당건수
from public.builder b
left join public.project_builder pb on pb.builder_id = b.id
group by b.slug, b.display_name
order by 담당건수 desc, b.slug;
-- 기대: 김도영 3 · 정하람 2 · 이서현 2 · 박준우 2 · 한지우 2 · 서재훈 1.
--       0건 빌더 없음.

-- 확인 ④ C-01 카드 표기 (FN-C01-04 — 단수 · 외 1명 · 외 2명 세 가지)
select p.slug,
       count(*) as 담당수,
       (array_agg(b.display_name order by pb.is_owner desc, pb.sort_order))[1]
         || case when count(*) = 1 then '' else ' 외 ' || (count(*) - 1) || '명' end as 카드표기
from public.project p
join public.project_builder pb on pb.project_id = p.id
join public.builder b on b.id = pb.builder_id
group by p.slug
order by 담당수, p.slug;
-- 기대: 5행. 표기 세 가지가 전부 나온다.
--   패밀리케어     1 → 「이서현」          ← 단수
--   에듀셀파       2 → 「이서현 외 1명」    ← 외 1명
--   나이스정보통신 3 → 「김도영 외 2명」
--   에어로케이     3 → 「김도영 외 2명」
--   우리동네광고   3 → 「김도영 외 2명」   ← 외 2명

-- 확인 ⑤ 합계
select
  (select count(*) from public.builder)                              as 빌더행,
  (select count(*) from public.project_builder)                      as 연결행,
  (select count(*) from public.builder where slug like 'builder-%')   as 잔존플레이스홀더;
-- 기대: 6 · 12 · 0

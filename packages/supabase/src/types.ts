/**
 * Supabase 테이블 타입.
 *
 * `migrations/0001_init.sql` 과 **수동으로 동기화**합니다.
 * 마이그레이션을 바꾸면 이 파일도 함께 고치세요. (`supabase gen types` 를 쓸 수도 있지만,
 * 데모 상태에서 CLI 의존성을 추가하지 않기 위해 손으로 관리합니다.)
 */

/**
 * posts 테이블의 한 행. 프론트매터 스키마와 1:1 대응됩니다.
 *
 * `interface` 가 아니라 `type` 이어야 합니다. supabase-js 의 `GenericTable` 은
 * `Row extends Record<string, unknown>` 을 요구하는데, 인터페이스에는 암묵적
 * 인덱스 시그니처가 붙지 않아 이 제약을 통과하지 못하고 모든 쿼리 결과 타입이
 * 조용히 `never` 로 무너집니다.
 */
export type PostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: string;
  author: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  /** 프론트매터의 cover 블록 전체. */
  cover: Record<string, unknown> | null;
  /** 프론트매터의 seo 블록 전체 (canonical · robots · og · twitter · sitemap). */
  seo: Record<string, unknown>;
  /** 프론트매터의 geo 블록 전체 (answerSummary · faq · entities · citations). */
  geo: Record<string, unknown>;
  /** 프론트매터의 review 블록 전체. */
  review: Record<string, unknown>;
};

export type PostInsert = Omit<PostRow, 'id'> & { id?: string };

/**
 * 아래 6종은 `migrations/0002_ai_builder_group.sql` 의 컬럼과 1:1 로 맞춥니다.
 * 마이그레이션을 바꾸면 이 파일도 함께 고치세요.
 * `insight` · `admin_user` 는 아직 읽는 화면이 없어 넣지 않았습니다.
 * 필요할 때 같은 방식으로 추가합니다.
 *
 * `Relationships` 가 비어 있어 PostgREST 중첩 select
 * (`project_category(category(...))`)는 타입이 잡히지 않습니다.
 * 조인이 필요하면 평면 쿼리를 여러 번 던져 앱에서 합칩니다
 * (`apps/web/lib/queries/project-cards.ts` 참조).
 */

/** 프로젝트 링크 등급. `none` 이면 바로가기 버튼을 렌더하지 않습니다 (FN-C01-08). */
export type LinkGrade = 'live' | 'deploy' | 'repo' | 'video' | 'none';

/** 포트폴리오 분류 축. 계층 없이 두 축을 한 목록으로 관리합니다 (데이터모델 §3.4). */
export type CategoryAxis = 'industry' | 'service';

/**
 * 교육 과정 상태. P-07 카드가 「모집 중 / 준비 중」을 가릅니다 (데이터모델 §3.6).
 * P-07 은 범위 밖이지만 컬럼 제약(`course_status_check`)이라 타입에 그대로 둡니다.
 */
export type CourseStatus = 'open' | 'preparing';

/**
 * 교육 과정. P-08 폐지로 공개 경로는 없어졌고, 지금 읽는 곳은
 * P-06 의 수료 과정명 표기 한 곳뿐입니다 (`FN-P06-05` — **텍스트로만**).
 */
export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  /** 커리큘럼 항목 배열. JSON 구조는 과정 콘텐츠 수령 후 확정 (데이터모델 §8-7) */
  curriculum: unknown[];
  status: CourseStatus;
  is_public: boolean;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BuilderRow = {
  id: string;
  auth_user_id: string | null;
  slug: string;
  display_name: string;
  name_type: 'real' | 'nickname';
  image_url: string | null;
  image_alt: string | null;
  cohort: number;
  bio: string | null;
  career: unknown[];
  course_id: string | null;
  is_public: boolean;
  is_pinned: boolean;
  pin_order: number | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body_what: string;
  body_why: string;
  body_how: string;
  body_result: string;
  thumbnail_url: string;
  thumbnail_alt: string;
  live_url: string | null;
  link_grade: LinkGrade;
  is_public: boolean;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  axis: CategoryAxis;
  slug: string;
  name: string;
  sort_order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectBuilderRow = {
  id: string;
  project_id: string;
  builder_id: string;
  is_owner: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectCategoryRow = {
  id: string;
  project_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
};

/**
 * `migrations/0003_site_setting.sql`. 키-값 한 쌍이 한 행입니다.
 * `id` 가 없고 `key` 가 기본키인 유일한 테이블입니다.
 *
 * 현재 키: `contact_form_url` — 문의 폼(Plug) 주소.
 * 회의록(8/12) 「문의 폼 및 유입 경로」의 "관리자 화면에서 폼 URL을 변경할 수 있도록"
 * 이 여기에 대응합니다.
 */
export type SiteSettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

/**
 * 인사이트 카테고리. `/insights/{category}` 가 점유한 **예약어 3개**이며
 * 글 슬러그로 쓸 수 없습니다 (IA §4 · FN-A07-04 · DB CHECK 양쪽).
 */
export type InsightCategory = 'before' | 'process' | 'people';

/** 공개 조건은 `published` **이고** `published_at` 이 있을 때입니다. 그 외는 404. */
export type InsightStatus = 'draft' | 'review' | 'published';

/**
 * 인사이트 글. 데이터모델 §3.6a · 마이그레이션 0002
 *
 * `body` 는 **마크다운**입니다. 에디터가 경계에서만 HTML 로 바꿉니다
 * (`apps/admin/lib/markdown.ts`).
 *
 * `cover_image_url` 은 파생 값이지만 저장합니다 — 데이터모델 §6 원칙의 명시적 예외입니다.
 * 본문 저장 시 함께 갱신합니다 (FN-A07-07).
 */
export type InsightRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: InsightCategory;
  /** NOT NULL — REQ-F-095 가 익명·조직 명의 글을 금지합니다. */
  builder_id: string;
  cover_image_url: string | null;
  status: InsightStatus;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * DB 가 스스로 채우는 컬럼. Insert 에서 생략할 수 있다.
 *
 * `id` 는 `gen_random_uuid()`, 두 시각은 `default now()` 와 `set_updated_at()` 트리거가
 * 채운다 (마이그레이션 0001 · 0002). 이걸 필수로 두면 삽입할 때마다 앱이 시각을 만들어
 * 넣게 되고, 그 값은 **DB 시계가 아니라 앱 서버 시계**다 — 두 시각이 갈라진다.
 */
type Generated = 'id' | 'created_at' | 'updated_at';

type InsertOf<T extends { id: string; created_at: string; updated_at: string }> = Omit<
  T,
  Generated
> &
  Partial<Pick<T, Generated>>;

/**
 * supabase-js checks this against its internal `GenericSchema`. Omitting
 * `Views` / `Functions` / `Enums` / `CompositeTypes` / `Relationships` makes
 * the constraint fail silently and every query result collapses to `never`,
 * so the empty members below are load-bearing, not boilerplate.
 */
export type Database = {
  public: {
    Tables: {
      posts: {
        Row: PostRow;
        Insert: PostInsert;
        Update: Partial<PostInsert>;
        Relationships: [];
      };
      course: {
        Row: CourseRow;
        Insert: InsertOf<CourseRow>;
        Update: Partial<CourseRow>;
        Relationships: [];
      };
      builder: {
        Row: BuilderRow;
        Insert: InsertOf<BuilderRow>;
        Update: Partial<BuilderRow>;
        Relationships: [];
      };
      project: {
        Row: ProjectRow;
        Insert: InsertOf<ProjectRow>;
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      category: {
        Row: CategoryRow;
        Insert: InsertOf<CategoryRow>;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      project_builder: {
        Row: ProjectBuilderRow;
        Insert: InsertOf<ProjectBuilderRow>;
        Update: Partial<ProjectBuilderRow>;
        Relationships: [];
      };
      project_category: {
        Row: ProjectCategoryRow;
        Insert: InsertOf<ProjectCategoryRow>;
        Update: Partial<ProjectCategoryRow>;
        Relationships: [];
      };
      insight: {
        Row: InsightRow;
        Insert: InsertOf<InsightRow>;
        Update: Partial<InsightRow>;
        Relationships: [];
      };
      // `key` 가 기본키라 Insert 에서 생략할 수 없다 (다른 테이블의 `id?` 와 다르다)
      site_setting: {
        Row: SiteSettingRow;
        Insert: SiteSettingRow;
        Update: Partial<SiteSettingRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    /**
     * 판정 함수 (마이그레이션 0002 §3 · 데이터모델 §4.1).
     *
     * `admin_user` 는 0004 에서 authenticated 롤에 **일부러 열지 않았다.**
     * 두 함수가 security definer 라 함수 안에서만 그 테이블이 읽힌다 —
     * 관리 화면의 역할 판정은 테이블 조회가 아니라 이 rpc 를 지나야 한다.
     */
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean };
      my_builder_id: { Args: Record<never, never>; Returns: string | null };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

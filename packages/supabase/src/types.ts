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
 * 아래 5종은 `migrations/0002_ai_builder_group.sql` 의 컬럼과 1:1 로 맞춥니다.
 * 마이그레이션을 바꾸면 이 파일도 함께 고치세요.
 * `course` · `insight` · `admin_user` · `site_setting` 은 아직 읽는 화면이 없어
 * 넣지 않았습니다. 필요할 때 같은 방식으로 추가합니다.
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
      builder: {
        Row: BuilderRow;
        Insert: Omit<BuilderRow, 'id'> & { id?: string };
        Update: Partial<BuilderRow>;
        Relationships: [];
      };
      project: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, 'id'> & { id?: string };
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      category: {
        Row: CategoryRow;
        Insert: Omit<CategoryRow, 'id'> & { id?: string };
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      project_builder: {
        Row: ProjectBuilderRow;
        Insert: Omit<ProjectBuilderRow, 'id'> & { id?: string };
        Update: Partial<ProjectBuilderRow>;
        Relationships: [];
      };
      project_category: {
        Row: ProjectCategoryRow;
        Insert: Omit<ProjectCategoryRow, 'id'> & { id?: string };
        Update: Partial<ProjectCategoryRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

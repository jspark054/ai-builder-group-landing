// A-01 로그인 `/admin/login`
//
// 근거 — 화면설계 §6.1 · 기능명세 §5.1 · IA §3.2
//   FN-A01-01  이메일·비밀번호를 입력받는다
//   FN-A01-03  **회원가입 UI를 제공하지 않는다** — 계정은 관리자가 발급한다
//
// 조판은 발주사(똑똑한개발자) Admin CMS 로그인 화면을 따랐다 (2026-08-27 제공 캡처).
// 회색 배경 위 카드 한 장, 워드마크 → 서브라벨 → 제목 → 라벨+필드 2개 → 풀폭 검정 버튼.
// 운영자가 이미 쓰는 조작 방식이라 학습 비용이 들지 않는다.
//
// ⚠ 캡처의 입력창이 연파랑인 것은 디자인이 아니라 크롬 자동완성 배경(#E8F0FE)이다.
//   필드는 흰 배경 + 테두리로 그린다.
// ⚠ 카드는 그림자가 아니라 테두리로 세운다 (하드룰 1 — 그림자 클래스 전면 금지).
//
// 이 화면은 (shell) 밖에 있다. 사이드바가 보이면 이미 들어온 것처럼 읽힌다.

import { safeNext } from '@/lib/safe-next';

import { signIn } from './actions';

/** 실패 사유별 문구. 계정 존재 여부가 드러나는 표현을 쓰지 않는다. */
const ERROR_MESSAGE: Record<string, string> = {
  credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
  'no-account': '이 계정에는 관리 화면 권한이 없습니다. 운영 담당자에게 문의하세요.',
  config: 'Supabase 연결 정보가 없어 로그인할 수 없습니다. 환경 변수를 확인하세요.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const message = params.error ? ERROR_MESSAGE[params.error] : undefined;

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-[420px] rounded-2xl border border-neutral-200 bg-white p-10">
        <p className="text-lg font-bold tracking-wide">AI 빌더그룹</p>
        <p className="mt-1 text-xs text-neutral-400">Admin</p>

        <h1 className="mt-8 text-2xl font-bold tracking-tight">로그인</h1>

        {message && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {message}
          </p>
        )}

        <form action={signIn} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />

          <div>
            <label className="label" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="field h-12"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="field h-12"
            />
          </div>

          <button type="submit" className="btn-primary h-12 w-full">
            로그인
          </button>
        </form>

        {/* 회원가입·비밀번호 찾기 링크를 두지 않는다 (FN-A01-03).
            계정은 관리자가 발급하고, 비밀번호 재설정 경로는 확정문서에 없다. */}
      </div>
    </div>
  );
}

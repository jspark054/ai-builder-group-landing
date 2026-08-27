import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const marked = new Marked({ gfm: true, breaks: false });

/**
 * 본문에 남길 태그.
 *
 * A-07 에디터(Tiptap)가 만들 수 있는 것 + 마크다운이 만드는 것까지다.
 * 여기 없는 태그는 껍데기만 벗기고 안의 글은 남긴다 — 통째로 지우면 작성자가
 * 「왜 문단이 사라졌지」만 겪고 무엇이 문제였는지는 모른다.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
  'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'blockquote', 'hr',
  'a', 'img',
  'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

/**
 * 인사이트 본문을 HTML 로 렌더한다.
 *
 * 🔴 **`marked` 는 마크다운 안의 raw HTML 을 그대로 통과시킨다.** 예전 주석은
 *    「repo-authored, so it is trusted」였는데, A-07 이 붙은 지금 본문은 관리 화면에서
 *    들어온다. 작성자가 관리자뿐인 것은 **방어가 아니라 가정**이다 — 계정 하나가
 *    털리면 공개 페이지에 스크립트가 박히고 그건 DB 에 영속된다.
 *
 * 정규식으로 직접 거르지 않는다. HTML 파싱은 예외가 많아 손으로 만든 필터는 거의 항상
 * 뚫린다 (`<img src=x onerror=…>` · `javascript:` · `<svg><script>` · 주석 안의 태그 …).
 *
 * **저장 시점이 아니라 렌더 시점에** 씻는 이유 — 저장 형식이 마크다운이라 저장 직전에는
 * 씻을 HTML 이 아직 없고, 원본을 고치면 작성자가 쓴 것과 저장된 것이 달라진다.
 * ISR 이라 렌더가 자주 돌지도 않는다.
 *
 * h1 은 h2 로 내린다. 페이지 제목이 h1 이므로 본문에 또 있으면 문서 구조가 깨진다.
 */
export function renderMarkdown(body: string): string {
  const html = marked.parse(body, { async: false });

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      // rel 을 허용 목록에 넣어야 아래 transformTags 가 붙인 값이 살아남는다 —
      // 허용 목록은 transform 이후에 한 번 더 적용된다
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    // data: URI 를 허용하지 않는다. 이미지는 Storage 에 올리고 주소로 참조한다
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    nonTextTags: ['script', 'style', 'textarea', 'noscript'],
    transformTags: {
      h1: 'h2',
      h5: 'h4',
      h6: 'h4',
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: 'noopener noreferrer' },
      }),
    },
  });
}

export function formatDate(iso: string | undefined, locale = 'ko-KR'): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

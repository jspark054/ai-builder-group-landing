// 본문 이미지 업로드 — 에디터의 이미지 버튼이 부른다.
//
// 근거 — FN-A07-07(본문 첫 이미지를 커버로) · 하드룰 3(이미지는 발주사가 넣는다)
//
// 🔴 인증을 여기서 다시 본다. proxy 는 `/api/*` 도 잡지만(matcher 가 자산만 제외한다),
//    그건 **인증**까지다. 업로드는 관리자만 할 수 있어야 한다 — `requireAdmin()` 이
//    빌더를 A-06 으로 돌려보낸다.
//
// 🔴 Storage 업로드는 service role 키를 쓴다(packages/supabase 의 uploadImage).
//    그래서 이 라우트가 서버 전용이라는 사실이 중요하다. 브라우저는 파일만 던진다.
//
// ⚠ 생성이 아니라 업로드다. 「코드로 SVG 를 그려 이미지를 대신하지 않는다」와 무관하다.

import { NextResponse } from 'next/server';

import { uploadImage } from '@orca/supabase';

import { requireAdmin } from '@/lib/authz';
import { toSlug } from '@/lib/insights';

/** 본문에 넣을 수 있는 형식. 그 외는 받지 않는다 */
// 에디터의 file input `accept` 와 목록을 맞춘다 — 고를 수는 있는데 서버가 거절하면
// 사용자는 왜 안 되는지 알 수 없다.
const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
]);

/** 5MB. 본문 이미지가 이보다 크면 공개 화면이 먼저 느려진다 */
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  await requireAdmin();

  const form = await request.formData();
  const file = form.get('file');
  const slugField = form.get('slug');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  }

  const extension = ALLOWED.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: 'JPG · PNG · WebP · GIF · AVIF 만 올릴 수 있습니다.' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '5MB 이하만 올릴 수 있습니다.' }, { status: 400 });
  }

  // 경로에 글 슬러그를 넣어 두면 나중에 어느 글의 이미지인지 보인다.
  // 새 글은 아직 슬러그가 없어 'new' 로 들어온다.
  const folder = toSlug(typeof slugField === 'string' ? slugField : '') || 'new';
  const path = `insight/${folder}/${Date.now()}.${extension}`;

  try {
    const { url } = await uploadImage(await file.arrayBuffer(), {
      path,
      contentType: file.type,
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[a-07 upload]', error);
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 });
  }
}

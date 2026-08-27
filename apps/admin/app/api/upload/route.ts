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

/**
 * Storage 키에 넣어도 되는 문자만 남긴다.
 *
 * 🔴 슬러그를 그대로 넣으면 안 된다. 이 프로젝트의 슬러그는 **자연어 한글**인데
 *    (`REQ-N-013`) Supabase Storage 키는 ASCII 만 받는다 —
 *    `insight/한글/1.png` 은 `InvalidKey` 로 거절된다 (2026-08-28 실측).
 *    그래서 폴더에는 슬러그가 아니라 글 id(UUID)를 쓰고, 여기서 한 번 더 거른다.
 */
function toStorageFolder(input: string): string {
  const safe = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 80);
  return safe || 'new';
}

export async function POST(request: Request): Promise<Response> {
  await requireAdmin();

  const form = await request.formData();
  const file = form.get('file');
  const folderField = form.get('folder');

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

  // 경로에 글 id 를 넣어 두면 나중에 어느 글의 이미지인지 보인다.
  // 새 글은 아직 id 가 없어 'new' 로 들어온다.
  const folder = toStorageFolder(typeof folderField === 'string' ? folderField : '');
  const path = `insight/${folder}/${Date.now()}.${extension}`;

  try {
    const { url } = await uploadImage(await file.arrayBuffer(), {
      path,
      contentType: file.type,
    });
    return NextResponse.json({ url });
  } catch (error) {
    // 🔴 원인을 삼키지 않는다. 이 라우트는 관리자만 부르므로 실제 사유를 그대로 보여준다 —
    //    「업로드에 실패했습니다」만 뜨면 관리자도 우리도 다음에 할 일을 알 수 없다.
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[a-07 upload]', { path, contentType: file.type, size: file.size, detail });
    return NextResponse.json({ error: `업로드에 실패했습니다. ${detail}` }, { status: 500 });
  }
}

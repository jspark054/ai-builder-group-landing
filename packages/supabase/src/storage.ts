import { createAdminSupabase } from './client.ts';
import { requireConfig } from './config.ts';

export interface UploadResult {
  /** 브라우저에서 바로 쓸 수 있는 공개 URL. */
  url: string;
  /** 버킷 내부 경로. 삭제할 때 필요합니다. */
  path: string;
}

/**
 * 이미지를 Supabase Storage 에 업로드합니다.
 *
 * 이 함수는 **사용자가 올린 이미지**만 다룹니다 (`source: user-upload`).
 * 이미지 *생성*은 Codex imagegen 전용이라는 하드 룰과 무관합니다 — 업로드는 생성이 아닙니다.
 * ADR-0002 참조.
 */
export async function uploadImage(
  file: ArrayBuffer | Uint8Array,
  options: { path: string; contentType: string; upsert?: boolean },
): Promise<UploadResult> {
  const { bucket } = requireConfig();
  const supabase = createAdminSupabase();

  const { error } = await supabase.storage.from(bucket).upload(options.path, file, {
    contentType: options.contentType,
    upsert: options.upsert ?? true,
  });

  if (error) {
    throw new Error(`Supabase Storage 업로드 실패: ${describeStorageError(error)}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(options.path);
  return { url: data.publicUrl, path: options.path };
}

export async function deleteImage(path: string): Promise<void> {
  const { bucket } = requireConfig();
  const supabase = createAdminSupabase();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Supabase Storage 삭제 실패: ${describeStorageError(error)}`);
}

/**
 * StorageError 를 사람이 읽을 수 있는 한 줄로 만듭니다.
 *
 * 🔴 `error.message` 만 쓰면 원인을 통째로 잃습니다. storage-js 는 응답 본문의
 *    `msg` · `message` · `error` 를 그대로 메시지로 삼는데, 그 값이 빈 문자열이면
 *    메시지도 빈 문자열이 됩니다 — 2026-08-28 프로덕션에서 실제로 그렇게 났고
 *    (Vercel 로그에 `<none>`) 서버 로그에도 단서가 남지 않았습니다.
 *    이름 · HTTP 상태 · statusCode 를 함께 붙여 그때도 원인을 남깁니다.
 */
function describeStorageError(error: unknown): string {
  if (typeof error !== 'object' || error === null) return String(error);

  const e = error as { name?: string; message?: string; status?: number; statusCode?: string };
  const parts = [
    typeof e.name === 'string' && e.name !== '' ? e.name : undefined,
    typeof e.message === 'string' && e.message.trim() !== '' ? e.message : undefined,
    typeof e.status === 'number' ? `status=${e.status}` : undefined,
    typeof e.statusCode === 'string' && e.statusCode !== ''
      ? `statusCode=${e.statusCode}`
      : undefined,
  ].filter((part): part is string => part !== undefined);

  return parts.length > 0 ? parts.join(' · ') : JSON.stringify(error);
}

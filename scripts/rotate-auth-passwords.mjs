#!/usr/bin/env node
/**
 * Supabase Auth 계정 비밀번호 일괄 교체.
 *
 * 배포 전 점검 항목이다 — 세 계정의 비밀번호가 세션 대화에 평문으로 남았고,
 * 관리자 두 계정은 같은 값을 쓰고 있다. 관리자를 둘로 나눈 이유가 운영 연속성인데
 * (데이터모델 §3.7) 같은 비밀번호면 그 목적이 사라진다.
 *
 * ── 쓰는 법 ──────────────────────────────────────────────────
 *
 *   ADMIN1_PW='...' ADMIN2_PW='...' BUILDER_PW='...' \
 *     node scripts/rotate-auth-passwords.mjs
 *
 * 값을 하나만 넘기면 그 계정만 바꾼다. 넘기지 않은 계정은 건드리지 않는다.
 *
 * 🔴 **비밀번호를 인자로 넘기지 않는다.** 인자는 `ps` 로 다른 프로세스에서 보인다.
 *    환경변수도 셸 히스토리에 남으므로, 남기고 싶지 않으면 앞에 공백을 하나 두거나
 *    (`HISTCONTROL=ignorespace` 인 셸) `read -s` 로 받아서 넘긴다:
 *
 *      read -s -p 'admin1: ' ADMIN1_PW && export ADMIN1_PW
 *
 * 🔴 이 스크립트는 **service_role 키**를 쓴다. 서버 전용 키이므로 로컬에서만 돌린다.
 *    `.env` 를 읽으므로 `bash scripts/with-env.sh` 를 앞에 붙일 필요는 없다 —
 *    아래에서 직접 읽는다.
 *
 * ⚠ 출력에 비밀번호를 찍지 않는다. 성공/실패와 계정 이메일만 남긴다.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** `.env` 를 읽어 process.env 에 없는 값만 채운다 (이미 있는 값을 덮지 않는다) */
function loadEnv() {
  let raw;
  try {
    raw = readFileSync(join(ROOT, '.env'), 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
  process.exit(1);
}

/** 어느 환경변수가 어느 계정을 가리키는지. 이메일을 코드에 두어 오타를 막는다 */
const TARGETS = [
  { env: 'ADMIN1_PW', email: 'admin@builderschool.ai', label: '관리자 1' },
  { env: 'ADMIN2_PW', email: 'admin2@builderschool.ai', label: '관리자 2' },
  { env: 'BUILDER_PW', email: 'builder-test@builderschool.ai', label: '빌더 테스트' },
];

/** Supabase 기본 정책은 6자 이상이다. 그보다 높게 잡는다 — 관리 화면 계정이다 */
const MIN_LENGTH = 12;

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function findUserId(email) {
  // Admin API 의 목록 조회. 계정 수가 적어 페이지를 넘기지 않는다
  const res = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers });
  if (!res.ok) throw new Error(`사용자 목록 조회 실패 (HTTP ${res.status})`);
  const body = await res.json();
  const users = Array.isArray(body) ? body : (body.users ?? []);
  const found = users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
  return found?.id ?? null;
}

async function setPassword(id, password) {
  const res = await fetch(`${url}/auth/v1/admin/users/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    // 응답 본문에 비밀번호가 실리지 않는다. 상태 코드와 메시지만 꺼낸다
    let detail = '';
    try {
      const body = await res.json();
      detail = body.msg ?? body.message ?? body.error_description ?? '';
    } catch {
      /* 본문이 JSON 이 아니면 상태 코드만 남긴다 */
    }
    throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
  }
}

let attempted = 0;
let failed = 0;

for (const target of TARGETS) {
  const password = process.env[target.env];

  if (password === undefined || password === '') {
    console.log(`건너뜀   ${target.label.padEnd(8)} ${target.email}  (${target.env} 미지정)`);
    continue;
  }

  attempted += 1;

  if (password.length < MIN_LENGTH) {
    console.error(
      `실패     ${target.label.padEnd(8)} ${target.email}  ${MIN_LENGTH}자 이상이어야 합니다`,
    );
    failed += 1;
    continue;
  }

  try {
    const id = await findUserId(target.email);
    if (!id) {
      console.error(`실패     ${target.label.padEnd(8)} ${target.email}  계정을 찾지 못했습니다`);
      failed += 1;
      continue;
    }
    await setPassword(id, password);
    console.log(`변경됨   ${target.label.padEnd(8)} ${target.email}`);
  } catch (error) {
    console.error(
      `실패     ${target.label.padEnd(8)} ${target.email}  ${error instanceof Error ? error.message : String(error)}`,
    );
    failed += 1;
  }
}

if (attempted === 0) {
  console.log('\n바꾼 계정이 없습니다. ADMIN1_PW · ADMIN2_PW · BUILDER_PW 중 하나 이상을 주세요.');
  process.exit(1);
}

console.log(`\n시도 ${attempted}건 · 실패 ${failed}건`);
if (failed > 0) process.exit(1);

console.log('\n⚠ 바꾼 비밀번호로 실제 로그인이 되는지 확인하세요.');
console.log('⚠ 셸 히스토리에 값이 남았는지 확인하고 필요하면 지우세요.');

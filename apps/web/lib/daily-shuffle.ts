/**
 * 일별 시드 셔플 — `POL-07` 빌더 목록 정렬 · `FN-P05-02`.
 *
 * 인수 기준이 「동일 날짜 내 순서 동일, 날짜 변경 시 순서 변경」이다.
 * `Math.random()` 은 요청마다 달라져 이 조건을 통과하지 못하고, SSG 와도 맞지 않는다.
 * 그래서 **당일 날짜만으로 결정되는** 난수열을 쓴다.
 *
 * 새 라이브러리를 도입하지 않는다. 아래 두 함수가 전부다.
 */

/** 시드 문자열 → 32비트 정수. FNV-1a. 암호용이 아니라 분포만 있으면 된다 */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    // FNV 소수 곱. Math.imul 이라야 32비트로 감기고 정밀도가 안 샌다
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — 상태 32비트짜리 결정적 PRNG. 같은 시드면 같은 수열이다 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 오늘 날짜를 `YYYY-MM-DD` 로 준다. **Asia/Seoul 고정**이다.
 *
 * 서버 타임존에 맡기면 배포 환경(대개 UTC)과 국내 방문자의 「오늘」이 갈려,
 * 한국 시간 오전 9시 이전에 어제 순서가 나온다. 시드가 흔들리면
 * `FN-P05-02` 의 「동일 날짜 내 순서 동일」이 깨진다.
 */
export function seoulDateKey(now: Date = new Date()): string {
  // en-CA 로케일이 YYYY-MM-DD 를 준다. 직접 포맷하면 자리수 패딩을 또 손봐야 한다
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * 시드 기반 Fisher-Yates. 원본 배열을 건드리지 않고 새 배열을 준다.
 *
 * 같은 `seed` 면 항상 같은 순서다 — 하루 안에서는 재방문해도 순서가 유지되고
 * (POL-07 「재방문 탐색」), 검수 시 같은 날짜에 같은 화면이 재현된다.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  const random = mulberry32(hashSeed(seed));

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    // noUncheckedIndexedAccess 때문에 구조 분해 교환을 쓰면 T | undefined 가 된다.
    // 인덱스가 범위 안인 것은 루프 조건이 보장하므로 지역 변수로 받아 교환한다
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }

  return result;
}

// src/utils/syncError.js
//
// 동기화 실패 메시지를 관리자가 읽을 수 있는 한글 안내로 바꾼다.
//
// 백엔드는 예외 종류를 접두로 붙인 원문을 그대로 저장한다.
//   BadSqlGrammarException: ### Error updating database. Cause: java.sql...
//   InternalServerError: 500 Internal Server Error: <!DOCTYPE html>...
// 이 원문에는 테이블 구조와 SQL 문이 그대로 들어 있어 화면에 노출하면 안 된다.
// 원인 파악에는 필요하므로 지우지 않고, 요약을 보여주고 원문은 접어둔다.

// 위에서부터 먼저 걸리는 규칙이 이긴다. 구체적인 것을 앞에 둔다.
const RULES = [
  // ── DB 제약 ─────────────────────────────────────────────
  {
    test: /Column '([^']+)' cannot be null/i,
    build: (m) => `필수 값이 비어 있어 저장하지 못했습니다 (${m[1]})`,
  },
  {
    test: /Unknown column '([^']+)'/i,
    build: (m) => `DB에 없는 항목을 사용했습니다. 스키마가 최신인지 확인하세요 (${m[1]})`,
  },
  {
    test: /Table '([^']+)' doesn't exist/i,
    build: (m) => `DB에 없는 테이블을 사용했습니다. 스키마가 최신인지 확인하세요 (${m[1]})`,
  },
  {
    test: /Duplicate entry '([^']*)'/i,
    build: (m) => `이미 있는 데이터를 다시 저장하려 했습니다 (${m[1]})`,
  },
  {
    test: /foreign key constraint/i,
    build: () => '참조하는 기준 데이터가 없어 저장하지 못했습니다',
  },
  {
    test: /Data too long for column '([^']+)'/i,
    build: (m) => `값이 저장 가능한 길이를 넘었습니다 (${m[1]})`,
  },
  {
    test: /Incorrect .* value/i,
    build: () => '값의 형식이 맞지 않아 저장하지 못했습니다',
  },
  {
    test: /Out of range value/i,
    build: () => '숫자 값이 저장 가능한 범위를 넘었습니다',
  },
  {
    test: /Check constraint .* is violated/i,
    build: () => '허용되지 않는 값이라 저장하지 못했습니다',
  },

  // ── DB 연결 ─────────────────────────────────────────────
  {
    test: /CannotGetJdbcConnection|DataAccessResourceFailure|Communications link failure/i,
    build: () => 'DB에 연결하지 못했습니다',
  },
  {
    test: /Deadlock found|Lock wait timeout/i,
    build: () => '다른 작업과 겹쳐 DB 처리가 지연되었습니다. 다시 시도해 주세요',
  },

  // ── 외부 API 응답 코드 ──────────────────────────────────
  {
    test: /\b500\b|InternalServerError/i,
    build: () => '온통청년 서버에서 오류가 발생했습니다 (HTTP 500)',
  },
  {
    test: /\b50[234]\b|Bad Gateway|Service Unavailable|Gateway Timeout/i,
    build: () => '온통청년 서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요',
  },
  {
    test: /\b404\b|NotFound/i,
    build: () => '요청한 주소를 찾을 수 없습니다 (HTTP 404)',
  },
  {
    test: /\b40[13]\b|Unauthorized|Forbidden/i,
    build: () => 'API 인증에 실패했습니다. 서비스 키를 확인하세요',
  },
  {
    test: /\b429\b|Too Many Requests/i,
    build: () => '요청이 너무 많아 일시적으로 차단되었습니다',
  },
  {
    test: /\b400\b|Bad Request/i,
    build: () => '요청 형식이 올바르지 않습니다 (HTTP 400)',
  },

  // ── 네트워크 ────────────────────────────────────────────
  {
    test: /SocketTimeout|timed? ?out|ReadTimeout/i,
    build: () => '응답을 기다리다 시간이 초과되었습니다',
  },
  {
    test: /UnknownHost|ConnectException|Connection refused|ResourceAccessException/i,
    build: () => '외부 서버에 연결하지 못했습니다. 네트워크를 확인하세요',
  },
  {
    test: /SSL|Certificate/i,
    build: () => '보안 연결에 실패했습니다',
  },

  // ── 응답 파싱 ───────────────────────────────────────────
  {
    test: /<!DOCTYPE html|<html/i,
    build: () => '서버가 정상 데이터 대신 오류 페이지를 보냈습니다',
  },
  {
    test: /JsonParse|JsonMapping|JsonProcessing|Unexpected character|MismatchedInput/i,
    build: () => '응답 형식을 해석하지 못했습니다',
  },
  {
    test: /NumberFormat|DateTimeParse|ParseException/i,
    build: () => '응답에 형식이 잘못된 값이 있어 변환하지 못했습니다',
  },

  // ── 코드 오류 ───────────────────────────────────────────
  {
    test: /NullPointerException/i,
    build: () => '처리 도중 값이 비어 오류가 발생했습니다',
  },
  {
    test: /IndexOutOfBounds|ArrayIndexOutOfBounds/i,
    build: () => '응답 데이터 개수가 예상과 달라 오류가 발생했습니다',
  },
  {
    test: /ClassCast|IllegalArgument|IllegalState/i,
    build: () => '처리 중 예상하지 못한 값이 들어와 오류가 발생했습니다',
  },
  {
    test: /OutOfMemory/i,
    build: () => '처리량이 많아 메모리가 부족했습니다',
  },
];

// 영문자·중괄호·세미콜론이 거의 없으면 이미 사람이 읽을 수 있는 한글 메시지로 본다.
// 예: '일부 항목 파싱 실패(3건)', '공공데이터포털 API 응답 오류(HTTP 500)'
function looksKorean(raw) {
  const hangul = (raw.match(/[가-힣]/g) || []).length;
  const noise = (raw.match(/[{};#]|Exception|\bat\b/g) || []).length;
  return hangul >= 4 && noise === 0;
}

/**
 * 오류 원문을 화면용으로 바꾼다.
 *
 * @returns {{ summary: string, detail: string|null }}
 *   summary — 표에 바로 보여줄 한글 한 줄
 *   detail  — 원문. 이미 읽을 만한 메시지면 null (접기 버튼을 숨기면 된다)
 */
export function translateSyncError(raw) {
  if (!raw) return { summary: '', detail: null };

  const text = String(raw).trim();
  if (!text) return { summary: '', detail: null };

  if (looksKorean(text)) {
    return { summary: text, detail: null };
  }

  for (const rule of RULES) {
    const m = text.match(rule.test);
    if (m) {
      return { summary: rule.build(m), detail: text };
    }
  }

  return { summary: '알 수 없는 오류가 발생했습니다', detail: text };
}

/** 표 한 칸에 들어갈 만큼 자른다. */
export function shortenError(raw, limit = 40) {
  const { summary } = translateSyncError(raw);
  return summary.length > limit ? `${summary.slice(0, limit)}…` : summary;
}
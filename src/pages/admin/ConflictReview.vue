<template>
  <div>
    <div class="a-head">
      <div><h1>동기화 로그</h1></div>
      <p>온통청년 API 동기화 실행 기록입니다.</p>
    </div>

    <!-- 필터 -->
    <div class="a-card mb-3">
      <div class="a-card-b">
        <div class="f-top">
          <div class="a-field f-date">
            <label>시작일</label>
            <input v-model="filters.startDate" type="date" class="a-num"
                   :max="filters.endDate || undefined" />
          </div>
          <div class="a-field f-date">
            <label>종료일</label>
            <input v-model="filters.endDate" type="date" class="a-num"
                   :min="filters.startDate || undefined" />
          </div>
          <button class="a-btn a-btn-dark a-btn-fix f-go" :disabled="!isPeriodValid" @click="search">
            조회
          </button>
          <button class="a-btn a-btn-fix f-go" @click="resetFilters">초기화</button>
        </div>

        <div class="a-filters">
          <div>
            <div class="a-fl">결과</div>
            <div class="a-seg">
              <button v-for="opt in statusOptions" :key="opt.value"
                      :class="{ 'is-on': filters.resultStatus === opt.value }"
                      @click="selectStatus(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="a-fl">실행 방식</div>
            <div class="a-seg">
              <button v-for="opt in execOptions" :key="opt.value"
                      :class="{ 'is-on': filters.execType === opt.value }"
                      @click="selectExec(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--
      통계.
      ★ 색은 값에 따라 켜진다. 실패가 0회면 회색이고 1회 이상이면 빨강이다.
        항상 켜져 있으면 신호가 아니고, 값에 따라 켜져야 그날 문제가 있었는지가 보인다.
    -->
    <div v-if="data" class="a-metrics stats">
      <div v-for="card in statCards" :key="card.label" class="a-metric" :class="card.cls">
        <div class="a-metric-v a-num">
          {{ card.value }}<span class="a-unit">{{ card.unit }}</span>
        </div>
        <div class="a-metric-l">{{ card.label }}</div>
      </div>
    </div>

    <div v-if="data" class="a-hint mb-3">
      위 통계는 선택한 기간 전체 기준입니다. 결과·실행 방식 필터를 걸어도 바뀌지 않습니다.
    </div>

    <!-- 목록 -->
    <div class="a-card">
      <div v-if="loading" class="a-loading">
        <span class="a-spin"></span> 불러오는 중
      </div>

      <div v-else-if="loadError" class="a-card-b">
        <div class="a-notice a-notice-dngr">{{ loadError }}</div>
      </div>

      <template v-else-if="data">
        <div class="a-card-h">
          <h2>전체 <span class="a-num">{{ data.totalCount.toLocaleString() }}</span>건</h2>
        </div>

        <div class="t-wrap">
          <table class="a-tbl">
            <!--
              ★ 오류 내용 열만 폭을 정하지 않는다.
                모든 열에 폭을 주면 남는 폭이 열마다 비례 배분되어
                열 사이가 조금씩 벌어지고, 그 누적이 오른쪽 여백처럼 보인다.
            -->
            <colgroup>
              <col style="width:84px">
              <col style="width:128px">
              <col style="width:196px">
              <col style="width:96px">
              <col style="width:78px">
              <col style="width:68px">
              <col style="width:68px">
              <col style="width:68px">
              <col style="width:76px">
              <col style="min-width:240px">
              <col style="width:96px">
            </colgroup>
            <thead>
              <tr>
                <th>방식</th>
                <th>실행 시각</th>
                <th>대상 기간</th>
                <th>결과</th>
                <th class="a-r">처리</th>
                <th class="a-r">신규</th>
                <th class="a-r">갱신</th>
                <!-- API 응답에서 사라져 숨김 처리된 건수.
                     데이터는 지우지 않고 노출만 막으므로 복구가 가능하다 -->
                <th class="a-r">삭제</th>
                <th class="a-r">소요</th>
                <th>오류 내용</th>
                <th class="a-r">상세</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in data.logs" :key="log.logNo">
                <td><span class="a-bdg a-bdg-plain a-bdg-fix">{{ execLabel(log.execType) }}</span></td>
                <td class="a-num a-dim d-nowrap">{{ formatDateTime(log.executedAt) }}</td>
                <td class="a-num a-dim d-nowrap">{{ periodText(log) || '전체' }}</td>
                <td>
                  <span class="a-bdg a-bdg-fix" :class="statusBadge(log.resultStatus)">
                    {{ statusLabel(log.resultStatus) }}
                  </span>
                </td>
                <td class="a-r a-num" :class="numClass(log.totalCnt)">
                  {{ log.totalCnt }}<span class="a-unit">건</span>
                </td>
                <td class="a-r a-num" :class="numClass(log.insertCnt)">{{ log.insertCnt }}</td>
                <td class="a-r a-num" :class="numClass(log.updateCnt)">{{ log.updateCnt }}</td>
                <td class="a-r a-num">
                  <span v-if="log.deleteCnt > 0" class="d-del">{{ log.deleteCnt }}</span>
                  <span v-else class="a-zero">0</span>
                </td>
                <td class="a-r a-num a-dim">{{ formatDuration(log.durationMs) }}</td>

                <!--
                  ★ 오류 내용은 차수별로 한 줄씩 그린다.
                    syncError.js 가 이미 「[1차 동기화 실패] status=500」 형태로
                    줄을 나눠 만들고 있는데, 한 문장으로 흘리면 그 구조가 사라진다.
                    재시도가 최대 1회라 항상 두 줄 안쪽이다.

                    차수 구조가 없는 오류(인증 실패·DB 오류 등)는 한 줄로 그대로 둔다.
                -->
                <td>
                  <template v-if="log.errorMsg">
                    <template v-if="attemptRows(log.errorMsg)">
                      <div v-for="(a, i) in attemptRows(log.errorMsg)" :key="i" class="att">
                        <span class="att-k a-num">{{ a.no }}</span>
                        <span class="att-s" :class="a.ok ? 'is-ok' : 'is-fail'">{{ a.text }}</span>
                      </div>
                    </template>
                    <div v-else class="att-one"
                         :class="log.resultStatus === 'F' ? 'is-fail' : ''">
                      {{ errorOf(log.errorMsg).summary }}
                    </div>
                  </template>
                  <span v-else class="a-none">—</span>
                </td>

                <!-- 실패한 로그는 처리 건수가 0이라 갱신 내역이 없다.
                     대신 오류 원문을 볼 수 있어야 하므로 오류가 있으면 버튼을 연다. -->
                <td class="a-t-act">
                  <button class="a-btn a-btn-xs a-btn-fix-sm"
                          :class="log.errorMsg ? 'a-btn-dark' : 'a-btn-quiet'"
                          :disabled="log.totalCnt === 0 && !log.errorMsg"
                          @click="openDetails(log)">
                    {{ log.errorMsg ? '오류' : '보기' }}
                  </button>
                </td>
              </tr>

              <tr v-if="data.logs.length === 0">
                <td colspan="11">
                  <div class="a-empty">
                    조건에 맞는 실행 기록이 없습니다. 기간이나 필터를 바꿔보세요.
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="data.totalCount > 0" class="a-pager">
          <span>
            전체 <b class="a-num">{{ data.totalCount.toLocaleString() }}</b>건 중
            <span class="a-num">{{ rangeText }}</span> 표시
          </span>
          <div class="a-pager-grp">
            <span>
              <b class="a-num">{{ data.page }}</b>
              <span class="d-slash">/</span>
              <span class="a-num">{{ data.totalPages }}</span>
            </span>
            <button class="a-pg" :disabled="data.page <= 1"
                    @click="goPage(data.page - 1)">‹</button>
            <button class="a-pg" :disabled="data.page >= data.totalPages"
                    @click="goPage(data.page + 1)">›</button>
          </div>
        </div>
      </template>
    </div>

    <!-- 상세 : 오류 원문 + 갱신 내역 -->
    <div v-if="detailTarget" class="a-modal-back" @click.self="closeDetails">
      <div class="a-modal log-modal">
        <div class="a-modal-h">
          <div>
            <div class="a-modal-t">동기화 상세</div>
            <div class="a-t-sub a-num">
              {{ formatDateTime(detailTarget.executedAt) }}
              · {{ execLabel(detailTarget.execType) }}
              · {{ statusLabel(detailTarget.resultStatus) }}
              <template v-if="periodText(detailTarget)"> · {{ periodText(detailTarget) }}</template>
            </div>
          </div>
          <button class="a-modal-x" @click="closeDetails">✕</button>
        </div>

        <div class="a-modal-b log-modal-b">
          <!-- 오류가 있으면 먼저 보여준다. 실패 로그는 이게 전부다 -->
          <div v-if="detailTarget.errorMsg" class="a-notice mb-3"
               :class="detailTarget.resultStatus === 'F' ? 'a-notice-dngr' : ''">
            <div>
              <template v-if="attemptRows(detailTarget.errorMsg)">
                <div v-for="(a, i) in attemptRows(detailTarget.errorMsg)" :key="i" class="att">
                  <span class="att-k a-num">{{ a.no }}</span>
                  <span class="att-s" :class="a.ok ? 'is-ok' : 'is-fail'">{{ a.text }}</span>
                </div>
              </template>
              <b v-else>{{ errorOf(detailTarget.errorMsg).summary }}</b>

              <template v-if="errorOf(detailTarget.errorMsg).detail">
                <div>
                  <button class="a-lnk raw-toggle" @click="showRaw = !showRaw">
                    {{ showRaw ? '원문 접기' : '원문 보기' }}
                  </button>
                </div>
                <pre v-if="showRaw" class="raw">{{ errorOf(detailTarget.errorMsg).detail }}</pre>
              </template>
            </div>
          </div>

          <div v-if="detailLoading" class="a-loading">
            <span class="a-spin"></span> 불러오는 중
          </div>

          <div v-else-if="detailError" class="a-notice a-notice-dngr">
            <div>{{ detailError }}</div>
          </div>

          <template v-else>
            <div class="sum">
              <span>전체 <b class="a-num">{{ details.length }}</b>건</span>
              <span>신규 <b class="a-num">{{ insertCount }}</b></span>
              <span>갱신 <b class="a-num">{{ updateCount }}</b></span>
              <span>삭제 <b class="a-num">{{ deleteCount }}</b></span>
              <span>내용 변경 <b class="a-num">{{ changedCount }}</b></span>
            </div>

            <!-- 건수가 많을 수 있어 목록만 스크롤한다 -->
            <div class="detail-scroll">
              <table class="a-tbl">
                <colgroup>
                  <col style="width:78px">
                  <col style="min-width:220px">
                  <col style="min-width:200px">
                  <col style="width:150px">
                  <col style="width:82px">
                </colgroup>
                <thead class="sticky-head">
                  <tr>
                    <th>구분</th>
                    <th>혜택명</th>
                    <th>변경 내용</th>
                    <th>주관기관</th>
                    <th class="a-r">조회수</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in details" :key="d.benefitNo">
                    <td>
                      <span class="a-bdg a-bdg-fix" :class="actionBadge(d.actionType)">
                        {{ actionLabel(d.actionType) }}
                      </span>
                    </td>
                    <td>
                      <div class="a-t-name">{{ d.plcyNm }}</div>
                      <div class="a-t-sub">{{ categoryName(d.categoryCode) }}</div>
                    </td>
                    <td>
                      <span v-if="d.changedSummary" class="d-chg">{{ d.changedSummary }}</span>
                      <span v-else class="a-none">{{ emptySummaryText(d.actionType) }}</span>
                    </td>
                    <td class="a-dim">{{ d.sprvsnInstCdNm }}</td>
                    <td class="a-r a-num">{{ (d.inqCnt ?? 0).toLocaleString() }}</td>
                  </tr>

                  <tr v-if="details.length === 0">
                    <td colspan="5">
                      <div class="a-empty">
                        <template v-if="detailTarget.errorMsg">
                          동기화가 실패해 처리된 혜택이 없습니다.
                        </template>
                        <template v-else>
                          기록된 처리 내역이 없습니다.
                          <div class="empty-sub">기간을 지정한 동기화만 내역을 남깁니다.</div>
                        </template>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import adminApi from '@/api/adminApi';
import { translateSyncError } from '@/util/syncError';

const PAGE_SIZE = 20;

// 영문 대문자는 훑는 속도가 느려 한글로 바꾼다.
// 값(S / P / F)은 서버와 맞춰야 하므로 그대로 둔다.
const statusOptions = [
  { value: '', label: '전체' },
  { value: 'S', label: '성공' },
  { value: 'P', label: '부분 성공' },
  { value: 'F', label: '실패' },
];

const execOptions = [
  { value: '', label: '전체' },
  { value: 'A', label: '자동' },
  { value: 'M', label: '수동' },
];

const filters = reactive({
  startDate: '',
  endDate: '',
  resultStatus: '',
  execType: '',
});

const loading = ref(false);
const loadError = ref('');
const data = ref(null);

// 달력에서 막지만 직접 입력하는 경우까지 대비한다.
// 조회 화면이라 미래 날짜는 허용한다 — 결과가 0건으로 나올 뿐 문제가 없다.
const isPeriodValid = computed(
  () => !filters.startDate || !filters.endDate || filters.startDate <= filters.endDate,
);

const CATEGORY = {
  1: '일자리', 2: '주거', 3: '교육', 4: '복지·문화', 5: '참여·권리',
};

const detailTarget = ref(null); // 상세를 보고 있는 로그
const details = ref([]);
const detailLoading = ref(false);
const detailError = ref('');
const showRaw = ref(false); // 오류 원문 펼침 여부

const insertCount = computed(() => details.value.filter((d) => d.actionType === 'I').length);
const updateCount = computed(() => details.value.filter((d) => d.actionType === 'U').length);
// API 응답에서 사라져 숨김 처리된 건. 갱신과 성격이 달라 따로 센다
const deleteCount = computed(() => details.value.filter((d) => d.actionType === 'D').length);
// 갱신 대상이어도 내용이 그대로인 경우가 많아 실제로 값이 바뀐 건수를 따로 센다
const changedCount = computed(() => details.value.filter((d) => d.changedSummary).length);

/**
 * 처리 구분 표시.
 * I는 새로 들어온 정책, U는 기존 정책 갱신,
 * D는 온통청년 응답에 없어 숨김 처리된 정책이다.
 */
function actionLabel(type) {
  if (type === 'I') return '신규';
  if (type === 'D') return '삭제';
  return '갱신';
}

function actionBadge(type) {
  if (type === 'I') return 'a-bdg-ok';
  if (type === 'D') return 'a-bdg-dngr';
  return 'a-bdg-info';
}

// 변경 요약이 없을 때 대신 보여줄 문구
function emptySummaryText(type) {
  if (type === 'I') return '신규 등록';
  if (type === 'D') return 'API 응답에 없음';
  return '변경 없음';
}

/*
 * 통계 카드.
 *
 * ★ 색을 값에 따라 켠다.
 *   전에는 다섯 개가 전부 검은 숫자라 「실패 1회」와 「전체 28회」의
 *   무게가 같아 어디를 먼저 볼지가 없었다.
 *   반대로 다섯 개를 저마다 다른 색으로 칠하면 정해둔 색의 뜻이 무너진다.
 *   그래서 값이 있을 때만, 정해둔 다섯 색 안에서 켠다.
 */
const statCards = computed(() => {
  if (!data.value) return [];
  const s = data.value.stats;
  return [
    { label: '전체 실행', value: s.totalCount, unit: '회', cls: 'is-quiet' },
    { label: '성공', value: s.successCount, unit: '회', cls: '' },
    {
      label: '부분 성공',
      value: s.partialCount,
      unit: '회',
      cls: s.partialCount > 0 ? 'is-watch' : 'is-quiet',
    },
    {
      label: '실패',
      value: s.failCount,
      unit: '회',
      cls: s.failCount > 0 ? 'is-alert' : 'is-quiet',
    },
    { label: '평균 소요', value: formatDurationValue(s.avgDurationMs), unit: '초', cls: 'is-quiet' },
  ];
});

// 지금 몇 번째부터 몇 번째를 보고 있는지
const rangeText = computed(() => {
  if (!data.value || data.value.totalCount === 0) return '';
  const start = (data.value.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(data.value.page * PAGE_SIZE, data.value.totalCount);
  return `${start}–${end}`;
});

async function load(page = 1) {
  loading.value = true;
  loadError.value = '';
  try {
    data.value = await adminApi.getSyncLogs({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      resultStatus: filters.resultStatus || undefined,
      execType: filters.execType || undefined,
      page,
      size: PAGE_SIZE,
    });
  } catch (e) {
    loadError.value = '실행 기록을 불러오지 못했습니다. 서버 상태를 확인해 주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

// 필터가 바뀌면 항상 1페이지부터 다시 본다
function search() {
  load(1);
}

function selectStatus(value) {
  filters.resultStatus = value;
  search();
}

function selectExec(value) {
  filters.execType = value;
  search();
}

function resetFilters() {
  filters.startDate = '';
  filters.endDate = '';
  filters.resultStatus = '';
  filters.execType = '';
  search();
}

function goPage(page) {
  if (page < 1 || page > data.value.totalPages || page === data.value.page) return;
  load(page);
}

/**
 * 오류 원문을 화면용으로 바꾼다.
 *   summary — 한글 요약
 *   detail  — 원문. 이미 읽을 만한 메시지면 null 이라 '원문 보기'가 안 뜬다
 */
function errorOf(raw) {
  return translateSyncError(raw);
}

/**
 * ★ 재시도 로그를 차수별 줄로 나눈다.
 *
 * syncError.js 의 buildRetrySummary 가 이미
 *   [1차 동기화 실패] status=500
 *   [2차 동기화 성공]
 * 형태로 줄을 나눠 만든다. 이걸 한 문장으로 흘리면 그 구조가 사라져서,
 * 「2차에서 살아났나」를 알려면 문장 끝까지 읽어야 한다.
 *
 * 재시도가 maxWholeRetryCount=1 이라 항상 두 줄 안쪽이므로 잘라낼 필요가 없다.
 *
 * 차수 구조가 아닌 오류(인증 실패·DB 오류 등)는 null 을 돌려주고
 * 화면은 한 줄로 그대로 그린다.
 */
function attemptRows(raw) {
  const { summary } = translateSyncError(raw);
  if (!summary) return null;

  const lines = summary.split('\n').map((l) => l.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    const m = line.match(/^\[(\d+)차[^\]]*\]\s*(.*)$/);
    if (!m) return null; // 한 줄이라도 형태가 다르면 통째로 한 줄로 본다

    const ok = /성공/.test(line);
    const rest = (m[2] || '').trim();

    rows.push({
      no: `${m[1]}차`,
      text: ok
        ? (rest ? `성공 · ${rest}` : '성공')
        : (rest ? `실패 · ${rest}` : '실패'),
      ok,
    });
  }

  return rows.length ? rows : null;
}

function execLabel(type) {
  return type === 'A' ? '자동' : '수동';
}

function statusLabel(status) {
  if (status === 'S') return '성공';
  if (status === 'P') return '부분 성공';
  return '실패';
}

function statusBadge(status) {
  if (status === 'S') return 'a-bdg-ok';
  if (status === 'P') return 'a-bdg-warn';
  return 'a-bdg-dngr';
}

// 값이 0이면 흐리게 뺀다. 0 이 다른 숫자와 같은 굵기면 눈이 계속 거기 걸린다
function numClass(v) {
  return Number(v || 0) === 0 ? 'a-zero' : 'a-val';
}

function categoryName(code) {
  return CATEGORY[code] || '기타';
}

/**
 * 동기화 상세 조회.
 * 로그에는 건수만 남아 어떤 혜택이 처리됐는지 알 수 없으므로 건별로 확인한다.
 * 실패한 로그는 처리 건수가 0이라 목록이 비고, 오류 원문만 보게 된다.
 */
async function openDetails(log) {
  detailTarget.value = log;
  details.value = [];
  detailError.value = '';
  showRaw.value = false;

  // 처리 건수가 0이면 조회할 내역이 없다. 오류만 보여주고 끝낸다
  if (log.totalCnt === 0) return;

  detailLoading.value = true;
  try {
    details.value = await adminApi.getSyncLogDetails(log.logNo);
  } catch (e) {
    detailError.value = '갱신 내역을 불러오지 못했습니다.';
    console.error(e);
  } finally {
    detailLoading.value = false;
  }
}

function closeDetails() {
  detailTarget.value = null;
  details.value = [];
  detailError.value = '';
  showRaw.value = false;
}

// 어떤 기간을 대상으로 돌렸는지 표시한다.
// 페이지 범위 동기화나 스케줄러 자동 실행은 대상 기간이 없어 빈 값이다.
function periodText(log) {
  if (!log.syncStartDate || !log.syncEndDate) return '';
  return `${formatDate(log.syncStartDate)} ~ ${formatDateShort(log.syncEndDate)}`;
}

function formatDate(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 같은 해 안에서 끝나는 기간이 대부분이라 종료일은 월-일만 보여준다
function formatDateShort(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatDateTime(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDuration(ms) {
  if (ms === null || ms === undefined) return '-';
  return `${(ms / 1000).toFixed(1)}초`;
}

// 카드에서는 단위를 따로 그리므로 숫자만 돌려준다
function formatDurationValue(ms) {
  if (ms === null || ms === undefined) return '-';
  return (ms / 1000).toFixed(1);
}

onMounted(() => load(1));
</script>

<style scoped>
.mb-3 { margin-bottom: 14px; }

/* ---- 필터 ---- */
.f-top {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 18px;
}

.f-date { margin-bottom: 0; width: 168px; }

/* 라벨이 있는 입력칸과 아랫변을 맞춘다 */
.f-go { margin-bottom: 0; }

.stats { margin-bottom: 10px; }

/* ---- 표 ---- */
.t-wrap { overflow-x: auto; }

.a-tbl td { word-break: keep-all; }

.d-nowrap { white-space: nowrap; }
.d-del { color: var(--a-warn); font-weight: 600; }
.d-chg { color: var(--a-warn); }
.d-slash { color: var(--a-c300); margin: 0 2px; }

/* ---- 차수별 오류 표기 ---- */
.att {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: var(--a-t-sm);
  line-height: 1.7;
}

/* 차수 라벨은 폭을 고정한다. 내용이 길어져도 왼쪽 줄이 맞는다 */
.att-k {
  flex: 0 0 28px;
  color: var(--a-c400);
}


.att-one.is-fail { color: var(--a-dngr); }

/* ---- 상세 ---- */
.log-modal {
  max-width: 1040px;
  display: flex;
  flex-direction: column;
}

.log-modal-b { overflow: hidden; }

.raw-toggle { padding: 8px 0 0; }

/* 외부 서버의 HTML 오류 페이지가 통째로 들어오는 경우가 있어
   높이를 제한하고 그 안에서만 스크롤한다 */
.raw {
  margin: 8px 0 0;
  padding: 10px 12px;
  max-height: 220px;
  overflow: auto;
  border: var(--a-bd);
  border-radius: var(--a-r);
  background: var(--a-c0);
  font-size: var(--a-t-cap);
  line-height: 1.6;
  color: var(--a-c500);
  white-space: pre-wrap;
  word-break: break-all;
}

.sum {
  display: flex;
  gap: 18px;
  font-size: var(--a-t-md);
  color: var(--a-c500);
  padding: 11px 13px;
  background: var(--a-c50);
  border: var(--a-bd);
  border-radius: var(--a-r);
  margin-bottom: 12px;
}

.sum b { color: var(--a-c900); font-weight: 600; }

/* 수백 건까지 나올 수 있어 목록만 스크롤한다 */
.detail-scroll {
  overflow-y: auto;
  max-height: 56vh;
  border: var(--a-bd);
  border-radius: var(--a-r);
}

.sticky-head th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.empty-sub { margin-top: 4px; font-size: var(--a-t-sm); }
</style>
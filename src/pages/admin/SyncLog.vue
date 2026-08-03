<template>
  <div>
    <div class="mb-4">
      <h4 class="mb-1 fw-bold">동기화 로그</h4>
      <small class="text-muted">온통청년 API 동기화 실행 기록</small>
    </div>

    <!-- 필터 -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-3 align-items-end">

          <div class="col-auto">
            <label class="form-label small text-muted mb-1">시작일</label>
            <input v-model="filters.startDate" type="date"
                   :max="filters.endDate || undefined"
                   class="form-control form-control-sm" style="width:170px" />
          </div>

          <div class="col-auto">
            <label class="form-label small text-muted mb-1">종료일</label>
            <input v-model="filters.endDate" type="date"
                   :min="filters.startDate || undefined"
                   class="form-control form-control-sm" style="width:170px" />
          </div>

          <div class="col-auto">
            <button class="btn btn-sm btn-dark px-4" :disabled="!isPeriodValid" @click="search">조회</button>
            <button class="btn btn-sm btn-link text-muted" @click="resetFilters">초기화</button>
          </div>
        </div>

        <hr class="my-3" />

        <div class="d-flex flex-wrap gap-4">
          <div>
            <div class="small text-muted mb-1">결과</div>
            <div class="btn-group btn-group-sm">
              <button v-for="opt in statusOptions" :key="opt.value"
                      class="btn"
                      :class="filters.resultStatus === opt.value ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectStatus(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="small text-muted mb-1">실행 방식</div>
            <div class="btn-group btn-group-sm">
              <button v-for="opt in execOptions" :key="opt.value"
                      class="btn"
                      :class="filters.execType === opt.value ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectExec(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 통계 -->
    <div v-if="data" class="row g-3 mb-3">
      <div class="col-6 col-lg" v-for="card in statCards" :key="card.label">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body py-3">
            <div class="small text-muted mb-1">{{ card.label }}</div>
            <div class="fs-5 fw-bold" :class="card.tone">{{ card.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="data" class="small text-muted mb-3">
      위 통계는 선택한 기간 전체 기준입니다. 결과·실행 방식 필터를 걸어도 바뀌지 않습니다.
    </p>

    <!-- 목록 -->
    <div class="card border-0 shadow-sm">
      <div class="card-body">

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-secondary" role="status">
            <span class="visually-hidden">불러오는 중</span>
          </div>
        </div>

        <div v-else-if="loadError" class="alert alert-danger py-2 small mb-0">
          {{ loadError }}
        </div>

        <template v-else-if="data">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0 fw-bold">전체 {{ data.totalCount }}건</h6>
            <small class="text-muted" v-if="data.totalPages > 0">
              {{ data.page }} / {{ data.totalPages }} 페이지
            </small>
          </div>

          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <thead class="table-light">
                <tr class="small text-muted">
                  <th style="width:90px">구분</th>
                  <th style="width:150px">실행 시각</th>
                  <th style="width:190px">동기화 대상 기간</th>
                  <th style="width:100px">결과</th>
                  <th class="text-end" style="width:90px">처리</th>
                  <th class="text-end" style="width:100px">신규(추정)</th>
                  <th class="text-end" style="width:100px">갱신(추정)</th>
                  <th class="text-end" style="width:80px">소요</th>
                  <th style="min-width:280px">오류 내용</th>
                  <th style="width:80px">내역</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in data.logs" :key="log.logNo">
                  <td>
                    <span class="badge" :class="execBadge(log.execType)">
                      {{ execLabel(log.execType) }}
                    </span>
                  </td>
                  <td class="small">{{ formatDateTime(log.executedAt) }}</td>
                  <td class="small text-muted">{{ periodText(log) }}</td>
                  <td>
                    <span class="badge" :class="statusBadge(log.resultStatus)">
                      {{ statusLabel(log.resultStatus) }}
                    </span>
                  </td>
                  <td class="text-end small">{{ log.totalCnt }}건</td>
                  <td class="text-end small">{{ log.insertCnt }}건</td>
                  <td class="text-end small">{{ log.updateCnt }}건</td>
                  <td class="text-end small">{{ formatDuration(log.durationMs) }}</td>
                  <td class="small">
                    <template v-if="log.errorMsg">
                      <span :class="log.resultStatus === 'F' ? 'text-danger' : 'text-warning-emphasis'">
                        {{ expanded[log.logNo] ? log.errorMsg : shorten(log.errorMsg) }}
                      </span>
                      <button v-if="log.errorMsg.length > ERROR_PREVIEW"
                              class="btn btn-link btn-sm p-0 ms-1 align-baseline"
                              @click="toggleError(log.logNo)">
                        {{ expanded[log.logNo] ? '접기' : '더보기' }}
                      </button>
                    </template>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-secondary"
                            :disabled="log.totalCnt === 0"
                            @click="openDetails(log)">보기</button>
                  </td>
                </tr>

                <tr v-if="data.logs.length === 0">
                  <td colspan="10" class="text-center text-muted small py-5">
                    조건에 맞는 실행 기록이 없습니다. 기간이나 필터를 바꿔보세요.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 페이지네이션 -->
          <nav v-if="data.totalPages > 1" class="mt-3">
            <ul class="pagination pagination-sm justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: data.page <= 1 }">
                <button class="page-link" @click="goPage(data.page - 1)">이전</button>
              </li>
              <li v-for="p in pageNumbers" :key="p"
                  class="page-item" :class="{ active: p === data.page }">
                <button class="page-link" @click="goPage(p)">{{ p }}</button>
              </li>
              <li class="page-item" :class="{ disabled: data.page >= data.totalPages }">
                <button class="page-link" @click="goPage(data.page + 1)">다음</button>
              </li>
            </ul>
          </nav>
        </template>
      </div>
    </div>

    <!-- 갱신 내역 -->
    <div v-if="detailTarget" class="modal-backdrop-custom" @click.self="closeDetails">
      <div class="modal-box">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 class="fw-bold mb-1">동기화 갱신 내역</h6>
            <small class="text-muted">
              {{ formatDateTime(detailTarget.executedAt) }}
              <template v-if="periodText(detailTarget)"> · {{ periodText(detailTarget) }}</template>
            </small>
          </div>
          <button class="btn-close" @click="closeDetails"></button>
        </div>

        <div v-if="detailLoading" class="text-center py-5">
          <div class="spinner-border spinner-border-sm text-secondary" role="status">
            <span class="visually-hidden">불러오는 중</span>
          </div>
        </div>

        <div v-else-if="detailError" class="alert alert-danger py-2 small mb-0">
          {{ detailError }}
        </div>

        <template v-else>
          <div class="d-flex gap-3 mb-3 small">
            <span>전체 <strong>{{ details.length }}</strong>건</span>
            <span class="text-success">신규 <strong>{{ insertCount }}</strong></span>
            <span class="text-primary">갱신 <strong>{{ updateCount }}</strong></span>
            <span class="text-warning-emphasis">내용 변경 <strong>{{ changedCount }}</strong></span>
          </div>

          <!-- 건수가 많을 수 있어 목록만 스크롤한다 -->
          <div class="detail-scroll">
            <table class="table table-sm align-middle mb-0">
              <thead class="table-light sticky-head">
                <tr class="small text-muted">
                  <th style="width:60px">구분</th>
                  <th style="width:80px">카테고리</th>
                  <th style="min-width:200px">혜택명</th>
                  <th style="min-width:200px">변경 내용</th>
                  <th style="width:130px">주관기관</th>
                  <th class="text-end" style="width:70px">조회수</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in details" :key="d.benefitNo">
                  <td>
                    <span class="badge"
                          :class="d.actionType === 'I' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'">
                      {{ d.actionType === 'I' ? '신규' : '갱신' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge bg-light text-muted border">
                      {{ categoryName(d.categoryCode) }}
                    </span>
                  </td>
                  <td class="small">{{ d.plcyNm }}</td>
                  <td class="small">
                    <span v-if="d.changedSummary" class="text-warning-emphasis">
                      {{ d.changedSummary }}
                    </span>
                    <span v-else class="text-muted">
                      {{ d.actionType === 'I' ? '신규 등록' : '변경 없음' }}
                    </span>
                  </td>
                  <td class="small text-muted">{{ d.sprvsnInstCdNm }}</td>
                  <td class="text-end small">{{ (d.inqCnt ?? 0).toLocaleString() }}</td>
                </tr>
                <tr v-if="details.length === 0">
                  <td colspan="6" class="text-center text-muted small py-5">
                    기록된 처리 내역이 없습니다.
                    <div class="mt-1">기간별 동기화만 내역을 남깁니다.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';

// 오류 메시지에 외부 서버의 HTML 에러 페이지가 통째로 들어오는 경우가 있어
// 기본은 잘라 보여주고 '더보기'로 펼친다.
const ERROR_PREVIEW = 60;
const PAGE_SIZE = 20;

const statusOptions = [
  { value: '', label: '전체' },
  { value: 'S', label: 'SUCCESS' },
  { value: 'P', label: 'PARTIAL' },
  { value: 'F', label: 'FAIL' },
];

const execOptions = [
  { value: '', label: '전체' },
  { value: 'A', label: 'AUTO' },
  { value: 'M', label: 'MANUAL' },
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
const expanded = ref({});

// 달력에서 막지만 직접 입력하는 경우까지 대비한다.
// 조회 화면이라 미래 날짜는 허용한다 — 결과가 0건으로 나올 뿐 문제가 없다.
const isPeriodValid = computed(() =>
    !filters.startDate || !filters.endDate || filters.startDate <= filters.endDate);

const CATEGORY = {
  1: '일자리', 2: '주거', 3: '교육', 4: '복지·문화', 5: '참여·권리',
};

const detailTarget = ref(null);   // 내역을 보고 있는 로그
const details = ref([]);
const detailLoading = ref(false);
const detailError = ref('');

const insertCount = computed(() => details.value.filter((d) => d.actionType === 'I').length);
const updateCount = computed(() => details.value.filter((d) => d.actionType === 'U').length);
// 갱신 대상이어도 내용이 그대로인 경우가 많아 실제로 값이 바뀐 건수를 따로 센다
const changedCount = computed(() => details.value.filter((d) => d.changedSummary).length);

const statCards = computed(() => {
  if (!data.value) return [];
  const s = data.value.stats;
  return [
    { label: '전체 실행', value: `${s.totalCount}회`, tone: '' },
    { label: '성공', value: `${s.successCount}회`, tone: 'text-success' },
    { label: '부분 성공', value: `${s.partialCount}회`, tone: 'text-warning-emphasis' },
    { label: '실패', value: `${s.failCount}회`, tone: 'text-danger' },
    { label: '평균 소요시간', value: formatDuration(s.avgDurationMs), tone: '' },
  ];
});

// 현재 페이지 주변 최대 5개만 노출한다
const pageNumbers = computed(() => {
  if (!data.value) return [];
  const total = data.value.totalPages;
  const cur = data.value.page;
  let start = Math.max(1, cur - 2);
  const end = Math.min(total, start + 4);
  start = Math.max(1, end - 4);

  const list = [];
  for (let i = start; i <= end; i++) list.push(i);
  return list;
});

async function load(page = 1) {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await axios.get('/api/admin/synclog', {
      params: {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        resultStatus: filters.resultStatus || undefined,
        execType: filters.execType || undefined,
        page,
        size: PAGE_SIZE,
      },
    });
    data.value = res.data;
    expanded.value = {};
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

function toggleError(logNo) {
  expanded.value = { ...expanded.value, [logNo]: !expanded.value[logNo] };
}

function shorten(text) {
  return text.length > ERROR_PREVIEW ? `${text.slice(0, ERROR_PREVIEW)}…` : text;
}

function execLabel(type) {
  return type === 'A' ? 'AUTO' : 'MANUAL';
}

function execBadge(type) {
  return type === 'A' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning-emphasis';
}

function statusLabel(status) {
  if (status === 'S') return 'SUCCESS';
  if (status === 'P') return 'PARTIAL';
  return 'FAIL';
}

function statusBadge(status) {
  if (status === 'S') return 'bg-success-subtle text-success';
  if (status === 'P') return 'bg-warning-subtle text-warning-emphasis';
  return 'bg-danger-subtle text-danger';
}

function categoryName(code) {
  return CATEGORY[code] || '기타';
}

/**
 * 동기화 갱신 내역 조회.
 * 로그에는 건수만 남아 어떤 혜택이 처리됐는지 알 수 없으므로 건별로 확인한다.
 * 기간별 동기화만 내역을 기록하므로 예전 로그는 비어 있을 수 있다.
 */
async function openDetails(log) {
  detailTarget.value = log;
  details.value = [];
  detailError.value = '';
  detailLoading.value = true;

  try {
    const res = await axios.get(`/api/admin/synclog/${log.logNo}/details`);
    details.value = res.data;
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
}

// 어떤 기간을 대상으로 돌렸는지 표시한다.
// 페이지 범위 동기화나 스케줄러 자동 실행은 대상 기간이 없어 빈 값이다.
function periodText(log) {
  if (!log.syncStartDate || !log.syncEndDate) return '';
  return `${formatDate(log.syncStartDate)} ~ ${formatDate(log.syncEndDate)}`;
}

function formatDate(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatDateTime(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDuration(ms) {
  if (ms === null || ms === undefined) return '-';
  return `${(ms / 1000).toFixed(1)}초`;
}

onMounted(() => load(1));
</script>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 980px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

/* 수백 건까지 나올 수 있어 목록만 스크롤한다 */
.detail-scroll {
  overflow-y: auto;
  max-height: 60vh;
}

.sticky-head th {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 1;
}

.table td { word-break: keep-all; }
</style>
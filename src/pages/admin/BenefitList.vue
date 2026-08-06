<template>
  <div>
    <div class="mb-4">
      <h4 class="mb-1 fw-bold">혜택 관리</h4>
      <small class="text-muted">온통청년에서 수집한 청년혜택을 조회하고 노출 상태를 관리합니다.</small>
    </div>

    <!-- 필터 -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-auto">
            <label class="form-label small text-muted mb-1">혜택명</label>
            <input v-model="filters.keyword" type="text" placeholder="혜택명 검색"
                   class="form-control form-control-sm" style="width:260px"
                   @keyup.enter="search" />
          </div>

          <div class="col-auto">
            <button class="btn btn-sm btn-dark px-4" @click="search">조회</button>
            <button class="btn btn-sm btn-link text-muted" @click="resetFilters">초기화</button>
          </div>
        </div>

        <hr class="my-3" />

        <div class="d-flex flex-wrap gap-4">
          <div>
            <div class="small text-muted mb-1">노출 상태</div>
            <div class="btn-group btn-group-sm">
              <button v-for="opt in activeOptions" :key="opt.value"
                      class="btn"
                      :class="filters.isActive === opt.value ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectActive(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="small text-muted mb-1">카테고리</div>
            <div class="btn-group btn-group-sm">
              <button v-for="opt in categoryOptions" :key="opt.value"
                      class="btn"
                      :class="filters.categoryCode === opt.value ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectCategory(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="small text-muted mb-1">마감</div>
            <div class="btn-group btn-group-sm">
              <button class="btn"
                      :class="!filters.deadlineSoon ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectDeadline(false)">전체</button>
              <button class="btn"
                      :class="filters.deadlineSoon ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectDeadline(true)">30일 이내</button>
            </div>
          </div>

          <div>
            <div class="small text-muted mb-1">중복수혜</div>
            <div class="btn-group btn-group-sm">
              <button class="btn"
                      :class="!filters.hasConflict ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectConflict(false)">전체</button>
              <button class="btn"
                      :class="filters.hasConflict ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectConflict(true)">관리 대상</button>
            </div>
          </div>
        </div>
      </div>
    </div>

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
            <h6 class="mb-0 fw-bold">전체 {{ data.totalCount.toLocaleString() }}건</h6>
            <small class="text-muted" v-if="data.totalPages > 0">
              {{ data.page }} / {{ data.totalPages }} 페이지
            </small>
          </div>

          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <thead class="table-light">
                <tr class="small text-muted">
                  <th style="width:70px">상태</th>
                  <th style="width:90px">카테고리</th>
                  <th style="min-width:260px">혜택명</th>
                  <th style="min-width:140px">주관기관</th>
                  <th style="width:110px">마감</th>
                  <th class="text-end" style="width:80px">조회수</th>
                  <th style="width:80px">중복규칙</th>
                  <th style="width:150px">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in data.benefits" :key="b.benefitNo">
                  <td>
                    <span class="badge" :class="activeBadge(b.isActive)">
                      {{ b.isActive === 'Y' ? '노출' : '숨김' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge bg-light text-muted border">
                      {{ categoryName(b.categoryCode) }}
                    </span>
                  </td>
                  <td class="small">{{ b.plcyNm }}</td>
                  <td class="small text-muted">{{ b.sprvsnInstCdNm }}</td>
                  <td class="small" :class="ddayTone(b)">{{ deadlineText(b) }}</td>
                  <td class="text-end small">{{ (b.inqCnt ?? 0).toLocaleString() }}</td>
                  <td>
                    <span v-if="b.conflictGroupCode" class="badge bg-info-subtle text-info">
                      {{ b.conflictGroupCode }}
                    </span>
                    <span v-else class="text-muted small">-</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-secondary me-1"
                            @click="openDetail(b.benefitNo)">상세</button>
                    <button class="btn btn-sm"
                            :class="b.isActive === 'Y' ? 'btn-outline-danger' : 'btn-outline-success'"
                            :disabled="togglingNo === b.benefitNo"
                            @click="askToggle(b)">
                      {{ b.isActive === 'Y' ? '숨김' : '노출' }}
                    </button>
                  </td>
                </tr>

                <tr v-if="data.benefits.length === 0">
                  <td colspan="8" class="text-center text-muted small py-5">
                    조건에 맞는 혜택이 없습니다. 검색어나 필터를 바꿔보세요.
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

    <!-- 상태 변경 확인 -->
    <div v-if="pendingToggle" class="modal-backdrop-custom" @click.self="pendingToggle = null">
      <div class="modal-box">
        <h6 class="fw-bold mb-3">
          {{ pendingToggle.isActive === 'Y' ? '노출을 중단할까요?' : '다시 노출할까요?' }}
        </h6>
        <p class="small mb-2">{{ pendingToggle.plcyNm }}</p>
        <p class="small text-muted mb-4">
          <template v-if="pendingToggle.isActive === 'Y'">
            숨김 처리하면 추천 대상에서 제외됩니다. 데이터는 삭제되지 않습니다.
          </template>
          <template v-else>
            다시 추천 대상에 포함됩니다.
          </template>
        </p>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-sm btn-outline-secondary" @click="pendingToggle = null">취소</button>
          <button class="btn btn-sm btn-dark" @click="confirmToggle">확인</button>
        </div>
      </div>
    </div>

    <!-- 상세 -->
    <div v-if="detail" class="modal-backdrop-custom" @click.self="detail = null">
      <div class="modal-box modal-wide">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <span class="badge bg-light text-muted border me-1">
              {{ categoryName(detail.categoryCode) }}
            </span>
            <span class="badge" :class="activeBadge(detail.isActive)">
              {{ detail.isActive === 'Y' ? '노출' : '숨김' }}
            </span>
            <h6 class="fw-bold mt-2 mb-0">{{ detail.plcyNm }}</h6>
            <small class="text-muted">{{ detail.sprvsnInstCdNm }}</small>
          </div>
          <button class="btn-close" @click="detail = null"></button>
        </div>

        <dl class="row small mb-0">
          <dt class="col-4 col-md-3 text-muted fw-normal">혜택번호</dt>
          <dd class="col-8 col-md-9">{{ detail.plcyNo }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">신청 기간</dt>
          <dd class="col-8 col-md-9">{{ periodText(detail) }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">연령</dt>
          <dd class="col-8 col-md-9">{{ ageText(detail) }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">소득 조건</dt>
          <dd class="col-8 col-md-9">
            {{ incomeText(detail) }}
            <div v-if="detail.earnEtcCn" class="text-muted mt-1">{{ detail.earnEtcCn }}</div>
          </dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">지역 매핑</dt>
          <dd class="col-8 col-md-9">
            {{ detail.regionCount?.toLocaleString() }}개 지역
            <span v-if="detail.regionCount > 200" class="text-warning-emphasis">
              · 전국 코드가 부여된 혜택입니다
            </span>
          </dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">중복수혜 그룹</dt>
          <dd class="col-8 col-md-9">{{ detail.conflictGroupCode || '없음' }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">조회수</dt>
          <dd class="col-8 col-md-9">{{ (detail.inqCnt ?? 0).toLocaleString() }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">등록일</dt>
          <dd class="col-8 col-md-9">{{ formatDate(detail.frstRegDt) }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">지원 내용</dt>
          <dd class="col-8 col-md-9">{{ detail.plcySprtCn || '-' }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">신청 방법</dt>
          <dd class="col-8 col-md-9 mb-0">{{ detail.plcyAplyMthdCn || '-' }}</dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import adminApi from '@/api/adminApi';

const route = useRoute();

const PAGE_SIZE = 20;

const CATEGORY = {
  1: '일자리', 2: '주거', 3: '교육', 4: '복지·문화', 5: '참여·권리',
};

const activeOptions = [
  { value: '', label: '전체' },
  { value: 'Y', label: '노출' },
  { value: 'N', label: '숨김' },
];

const categoryOptions = [
  { value: '', label: '전체' },
  { value: '1', label: '일자리' },
  { value: '2', label: '주거' },
  { value: '3', label: '교육' },
  { value: '4', label: '복지·문화' },
  { value: '5', label: '참여·권리' },
];

const filters = reactive({
  keyword: '',
  isActive: '',
  categoryCode: '',
  deadlineSoon: false,
  hasConflict: false,
});

const loading = ref(false);
const loadError = ref('');
const data = ref(null);
const detail = ref(null);
const pendingToggle = ref(null);
const togglingNo = ref(null);

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
    data.value = await adminApi.getBenefits({
      keyword: filters.keyword || undefined,
      isActive: filters.isActive || undefined,
      categoryCode: filters.categoryCode || undefined,
      deadlineSoon: filters.deadlineSoon || undefined,
      hasConflict: filters.hasConflict || undefined,
      page,
      size: PAGE_SIZE,
    });
  } catch (e) {
    loadError.value = '혜택 목록을 불러오지 못했습니다. 서버 상태를 확인해 주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

// 필터가 바뀌면 항상 1페이지부터 다시 본다
function search() {
  load(1);
}

function selectActive(value) {
  filters.isActive = value;
  search();
}

function selectCategory(value) {
  filters.categoryCode = value;
  search();
}

function selectDeadline(value) {
  filters.deadlineSoon = value;
  search();
}

function selectConflict(value) {
  filters.hasConflict = value;
  search();
}

function resetFilters() {
  filters.keyword = '';
  filters.isActive = '';
  filters.categoryCode = '';
  filters.deadlineSoon = false;
  filters.hasConflict = false;
  search();
}

function goPage(page) {
  if (page < 1 || page > data.value.totalPages || page === data.value.page) return;
  load(page);
}

async function openDetail(benefitNo) {
  try {
      detail.value = await adminApi.getBenefitDetail(benefitNo);
  } catch (e) {
    loadError.value = '혜택 상세를 불러오지 못했습니다.';
    console.error(e);
  }
}

// 되돌릴 수 있는 작업이지만 추천 결과가 즉시 달라지므로 한 번 확인한다
function askToggle(benefit) {
  pendingToggle.value = benefit;
}

async function confirmToggle() {
  const b = pendingToggle.value;
  const next = b.isActive === 'Y' ? 'N' : 'Y';

  pendingToggle.value = null;
  togglingNo.value = b.benefitNo;

  try {
    await adminApi.changeBenefitActive(b.benefitNo, next);
    // 목록 전체를 다시 부르지 않고 해당 행만 갱신한다
    b.isActive = next;
  } catch (e) {
    loadError.value = '상태 변경에 실패했습니다.';
    console.error(e);
  } finally {
    togglingNo.value = null;
  }
}

function categoryName(code) {
  return CATEGORY[code] || '기타';
}

function activeBadge(isActive) {
  return isActive === 'Y' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary';
}

// apply_end_date가 NULL인 경우가 상시모집(0057002)과 마감(0057003) 두 가지라
// dday만 보면 마감된 혜택이 '상시 모집'으로 표시된다. 구분 코드를 먼저 본다.
function deadlineText(b) {
  if (b.aplyPrdSeCd === '0057003') return '접수 마감';
  if (b.aplyPrdSeCd === '0057002') return '상시 모집';

  if (b.dday === null || b.dday === undefined) return '기간 미정';
  if (b.dday < 0) return '마감';
  if (b.dday === 0) return '오늘 마감';
  return `D-${b.dday}`;
}

function ddayTone(b) {
  if (b.aplyPrdSeCd === '0057003') return 'text-muted';
  if (b.dday === null || b.dday === undefined) return 'text-muted';
  if (b.dday < 0) return 'text-muted';
  if (b.dday <= 3) return 'text-danger fw-semibold';
  if (b.dday <= 7) return 'text-warning-emphasis';
  return '';
}

function periodText(d) {
  if (d.aplyPrdSeCd === '0057002') return '상시 모집';
  if (d.aplyPrdSeCd === '0057003') return '접수 마감';
  const s = formatDate(d.applyStartDate);
  const e = formatDate(d.applyEndDate);
  if (s === '-' && e === '-') return '-';
  return `${s} ~ ${e}`;
}

function ageText(d) {
  if (d.sprtTrgtMinAge == null && d.sprtTrgtMaxAge == null) return '제한 없음';
  return `만 ${d.sprtTrgtMinAge ?? 0}세 ~ ${d.sprtTrgtMaxAge ?? 99}세`;
}

function incomeText(d) {
  if (d.earnCndSeCd === '0043001') return '제한 없음';
  if (d.earnCndSeCd === '0043002') {
    const max = d.earnMaxAmt ? `${d.earnMaxAmt.toLocaleString()}만원 이하` : '기준 있음';
    return `연소득 ${max}`;
  }
  if (d.earnCndSeCd === '0043003') return '기타 (자연어 조건이라 자동 판정 불가)';
  return '-';
}

function formatDate(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

onMounted(() => {
  // 대시보드 카드에서 조회 조건을 달고 넘어오는 경우를 받는다
  if (route.query.isActive) filters.isActive = String(route.query.isActive);
  if (route.query.categoryCode) filters.categoryCode = String(route.query.categoryCode);
  if (route.query.deadlineSoon === 'true') filters.deadlineSoon = true;
  if (route.query.hasConflict === 'true') filters.hasConflict = true;
  if (route.query.keyword) filters.keyword = String(route.query.keyword);

  load(1);
});
</script>

<style scoped>
.table td { word-break: keep-all; }

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
  max-width: 420px;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-wide { max-width: 680px; }
</style>
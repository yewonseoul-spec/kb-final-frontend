<template>
  <div class="card border-0 shadow-sm">
    <div class="card-body">

      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h6 class="mb-1 fw-bold">정책 데이터 동기화</h6>
          <small class="text-muted">온통청년 API에서 청년정책을 가져와 DB에 반영합니다.</small>
        </div>
        <button class="btn btn-dark" :disabled="loading" @click="executeSync">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          {{ loading ? '동기화 중…' : '동기화 실행' }}
        </button>
      </div>

      <!-- 동기화 방식 -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: mode === 'page' }"
                  :disabled="loading" @click="mode = 'page'">
            페이지 범위
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: mode === 'period' }"
                  :disabled="loading" @click="mode = 'period'">
            등록일 기간
          </button>
        </li>
      </ul>

      <!-- 페이지 범위 -->
      <div v-if="mode === 'page'" class="mb-3">
        <div class="row g-3">
          <div class="col-auto">
            <label class="form-label small text-muted mb-1">시작 페이지</label>
            <input v-model.number="pageNum" type="number" min="1"
                   class="form-control" style="width:140px" :disabled="loading" />
          </div>
          <div class="col-auto">
            <label class="form-label small text-muted mb-1">페이지당 건수</label>
            <input v-model.number="pageSize" type="number" min="1" max="100"
                   class="form-control" style="width:140px" :disabled="loading" />
          </div>
        </div>
        <small class="text-muted d-block mt-3">
          지정한 페이지 범위만 가져옵니다. 특정 구간을 다시 받을 때 사용합니다.
        </small>
      </div>

      <!-- 등록일 기간 -->
      <div v-else class="mb-3">
        <div class="row g-3">
          <div class="col-auto">
            <label class="form-label small text-muted mb-1">시작일</label>
            <input v-model="startDate" type="date"
                   class="form-control" style="width:180px" :disabled="loading" />
          </div>
          <div class="col-auto">
            <label class="form-label small text-muted mb-1">종료일</label>
            <input v-model="endDate" type="date"
                   class="form-control" style="width:180px" :disabled="loading" />
          </div>
        </div>
        <div class="alert alert-light border mt-3 mb-0 py-2 small text-muted">
          <div>정책이 온통청년에 <strong>처음 등록된 날짜</strong> 기준입니다. 신청 기간이 아닙니다.</div>
          <div class="mt-1">
            온통청년 API가 등록일 조회를 지원하지 않아 전체를 받아온 뒤 걸러냅니다.
            기간을 좁혀도 소요 시간은 줄어들지 않습니다.
          </div>
        </div>
      </div>

      <!-- 실행 결과 -->
      <div v-if="result" class="border rounded p-3 mt-3">
        <div class="d-flex align-items-center mb-3">
          <h6 class="mb-0 me-2">실행 결과</h6>
          <span class="badge" :class="statusBadge(result.resultStatus)">
            {{ statusLabel(result.resultStatus) }}
          </span>
        </div>

        <div class="row g-3 text-center">
          <div class="col-6 col-md-3">
            <div class="small text-muted">처리 건수</div>
            <div class="fw-bold">{{ result.totalCnt }}건</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted">신규(추정)</div>
            <div class="fw-bold">{{ result.insertCnt }}건</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted">갱신(추정)</div>
            <div class="fw-bold">{{ result.updateCnt }}건</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted">소요 시간</div>
            <div class="fw-bold">{{ (result.durationMs / 1000).toFixed(1) }}초</div>
          </div>
        </div>

        <small class="text-muted d-block mt-3">
          신규·갱신 건수는 동기화 전후 전체 정책 수의 차이로 계산한 추정치입니다.
        </small>

        <div v-if="result.errorMsg"
             class="alert mt-3 mb-0 py-2 small"
             :class="result.resultStatus === 'F' ? 'alert-danger' : 'alert-warning'">
          {{ result.errorMsg }}
        </div>
      </div>

      <div v-if="requestError" class="alert alert-danger py-2 small mt-3 mb-0">
        {{ requestError }}
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

// 동기화가 끝나면 부모(대시보드)가 통계를 다시 불러올 수 있게 알린다
const emit = defineEmits(['synced']);

// TODO: 로그인 관리자 member_no로 교체 (현재는 테스트값)
const memberNo = 1;

const mode = ref('page');      // page | period

const pageNum = ref(1);
const pageSize = ref(10);

const startDate = ref(defaultStartDate());
const endDate = ref(formatDate(new Date()));

const loading = ref(false);
const result = ref(null);
const requestError = ref('');

// 기본값은 최근 30일. 등록일 기준이라 이 구간에 해당하는 정책은 많지 않다.
function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatDate(d);
}

// toISOString은 UTC 기준이라 날짜가 하루 밀릴 수 있어 직접 조립한다
function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function statusLabel(status) {
  if (status === 'S') return '성공';
  if (status === 'P') return '부분 성공';
  return '실패';
}

function statusBadge(status) {
  if (status === 'S') return 'bg-success';
  if (status === 'P') return 'bg-warning text-dark';
  return 'bg-danger';
}

async function executeSync() {
  loading.value = true;
  requestError.value = '';
  result.value = null;

  const url = mode.value === 'page'
      ? '/api/admin/sync'
      : '/api/admin/sync/period';

  const params = mode.value === 'page'
      ? { pageNum: pageNum.value, pageSize: pageSize.value, memberNo }
      : { startDate: startDate.value, endDate: endDate.value, memberNo };

  try {
    const { data } = await axios.post(url, null, { params });
    result.value = data;
    emit('synced');
  } catch (e) {
    requestError.value = '동기화 요청에 실패했습니다. 서버 상태를 확인해 주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}
</script>
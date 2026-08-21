<template>
  <div class="card border-0 shadow-sm">
    <div class="card-body">

      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h6 class="mb-1 fw-bold">정책 데이터 동기화</h6>
          <small class="text-muted">온통청년 API에서 청년정책을 가져와 DB에 반영합니다.</small>
        </div>
        <button class="btn btn-dark" :disabled="loading || !isPeriodValid" @click="executeSync">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          {{ loading ? '동기화 중…' : '동기화 실행' }}
        </button>
      </div>

      <div class="row g-3">
        <div class="col-auto">
          <label class="form-label small text-muted mb-1">시작일</label>
          <input v-model="startDate" type="date"
                 :max="endDate || today"
                 class="form-control" style="width:180px" :disabled="loading" />
        </div>
        <div class="col-auto">
          <label class="form-label small text-muted mb-1">종료일</label>
          <input v-model="endDate" type="date"
                 :min="startDate" :max="today"
                 class="form-control" style="width:180px" :disabled="loading" />
        </div>
      </div>

      <p class="small text-muted mt-3 mb-0">
        정책이 온통청년에 <strong>처음 등록된 날짜</strong> 기준입니다.
      </p>

      <!-- 실행 결과 -->
      <div v-if="result" class="border rounded p-3 mt-3">
        <div class="d-flex align-items-center mb-3">
          <h6 class="mb-0 me-2">실행 결과</h6>
          <span class="badge" :class="statusBadge(result.resultStatus)">
            {{ statusLabel(result.resultStatus) }}
          </span>
          <span class="ms-auto small text-muted">{{ startDate }} ~ {{ endDate }}</span>
        </div>

        <div class="row g-3 text-center">
          <div class="col-6 col-md-3">
            <div class="small text-muted">처리 건수</div>
            <div class="fw-bold">{{ formatCount(result.totalCnt) }}</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted">신규(추정)</div>
            <div class="fw-bold">{{ formatCount(result.insertCnt) }}</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted">갱신(추정)</div>
            <div class="fw-bold">{{ formatCount(result.updateCnt) }}</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted">소요 시간</div>
            <div class="fw-bold">{{ (result.durationMs / 1000).toFixed(1) }}초</div>
          </div>
        </div>

        <!-- 기간별 동기화는 숨김 판정을 하지 않으므로 값이 있을 때만 보여준다.
             전체 목록을 다 받은 것이 아니라 '응답에 없다'를 삭제로 볼 수 없기 때문이다 -->
        <div v-if="result.deleteCnt > 0" class="alert alert-warning mt-3 mb-0 py-2 small">
          이번 동기화에서 {{ formatCount(result.deleteCnt) }}건이 삭제 처리되었습니다.
          데이터는 보존되며 다시 제공되면 자동으로 복구됩니다.
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
import { ref, computed } from 'vue';
import adminApi from '@/api/adminApi';
// 동기화가 끝나면 부모(대시보드)가 통계를 다시 불러올 수 있게 알린다
const emit = defineEmits(['synced']);



const loading = ref(false);
const result = ref(null);
const requestError = ref('');

// toISOString은 UTC 기준이라 날짜가 하루 밀릴 수 있어 직접 조립한다
function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 아직 등록되지 않은 날짜는 선택할 이유가 없으므로 오늘을 상한으로 둔다
const today = formatDate(new Date());

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatDate(d);
}

const startDate = ref(defaultStartDate());
const endDate = ref(today);

// 달력에서 max·min으로 막지만, 직접 입력하는 경우까지 막기 위해 한 번 더 확인한다
const isPeriodValid = computed(() =>
    !!startDate.value && !!endDate.value && startDate.value <= endDate.value);

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

function formatCount(n) {
  return `${(n ?? 0).toLocaleString()}건`;
}

async function executeSync() {
  if (!isPeriodValid.value) return;

  loading.value = true;
  requestError.value = '';
  result.value = null;

  try {
    result.value = await adminApi.syncByPeriod(startDate.value, endDate.value);
    emit('synced');
  } catch (e) {
    requestError.value = '동기화 요청에 실패했습니다. 서버 상태를 확인해 주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}
</script>

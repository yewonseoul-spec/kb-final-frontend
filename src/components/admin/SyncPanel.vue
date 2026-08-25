<template>
  <div class="a-card">
    <div class="a-card-b">
      <div class="s-head">
        <div>
          <h2>정책 데이터 동기화</h2>
          <p class="s-lead">온통청년 API에서 청년정책을 가져와 DB에 반영합니다.</p>
        </div>

        <button class="a-btn a-btn-dark s-run"
                :disabled="loading || !isPeriodValid" @click="executeSync">
          <span v-if="loading" class="a-spin"></span>
          {{ loading ? '동기화 중…' : '동기화 실행' }}
        </button>
      </div>

      <div class="s-dates">
        <div class="a-field">
          <label>시작일</label>
          <input v-model="startDate" type="date" class="a-num"
                 :max="endDate || today" :disabled="loading" />
        </div>
        <div class="a-field">
          <label>종료일</label>
          <input v-model="endDate" type="date" class="a-num"
                 :min="startDate" :max="today" :disabled="loading" />
        </div>
      </div>

      <!--
        이 안내가 이 카드에서 가장 중요한 문장이다.

        없으면 관리자는 시작일·종료일을 신청 기간으로 읽는다.
        그러면 "8월에 신청할 수 있는 정책만 가져오자" 하고 기간을 좁히는데,
        실제로는 8월에 온통청년에 새로 등록된 정책만 들어온다.
        결과가 예상과 다르게 나오고, 원인을 화면 어디에서도 찾을 수 없다.
      -->
      <p class="s-hint">
        정책이 온통청년에 <b>처음 등록된 날짜</b> 기준입니다. 신청 기간이 아닙니다.
      </p>

      <!-- 실행 결과 -->
      <div v-if="result" class="s-result">
        <div class="s-result-h">
          <b>실행 결과</b>
          <span class="a-bdg" :class="statusBadge(result.resultStatus)">
            {{ statusLabel(result.resultStatus) }}
          </span>
          <span class="s-period a-num">{{ startDate }} ~ {{ endDate }}</span>
        </div>

        <div class="s-stats">
          <div class="s-stat">
            <div class="s-stat-v a-num">{{ formatCount(result.totalCnt) }}</div>
            <div class="s-stat-l">처리 건수</div>
          </div>
          <div class="s-stat">
            <div class="s-stat-v a-num">{{ formatCount(result.insertCnt) }}</div>
            <div class="s-stat-l">신규 (추정)</div>
          </div>
          <div class="s-stat">
            <div class="s-stat-v a-num">{{ formatCount(result.updateCnt) }}</div>
            <div class="s-stat-l">갱신 (추정)</div>
          </div>
          <div class="s-stat">
            <div class="s-stat-v a-num">{{ (result.durationMs / 1000).toFixed(1) }}초</div>
            <div class="s-stat-l">소요 시간</div>
          </div>
        </div>

        <p class="s-note">
          신규·갱신 건수는 동기화 전후 전체 정책 수의 차이로 계산한 추정치입니다.
        </p>

        <!-- 기간별 동기화는 숨김 판정을 하지 않으므로 값이 있을 때만 보여준다.
             전체 목록을 다 받은 것이 아니라 '응답에 없다'를 삭제로 볼 수 없기 때문이다 -->
        <div v-if="result.deleteCnt > 0" class="a-notice s-msg">
          <div>
            이번 동기화에서 <b>{{ formatCount(result.deleteCnt) }}</b>이 삭제 처리되었습니다.
            데이터는 보존되며 다시 제공되면 자동으로 복구됩니다.
          </div>
        </div>

        <div v-if="result.errorMsg" class="a-notice s-msg"
             :class="result.resultStatus === 'F' ? 'a-notice-dngr' : ''">
          <div>{{ result.errorMsg }}</div>
        </div>
      </div>

      <div v-if="requestError" class="a-notice a-notice-dngr s-msg">
        <div>{{ requestError }}</div>
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
  if (status === 'S') return 'a-bdg-ok';
  if (status === 'P') return 'a-bdg-warn';
  return 'a-bdg-dngr';
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

<style scoped>
.s-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.s-head h2 {
  margin: 0 0 5px;
  color: var(--a-c900);
  font-size: var(--a-t-md);
  letter-spacing: var(--a-ls-md);
  font-weight: 700;
}

.s-lead {
  margin: 0;
  color: var(--a-c500);
  font-size: var(--a-t-sm);
  line-height: 1.6;
}

.s-dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  max-width: 420px;
}

.s-dates .a-field { margin-bottom: 0; }

.s-hint {
  margin: 14px 0 0;
  color: var(--a-c500);
  font-size: var(--a-t-sm);
  line-height: 1.6;
}
.s-hint b { color: var(--a-c900); font-weight: 700; }

.s-run {
  flex-shrink: 0;
  justify-content: center;
}

/* 실행 중 표시는 어두운 버튼 위에 얹히므로 색을 바꾼다 */
.s-run .a-spin {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
}

/* ---- 실행 결과 ---- */
.s-result {
  margin-top: 14px;
  padding-top: 14px;
  border-top: var(--a-bd);
}

.s-result-h {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.s-result-h b {
  font-size: var(--a-t-md);
  letter-spacing: var(--a-ls-md);
  font-weight: 700;
}

.s-period {
  margin-left: auto;
  font-size: var(--a-t-cap);
  color: var(--a-c400);
  white-space: nowrap;
}

/*
  네 칸을 2×2로 놓는다.
  좁은 칸에서 한 줄에 넷을 넣으면 '1,281건' 같은 값이 줄바꿈된다.
*/
.s-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: var(--a-bd);
  border-radius: var(--a-r);
  overflow: hidden;
}

.s-stat {
  padding: 10px 12px;
  border-right: var(--a-bd);
  border-bottom: var(--a-bd);
}

.s-stat:nth-child(2n) { border-right: 0; }
.s-stat:nth-child(n + 3) { border-bottom: 0; }

.s-stat-v {
  font-size: var(--a-t-lg);
  letter-spacing: var(--a-ls-lg);
  font-weight: 700;
  line-height: 1.2;
}

.s-stat-l {
  color: var(--a-c500);
  font-size: var(--a-t-cap);
  margin-top: 2px;
}

.s-note {
  margin: 9px 0 0;
  color: var(--a-c400);
  font-size: var(--a-t-cap);
  line-height: 1.6;
}

.s-msg { margin-top: 12px; }
</style>

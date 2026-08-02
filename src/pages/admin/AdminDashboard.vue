<template>
  <div>
    <div class="mb-4">
      <h4 class="mb-1 fw-bold">대시보드</h4>
      <small class="text-muted">청년타파 운영 현황</small>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-secondary" role="status">
        <span class="visually-hidden">불러오는 중</span>
      </div>
    </div>

    <div v-else-if="loadError" class="alert alert-danger py-2 small">
      {{ loadError }}
    </div>

    <template v-else-if="data">

      <!-- 통계 카드 -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg" v-for="card in cards" :key="card.label">
          <component :is="card.to ? 'router-link' : 'div'"
                     :to="card.to"
                     class="card h-100 border-0 shadow-sm text-decoration-none text-reset"
                     :class="card.to ? 'card-link' : ''">
            <div class="card-body py-3">
              <div class="small text-muted mb-1">{{ card.label }}</div>
              <div class="fs-4 fw-bold" :class="card.tone">{{ card.value }}</div>
              <div class="small text-muted mt-1">{{ card.note }}</div>
            </div>
          </component>
        </div>
      </div>

      <div class="row g-3 mb-4">

        <!-- 최근 동기화 로그 -->
        <div class="col-12 col-xl-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 class="mb-0 fw-bold">동기화 로그</h6>
                  <small class="text-muted">최근 {{ data.recentSyncLogs.length }}건</small>
                </div>
                <router-link to="/admin/synclog" class="btn btn-sm btn-outline-secondary">
                  전체 보기
                </router-link>
              </div>

              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr class="small text-muted">
                      <th>구분</th>
                      <th>실행 시각</th>
                      <th>결과</th>
                      <th class="text-end">신규(추정)</th>
                      <th class="text-end">갱신(추정)</th>
                      <th class="text-end">소요</th>
                      <th style="min-width:180px">오류 내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="log in data.recentSyncLogs" :key="log.logNo">
                      <td>
                        <span class="badge" :class="execBadge(log.execType)">
                          {{ execLabel(log.execType) }}
                        </span>
                      </td>
                      <td class="small">{{ formatDateTime(log.executedAt) }}</td>
                      <td>
                        <span class="badge" :class="statusBadge(log.resultStatus)">
                          {{ statusLabel(log.resultStatus) }}
                        </span>
                      </td>
                      <td class="text-end small">{{ log.insertCnt }}건</td>
                      <td class="text-end small">{{ log.updateCnt }}건</td>
                      <td class="text-end small">{{ formatDuration(log.durationMs) }}</td>
                      <td class="small">
                      <span v-if="log.errorMsg" :class="log.resultStatus === 'F' ? 'text-danger' : 'text-warning-emphasis'">
                      {{ shortenError(log.errorMsg) }}
                      </span>
                      <span v-else class="text-muted">-</span>
                      </td>
                    </tr>
                    <tr v-if="data.recentSyncLogs.length === 0">
                      <td colspan="7" class="text-center text-muted small py-4">
                        아직 동기화 이력이 없습니다.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 마감 임박 정책 -->
        <div class="col-12 col-xl-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0 fw-bold">마감 임박 정책</h6>
                <span class="badge bg-light text-danger border">30일 이내</span>
              </div>

              <router-link v-for="b in data.deadlineBenefits" :key="b.benefitNo"
                   :to="`/admin/benefits?keyword=${encodeURIComponent(b.plcyNm)}`"
                   class="d-flex justify-content-between align-items-start py-2 border-bottom text-decoration-none text-reset">
                <div class="pe-2">
                  <div class="small fw-semibold">{{ b.plcyNm }}</div>
                  <span class="badge bg-light text-muted border mt-1">
                    {{ categoryName(b.categoryCode) }}
                  </span>
                </div>
                <span class="small fw-bold text-nowrap" :class="ddayTone(b.dday)">
                  {{ ddayLabel(b.dday) }}
                </span>
              </router-link>

              <p v-if="data.deadlineBenefits.length === 0"
                 class="text-center text-muted small py-4 mb-0">
                30일 이내 마감되는 정책이 없습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 동기화 실행 -->
      <SyncPanel @synced="loadDashboard" />

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import SyncPanel from '@/components/admin/SyncPanel.vue';

const CATEGORY = {
  1: '일자리', 2: '주거', 3: '교육', 4: '복지·문화', 5: '참여·권리',
};

const loading = ref(false);
const loadError = ref('');
const data = ref(null);

const cards = computed(() => {
  if (!data.value) return [];
  const d = data.value;
  return [
    { label: '전체 정책', value: `${d.totalBenefits.toLocaleString()}건`,
      note: '온통청년 수집 누적', tone: '',
      to: '/admin/benefits' },
    { label: '추천 가능 정책', value: `${d.activeBenefits.toLocaleString()}건`,
      note: '마감·미개시 제외', tone: 'text-primary',
      to: '/admin/benefits?isActive=Y' },
    // 대시보드는 is_active='Y' 기준으로 세므로 목록에도 같은 조건을 건다
    { label: '마감 임박 정책', value: `${d.deadlineSoonCount}건`,
      note: '30일 이내', tone: 'text-danger',
      to: '/admin/benefits?deadlineSoon=true&isActive=Y' },
    { label: '중복수혜 규칙', value: `${d.conflictRuleCount}건`,
      note: '검수 확정분만 적용', tone: '',
      to: '/admin/benefits?hasConflict=true' },
    { label: '전체 회원', value: `${d.memberCount}명`,
      note: '탈퇴 회원 제외', tone: '', to: null },
  ];
});

async function loadDashboard() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await axios.get('/api/admin/dashboard');
    data.value = res.data;
  } catch (e) {
    loadError.value = '운영 현황을 불러오지 못했습니다. 서버 상태를 확인해 주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}
// 외부 서버 에러 페이지가 통째로 들어오는 경우가 있어 대시보드에서는 앞부분만 보여준다
function shortenError(text) {
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

function categoryName(code) {
  return CATEGORY[code] || '기타';
}

// 마감일이 오늘이면 'D-0'보다 '오늘 마감'이 명확하다
function ddayLabel(dday) {
  if (dday === null || dday === undefined) return '-';
  if (dday <= 0) return '오늘 마감';
  return `D-${dday}`;
}

function ddayTone(dday) {
  if (dday <= 3) return 'text-danger';
  if (dday <= 7) return 'text-warning';
  return 'text-muted';
}

function execLabel(type) {
  return type === 'A' ? 'AUTO' : 'MANUAL';
}

function execBadge(type) {
  return type === 'A' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning-emphasis';
}

// sync_log.result_status는 S / P / F 세 가지다
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

onMounted(loadDashboard);
</script>

<style scoped>
/* 한글이 글자 단위로 끊기지 않도록 */
.table td { word-break: keep-all; }

/* 클릭 가능한 카드임을 hover로 알린다 */
.card-link { transition: box-shadow .15s; }
.card-link:hover { box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .1) !important; }
</style>
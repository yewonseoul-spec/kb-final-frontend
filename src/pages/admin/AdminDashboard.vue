<template>
  <div>
    <div class="a-head">
      <div><h1>대시보드</h1></div>
      <p>청년타파 운영 현황을 한눈에 확인합니다.</p>
      <div class="a-head-act">
        <button class="a-btn" :disabled="loading" @click="loadDashboard">새로고침</button>
      </div>
    </div>

    <div v-if="loading" class="a-loading">
      <span class="a-spin"></span> 불러오는 중
    </div>

    <div v-else-if="loadError" class="a-notice a-notice-dngr">
      <div>{{ loadError }}</div>
    </div>

    <template v-else-if="data">

      <!-- 지표 카드 -->
      <div class="a-metrics">
        <component v-for="card in cards" :key="card.label"
                   :is="card.to ? 'router-link' : 'div'"
                   :to="card.to"
                   class="a-metric"
                   :class="{ 'is-pick': card.pick }">
          <div class="a-metric-v a-num">{{ card.value }}</div>
          <div class="a-metric-l">
            {{ card.label }}
            <span v-if="card.to" class="m-go">›</span>
          </div>
          <div class="a-metric-d">{{ card.note }}</div>
        </component>
      </div>

      <!--
        좌우 두 칸.

        왼쪽은 하나짜리가 아니라 세로로 쌓는 자리다.
        SyncPanel 을 그리드의 직접 자식으로 두면 카드를 하나 더 넣는 순간
        2칸 그리드가 3칸으로 밀려 오른쪽 칸이 아래로 떨어진다.
        감싸는 div 를 두어 왼쪽 안에서만 쌓이게 한다.
      -->
      <div class="grid37">
        <div class="col-stack">
          <SyncPanel @synced="loadDashboard" />

          <!--
            추천검색어 현황.
            여기서는 보기만 하고, 순서를 바꾸거나 켜고 끄는 것은 설정 화면에서 한다.
            카드 전체가 그 화면으로 가는 링크다.
          -->
          <router-link to="/admin/recommendKeyword" class="a-card kw-card">
            <div class="a-card-h">
              <h2>추천검색어</h2>
              <span class="a-sub">사용자 혜택 검색 화면에 노출 중</span>
              <span class="kw-count a-more">
                <b class="a-num">{{ activeKeywords.length }}</b>개
                <span class="m-go">›</span>
              </span>
            </div>

            <div class="a-card-b">
              <div v-if="keywordLoading" class="kw-msg">
                추천검색어를 불러오는 중입니다.
              </div>

              <div v-else-if="activeKeywords.length" class="kw-chips">
                <span v-for="item in activeKeywords" :key="item.keywordCode" class="kw-chip">
                  {{ item.keywordName }}
                </span>
              </div>

              <!-- 비어 있는 화면은 무엇을 하라는 안내여야 한다 -->
              <div v-else class="kw-msg">
                노출 중인 추천검색어가 없습니다. 설정 화면에서 추가할 수 있습니다.
              </div>
            </div>
          </router-link>
        </div>

        <div class="a-card">
          <div class="a-card-h">
            <h2>마감 임박 정책</h2>
            <span class="a-sub">30일 이내</span>
            <router-link to="/admin/benefits?deadlineSoon=true&isActive=Y"
                         class="a-btn a-btn-xs a-more">전체 보기</router-link>
          </div>

          <table v-if="data.deadlineBenefits.length" class="a-tbl">
            <thead>
              <tr>
                <th>정책명</th>
                <th style="width:120px">카테고리</th>
                <th style="width:90px" class="a-r">남은 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in data.deadlineBenefits" :key="b.benefitNo">
                <td>
                  <router-link :to="`/admin/benefits?keyword=${encodeURIComponent(b.plcyNm)}`"
                               class="a-t-name d-link">{{ b.plcyNm }}</router-link>
                </td>
                <td class="d-dim">{{ categoryName(b.categoryCode) }}</td>
                <td class="a-r">
                  <span class="a-bdg" :class="ddayBadge(b.dday)">{{ ddayLabel(b.dday) }}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="a-empty">30일 이내 마감되는 정책이 없습니다.</div>
        </div>
      </div>

      <!-- 동기화 로그 : 열이 많아 가로 전체를 쓴다 -->
      <div class="a-card">
        <div class="a-card-h">
          <h2>최근 동기화</h2>
          <span class="a-sub">최근 {{ data.recentSyncLogs.length }}건</span>
          <router-link to="/admin/synclog" class="a-btn a-btn-xs a-more">전체 보기</router-link>
        </div>

        <div class="t-wrap">
          <table class="a-tbl">
            <thead>
              <tr>
                <th style="width:78px">방식</th>
                <th style="width:118px">실행 시각</th>
                <th style="width:186px">대상 기간</th>
                <th style="width:94px">결과</th>
                <th class="a-r" style="width:82px">신규</th>
                <th class="a-r" style="width:82px">갱신</th>
                <!-- API 응답에서 사라져 숨김 처리된 건수 -->
                <th class="a-r" style="width:72px">삭제</th>
                <th class="a-r" style="width:76px">소요</th>
                <th style="min-width:200px">오류 내용</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in data.recentSyncLogs" :key="log.logNo">
                <td><span class="a-bdg a-bdg-plain">{{ execLabel(log.execType) }}</span></td>
                <td class="a-num d-nowrap">{{ formatDateTime(log.executedAt) }}</td>
                <td class="a-num d-dim d-nowrap">{{ periodText(log) }}</td>
                <td>
                  <span class="a-bdg" :class="statusBadge(log.resultStatus)">
                    {{ statusLabel(log.resultStatus) }}
                  </span>
                </td>
                <td class="a-r a-num">{{ log.insertCnt }}</td>
                <td class="a-r a-num">{{ log.updateCnt }}</td>
                <td class="a-r a-num">
                  <span v-if="log.deleteCnt > 0" class="d-del">{{ log.deleteCnt }}</span>
                  <span v-else class="d-none">—</span>
                </td>
                <td class="a-r a-num">{{ formatDuration(log.durationMs) }}</td>

                <!-- 요약만 보여준다. 원문 확인은 '전체 보기'의 동기화 로그 화면에서 한다 -->
                <td>
                  <span v-if="log.errorMsg" class="d-err">{{ shortenError(log.errorMsg) }}</span>
                  <span v-else class="d-none">—</span>
                </td>
              </tr>

              <tr v-if="data.recentSyncLogs.length === 0">
                <td colspan="9">
                  <div class="a-empty">아직 동기화 이력이 없습니다.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adminApi from '@/api/adminApi';
import SyncPanel from '@/components/admin/SyncPanel.vue';
import { shortenError } from '@/util/syncError';

const CATEGORY = {
  1: '일자리', 2: '주거', 3: '교육', 4: '복지·문화', 5: '참여·권리',
};

const loading = ref(false);
const loadError = ref('');
const data = ref(null);

const keywords = ref([]);
const keywordLoading = ref(false);

// 사용자 화면에 실제로 나가는 것만, 나가는 순서대로 보여준다.
// 설정 화면과 순서가 다르면 어느 쪽이 맞는지 확인하러 가야 한다
const activeKeywords = computed(() =>
  [...keywords.value]
    .filter((item) => item.isActive === 'Y')
    .sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0)),
);

/*
 * 지표 카드.
 *
 * 색으로 강조하지 않는다. 다섯 개가 저마다 다른 색을 갖고 있으면
 * 정해둔 색의 뜻(초록=활성, 파랑=규칙, 주황=확인 필요)이 무너진다.
 * 관리자가 실제로 손대야 하는 '마감 임박' 하나만 테두리로 표시한다.
 */
const cards = computed(() => {
  if (!data.value) return [];
  const d = data.value;
  return [
    { label: '전체 정책', value: d.totalBenefits.toLocaleString(),
      note: '온통청년 수집 누적',
      to: '/admin/benefits' },
    { label: '추천 가능 정책', value: d.activeBenefits.toLocaleString(),
      note: '마감·미개시 제외',
      to: '/admin/benefits?isActive=Y' },
    // 대시보드는 is_active='Y' 기준으로 세므로 목록에도 같은 조건을 건다
    { label: '마감 임박 정책', value: String(d.deadlineSoonCount),
      note: '30일 이내', pick: true,
      to: '/admin/benefits?deadlineSoon=true&isActive=Y' },
    { label: '중복수혜 규칙', value: String(d.conflictRuleCount),
      note: '검수 확정분만 적용',
      to: '/admin/benefits?hasConflict=true' },
    { label: '전체 회원', value: String(d.memberCount),
      note: '탈퇴 회원 제외', to: null },
  ];
});

async function loadDashboard() {
  loading.value = true;
  loadError.value = '';
  try {
    data.value = await adminApi.getDashboard();
  } catch (e) {
    loadError.value = '운영 현황을 불러오지 못했습니다. 서버 상태를 확인해 주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

/*
 * 추천검색어는 따로 읽는다.
 *
 * 대시보드 조회와 묶으면 한쪽이 실패했을 때 화면 전체가 비는데,
 * 이건 보조 정보라 없어도 운영 현황은 봐야 한다.
 * 응답이 배열일 때와 페이지 객체일 때가 모두 있어 셋 다 받는다.
 */
async function loadKeywords() {
  keywordLoading.value = true;
  try {
    const result = await adminApi.getRecommendKeywords();
    keywords.value = Array.isArray(result)
      ? result
      : result?.content || result?.list || [];
  } catch (e) {
    keywords.value = [];
    console.error('대시보드 추천검색어 조회 실패:', e);
  } finally {
    keywordLoading.value = false;
  }
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

/*
 * 마감 임박의 색.
 *
 * 예전에는 3일 이내를 빨강으로 칠했다.
 * 빨강은 되돌릴 수 없는 것에만 쓰기로 했고, 마감은 시간이 지나면
 * 저절로 오는 것이지 관리자가 잘못한 것이 아니다.
 */
function ddayBadge(dday) {
  if (dday === null || dday === undefined) return 'a-bdg-plain';
  if (dday <= 7) return 'a-bdg-warn';
  return 'a-bdg-plain';
}

// 영문 대문자(AUTO / MANUAL)는 관리자 화면에서 읽는 속도가 느리다
function execLabel(type) {
  return type === 'A' ? '자동' : '수동';
}

// sync_log.result_status는 S / P / F 세 가지다
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

// 어떤 기간을 대상으로 돌렸는지 표시한다.
// 페이지 범위 동기화나 스케줄러 자동 실행은 대상 기간이 없어 빈 값이다.
function periodText(log) {
  if (!log.syncStartDate || !log.syncEndDate) return '전체';
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
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDuration(ms) {
  if (ms === null || ms === undefined) return '-';
  return `${(ms / 1000).toFixed(1)}초`;
}

onMounted(() => {
  loadDashboard();
  loadKeywords();
});
</script>

<style scoped>
.grid37 {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 14px;
  margin-bottom: 16px;
  /* 두 칸의 높이를 억지로 맞추지 않는다.
     예전에는 h-100 으로 늘려서 짧은 쪽 아래가 빈 채로 남았다 */
  align-items: start;
}

/* 왼쪽 칸. 카드를 세로로 쌓는다 */
.col-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.m-go { color: var(--a-c300); margin-left: 3px; }

/* ---- 추천검색어 ---- */
/* 카드 전체가 링크다. 글자색이 파랗게 변하지 않게 되돌린다 */
.kw-card {
  display: block;
  color: inherit;
  text-decoration: none;
}

.kw-card:hover { border-color: var(--a-c300); }
.kw-card:hover .kw-chip { border-color: var(--a-c300); }

.kw-count {
  color: var(--a-c500);
  font-size: var(--a-t-sm);
  white-space: nowrap;
}

.kw-count b {
  color: var(--a-c900);
  font-size: var(--a-t-md);
  font-weight: 700;
}

.kw-chips { display: flex; flex-wrap: wrap; gap: 6px; }

/*
  검색어 칩.
  의미색을 쓰지 않는다. 이건 상태가 아니라 이름이고,
  색을 넣으면 정해둔 다섯 가지 뜻과 섞인다.
*/
.kw-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border: var(--a-bd);
  border-radius: 999px;
  background: var(--a-c0);
  color: var(--a-c700);
  font-size: var(--a-t-sm);
  letter-spacing: var(--a-ls-sm);
}

.kw-msg { color: var(--a-c400); font-size: var(--a-t-sm); }

/* ---- 표 ---- */
.t-wrap { overflow-x: auto; }

/* 한글이 글자 단위로 끊기지 않도록 */
.a-tbl td { word-break: keep-all; }

.d-nowrap { white-space: nowrap; }
.d-dim { color: var(--a-c500); }
.d-none { color: var(--a-c300); }
.d-del { color: var(--a-warn); font-weight: 600; }

/* 요약은 여러 줄로 들어오는 경우가 있어 줄바꿈을 살린다 */
.d-err {
  color: var(--a-warn);
  white-space: pre-line;
  line-height: 1.5;
}

.d-link { color: var(--a-c900); text-decoration: none; }
.d-link:hover { text-decoration: underline; }

@media (max-width: 1280px) {
  .grid37 { grid-template-columns: 1fr; }
  .a-metrics { grid-template-columns: repeat(3, 1fr); }
}
</style>

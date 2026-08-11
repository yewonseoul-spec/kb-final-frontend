<template>
  <div class="stress-page">

    <header class="page-head">
      <h2 class="page-title">내 통장의 평행세계</h2>
      <p class="page-sub">조건이 다른 세계를 내 통장에 적용해봅니다</p>
    </header>

    <!-- 1단 · 세계 선택 -->
    <section class="section">
      <h3 class="section-title">어느 세계로 가볼까요</h3>

      <div v-if="loadingScenarios" class="state-box">
        <div class="spinner"></div>
      </div>

      <div v-else class="world-list">
        <button
          v-for="world in worlds"
          :key="world.scenarioCode"
          class="world-card"
          :class="{ 'is-selected': selectedCode === world.scenarioCode, 'is-locked': !world.available }"
          :aria-pressed="selectedCode === world.scenarioCode"
          @click="selectWorld(world)">
          <span class="world-head">
            <span class="world-name">{{ world.scenarioName }}</span>
            <span class="world-badge" :class="badgeClass(world)">{{ badgeText(world) }}</span>
          </span>
          <span class="world-desc">{{ world.description || world.targetCategory }}</span>
          <span v-if="!world.available" class="world-lock">준비 중</span>
        </button>
      </div>

      <p v-if="blockedNotice" class="hint-warn">{{ blockedNotice }}</p>
    </section>

    <!-- 강도 선택 -->
    <section v-if="selectedWorld && selectedWorld.available && hasLevels" class="section">
      <h3 class="section-title">얼마나 세게</h3>
      <div class="level-row">
        <button
          v-for="level in selectedWorld.levels"
          :key="level.shockLevel"
          class="level-btn"
          :class="{ 'is-selected': selectedLevel === level.shockLevel }"
          :aria-pressed="selectedLevel === level.shockLevel"
          @click="selectLevel(level.shockLevel)">
          <span class="level-value">{{ level.displayText }}</span>
        </button>
      </div>
      <p class="hint">실제 전망이 아니라 재무 민감도를 확인하기 위한 가정입니다</p>
    </section>

    <div v-if="loadError" class="error-banner">
      <span>{{ loadError }}</span>
      <button class="retry-btn" @click="retry">다시 시도</button>
    </div>

    <div v-if="calculating && !result" class="state-box">
      <div class="spinner"></div>
    </div>

    <!-- 2단 · 결과 -->
    <template v-if="result">
      <section class="section" :class="{ 'is-dim': calculating }">

        <!-- 계산 불가 안내 -->
        <div v-if="isInsufficientHistory" class="notice-box">
          <p class="notice-title">분석할 수 있는 기간이 없습니다</p>
          <p class="notice-body">소비 내역이 쌓이면 결과를 볼 수 있습니다</p>
        </div>

        <div v-else-if="isIncomeUnknown" class="notice-box">
          <p class="notice-title">소득 정보가 없습니다</p>
          <p class="notice-body">계산에 사용할 소득을 선택해주세요</p>
          <div class="notice-actions">
            <KbButton type="secondary" size="small" @click="goProfile">소득 입력하기</KbButton>
          </div>
        </div>

        <!-- 정상 결과 -->
        <template v-else>
          <div class="result-head">
            <p class="result-caption">{{ result.appliedDescription }}</p>

            <template v-if="hasCoverage">
              <p class="result-main">
                <span class="result-number">{{ displayMonths }}</span>
                <span class="result-unit">개월</span>
              </p>
              <p class="result-sub">버틸 수 있습니다</p>
            </template>

            <template v-else-if="result.cashFlowState === 'SURPLUS'">
              <p class="result-main">
                <span class="result-number">{{ formatWon(result.monthlySurplus) }}</span>
              </p>
              <p class="result-sub">매달 남습니다</p>
            </template>

            <template v-else-if="result.cashFlowState === 'BALANCED'">
              <p class="result-main"><span class="result-number">±0원</span></p>
              <p class="result-sub">수입과 지출이 같습니다</p>
            </template>

            <template v-else>
              <p class="result-main">
                <span class="result-number">{{ formatWon(result.monthlyGap) }}</span>
              </p>
              <p class="result-sub">매달 부족합니다</p>
            </template>
          </div>

          <!-- 게이지 -->
          <div v-if="hasCoverage" class="gauge">
            <div class="gauge-fill" :style="{ width: gaugeWidth }"></div>
            <div class="gauge-goal"></div>
          </div>
          <p v-if="hasCoverage" class="gauge-note">눈금은 6개월입니다</p>

          <!-- 보조 지표 -->
          <div class="metric-row">
            <div class="metric">
              <span class="metric-label">월 부족액</span>
              <b class="metric-value">{{ result.monthlyGap != null ? formatWon(result.monthlyGap) : '없음' }}</b>
            </div>
            <div class="metric">
              <span class="metric-label">즉시 부족액</span>
              <b class="metric-value" :class="{ 'is-danger': result.immediateShortfall > 0 }">
                {{ result.immediateShortfall != null ? formatWon(result.immediateShortfall) : '알 수 없음' }}
              </b>
            </div>
            <div class="metric">
              <span class="metric-label">남은 돈</span>
              <b class="metric-value">
                {{ result.postShockBalance != null ? formatWon(result.postShockBalance) : '알 수 없음' }}
              </b>
            </div>
          </div>

          <p v-if="isNoAccount" class="hint-warn">
            등록된 계좌가 없어 잔액 기반 결과를 계산하지 않았습니다
          </p>
        </template>
      </section>

      <!-- 3단 · 귀환 -->
      <section v-if="canRebalance" class="section">
        <h3 class="section-title">무엇을 포기하시겠어요</h3>

        <div class="give-up-list">
          <button
            v-for="category in reducibleCategories"
            :key="category.categoryName"
            class="give-up-item"
            :class="{ 'is-selected': givenUp.includes(category.categoryName) }"
            :aria-pressed="givenUp.includes(category.categoryName)"
            @click="toggleGiveUp(category.categoryName)">
            <span class="give-up-name">{{ category.categoryName }}</span>
            <span class="give-up-amount">월 {{ formatWon(category.monthlyAverage) }}</span>
            <span class="give-up-effect">+{{ effectOf(category) }}개월</span>
          </button>
        </div>

        <div v-if="givenUp.length" class="rebalance-result">
          <span class="rebalance-from">{{ displayMonths }}개월</span>
          <span class="rebalance-arrow">→</span>
          <span class="rebalance-to">{{ rebalancedMonths }}개월</span>
          <span class="rebalance-diff">{{ rebalanceDiffText }}</span>
        </div>

        <p class="hint">줄인다고 가정했을 때의 결과입니다</p>
      </section>

      <!-- 4단 · 상세 -->
      <section class="section">
        <details class="detail-block">
          <summary class="detail-summary">계산 근거</summary>
          <ul class="detail-list">
            <li v-for="(line, index) in result.basis" :key="'basis-' + index">{{ line }}</li>
          </ul>
          <p class="detail-meta">
            소비 분석 기간 {{ result.analysisStart }} ~ {{ result.analysisEnd }}
            ({{ result.observationMonths }}개 완결월)
          </p>
        </details>

        <details class="detail-block">
          <summary class="detail-summary">지출 구성</summary>
          <ul class="category-list">
            <li v-for="category in result.categories" :key="category.categoryName" class="category-item">
              <span class="category-name">{{ category.categoryName }}</span>
              <span class="category-freq">
                {{ result.observationMonths }}개월 중 {{ category.occurredMonths }}개월
              </span>
              <span class="category-amount">{{ formatWon(category.monthlyAverage) }}</span>
            </li>
          </ul>
          <p class="detail-meta">월 환산 평균입니다. 실제로 그 금액을 쓴 달이 없을 수 있습니다</p>
        </details>

        <details class="detail-block">
          <summary class="detail-summary">알려진 한계</summary>
          <ul class="detail-list">
            <li v-for="(line, index) in result.limitations" :key="'limit-' + index">{{ line }}</li>
          </ul>
        </details>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import stressApi from '@/api/stressApi';
import KbButton from '@/components/common/KbButton.vue';

const router = useRouter();

/** 소득 전액 상실은 stress_scenario 에 없어 화면에서 추가한다 */
const JOB_LOSS_WORLD = {
  scenarioCode: 'JOB_LOSS',
  scenarioName: '소득이 끊긴 세계',
  description: '등록 월소득이 전부 사라진다고 가정합니다',
  targetCategory: '소득',
  available: true,
  levels: [],
};

const scenarios = ref([]);
const loadingScenarios = ref(false);
const calculating = ref(false);
const loadError = ref('');
const blockedNotice = ref('');

const selectedCode = ref('');
const selectedLevel = ref('');
const result = ref(null);
const givenUp = ref([]);

const worlds = computed(() => [JOB_LOSS_WORLD, ...scenarios.value]);

const selectedWorld = computed(
  () => worlds.value.find((world) => world.scenarioCode === selectedCode.value) || null,
);

const hasLevels = computed(
  () => !!selectedWorld.value?.levels?.length,
);

const isInsufficientHistory = computed(
  () => result.value?.spendingStatus === 'INSUFFICIENT_HISTORY',
);

const isIncomeUnknown = computed(
  () => result.value?.incomeStatus === 'NEEDS_USER_ASSUMPTION',
);

const isNoAccount = computed(
  () => result.value?.balanceStatus === 'NO_ACCOUNT',
);

const hasCoverage = computed(
  () => result.value?.coverageMonths != null,
);

const coverageMonths = computed(
  () => Number(result.value?.coverageMonths ?? 0),
);

const displayMonths = computed(() => formatMonths(coverageMonths.value));

const gaugeWidth = computed(() => {
  const ratio = Math.min(coverageMonths.value / 8, 1);
  return `${Math.round(ratio * 100)}%`;
});

/** 부족 상태이고 잔액을 알 때만 조정할 수 있다 */
const canRebalance = computed(
  () => result.value?.cashFlowState === 'DEFICIT' && hasCoverage.value,
);

const reducibleCategories = computed(
  () => (result.value?.categories ?? []).filter((category) => category.monthlyAverage > 0),
);

/** 포기한 항목의 월 환산 합계 */
const reducedAmount = computed(() =>
  reducibleCategories.value
    .filter((category) => givenUp.value.includes(category.categoryName))
    .reduce((sum, category) => sum + category.monthlyAverage, 0),
);

const rebalancedMonths = computed(() => {
  const gap = Number(result.value?.monthlyGap ?? 0) - reducedAmount.value;
  if (gap <= 0) {
    return '∞';
  }
  return formatMonths(Number(result.value?.postShockBalance ?? 0) / gap);
});

const rebalanceDiffText = computed(() => {
  if (rebalancedMonths.value === '∞') {
    return '부족이 사라집니다';
  }
  const diff = Number(rebalancedMonths.value) - coverageMonths.value;
  return `${diff.toFixed(1)}개월 늘었습니다`;
});

/**
 * 해당 항목만 포기했을 때 늘어나는 기간을 계산한다
 * 서버가 배열로 내려주기 전까지 화면에서 계산한다
 */
function effectOf(category) {
  const gap = Number(result.value?.monthlyGap ?? 0);
  const balance = Number(result.value?.postShockBalance ?? 0);
  const nextGap = gap - category.monthlyAverage;
  if (nextGap <= 0) {
    return '∞';
  }
  return (balance / nextGap - balance / gap).toFixed(1);
}

function badgeText(world) {
  if (world.scenarioCode === 'JOB_LOSS') {
    return '가정';
  }
  return '가정';
}

function badgeClass(world) {
  return world.scenarioCode === 'JOB_LOSS' ? 'is-income' : 'is-assumed';
}

function formatWon(value) {
  if (value == null) {
    return '알 수 없음';
  }
  return `${Number(value).toLocaleString()}원`;
}

function formatMonths(value) {
  const months = Number(value);
  if (!Number.isFinite(months)) {
    return '0';
  }
  return months >= 100 ? Math.round(months).toString() : months.toFixed(1);
}

function selectWorld(world) {
  if (!world.available) {
    blockedNotice.value = world.unavailableReason || '아직 계산할 수 없는 세계입니다';
    return;
  }
  blockedNotice.value = '';
  selectedCode.value = world.scenarioCode;
  selectedLevel.value = world.levels?.length ? world.levels[0].shockLevel : 'HIGH';
  calculate();
}

function selectLevel(shockLevel) {
  selectedLevel.value = shockLevel;
  calculate();
}

function toggleGiveUp(categoryName) {
  const index = givenUp.value.indexOf(categoryName);
  if (index >= 0) {
    givenUp.value.splice(index, 1);
  } else {
    givenUp.value.push(categoryName);
  }
}

function goProfile() {
  router.push({ path: '/mypage' });
}

function retry() {
  loadError.value = '';
  if (selectedCode.value) {
    calculate();
  } else {
    loadScenarios();
  }
}

async function loadScenarios() {
  loadingScenarios.value = true;
  loadError.value = '';
  try {
    scenarios.value = await stressApi.getScenarios();
  } catch (e) {
    loadError.value = '세계 목록을 불러오지 못했습니다';
  } finally {
    loadingScenarios.value = false;
  }
}

async function calculate() {
  if (!selectedCode.value) {
    return;
  }
  calculating.value = true;
  loadError.value = '';
  givenUp.value = [];
  try {
    result.value = await stressApi.getResult(selectedCode.value, selectedLevel.value);
  } catch (e) {
    loadError.value = '결과를 계산하지 못했습니다';
  } finally {
    calculating.value = false;
  }
}

onMounted(loadScenarios);
</script>

<style scoped>
.stress-page {
  padding-bottom: 100px;
}

.page-head {
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}

.page-sub {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

.section {
  margin-bottom: 28px;
  transition: opacity 0.2s;
}

.section.is-dim {
  opacity: 0.5;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

/* 세계 카드 */
.world-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.world-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.world-card.is-selected {
  border-color: var(--color-primary);
  background: #fffdf5;
}

.world-card.is-locked {
  opacity: 0.55;
}

.world-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.world-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.world-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
}

.world-badge.is-assumed {
  background: #f2efe8;
  color: var(--color-text-muted);
}

.world-badge.is-income {
  background: #fdeaea;
  color: var(--color-danger);
}

.world-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.world-lock {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* 강도 */
.level-row {
  display: flex;
  gap: 8px;
}

.level-btn {
  flex: 1;
  padding: 12px 8px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 0.15s;
}

.level-btn.is-selected {
  border-color: var(--color-primary);
  background: #fffdf5;
}

.level-value {
  display: block;
  font-size: 13px;
  color: var(--color-text-primary);
}

/* 결과 */
.result-head {
  text-align: center;
  padding: 20px 0 12px;
}

.result-caption {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 10px;
}

.result-main {
  margin: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.result-number {
  font-size: 40px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.result-unit {
  font-size: 18px;
  color: var(--color-text-primary);
}

.result-sub {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 6px 0 0;
}

.gauge {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background: #efece4;
  margin: 16px 0 6px;
}

.gauge-fill {
  height: 10px;
  border-radius: 5px;
  background: var(--color-primary);
  transition: width 0.3s;
}

.gauge-goal {
  position: absolute;
  top: -3px;
  left: 75%;
  width: 2px;
  height: 16px;
  background: var(--color-text-muted);
}

.gauge-note {
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: right;
  margin: 0 0 16px;
}

.metric-row {
  display: flex;
  gap: 8px;
}

.metric {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: #faf8f3;
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.metric-value.is-danger {
  color: var(--color-danger);
}

/* 귀환 */
.give-up-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.give-up-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.give-up-item.is-selected {
  border-color: var(--color-primary);
  background: #fffdf5;
}

.give-up-name {
  flex: 1;
  font-size: 14px;
  text-align: left;
  color: var(--color-text-primary);
}

.give-up-amount {
  font-size: 12px;
  color: var(--color-text-muted);
}

.give-up-effect {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 62px;
  text-align: right;
}

.rebalance-result {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  background: #faf8f3;
}

.rebalance-from {
  font-size: 16px;
  color: var(--color-text-muted);
}

.rebalance-arrow {
  color: var(--color-text-muted);
}

.rebalance-to {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rebalance-diff {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* 상세 */
.detail-block {
  border-top: 1px solid var(--color-border);
  padding: 12px 0;
}

.detail-summary {
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.detail-list {
  margin: 10px 0 0;
  padding-left: 16px;
}

.detail-list li {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.8;
}

.detail-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 10px 0 0;
}

.category-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f2eb;
}

.category-name {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-primary);
}

.category-freq {
  font-size: 11px;
  color: var(--color-text-muted);
}

.category-amount {
  font-size: 13px;
  color: var(--color-text-primary);
  min-width: 84px;
  text-align: right;
}

/* 공통 */
.notice-box {
  padding: 24px 16px;
  border-radius: 14px;
  background: #faf8f3;
  text-align: center;
}

.notice-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}

.notice-body {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

.notice-actions {
  margin-top: 14px;
}

.hint {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 10px 0 0;
}

.hint-warn {
  font-size: 12px;
  color: var(--color-danger);
  margin: 10px 0 0;
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fdeaea;
  margin-bottom: 20px;
}

.error-banner span {
  font-size: 13px;
  color: var(--color-danger);
}

.retry-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-danger);
  border-radius: 8px;
  background: transparent;
  color: var(--color-danger);
  font-size: 12px;
  cursor: pointer;
}

.state-box {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #efece4;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
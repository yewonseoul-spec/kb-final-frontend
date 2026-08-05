<template>
  <div class="stress-page">

    <header class="page-head">
      <h2 class="page-title">금융 스트레스 테스트</h2>
      <p class="page-sub">위기 상황이 오면 얼마나 버틸 수 있는지 확인해보세요</p>
    </header>

    <!-- 시나리오 선택 -->
    <section class="section">
      <h3 class="section-title">어떤 상황을 가정할까요</h3>

      <div v-if="loadingScenarios" class="state-box">
        <div class="spinner"></div>
      </div>

      <div v-else class="scenario-grid">
        <button v-for="s in scenarios" :key="s.scenarioCode"
                class="scenario-card"
                :class="{ 'is-selected': selectedCode === s.scenarioCode, 'is-disabled': !s.available }"
                :disabled="!s.available"
                @click="selectScenario(s)">
          <span class="scenario-name">{{ s.scenarioName }}</span>
          <span class="scenario-target">{{ s.targetCategory === 'ALL' ? '전체' : s.targetCategory }}</span>
        </button>
      </div>

      <p v-if="unavailableReason" class="hint-warn">{{ unavailableReason }}</p>
    </section>

    <!-- 강도 선택 -->
    <section v-if="selectedScenario" class="section">
      <h3 class="section-title">충격 강도</h3>

      <div class="level-row">
        <button v-for="lv in selectedScenario.levels" :key="lv.shockLevel"
                class="level-btn"
                :class="{ 'is-selected': selectedLevel === lv.shockLevel }"
                @click="selectLevel(lv.shockLevel)">
          <span class="level-label">{{ lv.label }}</span>
          <span class="level-value">{{ lv.displayText }}</span>
        </button>
      </div>
    </section>

    <!-- 로딩 -->
    <div v-if="calculating" class="state-box">
      <div class="spinner"></div>
      <p class="state-text">방어력을 계산하는 중이에요</p>
    </div>

    <!-- 계산 불가 -->
    <KbCard v-else-if="result && result.status !== 'OK'" class="text-center">
      <h3 class="empty-title">계산할 수 없어요</h3>
      <p class="empty-desc">{{ result.message }}</p>
      <KbButton v-if="result.status === 'PROFILE_REQUIRED'" class="mt-3" @click="goProfile">
        프로필 입력하러 가기
      </KbButton>
      <KbButton v-else-if="result.status === 'NO_ACCOUNT'" class="mt-3" @click="goAsset">
        계좌 연결하러 가기
      </KbButton>
    </KbCard>

    <div v-else-if="loadError" class="state-box">
      <p class="state-text">{{ loadError }}</p>
      <KbButton type="secondary" size="small" @click="calculate">다시 시도</KbButton>
    </div>

    <!-- 결과 -->
    <template v-else-if="result">

      <!-- 점수 -->
      <KbCard yellow-bg class="score-card">
        <div class="score-top">
          <span class="grade-badge" :class="gradeClass">{{ result.grade }}</span>
          <span class="score-sub">방어력 점수</span>
        </div>
        <div class="score-main">
          <strong>{{ result.score }}</strong><span class="score-unit">점</span>
        </div>
        <p class="survival">
          지금 수입이 끊긴다면 <strong>{{ result.survivalMonths }}개월</strong> 버틸 수 있어요
        </p>
        <p class="grade-action">{{ result.gradeAction }}</p>
      </KbCard>

      <p class="assume-note">
        수입이 끊긴 상황을 가정해 현재 잔액으로 몇 개월 버틸 수 있는지 계산합니다.
        일반적으로 권장되는 비상자금은 3~6개월치입니다.
      </p>

      <!-- 위기 시 지출 -->
      <section class="section">
        <h3 class="section-title">위기가 오면</h3>

        <KbCard>
          <div class="flow">
            <div class="flow-item">
              <span class="flow-label">평상시 월 지출</span>
              <span class="flow-value">{{ won(result.monthlySpending) }}</span>
            </div>
            <div class="flow-item is-plus">
              <span class="flow-label">{{ result.scenarioName }} · {{ result.shockLabel }}</span>
              <span class="flow-value">+{{ won(result.increaseAmount) }}</span>
            </div>
            <div class="flow-divider"></div>
            <div class="flow-item is-total">
              <span class="flow-label">위기 시 월 지출</span>
              <span class="flow-value">{{ won(result.crisisSpending) }}</span>
            </div>
          </div>

          <p v-if="result.scenarioBasis" class="basis-note">
            {{ result.scenarioBasis }}
          </p>
        </KbCard>
      </section>

      <!-- 지출 구성 -->
      <section class="section">
        <h3 class="section-title">내 지출 구성</h3>

        <KbCard>
          <div class="bar">
            <div class="bar-seg is-fixed" :style="{ width: pct(result.fixedTotal) }"></div>
            <div class="bar-seg is-variable" :style="{ width: pct(result.variableTotal) }"></div>
            <div class="bar-seg is-adjustable" :style="{ width: pct(result.adjustableTotal) }"></div>
          </div>

          <div class="legend">
            <span><i class="dot is-fixed"></i>고정비 {{ won(result.fixedTotal) }}</span>
            <span><i class="dot is-variable"></i>변동비 {{ won(result.variableTotal) }}</span>
            <span><i class="dot is-adjustable"></i>조절 가능 {{ won(result.adjustableTotal) }}</span>
          </div>

          <button class="link-toggle" @click="showBreakdown = !showBreakdown">
            카테고리별 보기
            <span class="caret">{{ showBreakdown ? '▴' : '▾' }}</span>
          </button>

          <ul v-if="showBreakdown" class="cat-list">
            <li v-for="b in result.breakdown" :key="b.categoryName"
                :class="{ 'is-affected': b.affected }">
              <span class="cat-name">
                {{ b.categoryName }}
                <em v-if="b.affected" class="affected-tag">영향</em>
              </span>
              <span class="cat-type">{{ b.spendingType }}</span>
              <span class="cat-amount">{{ won(b.monthlyAmount) }}</span>
            </li>
          </ul>
        </KbCard>
      </section>

      <!-- 권고 -->
      <section v-if="result.reduction" class="section">
        <h3 class="section-title">지출을 줄이면</h3>

        <KbCard>
          <p class="reduce-main">
            월 <strong>{{ won(result.reduction.reducedSpending) }}</strong>까지 줄이면
            <strong>{{ result.reduction.reducedSurvivalMonths }}개월</strong>
            <span class="reduce-grade" :class="gradeClassOf(result.reduction.reducedGrade)">
              {{ result.reduction.reducedGrade }}
            </span>
            까지 버틸 수 있어요
          </p>

          <ul class="save-list">
            <li v-for="s in result.reduction.topSavings" :key="s">{{ s }}</li>
          </ul>

          <p class="basis-note">
            주거비처럼 계약으로 정해진 지출은 줄일 수 없다고 보고,
            여가·쇼핑처럼 조절 가능한 항목만 반영했습니다.
          </p>
        </KbCard>
      </section>

      <!-- 계산 근거 -->
      <section class="section">
        <button class="more-btn" @click="showBasis = !showBasis">
          계산 근거 보기
          <span class="caret">{{ showBasis ? '▴' : '▾' }}</span>
        </button>

        <ul v-if="showBasis" class="basis-list">
          <li v-for="b in result.basis" :key="b">{{ b }}</li>
        </ul>
      </section>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import stressApi from '@/api/stressApi';
import KbCard from '@/components/common/KbCard.vue';
import KbButton from '@/components/common/KbButton.vue';

const router = useRouter();


const scenarios = ref([]);
const loadingScenarios = ref(false);
const selectedCode = ref('');
const selectedLevel = ref('');

const result = ref(null);
const calculating = ref(false);
const loadError = ref('');

const showBreakdown = ref(false);
const showBasis = ref(false);

const selectedScenario = computed(() =>
    scenarios.value.find((s) => s.scenarioCode === selectedCode.value) || null);

const unavailableReason = computed(() => {
  const s = scenarios.value.find((x) => !x.available);
  return s ? s.unavailableReason : '';
});

const gradeClass = computed(() => gradeClassOf(result.value?.grade));

function gradeClassOf(grade) {
  if (grade === '안전') return 'is-safe';
  if (grade === '주의') return 'is-warn';
  return 'is-danger';
}

// 지출 구성 막대의 비율. 합계가 0이면 0%로 둔다
function pct(amount) {
  const total = (result.value?.monthlySpending) || 0;
  if (!total) return '0%';
  return `${(amount / total * 100).toFixed(1)}%`;
}

function won(v) {
  return `${(v ?? 0).toLocaleString()}원`;
}

async function loadScenarios() {
  loadingScenarios.value = true;
  try {
    const data = await stressApi.getScenarios();
    scenarios.value = data;

    // 첫 진입에는 계산 가능한 첫 시나리오를 보통 강도로 보여준다
    const first = data.find((s) => s.available);
    if (first) {
      selectedCode.value = first.scenarioCode;
      selectedLevel.value = 'MID';
      await calculate();
    }
  } catch (e) {
    loadError.value = '시나리오를 불러오지 못했어요.';
    console.error(e);
  } finally {
    loadingScenarios.value = false;
  }
}

function selectScenario(s) {
  selectedCode.value = s.scenarioCode;
  calculate();
}

function selectLevel(level) {
  selectedLevel.value = level;
  calculate();
}

async function calculate() {
  if (!selectedCode.value || !selectedLevel.value) return;

  calculating.value = true;
  loadError.value = '';

  try {
    const data = await stressApi.getResult(selectedCode.value, selectedLevel.value);
    result.value = data;
  } catch (e) {
    loadError.value = '계산에 실패했어요. 잠시 후 다시 시도해주세요.';
    console.error(e);
  } finally {
    calculating.value = false;
  }
}

function goProfile() {
  router.push('/mypage');
}

function goAsset() {
  router.push('/asset');
}

onMounted(loadScenarios);
</script>

<style scoped>
/* 하단 탭바(80px)에 마지막 카드가 가리지 않도록 여백을 둔다 */
.stress-page {
  padding-bottom: 100px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ---- 상태 ---- */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 0;
}

.state-text {
  margin: 0;
  font-size: 14px;
  color: #908980;
}

.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #efece4;
  border-top-color: #ffbc00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }

/* ---- 제목 ---- */
.page-head { padding-top: 4px; }

.page-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: #2e2a24;
  letter-spacing: -0.02em;
}

.page-sub {
  margin: 0;
  font-size: 13px;
  color: #908980;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: #2e2a24;
}

/* ---- 시나리오 ---- */
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
}

.scenario-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 10px;
  border-radius: 12px;
  border: 1.5px solid #efece4;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
}

.scenario-card.is-selected {
  border-color: #ffbc00;
  background: #fffaeb;
}

.scenario-card.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.scenario-name {
  font-size: 13.5px;
  font-weight: 700;
  color: #2e2a24;
}

.scenario-target {
  font-size: 11.5px;
  color: #908980;
}

.hint-warn {
  margin: 0;
  font-size: 12px;
  color: #b6964d;
}

/* ---- 강도 ---- */
.level-row {
  display: flex;
  gap: 8px;
}

.level-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  border-radius: 12px;
  border: 1.5px solid #efece4;
  background: #ffffff;
  cursor: pointer;
}

.level-btn.is-selected {
  border-color: #2e2a24;
  background: #2e2a24;
}

.level-btn.is-selected .level-label { color: #ffffff; }
.level-btn.is-selected .level-value { color: #d8d2c8; }

.level-label {
  font-size: 13.5px;
  font-weight: 700;
  color: #2e2a24;
}

.level-value {
  font-size: 11px;
  color: #908980;
}

/* ---- 점수 ---- */
.score-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grade-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 700;
}

.grade-badge.is-safe { background: #e3f4e6; color: #2c7a3f; }
.grade-badge.is-warn { background: #fff2d6; color: #98701a; }
.grade-badge.is-danger { background: #ffe8e8; color: #d64545; }

.score-sub {
  font-size: 12.5px;
  color: #908980;
}

.score-main {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-top: 2px;
}

.score-main strong {
  font-size: 40px;
  font-weight: 700;
  color: #2e2a24;
  letter-spacing: -0.03em;
}

.score-unit {
  font-size: 16px;
  color: #908980;
}

.survival {
  margin: 2px 0 0;
  font-size: 14px;
  color: #2e2a24;
}

.survival strong { color: #c99400; }

.grade-action {
  margin: 0;
  font-size: 12.5px;
  color: #908980;
}

.assume-note {
  margin: -8px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8f7f2;
  font-size: 12px;
  color: #6f6860;
  line-height: 1.55;
}

/* ---- 지출 흐름 ---- */
.flow {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flow-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13.5px;
}

.flow-label { color: #6f6860; }
.flow-value { color: #2e2a24; font-weight: 600; }

.flow-item.is-plus .flow-value { color: #d64545; }

.flow-divider {
  height: 1px;
  background: #efece4;
  margin: 2px 0;
}

.flow-item.is-total .flow-label { font-weight: 700; color: #2e2a24; }
.flow-item.is-total .flow-value { font-size: 16px; font-weight: 700; }

.basis-note {
  margin: 10px 0 0;
  font-size: 12px;
  color: #908980;
  line-height: 1.55;
}

/* ---- 지출 구성 ---- */
.bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: #f4f1ea;
}

.bar-seg.is-fixed { background: #6f6860; }
.bar-seg.is-variable { background: #ffbc00; }
.bar-seg.is-adjustable { background: #f0dfa8; }

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  font-size: 12px;
  color: #6f6860;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.dot.is-fixed { background: #6f6860; }
.dot.is-variable { background: #ffbc00; }
.dot.is-adjustable { background: #f0dfa8; }

.cat-list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.cat-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid #f4f1ea;
  font-size: 12.5px;
}

.cat-list li:last-child { border-bottom: none; }
.cat-list li.is-affected { background: #fffaeb; }

.cat-name { flex: 1; color: #2e2a24; }

.affected-tag {
  margin-left: 4px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #ffe8b0;
  color: #8a6d1f;
  font-size: 10px;
  font-style: normal;
}

.cat-type { color: #908980; font-size: 11.5px; }
.cat-amount { color: #2e2a24; font-weight: 600; min-width: 78px; text-align: right; }

/* ---- 권고 ---- */
.reduce-main {
  margin: 0;
  font-size: 14px;
  color: #2e2a24;
  line-height: 1.6;
}

.reduce-main strong { color: #c99400; }

.reduce-grade {
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
}

.reduce-grade.is-safe { background: #e3f4e6; color: #2c7a3f; }
.reduce-grade.is-warn { background: #fff2d6; color: #98701a; }
.reduce-grade.is-danger { background: #ffe8e8; color: #d64545; }

.save-list {
  margin: 10px 0 0;
  padding: 10px 12px;
  list-style: none;
  border-radius: 10px;
  background: #f8f7f2;
}

.save-list li {
  font-size: 12.5px;
  color: #6f6860;
  padding: 3px 0;
}

/* ---- 근거 ---- */
.more-btn {
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #efece4;
  font-size: 13.5px;
  font-weight: 600;
  color: #6f6860;
  cursor: pointer;
}

.basis-list {
  margin: 0;
  padding: 12px 14px;
  list-style: none;
  border-radius: 12px;
  background: #f8f7f2;
}

.basis-list li {
  font-size: 12.5px;
  color: #6f6860;
  padding: 4px 0;
  line-height: 1.5;
}

/* ---- 공통 ---- */
.link-toggle {
  margin-top: 10px;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: #908980;
  cursor: pointer;
}

.caret { font-size: 10px; margin-left: 2px; }

.empty-title { margin: 0; font-size: 17px; font-weight: 700; color: #2e2a24; }
.empty-desc { margin: 0; font-size: 13px; color: #908980; line-height: 1.55; }
.mt-3 { margin-top: 12px; }
.text-center { text-align: center; align-items: center; }
</style>
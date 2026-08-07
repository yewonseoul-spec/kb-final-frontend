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
        <!-- 계산할 수 없는 시나리오도 누를 수 있게 두고, 누르면 사유를 보여준다.
             disabled 로 막으면 왜 못 쓰는지 확인할 방법이 없다. -->
        <button v-for="s in scenarios" :key="s.scenarioCode"
                class="scenario-card"
                :class="{ 'is-selected': selectedCode === s.scenarioCode, 'is-locked': !s.available }"
                :aria-pressed="selectedCode === s.scenarioCode"
                @click="selectScenario(s)">
          <span class="scenario-name">{{ s.scenarioName }}</span>
          <span class="scenario-target">{{ s.targetCategory === 'ALL' ? '전체' : s.targetCategory }}</span>
          <span v-if="!s.available" class="lock-tag">준비 중</span>
        </button>
      </div>

      <p v-if="blockedNotice" class="hint-warn">{{ blockedNotice }}</p>
    </section>

    <!-- 강도 선택 -->
    <section v-if="selectedScenario && selectedScenario.available" class="section">
      <h3 class="section-title">충격 강도</h3>

      <div class="level-row">
        <button v-for="lv in selectedScenario.levels" :key="lv.shockLevel"
                class="level-btn"
                :class="{ 'is-selected': selectedLevel === lv.shockLevel }"
                :aria-pressed="selectedLevel === lv.shockLevel"
                @click="selectLevel(lv.shockLevel)">
          <span class="level-label">{{ lv.label }}</span>
          <span class="level-value">{{ lv.displayText }}</span>
        </button>
      </div>
    </section>

    <!-- 오류 안내.
         결과가 이미 있으면 지우지 않고 위에 배너로만 알린다 -->
    <div v-if="loadError" class="error-banner">
      <span>{{ loadError }}</span>
      <button class="retry-btn" @click="retry">다시 시도</button>
    </div>

    <!-- 첫 계산 중에만 전체를 대체한다.
         이미 결과가 있으면 그대로 두고 흐리게만 처리해,
         시나리오를 바꿀 때마다 화면이 접혔다 펴지는 것을 막는다. -->
    <div v-if="calculating && !result" class="state-box">
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

    <!-- 결과 -->
    <div v-else-if="result" class="result-wrap" :class="{ 'is-dim': calculating }">

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
                :class="{ 'is-affected': isAffected(b) }">
              <span class="cat-name">
                {{ b.categoryName }}
                <em v-if="isAffected(b)" class="affected-tag">영향</em>
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
            <strong>{{ result.reduction.reducedSurvivalMonths }}개월</strong>까지 버틸 수 있어요.
          </p>
          <p class="reduce-grade-line">
            이때 등급은
            <span class="reduce-grade" :class="gradeClassOf(result.reduction.reducedGrade)">
              {{ result.reduction.reducedGrade }}
            </span>
            입니다.
          </p>

          <ul class="save-list">
            <li v-for="(s, i) in result.reduction.topSavings" :key="i">{{ s }}</li>
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
          <li v-for="(b, i) in result.basis" :key="i">{{ b }}</li>
        </ul>
      </section>

    </div>
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
const blockedNotice = ref('');

const result = ref(null);
const calculating = ref(false);
const loadError = ref('');
const failedStage = ref('');   // 'scenarios' | 'result'

const showBreakdown = ref(false);
const showBasis = ref(false);

// 응답 역전 방지용 요청 순번.
// 시나리오를 빠르게 여러 번 누르면 늦게 도착한 이전 응답이 최신 결과를 덮는다.
let reqId = 0;

const selectedScenario = computed(() =>
    scenarios.value.find((s) => s.scenarioCode === selectedCode.value) || null);

const gradeClass = computed(() => gradeClassOf(result.value?.grade));

function gradeClassOf(grade) {
  if (grade === '안전') return 'is-safe';
  if (grade === '주의') return 'is-warn';
  return 'is-danger';
}

/**
 * 영향 카테고리 판정.
 * 백엔드가 affected 를 안 내려주면 선택한 시나리오의 대상 카테고리로 대신 판정한다.
 * 의료비는 카테고리 무관 고정 금액이고 복합 위기는 대상이 'ALL' 이라 표시되지 않는다.
 */
function isAffected(b) {
  if (b.affected !== undefined && b.affected !== null) return b.affected;

  const target = selectedScenario.value?.targetCategory;
  if (!target || target === 'ALL') return false;
  return b.categoryName === target;
}

/**
 * 지출 구성 막대의 비율.
 * 분모를 monthlySpending 이 아니라 세 구간의 합으로 둔다.
 * 의료비를 통계 기대값으로 대체하는 계산 때문에 둘이 어긋나면
 * 막대가 100%를 넘거나 모자라기 때문이다.
 */
function pct(amount) {
  const r = result.value;
  if (!r) return '0%';

  const total = (r.fixedTotal || 0) + (r.variableTotal || 0) + (r.adjustableTotal || 0);
  if (!total) return '0%';

  return `${((amount || 0) / total * 100).toFixed(1)}%`;
}

function won(v) {
  return `${(v ?? 0).toLocaleString()}원`;
}

async function loadScenarios() {
  loadingScenarios.value = true;
  loadError.value = '';

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
    failedStage.value = 'scenarios';
    loadError.value = '시나리오를 불러오지 못했어요.';
    console.error(e);
  } finally {
    loadingScenarios.value = false;
  }
}

function selectScenario(s) {
  // 계산할 수 없는 시나리오는 사유만 보여주고 요청하지 않는다
  if (!s.available) {
    blockedNotice.value = s.unavailableReason || '아직 준비 중인 시나리오예요.';
    return;
  }

  blockedNotice.value = '';
  selectedCode.value = s.scenarioCode;

  // 시나리오마다 강도 구성이 다를 수 있어 없는 강도면 보통으로 되돌린다
  if (!s.levels?.some((lv) => lv.shockLevel === selectedLevel.value)) {
    selectedLevel.value = 'MID';
  }

  calculate();
}

function selectLevel(level) {
  selectedLevel.value = level;
  calculate();
}

async function calculate() {
  if (!selectedCode.value || !selectedLevel.value) return;

  const myReq = ++reqId;
  calculating.value = true;
  loadError.value = '';

  try {
    const data = await stressApi.getResult(selectedCode.value, selectedLevel.value);
    if (myReq !== reqId) return;   // 늦게 온 이전 응답은 버린다
    result.value = data;
  } catch (e) {
    if (myReq !== reqId) return;

    failedStage.value = 'result';
    loadError.value = '계산에 실패했어요. 잠시 후 다시 시도해주세요.';
    console.error(e);
  } finally {
    if (myReq === reqId) calculating.value = false;
  }
}

/**
 * 실패한 지점에 따라 다시 부를 대상이 다르다.
 * 시나리오 조회가 실패하면 selectedCode 가 비어 있어 calculate 가 그냥 return 하므로,
 * '다시 시도'를 눌러도 아무 일이 일어나지 않는다.
 */
function retry() {
  if (failedStage.value === 'scenarios' || scenarios.value.length === 0) {
    loadScenarios();
  } else {
    calculate();
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
  max-width: 480px;
  margin: 0 auto;
}

/* 결과를 div 로 감싸면 부모의 flex gap 이 안 먹으므로 같은 간격을 다시 준다.
   재계산 중에는 결과를 지우지 않고 흐리게만 해서 화면이 튀지 않게 한다 */
.result-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: opacity 0.15s ease;
}

.result-wrap.is-dim { opacity: 0.45; }

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

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 13px;
  border-radius: 10px;
  background: #ffe8e8;
  font-size: 12.5px;
  color: #a83030;
}

.retry-btn {
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid #e0a6a6;
  border-radius: 8px;
  background: #ffffff;
  font-size: 12px;
  font-weight: 600;
  color: #a83030;
  cursor: pointer;
}

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
  position: relative;
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

.scenario-card.is-locked {
  background: #f8f7f2;
  border-style: dashed;
}

.scenario-card.is-locked .scenario-name,
.scenario-card.is-locked .scenario-target { color: #a8a29a; }

.lock-tag {
  margin-top: 4px;
  align-self: flex-start;
  padding: 1px 6px;
  border-radius: 4px;
  background: #ece8e0;
  color: #7d766d;
  font-size: 10px;
  font-weight: 600;
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
  padding: 9px 11px;
  border-radius: 8px;
  background: #fffaeb;
  font-size: 12px;
  color: #8a6d1f;
  line-height: 1.5;
}

/* ---- 강도 ----
   선택 표시를 시나리오 카드와 같은 시각 언어로 맞춘다.
   검은 배경은 화면에서 가장 강한 요소가 되어 주인공인 점수 카드보다 먼저 눈에 들어온다 */
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
  border-color: #ffbc00;
  background: #fffaeb;
}

.level-btn.is-selected .level-label { color: #2e2a24; }
.level-btn.is-selected .level-value { color: #8a6d1f; }

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

.reduce-grade-line {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6f6860;
}

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
<template>
  <div class="stress-page" :class="themeClass">

    <!-- 1 · 세계 선택 -->
    <section v-if="phase === 'select'" class="phase">
      <p class="eyebrow">MY FINANCIAL PARALLEL WORLDS</p>
      <h2 class="page-title">내 통장의 평행세계</h2>
      <p class="page-sub">과거에 실제로 있었던 위기가<br>지금 나에게 온다면 어떻게 될까요?</p>

      <div class="progress">
        <div class="dots">
          <span v-for="i in 3" :key="i" class="dot" :class="{ on: i <= visitedCount }"></span>
        </div>
        <small>{{ visitedCount }} / 3 체험함</small>
      </div>

      <div class="world-list">
        <button
          v-for="item in worlds"
          :key="item.code"
          class="world-card"
          :class="[`theme-${item.theme}`, { locked: item.boss && !bossUnlocked }]"
          @click="enterWorld(item)">
          <span class="w-year">{{ item.boss && !bossUnlocked ? '잠김' : item.year }}</span>
          <span class="w-label">{{ item.label }}</span>
          <span class="w-name">{{ item.name }}</span>
          <span class="w-desc">{{ item.summary }}</span>
          <span v-if="visited[item.code] != null" class="w-done">
            체험함 · {{ visited[item.code] }}점
          </span>
          <span v-else-if="item.boss && !bossUnlocked" class="w-lock">
            <span class="lockbar"><i :style="{ width: (visitedCount / 3 * 100) + '%' }"></i></span>
            세 세계를 모두 체험하면 열립니다
          </span>
          <span v-else class="w-go">세계 열기 →</span>
        </button>
      </div>

      <p v-if="loadError" class="error-line">{{ loadError }}</p>
    </section>

    <!-- 2 · 타임슬립 -->
    <section v-else-if="phase === 'shift'" class="phase portal" :class="`theme-${world.theme}`">
      <p class="portal-cap">{{ world.boss ? 'FINAL SHIFT' : 'TIME SHIFT' }}</p>
      <div class="portal-ring"><span class="portal-year">{{ world.year }}</span></div>
      <p class="portal-name">{{ world.name }}</p>
      <p class="portal-note">현재의 내 통장 데이터를 그대로 가져갑니다</p>
    </section>

    <!-- 3 · 역사 + 조건 -->
    <section v-else-if="phase === 'condition'" class="phase">
      <button class="back" @click="goSelect">← 다른 세계 고르기</button>

      <div class="box history">
        <span class="tag">{{ world.boss ? '가상 복합 세계' : '실제 역사 배경' }}</span>
        <p class="b-title">{{ world.history.title }}</p>
        <p class="b-copy">{{ world.history.body }}</p>
        <p class="b-metric">{{ world.history.metric }}</p>
        <p class="b-src">{{ world.history.source }}</p>
        <p v-if="world.history.disclaimer" class="b-note">※ {{ world.history.disclaimer }}</p>
      </div>

      <!-- 일반 세계 : 강도 하나 -->
      <div v-if="!world.boss" class="box">
        <span class="tag assume">
          {{ selectedOption && selectedOption.real ? '실제 기록' : '가상 스트레스' }}
        </span>
        <p class="q">{{ world.stress.question }}</p>
        <div class="opt-row">
          <button
            v-for="opt in world.stress.options"
            :key="opt.key"
            class="opt"
            :class="{ on: selectedKey === opt.key }"
            @click="selectedKey = opt.key">
            <strong>{{ opt.label }}</strong>
            <span v-if="opt.note">{{ opt.note }}</span>
          </button>
        </div>
        <p class="b-note">{{ world.stress.note }}</p>
      </div>

      <!-- 기록 밖의 세계 : 축을 직접 조합 -->
      <div v-else class="box">
        <span class="tag assume">가상 스트레스</span>
        <p class="q">{{ world.combine.question }}</p>

        <div v-for="axis in world.combine.axes" :key="axis.key" class="axis">
          <button class="axis-head" @click="toggleAxis(axis.key)">
            <span class="a-check" :class="{ on: picked[axis.key] != null }">
              {{ picked[axis.key] != null ? '✓' : '' }}
            </span>
            <span class="a-name">{{ axis.label }}</span>
            <span v-if="picked[axis.key] != null" class="a-pick">
              {{ axis.steps[picked[axis.key]].label }}
            </span>
          </button>
          <div v-if="picked[axis.key] != null" class="axis-steps">
            <button
              v-for="(step, i) in axis.steps"
              :key="i"
              class="step"
              :class="{ on: picked[axis.key] === i }"
              @click="picked = { ...picked, [axis.key]: i }">
              {{ step.label }}
            </button>
          </div>
        </div>

        <p class="b-note">{{ world.combine.note }}</p>
      </div>

      <button class="primary" :disabled="calculating || !canApply" @click="applyShock">
        {{ calculating ? '적용 중...' : (canApply ? '이 조건으로 체험하기' : '충격을 두 개 이상 골라주세요') }}
      </button>
      <p v-if="loadError" class="error-line">{{ loadError }}</p>
    </section>

    <!-- 4 · 충격 적용 -->
    <section v-else-if="phase === 'apply'" class="phase apply" :class="`theme-${world.theme}`">
      <p class="apply-cap">SHOCK APPLYING</p>
      <p class="apply-title">충격을 내 통장에 적용하는 중</p>

      <div v-if="world.physics === 'SPREAD'" class="impact-list">
        <div
          v-for="(it, i) in result.categoryImpacts"
          :key="it.categoryName"
          class="impact-row" :class="{ shown: shown > i }">
          <span class="i-name">{{ it.categoryName }}</span>
          <span class="i-flow">{{ won(it.beforeAmount) }} → {{ won(it.afterAmount) }}</span>
          <span class="i-delta">+{{ Number(it.impact).toLocaleString() }}</span>
        </div>
      </div>

      <div v-else-if="world.physics === 'CUT'" class="cut-box">
        <p class="cut-label">등록 월소득</p>
        <div class="cut-bar"><span :style="{ width: cutWidth }"></span></div>
        <p class="cut-value">
          {{ won(result.monthlyIncome) }}
          <span class="arrow">→</span><b>{{ won(crisisIncome) }}</b>
        </p>
      </div>

      <div v-else-if="world.physics === 'HIT'" class="hit-box" :class="{ hit: shown > 0 }">
        <p class="hit-label">등록 계좌 잔액</p>
        <p class="hit-value">{{ won(result.balance) }}</p>
        <p class="hit-shock">− {{ won(oneTimeAmount) }}</p>
        <p class="hit-after">{{ won(result.postShockBalance) }}</p>
        <p v-if="fixedExpenseAmount > 0" class="hit-fixed" :class="{ shown: shown > 0 }">
          그리고 매달 {{ won(fixedExpenseAmount) }}이 계속 나갑니다
        </p>
      </div>

      <!-- 세 축이 가운데로 모인다 -->
      <div v-else class="converge">
        <div
          v-for="(line, i) in convergeLines"
          :key="line"
          class="conv-line" :class="{ shown: shown > i }">
          {{ line }}
        </div>
        <p class="conv-need" :class="{ shown: shown >= convergeLines.length }">
          6개월 필요자금 {{ won(result.stressNeed) }}
        </p>
      </div>
    </section>

    <!-- 5 · 결과 -->
    <section v-else-if="phase === 'result'" class="phase">
      <button class="back" @click="goSelect">← 다른 세계 고르기</button>

      <p class="r-world">{{ world.year }} · {{ world.name }}</p>
      <p class="r-cond">{{ result.appliedDescription }}</p>

      <div v-if="isBlocked" class="notice">
        <p class="n-title">{{ blockedTitle }}</p>
        <p class="n-body">{{ blockedBody }}</p>
      </div>

      <template v-else>
        <div class="gauge">
          <svg viewBox="0 0 400 196">
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#c94f3d"/>
                <stop offset="0.25" stop-color="#e08b2e"/>
                <stop offset="0.5" stop-color="#e8c33c"/>
                <stop offset="0.75" stop-color="#8fbf62"/>
                <stop offset="1" stop-color="#4a9d6e"/>
              </linearGradient>
            </defs>
            <path class="track" d="M76 168 A124 124 0 0 1 324 168"/>
            <path class="fill" :style="arcStyle" d="M76 168 A124 124 0 0 1 324 168"/>
            <text class="tick" x="60" y="192" text-anchor="middle">0</text>
            <text class="tick" x="200" y="22" text-anchor="middle">50</text>
            <text class="tick" x="340" y="192" text-anchor="middle">100</text>
            <line class="needle" :style="needleStyle" x1="200" y1="168" x2="200" y2="72"/>
            <circle class="hub" cx="200" cy="168" r="6"/>
          </svg>
        </div>

        <div class="score">
          <b>{{ display }}<i>점</i></b>
          <p class="s-cap">{{ stateCaption }}</p>
        </div>
        <p class="s-line">{{ stateLine }}</p>

        <div class="why">
          <h3>왜 이렇게 나왔나요?</h3>
          <div class="row">
            <span class="k">월 부족액</span>
            <span class="v">
              <template v-if="result.baselineGap != null && result.baselineGap > 0">
                {{ won(result.baselineGap) }} → <em>{{ won(result.monthlyGap) }}</em>
              </template>
              <template v-else-if="result.baselineGap != null">
                월 여유 {{ won(-result.baselineGap) }} → <em>{{ won(result.monthlyGap) }} 부족</em>
              </template>
              <template v-else>{{ won(result.monthlyGap) }}</template>
              <small>충격 전 → 충격 후</small>
            </span>
          </div>
          <div class="row">
            <span class="k">6개월 필요자금</span>
            <span class="v">{{ won(result.stressNeed) }}<small>한 번 나갈 돈 + 월 부족액 × 6</small></span>
          </div>
          <div class="row">
            <span class="k">등록 계좌 잔액</span>
            <span class="v">{{ won(result.balance) }}<small>{{ coverText }}</small></span>
          </div>
          <p class="note">
            이 충격이 6개월 지속된다고 가정했을 때 필요한 자금 중
            현재 잔액이 얼마나 충당할 수 있는지를 나타낸 점수입니다.
            계기판의 색은 0~100 사이를 연속으로 나타낸 것이며 등급 구분이 아닙니다.
          </p>
        </div>

        <button v-if="!showRecovery && canRedesign" class="solo" @click="showRecovery = true">
          내 소비 다시 설계하기
        </button>
        <div class="cta">
          <button @click="shareMode = 'result'">결과 공유</button>
          <button @click="goSelect">다른 세계</button>
        </div>

        <div v-if="showRecovery" class="rb">
          <h3>내 소비를 다시 설계해볼까요?</h3>
          <p class="rb-sub">적게 바꾸고 많이 되돌릴수록 좋은 설계입니다</p>

          <div class="eff">
            <div><span>바꾼 항목</span><b>{{ adjustedCount }}개</b></div>
            <div class="r">
              <span>{{ isCapped ? '버틸 수 있는 시간' : '되돌린 점수' }}</span>
              <b>{{ isCapped ? recoveryText : gainText }}</b>
            </div>
          </div>

          <div class="cats">
            <div
              v-for="opt in visibleOptions"
              :key="opt.categoryName"
              class="cat" :class="{ on: rates[opt.categoryName] > 0 }">
              <button class="cat-head" @click="toggleOpen(opt.categoryName)">
                <span class="c-main">
                  <b>{{ opt.categoryName }}</b>
                  <span>월 {{ won(opt.monthlyAmount) }}</span>
                </span>
                <span v-if="rates[opt.categoryName] > 0" class="c-rate">
                  {{ Math.round(rates[opt.categoryName] * 100) }}% 감소
                </span>
                <span v-else class="c-act">지출 조정하기</span>
              </button>

              <div v-if="openCat === opt.categoryName" class="cat-body">
                <p v-if="opt.categoryName === '주거·공과금'" class="c-info">
                  월세·관리비·공과금 등이 함께 포함될 수 있는 항목입니다.
                  현재 데이터에서는 개별 비용의 조정 가능 여부를 판단하지 않습니다.
                </p>
                <input
                  class="slider" type="range" min="0" max="100" step="5"
                  :value="Math.round((rates[opt.categoryName] || 0) * 100)"
                  @input="setRate(opt.categoryName, $event.target.value)">
                <div class="s-foot">
                  <b>{{ Math.round((rates[opt.categoryName] || 0) * 100) }}% 감소한다고 가정</b>
                  <span>조정 후 {{ won(opt.monthlyAmount * (1 - (rates[opt.categoryName] || 0))) }}</span>
                </div>
                <p v-if="rates[opt.categoryName] === 1" class="c-info">
                  계산상 이 카테고리 지출을 0원으로 둔 가정이며
                  실제 계약상 납부 의무는 반영하지 않습니다.
                </p>
              </div>
            </div>
          </div>

          <button v-if="rebalanceOptions.length > 5" class="more" @click="showAll = !showAll">
            {{ showAll ? '접기' : `다른 지출 ${rebalanceOptions.length - 5}개 보기` }}
          </button>

          <div class="cta">
            <button @click="shareMode = 'recovery'">회복 결과 공유</button>
            <button @click="goSelect">다른 세계</button>
          </div>
        </div>
      </template>

      <p class="foot-note">실제 소비·소득·잔액은 변경되지 않았습니다</p>
    </section>

    <!-- 공유 시트 -->
    <div v-if="shareMode" class="backdrop" @click.self="shareMode = ''">
      <div class="sheet">
        <header class="sh-head">
          <h3>{{ shareMode === 'recovery' ? '회복 결과 공유' : '결과 공유' }}</h3>
          <button @click="shareMode = ''">✕</button>
        </header>
        <div class="share-card">
          <p class="sc-y">{{ world.year }} · {{ world.label }}</p>
          <p class="sc-n">{{ world.name }}</p>
          <template v-if="shareMode === 'recovery'">
            <p class="sc-s" :class="{ small: isCapped }">{{ recoveryText }}</p>
            <p class="sc-m">바꾼 항목 {{ adjustedCount }}개 · {{ recoveryGain }}</p>
            <p class="sc-q">당신은 몇 개를 바꿔야<br>여기까지 올 수 있나요?</p>
          </template>
          <template v-else>
            <p class="sc-s">{{ display }}<i>점</i></p>
            <p v-if="display === 100 && marginText" class="sc-m">{{ marginText }}</p>
            <p class="sc-q">같은 충격이 오면<br>당신은 몇 점일까요?</p>
          </template>
          <p class="sc-lg">청년타파</p>
        </div>
        <p class="sh-warn">소득·잔액·지출 금액은 공유되지 않습니다</p>
        <button class="sh-done" @click="shareMode = ''">공유하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import stressApi from '@/api/stressApi';
import { WORLDS, mergeShock } from './stressWorlds';

const ARC = 389.6;

/** 이 개월 수를 넘으면 년 단위로 표기한다. 두 해가 넘어가면 개월이 읽기 어려워진다 */
const YEAR_THRESHOLD_MONTHS = 24;

const worlds = WORLDS;
const phase = ref('select');
const world = ref(null);
const selectedKey = ref('');
const result = ref(null);
const calculating = ref(false);
const loadError = ref('');

/** 이번 세션에서 체험한 세계와 점수. 서버에 저장하지 않는다 */
const visited = ref({});
const visitedShift = ref({});

/** 기록 밖의 세계에서 고른 축. 값은 steps 인덱스 */
const picked = ref({});

const shown = ref(0);
const display = ref(100);

/** 조정 전 상태. 회복을 비교하기 위한 기준 */
const shockScore = ref(100);
const shockMonths = ref(null);

const rates = ref({});
const openCat = ref('');
const showAll = ref(false);
const showRecovery = ref(false);
const shareMode = ref('');

let debounce = null;
let rafId = null;

const themeClass = computed(() => (world.value ? `theme-${world.value.theme}` : ''));

/** 해금은 역사 세계 셋만 센다 */
const visitedCount = computed(() =>
  Object.keys(visited.value).filter((c) => c !== 'CONVERGE').length);
const bossUnlocked = computed(() => visitedCount.value >= 3);

const selectedOption = computed(() =>
  world.value?.stress?.options.find((o) => o.key === selectedKey.value) || null);

/** 기록 밖의 세계는 서로 다른 축을 두 개 이상 골라야 한다 */
const canApply = computed(() => {
  if (!world.value) return false;
  if (!world.value.boss) return !!selectedOption.value;
  return Object.keys(picked.value).length >= 2;
});

const isBlocked = computed(() =>
  result.value?.spendingStatus === 'INSUFFICIENT_HISTORY'
  || result.value?.incomeStatus === 'NEEDS_USER_ASSUMPTION'
  || result.value?.balanceStatus === 'NO_ACCOUNT');

const blockedTitle = computed(() => {
  if (result.value?.spendingStatus === 'INSUFFICIENT_HISTORY') return '분석할 수 있는 기간이 없습니다';
  if (result.value?.balanceStatus === 'NO_ACCOUNT') return '등록된 계좌가 없습니다';
  return '소득 정보가 없습니다';
});

const blockedBody = computed(() => {
  if (result.value?.spendingStatus === 'INSUFFICIENT_HISTORY') return '소비 내역이 쌓이면 결과를 볼 수 있습니다';
  if (result.value?.balanceStatus === 'NO_ACCOUNT') return '계좌를 연결하면 얼마나 버틸 수 있는지 계산할 수 있습니다';
  return '마이페이지에서 월소득을 입력하면 결과를 볼 수 있습니다';
});

const stateCaption = computed(() => {
  const s = result.value?.state;
  if (s === 'NO_ADDITIONAL_SHOCK') return '이 조건은 적용되지 않았습니다';
  if (s === 'CASHFLOW_RESTORED') return '월 부족이 사라졌습니다';
  return '6개월 필요자금을 얼마나 충당하는지';
});

const stateLine = computed(() => {
  const s = result.value?.state;
  if (s === 'CASHFLOW_FLIP') return '매달 남던 돈이 이 세계에서는 부족으로 바뀌었습니다';
  if (s === 'IMMEDIATE_AND_RECURRING') return '당장 낼 돈도, 버틸 잔액도 없습니다';
  if (s === 'IMMEDIATE_SHORTFALL') return '당장 필요한 돈을 잔액으로 감당하지 못합니다';
  if (s === 'NO_BUFFER_FOR_DEFICIT') return '월 부족이 생겼지만 보완할 잔액이 없습니다';
  if (s === 'NO_ADDITIONAL_SHOCK') return '이미 해당하는 상태라 추가되는 충격이 없습니다';
  if (s === 'CASHFLOW_CLEAR') return '이 충격 후에도 매달 부족이 생기지 않습니다';
  if (s === 'CLEAR') return '이 충격의 6개월 필요자금을 전부 감당할 수 있습니다';
  return world.value?.line || '';
});

const coverText = computed(() => {
  const m = result.value?.coverageMonths;
  if (m == null) return '이 충격으로는 잔액이 줄지 않습니다';
  return `이 부족액이 계속되면 ${period(m)}`;
});

const marginText = computed(() => {
  const m = result.value?.coverageMonths;
  return m == null ? '' : `${period(m)} 여유`;
});

/** 점수가 상한에 걸려 있으면 회복을 점수 대신 시간으로 보여준다 */
const isCapped = computed(() => shockScore.value === 100);

const nowMonths = computed(() => {
  const m = result.value?.coverageMonths;
  return m == null ? null : Math.round(Number(m));
});

const gainMonths = computed(() => {
  if (shockMonths.value == null || nowMonths.value == null) return null;
  return nowMonths.value - shockMonths.value;
});

const recoveryText = computed(() => {
  if (result.value?.coverageMonths == null) return '월 부족이 사라졌습니다';
  if (!isCapped.value) return `${shockScore.value} → ${display.value}`;
  return `${period(shockMonths.value)} → ${period(nowMonths.value)}`;
});

const recoveryGain = computed(() => {
  if (result.value?.coverageMonths == null) return '더 이상 잔액이 줄지 않습니다';
  if (!isCapped.value) return `되돌린 점수 ${gainText.value}`;
  if (gainMonths.value == null || gainMonths.value <= 0) return '아직 변화가 없습니다';
  return gainMonths.value >= YEAR_THRESHOLD_MONTHS
    ? `약 ${Math.round(gainMonths.value / 12)}년 확보`
    : `약 ${gainMonths.value}개월 확보`;
});

const arcStyle = computed(() => ({
  strokeDasharray: ARC,
  strokeDashoffset: ARC * (1 - display.value / 100),
}));
const needleStyle = computed(() => ({
  transform: `rotate(${-90 + display.value * 1.8}deg)`,
}));

const crisisIncome = computed(() => {
  const income = Number(result.value?.monthlyIncome ?? 0);
  const spending = Number(result.value?.monthlySpending ?? 0);
  const gap = Number(result.value?.monthlyGap ?? 0);
  return Math.min(Math.max(spending - gap, 0), income);
});
const cutWidth = computed(() => {
  const income = Number(result.value?.monthlyIncome ?? 0);
  return income ? `${Math.max(0, (crisisIncome.value / income) * 100)}%` : '0%';
});
const oneTimeAmount = computed(() =>
  Number(result.value?.balance ?? 0) - Number(result.value?.postShockBalance ?? 0));

/** 카테고리에 걸리지 않고 매달 더해지는 금액. 치료가 이어지는 경우다 */
const fixedExpenseAmount = computed(() => {
  if (!world.value || world.value.boss) return 0;
  return selectedOption.value?.shock?.fixedExpense ?? 0;
});

/** 복합 세계에서 각 축이 얼마를 만들었는지 */
const convergeLines = computed(() => {
  if (!result.value) return [];
  const lines = [];
  const impacts = result.value.categoryImpacts ?? [];
  const spread = impacts.reduce((s, i) => s + Number(i.impact), 0);
  if (spread > 0) lines.push(`생활물가 상승  월 +${spread.toLocaleString()}원`);
  const incomeCut = Number(result.value.monthlyIncome ?? 0) - crisisIncome.value;
  if (incomeCut > 0) lines.push(`소득 감소  월 −${incomeCut.toLocaleString()}원`);
  if (oneTimeAmount.value > 0) lines.push(`의료비  한 번에 ${oneTimeAmount.value.toLocaleString()}원`);
  return lines;
});

const rebalanceOptions = computed(() => result.value?.rebalanceOptions ?? []);
const canRedesign = computed(() => rebalanceOptions.value.length > 0);

/** 조정 중인 항목은 접어도 계속 보인다 */
const visibleOptions = computed(() => {
  const list = rebalanceOptions.value;
  if (showAll.value) return list;
  return list.filter((o, i) => i < 5 || rates.value[o.categoryName] > 0);
});

const adjustedCount = computed(() => Object.keys(rates.value).length);
const gainText = computed(() => {
  const g = (result.value?.score ?? 0) - shockScore.value;
  return (g >= 0 ? '+' : '') + g;
});

function won(v) {
  if (v == null) return '알 수 없음';
  return `${Math.round(Number(v)).toLocaleString()}원`;
}

/**
 * 개월 수를 사람이 읽는 표기로 바꾼다
 * 두 해가 넘어가면 개월보다 년이 읽기 쉬우므로 단위를 바꾼다.
 * 반올림한 값이므로 항상 '약'을 붙인다.
 */
function period(months) {
  if (months == null) return null;
  const m = Math.round(Number(months));
  if (m < YEAR_THRESHOLD_MONTHS) return `약 ${m}개월`;
  return `약 ${Math.round(m / 12)}년`;
}

/** 점수를 굴린다. 뒤로 갈수록 느려지게 해서 멈추는 순간을 강조한다 */
function animateScore(from, to) {
  if (rafId) cancelAnimationFrame(rafId);
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / 1100, 1);
    const e = 1 - Math.pow(1 - p, 2.4);
    display.value = Math.round(from + (to - from) * e);
    if (p < 1) rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

function goSelect() {
  phase.value = 'select';
  result.value = null;
  rates.value = {};
  picked.value = {};
  openCat.value = '';
  showAll.value = false;
  showRecovery.value = false;
  shareMode.value = '';
}

function enterWorld(target) {
  if (target.boss && !bossUnlocked.value) return;
  world.value = target;
  picked.value = {};
  selectedKey.value = target.boss ? '' : target.stress.options[0].key;
  loadError.value = '';
  phase.value = 'shift';

  // 첫 방문은 콘텐츠지만 반복되면 로딩처럼 느껴지므로 짧게 넘긴다
  const duration = visitedShift.value[target.code] ? 400 : 1000;
  visitedShift.value[target.code] = true;
  setTimeout(() => {
    if (phase.value === 'shift') phase.value = 'condition';
  }, duration);
}

/** 축을 켜고 끈다. 처음 켤 때는 가운데 강도로 시작한다 */
function toggleAxis(key) {
  const next = { ...picked.value };
  if (next[key] != null) delete next[key];
  else next[key] = 1;
  picked.value = next;
}

function toggleOpen(name) {
  openCat.value = openCat.value === name ? '' : name;
}

/** 화면이 서버로 보낼 충격 값을 만든다 */
function buildShock() {
  if (!world.value.boss) {
    return { ...selectedOption.value.shock, stageLabel: selectedOption.value.label };
  }
  const shocks = [];
  const labels = [];
  world.value.combine.axes.forEach((axis) => {
    const i = picked.value[axis.key];
    if (i == null) return;
    shocks.push(axis.steps[i].shock);
    labels.push(`${axis.label} ${axis.steps[i].label}`);
  });
  return { ...mergeShock(shocks), stageLabel: labels.join(' · ') };
}

function buildAdjustments() {
  return Object.keys(rates.value).map((name) => ({
    categoryName: name,
    reductionRate: rates.value[name],
  }));
}

/** 슬라이더는 자주 움직이므로 잠깐 모았다가 서버에 보낸다 */
function setRate(name, percent) {
  const v = Number(percent) / 100;
  const next = { ...rates.value };
  if (v === 0) delete next[name];
  else next[name] = v;
  rates.value = next;

  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(recalculate, 300);
}

async function applyShock() {
  if (!canApply.value) return;

  calculating.value = true;
  loadError.value = '';
  rates.value = {};
  openCat.value = '';
  showAll.value = false;
  showRecovery.value = false;
  shown.value = 0;

  try {
    result.value = await stressApi.getResult({
      worldCode: world.value.code,
      ...buildShock(),
      adjustments: [],
    });
    shockScore.value = result.value.score ?? 100;
    display.value = 100;
    phase.value = 'apply';
    runShockAnimation();
  } catch (e) {
    loadError.value = '결과를 계산하지 못했습니다';
  } finally {
    calculating.value = false;
  }
}

async function recalculate() {
  if (!world.value) return;
  try {
    const before = display.value;
    result.value = await stressApi.getResult({
      worldCode: world.value.code,
      ...buildShock(),
      adjustments: buildAdjustments(),
    });
    animateScore(before, result.value.score ?? 100);
  } catch (e) {
    loadError.value = '결과를 다시 계산하지 못했습니다';
  }
}

/** 세계마다 충격이 적용되는 방식이 다르다 */
function runShockAnimation() {
  const physics = world.value.physics;

  if (physics === 'SPREAD') {
    const impacts = result.value.categoryImpacts ?? [];
    impacts.forEach((_, i) => {
      setTimeout(() => { shown.value = i + 1; }, 150 + i * 200);
    });
    setTimeout(showResult, 400 + impacts.length * 200);
  } else if (physics === 'CONVERGE') {
    const n = convergeLines.value.length;
    for (let i = 0; i <= n; i += 1) {
      setTimeout(() => { shown.value = i + 1; }, 120 + i * 220);
    }
    setTimeout(showResult, 500 + n * 220);
  } else if (physics === 'CUT') {
    setTimeout(() => { shown.value = 1; }, 200);
    setTimeout(showResult, 1100);
  } else {
    setTimeout(() => { shown.value = 1; }, 300);
    setTimeout(showResult, 1300);
  }
}

function showResult() {
  phase.value = 'result';
  const target = result.value?.score ?? 100;
  animateScore(100, target);

  // 조정 전 상태를 기록해 회복을 비교한다
  shockMonths.value = result.value?.coverageMonths == null
    ? null : Math.round(Number(result.value.coverageMonths));

  if (result.value?.score != null) {
    visited.value = { ...visited.value, [world.value.code]: target };
  }
}
</script>

<style scoped>
.stress-page { padding-bottom: 100px; }
.phase { animation: fade .3s ease both; }
@keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.theme-amber { --world: #d99b2b; }
.theme-steel { --world: #6e7480; }
.theme-sepia { --world: #8a7355; }
.theme-violet { --world: #7f77dd; }

.eyebrow { font-size: 12px; font-weight: 800; letter-spacing: .1em; color: var(--color-text-muted); margin: 0 0 6px; }
.page-title { font-size: 26px; font-weight: 700; margin: 0 0 5px; }
.page-sub { font-size: 15px; color: var(--color-text-muted); line-height: 1.6; margin: 0 0 18px; }
.progress { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
.dots { display: flex; gap: 5px; }
.dot { width: 26px; height: 5px; border-radius: 99px; background: #ddd8cc; }
.dot.on { background: var(--color-primary); }
.progress small { font-size: 12px; font-weight: 700; color: var(--color-text-muted); }

.world-list { display: flex; flex-direction: column; gap: 11px; }
.world-card {
  position: relative; display: flex; flex-direction: column; gap: 3px;
  width: 100%; padding: 17px 19px; text-align: left; cursor: pointer;
  border: 1px solid var(--color-border); border-radius: 16px;
  background: var(--color-surface); overflow: hidden;
}
.world-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--world); }
.world-card.locked { background: #f1efe8; border-style: dashed; cursor: default; }
.w-year { font-size: 12px; color: var(--color-text-muted); }
.w-label { font-size: 11px; font-weight: 800; letter-spacing: .12em; color: var(--world); }
.w-name { font-size: 20px; font-weight: 700; margin-top: 3px; }
.w-desc { font-size: 13px; color: var(--color-text-muted); }
.w-go { margin-top: 11px; font-size: 14px; font-weight: 700; }
.w-done { margin-top: 11px; font-size: 13px; font-weight: 700; color: var(--world); }
.w-lock { margin-top: 11px; font-size: 12px; color: var(--color-text-muted); }
.lockbar { display: block; height: 5px; border-radius: 99px; background: #ddd8cc; margin-bottom: 7px; }
.lockbar i { display: block; height: 100%; background: #a8a296; border-radius: 99px; }

.portal { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.portal-cap { font-size: 12px; letter-spacing: .2em; color: var(--world); font-weight: 800; margin: 0; }
.portal-ring { width: 180px; height: 180px; border-radius: 50%; margin: 30px 0; display: grid; place-items: center; position: relative; border: 1px solid var(--color-border); }
.portal-ring::before { content: ''; position: absolute; inset: 12px; border-radius: 50%; border: 1px dashed var(--world); animation: spin 4s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.portal-year { font-size: 40px; font-weight: 800; }
.portal-name { font-size: 19px; font-weight: 700; margin: 0; }
.portal-note { font-size: 14px; color: var(--color-text-muted); margin: 10px 0 0; }

.back { background: none; border: 0; padding: 0 0 14px; font-size: 14px; color: var(--color-text-muted); cursor: pointer; }
.box { border: 1px solid var(--color-border); border-radius: 16px; padding: 18px; background: var(--color-surface); margin-bottom: 11px; }
.box.history { background: #f2efe7; border-left: 4px solid var(--world); }
.tag { display: inline-block; font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: 6px; background: #e8e4da; color: #6d675c; }
.tag.assume { background: #fff4d6; color: #8a6a10; }
.b-title { font-size: 19px; font-weight: 700; margin: 11px 0 5px; }
.b-copy { font-size: 14px; color: var(--color-text-muted); line-height: 1.6; margin: 0; }
.b-metric { font-size: 16px; font-weight: 700; margin: 11px 0 0; }
.b-src { font-size: 12px; color: var(--color-text-muted); margin: 3px 0 0; }
.b-note { font-size: 12px; color: var(--color-text-muted); margin: 11px 0 0; line-height: 1.7; }
.q { font-size: 16px; font-weight: 600; margin: 12px 0 13px; }
.opt-row { display: flex; gap: 8px; flex-wrap: wrap; }
.opt { flex: 1; min-width: 96px; padding: 14px 8px; cursor: pointer; border: 1px solid var(--color-border); border-radius: 12px; background: var(--color-surface); }
.opt.on { border-color: var(--color-primary); background: #fffdf4; box-shadow: 0 0 0 2px #ffbc0026; }
.opt strong { display: block; font-size: 15px; font-weight: 700; }
.opt span { display: block; font-size: 12px; color: var(--color-text-muted); margin-top: 3px; }

.axis { border: 1px solid var(--color-border); border-radius: 13px; margin-bottom: 8px; overflow: hidden; }
.axis-head { display: flex; align-items: center; gap: 10px; width: 100%; padding: 13px 15px; border: 0; background: none; text-align: left; cursor: pointer; }
.a-check { width: 20px; height: 20px; border-radius: 6px; border: 1px solid var(--color-border); display: grid; place-items: center; font-size: 12px; color: #fff; }
.a-check.on { background: var(--color-primary); border-color: var(--color-primary); color: #2e2a24; font-weight: 800; }
.a-name { flex: 1; font-size: 15px; }
.a-pick { font-size: 13px; font-weight: 700; color: #c79400; }
.axis-steps { display: flex; gap: 6px; padding: 0 15px 14px; }
.step { flex: 1; padding: 10px 4px; font-size: 13px; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-surface); cursor: pointer; }
.step.on { border-color: var(--color-primary); background: #fffdf4; font-weight: 700; }

.primary { width: 100%; margin-top: 16px; padding: 16px; border: 0; border-radius: 12px; background: var(--color-text-primary); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; }
.primary:disabled { opacity: .4; }

.apply { min-height: 50vh; padding-top: 40px; }
.apply-cap { font-size: 12px; letter-spacing: .2em; color: var(--world); font-weight: 800; margin: 0 0 8px; text-align: center; }
.apply-title { font-size: 19px; font-weight: 700; text-align: center; margin: 0 0 26px; }
.impact-list { display: flex; flex-direction: column; gap: 9px; }
.impact-row { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-surface); opacity: 0; transform: translateY(6px); transition: all .25s; }
.impact-row.shown { opacity: 1; transform: none; }
.i-name { flex: 1; font-size: 15px; }
.i-flow { font-size: 12px; color: var(--color-text-muted); }
.i-delta { font-size: 15px; font-weight: 700; color: var(--color-danger); }

.cut-box { text-align: center; padding: 24px 0; }
.cut-label { font-size: 14px; color: var(--color-text-muted); margin: 0 0 12px; }
.cut-bar { height: 18px; border-radius: 9px; background: #efece4; overflow: hidden; }
.cut-bar span { display: block; height: 100%; width: 100%; background: var(--world); transition: width .8s cubic-bezier(.4,0,.2,1); }
.cut-value { font-size: 18px; margin: 16px 0 0; }
.arrow { margin: 0 8px; color: var(--color-text-muted); }

.hit-box { text-align: center; padding: 24px 0; }
.hit-box.hit { animation: shake .4s; }
@keyframes shake { 25% { transform: translateX(-6px); } 50% { transform: translateX(6px); } 75% { transform: translateX(-3px); } }
.hit-label { font-size: 14px; color: var(--color-text-muted); margin: 0; }
.hit-value { font-size: 24px; font-weight: 700; margin: 8px 0; }
.hit-shock { font-size: 20px; color: var(--color-danger); font-weight: 700; margin: 8px 0; }
.hit-after { font-size: 30px; font-weight: 800; margin: 8px 0 0; }
.hit-fixed { font-size: 14px; color: var(--color-danger); margin: 16px 0 0; opacity: 0; transition: opacity .5s .5s; }
.hit-fixed.shown { opacity: 1; }

.converge { text-align: center; }
.conv-line { font-size: 16px; font-weight: 600; padding: 11px 0; opacity: 0; transform: translateY(8px); transition: all .3s; }
.conv-line.shown { opacity: 1; transform: none; }
.conv-need { font-size: 22px; font-weight: 800; margin: 18px 0 0; padding-top: 16px; border-top: 1px solid var(--color-border); opacity: 0; transition: opacity .4s; }
.conv-need.shown { opacity: 1; }

.r-world { font-size: 13px; color: var(--color-text-muted); margin: 0; }
.r-cond { font-size: 15px; font-weight: 600; margin: 4px 0 0; line-height: 1.5; }

.gauge { width: 90%; max-width: 344px; margin: 12px auto 0; }
.gauge svg { width: 100%; height: auto; display: block; }
.track { fill: none; stroke: #eae6dc; stroke-width: 11; stroke-linecap: round; }
.fill { fill: none; stroke: url(#arcGrad); stroke-width: 11; stroke-linecap: round; }
.tick { fill: #a8a296; font-size: 12px; font-weight: 600; }
.needle { stroke: var(--color-text-primary); stroke-width: 3; stroke-linecap: round; transform-origin: 200px 168px; }
.hub { fill: var(--color-text-primary); }

.score { text-align: center; margin-top: 4px; }
.score b { display: block; font-size: 50px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
.score b i { font-style: normal; font-size: 19px; font-weight: 700; color: var(--color-text-muted); margin-left: 3px; }
.s-cap { font-size: 12px; color: var(--color-text-muted); margin: 4px 0 0; }
.s-line { font-size: 13px; color: #5b564e; text-align: center; margin: 9px 0 0; line-height: 1.55; }

.why { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 14px; padding: 14px 15px; margin-top: 13px; }
.why h3 { font-size: 14px; font-weight: 700; margin: 0 0 9px; }
.row { display: flex; align-items: baseline; justify-content: space-between; padding: 6px 0; }
.row + .row { border-top: 1px solid #f4f1e9; }
.row .k { font-size: 13px; color: #5b564e; }
.row .v { font-size: 14px; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
.row .v em { font-style: normal; color: var(--color-danger); }
.row .v small { display: block; font-size: 11px; font-weight: 400; color: var(--color-text-muted); margin-top: 2px; }
.note { font-size: 11px; color: var(--color-text-muted); line-height: 1.65; margin: 10px 0 0; padding-top: 9px; border-top: 1px solid #f4f1e9; }

.solo { width: 100%; padding: 14px; border: 0; border-radius: 12px; background: var(--color-primary); color: #2e2a24; font-size: 16px; font-weight: 800; margin-top: 12px; cursor: pointer; }
.cta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
.cta button { padding: 13px 8px; border: 1px solid var(--color-border); border-radius: 12px; background: var(--color-surface); font-size: 15px; cursor: pointer; }

.rb { margin-top: 24px; }
.rb h3 { font-size: 17px; font-weight: 700; margin: 0 0 3px; }
.rb-sub { font-size: 13px; color: var(--color-text-muted); margin: 0 0 12px; }
.eff { display: flex; justify-content: space-between; align-items: center; padding: 13px 16px; border-radius: 12px; background: var(--color-text-primary); color: #fff; margin-bottom: 11px; gap: 12px; }
.eff span { display: block; font-size: 11px; color: #c9c4b8; }
.eff b { display: block; font-size: 17px; font-weight: 800; margin-top: 2px; }
.eff .r { text-align: right; }
.eff .r b { color: var(--color-primary); }

.cats { display: flex; flex-direction: column; gap: 9px; }
.cat { border: 1px solid var(--color-border); border-radius: 13px; background: var(--color-surface); overflow: hidden; }
.cat.on { border-color: var(--color-primary); }
.cat-head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; border: 0; background: none; text-align: left; cursor: pointer; }
.c-main { flex: 1; }
.c-main b { display: block; font-size: 15px; font-weight: 600; }
.c-main span { display: block; font-size: 12px; color: var(--color-text-muted); margin-top: 1px; }
.c-rate { font-size: 14px; font-weight: 800; color: #c79400; }
.c-act { font-size: 13px; color: var(--color-text-muted); }
.cat-body { padding: 0 16px 15px; }
.c-info { font-size: 11px; color: var(--color-text-muted); line-height: 1.6; margin: 0 0 11px; }
.slider { width: 100%; accent-color: var(--color-primary); }
.s-foot { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; }
.s-foot span { color: var(--color-text-muted); }
.more { width: 100%; margin-top: 9px; padding: 12px; border: 1px solid var(--color-border); border-radius: 12px; background: transparent; font-size: 14px; color: var(--color-text-muted); cursor: pointer; }

.notice { padding: 30px 18px; border-radius: 14px; background: #faf8f3; text-align: center; margin-top: 16px; }
.n-title { font-size: 17px; font-weight: 700; margin: 0 0 8px; }
.n-body { font-size: 15px; color: var(--color-text-muted); margin: 0; }
.foot-note { font-size: 13px; color: var(--color-text-muted); text-align: center; margin: 22px 0 0; }
.error-line { font-size: 15px; color: var(--color-danger); margin: 14px 0 0; }

.backdrop { position: fixed; inset: 0; z-index: 1000; background: #00000070; display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: 100%; max-width: 480px; background: var(--color-surface); border-radius: 20px 20px 0 0; padding-bottom: 20px; animation: up .25s ease; }
@keyframes up { from { transform: translateY(26px); } to { transform: none; } }
.sh-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 18px 12px; border-bottom: 1px solid var(--color-border); }
.sh-head h3 { margin: 0; font-size: 17px; font-weight: 700; }
.sh-head button { border: 0; background: none; font-size: 18px; color: var(--color-text-muted); cursor: pointer; }
.share-card { margin: 16px 18px 12px; border-radius: 16px; padding: 24px 20px; text-align: center; background: linear-gradient(150deg, #2e2a24, #4a4438); color: #fff; }
.sc-y { font-size: 11px; font-weight: 800; letter-spacing: .13em; color: var(--color-primary); margin: 0; }
.sc-n { font-size: 17px; font-weight: 700; margin: 5px 0 18px; }
.sc-s { font-size: 46px; font-weight: 800; line-height: 1; margin: 0; }
.sc-s.small { font-size: 26px; line-height: 1.35; }
.sc-s i { font-style: normal; font-size: 17px; color: #c9c4b8; margin-left: 3px; }
.sc-m { font-size: 12px; color: #c9c4b8; margin: 6px 0 0; }
.sc-q { font-size: 13px; font-weight: 600; margin: 18px 0 0; line-height: 1.6; }
.sc-lg { font-size: 10px; color: #a9a396; margin: 12px 0 0; letter-spacing: .1em; }
.sh-warn { font-size: 11px; color: var(--color-text-muted); text-align: center; margin: 0 18px 12px; line-height: 1.6; }
.sh-done { display: block; width: calc(100% - 36px); margin: 0 18px; padding: 14px; border: 0; border-radius: 12px; background: var(--color-text-primary); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
</style>
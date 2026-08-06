<template>
  <div class="engine-page">

    <!-- 로딩 -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p class="state-text">내 조건에 맞는 조합을 찾는 중이에요</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="loadError" class="state-box">
      <p class="state-text">{{ loadError }}</p>
      <KbButton type="secondary" size="small" @click="load">다시 시도</KbButton>
    </div>

    <!-- 프로필 미입력 -->
    <KbCard v-else-if="isProfileRequired" class="text-center">
      <h3 class="empty-title">프로필을 먼저 입력해주세요</h3>
      <p class="empty-desc">아래 정보가 있어야 맞춤 조합을 만들 수 있어요.</p>
      <div class="chip-wrap justify-center">
        <span v-for="f in result.missingFields" :key="f" class="chip chip-need">
          {{ fieldLabel(f) }}
        </span>
      </div>
      <KbButton class="mt-3" @click="goProfile">프로필 입력하러 가기</KbButton>
    </KbCard>

    <template v-else-if="isOk">

      <!-- 제목 -->
      <header class="page-head">
        <h2 class="page-title">내 조건에 맞는 최적 조합</h2>
        <p class="page-sub">함께 신청해도 문제없는 정책만 골랐어요</p>
      </header>

      <!-- 히어로 : 이 화면이 한 일 -->
      <KbCard yellow-bg class="hero">
        <p class="hero-line">
          자격 조건을 통과한 <strong>{{ result.benefits.length }}개</strong> 중
        </p>
        <p class="hero-main">
          함께 신청할 수 있는 <strong>{{ combinationSize }}개</strong>
        </p>

        <div class="hero-meta">
          <span>서로 다른 {{ combination?.distinctCategoryCount }}개 생활 영역</span>
          <span class="dot">·</span>
          <span :class="hasConflict ? 'text-warn' : ''">
            {{ hasConflict ? `확인할 사항 ${allWarningCount}건` : '중복수혜 충돌 없음' }}
          </span>
        </div>

        <button class="link-toggle" @click="showProfile = !showProfile">
          {{ showProfile ? '적용된 조건 접기' : '적용된 조건 보기' }}
          <span class="caret">{{ showProfile ? '▴' : '▾' }}</span>
        </button>

        <div v-if="showProfile" class="chip-wrap">
          <span v-for="c in appliedConditions" :key="c" class="chip">{{ c }}</span>
        </div>
      </KbCard>

      <!-- 추천 정책 -->
      <section v-if="combination" class="section">
        <h3 class="section-title">추천 정책</h3>

        <KbCard v-for="(b, i) in combination.benefits" :key="b.benefitNo" class="policy">
          <template #top>
            <div class="policy-top">
              <div class="policy-top-left">
                <span class="rank">{{ i + 1 }}</span>
                <KbBadge variant="gray">{{ categoryName(b.categoryCode) }}</KbBadge>
              </div>
              <KbBadge :variant="deadlineVariant(b)">{{ deadlineText(b) }}</KbBadge>
            </div>
          </template>

          <h4 class="policy-name">{{ b.plcyNm }}</h4>
          <p class="policy-meta">{{ incomeText(b) }}</p>

          <p v-if="b.earnCndSeCd === '0043003' && b.earnEtcCn" class="policy-note">
            소득 조건 원문 · {{ b.earnEtcCn }}
          </p>

          <div v-if="warningFor(b.benefitNo)" class="policy-warn">
            <strong>{{ warningFor(b.benefitNo).conflictType }}</strong>
            {{ warningFor(b.benefitNo).ruleText }}
          </div>

          <div class="policy-actions">
            <button class="link-toggle" @click="toggleDetail(b.benefitNo)">
              조건 상세
              <span class="caret">{{ openDetails[b.benefitNo] ? '▴' : '▾' }}</span>
            </button>
            <KbButton size="small" @click="openApply(b)">신청하기 ↗</KbButton>
          </div>

          <ul v-if="openDetails[b.benefitNo]" class="detail-list">
            <li v-for="d in b.scoreDetail" :key="d">{{ d }}</li>
          </ul>
        </KbCard>
      </section>

      <!-- 함께 신청할 때 확인할 것 -->
      <section v-if="hasConflict" class="section">
        <h3 class="section-title">함께 신청할 때 확인하세요</h3>

        <KbCard v-for="w in result.warnings" :key="'w-' + w.benefitNo" class="warn-card">
          <template #top>
            <KbBadge variant="danger">{{ w.conflictType }}</KbBadge>
          </template>
          <h4 class="warn-name">{{ w.plcyNm }}</h4>
          <p class="warn-text">{{ w.ruleText }}</p>
        </KbCard>

        <KbCard v-for="w in result.externalWarnings" :key="'e-' + w.benefitNo" class="warn-card">
          <template #top>
            <KbBadge variant="info">다른 제도</KbBadge>
          </template>
          <h4 class="warn-name">{{ w.plcyNm }}</h4>
          <p class="warn-text">{{ w.ruleText }}</p>
        </KbCard>
      </section>

      <!-- 다른 후보 -->
      <section class="section">
        <button class="more-btn" @click="showCandidates = !showCandidates">
          {{ showCandidates
             ? '다른 후보 접기'
             : `다른 후보 ${result.topBenefits.length}개 보기` }}
          <span class="caret">{{ showCandidates ? '▴' : '▾' }}</span>
        </button>

        <div v-if="showCandidates" class="candidate-list">
          <div v-for="b in result.topBenefits" :key="b.benefitNo" class="candidate">
            <div class="candidate-main">
              <KbBadge variant="gray">{{ categoryName(b.categoryCode) }}</KbBadge>
              <span class="candidate-name">{{ b.plcyNm }}</span>
            </div>
            <span class="candidate-dday">{{ deadlineText(b) }}</span>
          </div>
        </div>
      </section>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import engineApi from '@/api/engineApi';
import KbCard from '@/components/common/KbCard.vue';
import KbBadge from '@/components/common/KbBadge.vue';
import KbButton from '@/components/common/KbButton.vue';

const router = useRouter();

const CATEGORY = {
  1: '일자리', 2: '주거', 3: '교육', 4: '복지·문화', 5: '참여·권리',
};

const FIELD_LABEL = {
  birthDate: '생년월일',
  regionCode: '거주 지역',
  income: '소득',
  employStatus: '취업 상태',
  major: '전공',
  education: '학력',
  mrgSttsCd: '혼인 상태',
};

const loading = ref(false);
const loadError = ref('');
const result = ref(null);

const showProfile = ref(false);
const showCandidates = ref(false);
const openDetails = ref({});

const isProfileRequired = computed(() => result.value?.status === 'PROFILE_REQUIRED');
const isOk = computed(() => result.value?.status === 'OK');
const combination = computed(() => result.value?.recommendedCombinations?.[0] || null);
const combinationSize = computed(() => combination.value?.benefits.length ?? 0);

const allWarningCount = computed(() =>
    (result.value?.warnings?.length || 0) + (result.value?.externalWarnings?.length || 0));
const hasConflict = computed(() => allWarningCount.value > 0);

// 조합에 적용된 자격조건. 정책마다 같은 항목이 반복되므로 첫 정책 기준으로 뽑고
// 조회수·마감 같은 점수 항목은 조건이 아니라서 뺀다.
const appliedConditions = computed(() => {
  const first = combination.value?.benefits?.[0];
  if (!first) return [];
  return first.scoreDetail.filter((d) => d.includes('조건'));
});

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
      const data = await engineApi.getEligibleBenefits();
      console.log('엔진 응답', data.benefits[0]);
      result.value = data;
  } catch (e) {
    loadError.value = '추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function categoryName(code) {
  return CATEGORY[code] || '기타';
}

function fieldLabel(f) {
  return FIELD_LABEL[f] || f;
}

function daysLeft(b) {
  if (!b.applyEndDate) return null;
  return Math.ceil((new Date(b.applyEndDate) - Date.now()) / 86400000);
}

function deadlineText(b) {
  const d = daysLeft(b);
  if (d === null) return '상시 모집';
  if (d <= 0) return '오늘 마감';
  return `D-${d}`;
}

// 마감이 가까운 것만 붉게. 나머지는 회색으로 눌러 둔다.
function deadlineVariant(b) {
  const d = daysLeft(b);
  if (d !== null && d <= 7) return 'danger';
  return 'gray';
}

function incomeText(b) {
  if (b.earnCndSeCd === '0043001') return '소득 조건 없음';
  if (b.earnCndSeCd === '0043002') return '소득 기준 충족';
  if (b.earnCndSeCd === '0043003') return '소득 조건 별도 확인 필요';
  return '';
}

function warningFor(benefitNo) {
  return result.value?.warnings?.find((w) => w.benefitNo === benefitNo) || null;
}

function toggleDetail(benefitNo) {
  openDetails.value = { ...openDetails.value, [benefitNo]: !openDetails.value[benefitNo] };
}

// 온통청년 데이터가 지저분해서 그대로 쓰면 안 된다.
//   - 대부분 빈 문자열이고 NULL 이 아니다
//   - https:// 없이 www 로 시작하는 값이 많다
//   - '-', '전화문의' 처럼 링크가 아닌 값이 있다
//   - & 가 &amp; 로 저장돼 파라미터가 깨진다
//   - 앞뒤 공백이 붙은 값이 있다
function normalizeUrl(raw) {
  if (!raw) return null;

  const url = raw.trim().replace(/&amp;/g, '&');
  if (!url) return null;

  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('www.')) return `https://${url}`;

  return null;
}

// plcyNo 로 온통청년 주소를 만들지 않고, DB 에 저장된 실제 신청 URL 을 연다
function openApply(b) {
  const url = normalizeUrl(b.aplyUrlAddr);
  if (!url) return;

  window.open(url, '_blank', 'noopener');
}

function goProfile() {
  router.push('/mypage');
}

onMounted(load);
</script>

<style scoped>
/* 하단 탭바(80px)에 마지막 카드가 가리지 않도록 여백을 둔다 */
.engine-page {
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
  padding: 80px 0;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
}

/* ---- 제목 ---- */
.page-head {
  padding-top: 4px;
}

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

/* ---- 히어로 ---- */
.hero-line {
  margin: 0;
  font-size: 14px;
  color: #908980;
}

.hero-line strong {
  color: #2e2a24;
  font-weight: 600;
}

.hero-main {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #2e2a24;
  letter-spacing: -0.02em;
}

.hero-main strong {
  color: #c99400;
  font-size: 26px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 12.5px;
  color: #908980;
}

.hero-meta .dot { color: #d8d2c8; }
.text-warn { color: #b6964d; font-weight: 600; }

/* ---- 조건 칩 ---- */
.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.chip-wrap.justify-center { justify-content: center; }

.chip {
  padding: 5px 10px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #efece4;
  font-size: 12px;
  color: #6f6860;
}

.chip-need {
  background: #ffe8e8;
  border-color: #ffd4d4;
  color: #d64545;
  font-weight: 600;
}

/* ---- 섹션 ---- */
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

/* ---- 정책 카드 ---- */
.policy-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.policy-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 조합의 일부라는 것을 번호로 드러낸다 */
.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2e2a24;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

.policy-name {
  margin: 6px 0 0;
  font-size: 16.5px;
  font-weight: 700;
  color: #2e2a24;
  line-height: 1.4;
}

.policy-meta {
  margin: 0;
  font-size: 13px;
  color: #908980;
}

.policy-note {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f8f7f2;
  font-size: 12px;
  color: #6f6860;
  line-height: 1.5;
}

.policy-warn {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff8e6;
  font-size: 12.5px;
  color: #8a6d1f;
  line-height: 1.5;
}

.policy-warn strong {
  display: block;
  margin-bottom: 2px;
  font-weight: 700;
}

.policy-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.detail-list {
  margin: 4px 0 0;
  padding: 12px 14px;
  list-style: none;
  border-radius: 10px;
  background: #f8f7f2;
}

.detail-list li {
  font-size: 12.5px;
  color: #6f6860;
  padding: 3px 0;
}

/* ---- 공통 토글 ---- */
.link-toggle {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: #908980;
  cursor: pointer;
}

.link-toggle:hover { color: #2e2a24; }
.caret { font-size: 10px; margin-left: 2px; }

/* ---- 경고 카드 ---- */
.warn-name {
  margin: 4px 0 0;
  font-size: 14.5px;
  font-weight: 700;
  color: #2e2a24;
}

.warn-text {
  margin: 0;
  font-size: 13px;
  color: #6f6860;
  line-height: 1.55;
}

/* ---- 다른 후보 ---- */
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

.candidate-list {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #efece4;
  overflow: hidden;
}

.candidate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #f4f1ea;
}

.candidate:last-child { border-bottom: none; }

.candidate-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.candidate-name {
  font-size: 13px;
  color: #2e2a24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate-dday {
  flex-shrink: 0;
  font-size: 12px;
  color: #908980;
}

/* ---- 비어 있을 때 ---- */
.empty-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #2e2a24;
}

.empty-desc {
  margin: 0;
  font-size: 13px;
  color: #908980;
}

.mt-3 { margin-top: 12px; }
.text-center { text-align: center; align-items: center; }
</style>
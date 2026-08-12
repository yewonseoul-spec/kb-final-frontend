<template>
  <main class="benefit-detail-page">
    <section v-if="loading" class="state-box">
      혜택 정보를 불러오는 중이에요.
    </section>

    <section v-else-if="errorMessage" class="state-box error">
      <p>{{ errorMessage }}</p>

       <div class="empty-action">
      <KbButton @click="loadDetail">다시 불러오기</KbButton>
      </div>
    </section>

    <template v-else-if="detail">
      <article class="detail-card">
        <div class="detail-card-header">
          <div class="badge-list">
            <span v-if="regionLabel" class="detail-badge region">
              {{ regionLabel }}
            </span>

            <span class="detail-badge" :class="dDayClass">
              {{ dDayText }}
            </span>
          </div>
        </div>

        <h1 class="benefit-title">
          {{ detail.plcyNm }}
        </h1>

        <p v-if="summaryText" class="benefit-summary">
          {{ summaryText }}
        </p>

        <dl class="summary-info-list">
          <div class="summary-info-row">
            <dt>운영기관</dt>
            <dd>
              {{ detail.sprvsnInstCdNm || '-' }}
            </dd>
          </div>

          <div class="summary-info-row">
            <dt>신청기간</dt>
            <dd>
              {{ applicationPeriod }}
            </dd>
          </div>
        </dl>

        <section class="detail-section">
          <h2>지원 대상</h2>

          <p class="pre-line">
            {{ targetText }}
          </p>
        </section>

        <section class="detail-section">
          <h2>지원 내용</h2>

          <p class="pre-line">
            {{ supportText }}
          </p>
        </section>

        <section class="detail-section">
          <h2>신청 방법</h2>

          <p class="pre-line">
            {{ applyMethodText }}
          </p>
        </section>

        <section
          v-if="showAdditionalInfo"
          class="detail-section additional-info"
        >
          <h2>세부 조건</h2>

          <dl class="condition-list">
            <div v-if="ageText">
              <dt>연령</dt>
              <dd>{{ ageText }}</dd>
            </div>

            <div v-if="majorLabel">
              <dt>전공</dt>
              <dd>{{ majorLabel }}</dd>
            </div>

            <div v-if="schoolLabel">
              <dt>학력</dt>
              <dd>{{ schoolLabel }}</dd>
            </div>

            <div v-if="jobLabel">
              <dt>취업 상태</dt>
              <dd>{{ jobLabel }}</dd>
            </div>

            <div v-if="detail.earnEtcCn">
              <dt>소득 조건</dt>
              <dd class="pre-line">
                {{ detail.earnEtcCn }}
              </dd>
            </div>

            <div v-if="detail.sbmsnDcmntCn">
              <dt>제출 서류</dt>
              <dd class="pre-line">
                {{ detail.sbmsnDcmntCn }}
              </dd>
            </div>
          </dl>
        </section>
      </article>

      <p
        v-if="addMessage"
        class="add-message"
        :class="{ 'is-error': addFailed }"
      >
        {{ addMessage }}
      </p>

      <div class="detail-action-bar">
        <button
          type="button"
          class="detail-button secondary"
          :disabled="isAdding || isAdded"
          @click="addToApplied"
        >
          {{ addButtonText }}
        </button>

        <!-- [상호] 2026-08-07 : detail.aplyUrlAddr 대신 applyUrl 을 본다.
             값의 존재만 보면 열리지 않는 주소에도 버튼이 활성화된다. -->
        <button
          type="button"
          class="detail-button primary"
          :disabled="!applyUrl"
          @click="moveToApplyPage"
        >
         {{ applyButtonText }}
        </button>
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';

import { useRoute } from 'vue-router';

import { getBenefitDetail } from '@/api/benefitApi';

import mypageApi from '@/api/mypageApi';
import KbButton from '@/components/common/KbButton.vue';

const route = useRoute();

const detail = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const showAdditionalInfo = ref(false);
const isAdded = ref(false);
const addFailed = ref(false);
const isAdding = ref(false);
const addMessage = ref('');

const benefitNo = computed(() => {
  return Number(route.params.benefitNo);
});

const formatDate = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  return String(dateValue).replaceAll('-', '.');
};

const applicationPeriod = computed(() => {
  const startDate = detail.value?.applyStartDate;
  const endDate = detail.value?.applyEndDate;

  if (startDate && endDate) {
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  }

  if (detail.value?.aplyYmd) {
    return detail.value.aplyYmd;
  }

  if (detail.value?.benefitStatus === 'ALWAYS') {
    return '상시 신청';
  }

  return '신청 기간 별도 확인';
});

const getRemainingDays = () => {
  const endDateValue = detail.value?.applyEndDate;

  if (!endDateValue) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  const difference = endDate.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
};

const dDayText = computed(() => {
  if (detail.value?.benefitStatus === 'ALWAYS') {
    return '상시';
  }

  if (detail.value?.benefitStatus === 'CLOSED') {
    return '마감';
  }

  const remainingDays = getRemainingDays();

  if (remainingDays === null) {
    return '기간 확인';
  }

  if (remainingDays < 0) {
    return '마감';
  }

  if (remainingDays === 0) {
    return 'D-Day';
  }

  return `D-${remainingDays}`;
});

const dDayClass = computed(() => {
  if (dDayText.value === '마감') {
    return 'closed';
  }

  if (dDayText.value === '상시') {
    return 'always';
  }

  const remainingDays = getRemainingDays();

  if (remainingDays !== null && remainingDays >= 0 && remainingDays <= 7) {
    return 'urgent';
  }

  return 'open';
});

const regionLabel = computed(() => {
  const names = detail.value?.regionNames ?? [];

  if (!names.length) {
    return '';
  }

  if (names.length === 1) {
    return names[0];
  }

  const firstName = names[0];

  return `${firstName} 외 ${names.length - 1}곳`;
});

const summaryText = computed(() => {
  return detail.value?.plcyExplnCn || detail.value?.targetDesc || '';
});

const targetText = computed(() => {
  if (detail.value?.targetDesc) {
    return detail.value.targetDesc;
  }

  const parts = [];

  if (ageText.value) {
    parts.push(ageText.value);
  }

  if (regionLabel.value) {
    parts.push(regionLabel.value);
  }

  if (jobLabel.value) {
    parts.push(jobLabel.value);
  }

  return parts.length
    ? parts.join(', ')
    : '지원 대상은 공고 내용을 확인해 주세요.';
});

const supportText = computed(() => {
  return detail.value?.plcySprtCn || '지원 내용은 공고 내용을 확인해 주세요.';
});

const applyMethodText = computed(() => {
  return (
    detail.value?.plcyAplyMthdCn || '신청 방법은 공고 내용을 확인해 주세요.'
  );
});

const applyButtonText = computed(() => {
  if (detail.value?.aplyUrlAddr?.trim()) {
    return "신청하러 가기";
  }

  if (detail.value?.refUrlAddr1?.trim()) {
    return "공고 확인하기";
  }

  return "신청 링크 없음";
});

const ageText = computed(() => {
  const minAge = detail.value?.sprtTrgtMinAge;

  const maxAge = detail.value?.sprtTrgtMaxAge;

  if (minAge == null && maxAge == null) {
    return '';
  }

  if (Number(minAge) === 0 && Number(maxAge) === 0) {
    return '연령 제한 없음';
  }

  if (minAge != null && maxAge != null) {
    return `만 ${minAge}세 ~ ${maxAge}세`;
  }

  if (minAge != null) {
    return `만 ${minAge}세 이상`;
  }

  return `만 ${maxAge}세 이하`;
});

const majorLabel = computed(() => {
  return (detail.value?.majorNames ?? []).join(', ');
});

const schoolLabel = computed(() => {
  return (detail.value?.schoolNames ?? []).join(', ');
});

const jobLabel = computed(() => {
  return (detail.value?.jobNames ?? []).join(', ');
});

/**
 * [상호] 2026-08-07 : 신청 링크 정리 추가
 *
 * 원본 aply_url_addr 에는 빈 문자열, 스킴 없는 주소('www.…'),
 * URL 이 아닌 값('전화문의', '-'), 앞뒤 공백이 섞여 있다.
 * 값의 존재만 보고 window.open 을 부르면 상대 경로로 해석돼 엉뚱한 곳으로 간다.
 * EngineResult.vue 의 normalizeUrl 과 같은 규칙으로 맞췄다.
 *
 * 서버(BenefitMapper.xml)가 관리자 지정 URL을 우선해 내려주므로
 * 여기서 걸러지는 것은 온통청년 원본뿐이다.
 */
const normalizeUrl = (value) => {
  const raw = (value || '').trim();

  if (!raw) {
    return '';
  }

  const decoded = raw.replace(/&amp;/g, '&');

  if (/^https?:\/\//i.test(decoded)) {
    return decoded;
  }

  if (/^www\./i.test(decoded)) {
    return `https://${decoded}`;
  }

  return '';
};

const applyUrl = computed(() => {
  // 1순위: 실제 신청 URL
  const aplyUrl = normalizeUrl(
    detail.value?.aplyUrlAddr
  );

  if (aplyUrl) {
    return aplyUrl;
  }

  // 2순위: 참고 URL
  return normalizeUrl(
    detail.value?.refUrlAddr1
  );
});

const loadDetail = async () => {
  if (!Number.isInteger(benefitNo.value) || benefitNo.value <= 0) {
    errorMessage.value = '잘못된 혜택 번호입니다.';

    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    detail.value = await getBenefitDetail(benefitNo.value);
  } catch (error) {
    console.error('혜택 상세 조회 실패:', error);

    errorMessage.value = '혜택 정보를 불러오지 못했어요.';
  } finally {
    loading.value = false;
  }
};

const addButtonText = computed(() => {
  if (isAdded.value) return '✓ 추가됨';
  if (isAdding.value) return '추가 중…';
  return '신청한 혜택 추가';
});

const addToApplied = async () => {
  if (isAdding.value || isAdded.value) return;
  isAdding.value = true;
  addMessage.value = '';
  addFailed.value = false;

  try {
    await mypageApi.createAppliedBenefit(Number(benefitNo.value));
    addMessage.value = '신청한 혜택에 추가했어요.';
    isAdded.value = true;
  } catch (error) {
    // 관심 혜택과 달리 멱등이 아니다. 409 는 오류가 아니라 '이미 있다'는 안내다.
    if (error.response?.status === 409) {
      addMessage.value = '이미 추가한 혜택이에요.';
      isAdded.value = true;
    } else if (error.response) {
      addMessage.value = '추가하지 못했어요. 잠시 후 다시 시도해 주세요.';
      addFailed.value = true;
    }
  } finally {
    isAdding.value = false;
  }
};


// [상호] 2026-08-07 : 원본값 대신 정리된 applyUrl 을 연다
const moveToApplyPage = () => {
  if (!applyUrl.value) {
    return;
  }

  window.open(applyUrl.value, '_blank', 'noopener,noreferrer');
};

watch(benefitNo, () => {
  loadDetail();
});

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.benefit-detail-page {
  min-height: 100%;
  padding: 0 8px 110px;
  background: #faf9f5;
  color: #2d2923;
}

.detail-card {
  padding: 22px 20px;
  border: 1px solid #e6e0d6;
  border-radius: 18px;
  background: #ffffff;
}

.detail-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 25px;
  padding: 0 11px;
  border-radius: 14px;
  background: #edf5ff;
  color: #0969da;
  font-size: 12px;
  font-weight: 700;
}

.detail-badge.category {
  background: #fff3d1;
  color: #8b6100;
}

.detail-badge.region {
  background: #f0eee9;
  color: #625c53;
}

.detail-badge.urgent {
  background: #ffe6e8;
  color: #ef4d59;
}

.detail-badge.closed {
  background: #efefef;
  color: #8a847b;
}

.detail-badge.always {
  background: #fff2cf;
  color: #9b6b00;
}

.benefit-title {
  margin: 10px 0 6px;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.35;
}

.benefit-summary {
  margin: 0 0 14px;
  color: #746e65;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-line;
}

.summary-info-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
}

.summary-info-row {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 10px;
}

.summary-info-row dt {
  color: #8b847a;
  font-size: 13px;
}

.summary-info-row dd {
  margin: 0;
  color: #4c463f;
  font-size: 13px;
  font-weight: 600;
}

.detail-section {
  margin-top: 27px;
}

.detail-section h2 {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 800;
}

.detail-section p {
  margin: 0;
  color: #6f685f;
  font-size: 14px;
  line-height: 1.65;
}

.pre-line {
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.condition-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
}

.condition-list > div {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 10px;
}

.condition-list dt {
  color: #8b847a;
  font-size: 13px;
}

.condition-list dd {
  margin: 0;
  color: #514b43;
  font-size: 13px;
  line-height: 1.55;
}

.add-message {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: #eaf3ff;
  color: #1769d2;
  font-size: 13.5px;
  font-weight: 600;
  text-align: center;
  word-break: keep-all;
}

.add-message.is-error {
  background: #fff0ee;
  color: #e34a3e;
}

.detail-action-bar {
  display: grid;
  grid-template-columns: 1fr 1.08fr;
  gap: 12px;
  margin-top: 24px;
}

.detail-button {
  height: 52px;
  border-radius: 15px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.detail-button.secondary {
  border: 1px solid #6f685e;
  background: #ffffff;
  color: #39342e;
}

.detail-button.primary {
  border: 0;
  background: #ffbc00;
  color: #27231d;
}

.detail-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.state-box {
  padding: 80px 20px;
  color: #8c857b;
  text-align: center;
}

.state-box.error button {
  margin-top: 15px;
}

.empty-action {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
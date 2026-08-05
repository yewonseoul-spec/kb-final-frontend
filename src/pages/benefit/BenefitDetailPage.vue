<template>
  <main class="benefit-detail-page">
    <section
      v-if="loading"
      class="state-box"
    >
      혜택 정보를 불러오는 중이에요.
    </section>

    <section
      v-else-if="errorMessage"
      class="state-box error"
    >
      <p>{{ errorMessage }}</p>

      <button
        type="button"
        @click="loadDetail"
      >
        다시 불러오기
      </button>
    </section>

    <template v-else-if="detail">
      <article class="detail-card">
        <div class="detail-card-header">
          <div class="badge-list">

            <span
              v-if="regionLabel"
              class="detail-badge region"
            >
              {{ regionLabel }}
            </span>

            <span
              class="detail-badge"
              :class="dDayClass"
            >
              {{ dDayText }}
            </span>
          </div>
        </div>

        <h1 class="benefit-title">
          {{ detail.plcyNm }}
        </h1>

        <p
          v-if="summaryText"
          class="benefit-summary"
        >
          {{ summaryText }}
        </p>

        <dl class="summary-info-list">
          <div class="summary-info-row">
            <dt>운영기관</dt>
            <dd>
              {{ detail.sprvsnInstCdNm || "-" }}
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

      <div class="detail-action-bar">
        <button
          type="button"
          class="detail-button secondary"
        >
          {{ "신청한 혜택 추가" }}
        </button>

        <button
          type="button"
          class="detail-button primary"
          :disabled="!detail.aplyUrlAddr"
          @click="moveToApplyPage"
        >
          신청하러 가기
        </button>
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

import { useRoute } from "vue-router";

import { getBenefitDetail } from "@/api/benefitApi";
import BenefitCard from
  "@/components/benefit/BenefitCard.vue";

const route = useRoute();

const detail = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const showAdditionalInfo = ref(false);

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

  const difference =
    endDate.getTime() - today.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24),
  );
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
  if (dDayText.value === "마감") {
    return "closed";
  }

  if (dDayText.value === "상시") {
    return "always";
  }

  const remainingDays = getRemainingDays();

  if (remainingDays !== null && remainingDays >= 0 && remainingDays <= 7) {
    return "urgent";
  }

  return "open";
});

const regionLabel = computed(() => {
  const names = detail.value?.regionNames ?? [];

  if (!names.length) {
    return "";
  }

  if (names.length === 1) {
    return names[0];
  }

  const firstName = names[0];

  return `${firstName} 외 ${names.length - 1}곳`;
});

const summaryText = computed(() => {
  return detail.value?.plcyExplnCn || detail.value?.targetDesc || "";
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
    ? parts.join(", ")
    : "지원 대상은 공고 내용을 확인해 주세요.";
});

const supportText = computed(() => {
  return detail.value?.plcySprtCn || "지원 내용은 공고 내용을 확인해 주세요.";
});

const applyMethodText = computed(() => {
  return (
    detail.value?.plcyAplyMthdCn || "신청 방법은 공고 내용을 확인해 주세요."
  );
});

const ageText = computed(() => {
  const minAge = detail.value?.sprtTrgtMinAge;

  const maxAge = detail.value?.sprtTrgtMaxAge;

  if (minAge == null && maxAge == null) {
    return "";
  }

  if (Number(minAge) === 0 && Number(maxAge) === 0) {
    return "연령 제한 없음";
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
  return (detail.value?.majorNames ?? []).join(", ");
});

const schoolLabel = computed(() => {
  return (detail.value?.schoolNames ?? []).join(", ");
});

const jobLabel = computed(() => {
  return (detail.value?.jobNames ?? []).join(", ");
});

const loadDetail = async () => {
  if (!Number.isInteger(benefitNo.value) || benefitNo.value <= 0) {
    errorMessage.value = "잘못된 혜택 번호입니다.";

    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    detail.value = await getBenefitDetail(benefitNo.value);
  } catch (error) {
    console.error("혜택 상세 조회 실패:", error);

    errorMessage.value = "혜택 정보를 불러오지 못했어요.";
  } finally {
    loading.value = false;
  }
};

const moveToApplyPage = () => {
  const url = detail.value?.aplyUrlAddr;

  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
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

.favorite-button {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #797268;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
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
</style>

<template>
  <KbCard class="benefit-card" :class="{ 'is-closed': benefit.benefitStatus === 'CLOSED' }">
    <template #top>
      <div class="card-badges">
        <KbBadge class="d-day-badge" :class="dDayClass">
          {{ dDayText }}
        </KbBadge>
      </div>
    </template>

    <h2 class="benefit-title">{{ benefit.plcyNm }}</h2>

    <p class="benefit-provider">
      {{ benefit.sprvsnInstCdNm || "제공 기관 미정" }}
    </p>

    <p v-if="benefit.benefitStatus === 'ALWAYS'" class="benefit-period">
      상시 신청
    </p>
    <p v-else-if="benefit.applyStartDate || benefit.applyEndDate" class="benefit-period">
      {{ formatDate(benefit.applyStartDate) || "시작일 미정" }}
      <span>~</span>
      {{ formatDate(benefit.applyEndDate) || "종료일 미정" }}
    </p>
  </KbCard>
</template>

<script setup>
import { computed } from "vue";
import KbBadge from "@/components/common/KbBadge.vue";
import KbCard from "@/components/common/KbCard.vue";

const props = defineProps({
  benefit: {
    type: Object,
    required: true,
  },
});

const dDayText = computed(() => {
  const item = props.benefit;
  if (item.benefitStatus === "ALWAYS" || !item.applyEndDate) return "상시";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(`${item.applyEndDate}T00:00:00`);
  const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);

  if (remainingDays < 0) return "마감";
  if (remainingDays === 0) return "D-Day";
  return `D-${remainingDays}`;
});

const dDayClass = computed(() => {
  const text = dDayText.value;
  if (text === "마감") return "is-closed";
  if (text === "상시") return "is-always";
  if (text === "D-Day") return "is-urgent";

  const match = text.match(/^D-(\d+)$/);
  if (match && Number(match[1]) <= 7) return "is-urgent";
  return "is-open";
});

const formatDate = (date) => (date ? String(date).replaceAll("-", ".") : "");
</script>

<style scoped>
.benefit-card { cursor: pointer; }
.benefit-card.is-closed { background: #fafafa; }
.card-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.d-day-badge.is-open { background: #eaf3ff; color: #1769d2; }
.d-day-badge.is-urgent { background: #fff0ee; color: #e34a3e; }
.d-day-badge.is-always { background: #fff7df; color: #9a7100; }
.d-day-badge.is-closed { background: #f2f2f2; color: #908980; }
.benefit-title { margin: 2px 0 0; color: #2e2a24; font-size: 18px; font-weight: 750; line-height: 1.42; letter-spacing: -0.035em; word-break: keep-all; }
.benefit-provider { margin: 0; color: #696158; font-size: 13px; line-height: 1.5; }
.benefit-period { display: flex; align-items: center; gap: 5px; margin: 2px 0 0; color: #908980; font-size: 12px; }
.is-closed .benefit-title,
.is-closed .benefit-provider { color: #908980; }
</style>

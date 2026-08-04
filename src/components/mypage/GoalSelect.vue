<script setup>
defineProps({
  modelValue: { type: String, default: '' },
});
defineEmits(['update:modelValue']);

// value 는 DB goal_type ENUM 과 1:1. '' 는 '목표 미설정'(DELETE 대상).
// 혜택 건수 배지는 goal_type ↔ benefit 매핑이 없어 넣지 않는다(추천 도메인 소관).
const GOALS = [
  {
    value: 'INDEPENDENCE',
    icon: '🏠',
    name: '독립',
    examples: ['보증금·월세 지원', '청년 주택'],
  },
  {
    value: 'EMPLOYMENT',
    icon: '💼',
    name: '취업',
    examples: ['구직활동지원금', '내일채움공제'],
  },
  {
    value: 'STARTUP',
    icon: '🚀',
    name: '창업',
    examples: ['창업지원금', '창업사관학교'],
  },
  {
    value: 'MARRIAGE',
    icon: '💍',
    name: '결혼',
    examples: ['신혼 전세대출', '주택 특별공급'],
  },
  {
    value: 'STUDY_ABROAD',
    icon: '✈️',
    name: '유학',
    examples: ['국비 장학', '어학연수 지원'],
  },
  {
    value: '',
    icon: '⏳',
    name: '나중에 정할래요',
    examples: ['언제든 바꿀 수 있어요'],
  },
];
</script>

<template>
  <div class="goal-select">
    <button
      v-for="goal in GOALS"
      :key="goal.value"
      type="button"
      :class="['goal-card', { selected: modelValue === goal.value }]"
      :aria-pressed="modelValue === goal.value"
      @click="$emit('update:modelValue', goal.value)"
    >
      <span
        v-if="modelValue === goal.value"
        class="goal-check"
        aria-hidden="true"
        >✓</span
      >
      <span class="goal-icon" aria-hidden="true">{{ goal.icon }}</span>
      <span class="goal-name">{{ goal.name }}</span>
      <span class="goal-examples">
        <span v-for="example in goal.examples" :key="example">{{
          example
        }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.goal-select {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.goal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid #efece4;
  border-radius: 16px;
  background-color: #ffffff;
  text-align: left;
  cursor: pointer;
  word-break: keep-all;
}

/* 테두리가 굵어지는 만큼 padding 을 줄여 카드 크기가 안 흔들리게 한다 */
.goal-card.selected {
  border: 1.6px solid #ffbc00;
  padding: 15.4px;
}

.goal-check {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: #ffbc00;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.goal-icon {
  font-size: 28px;
  line-height: 1;
}

.goal-name {
  font-size: 16px;
  font-weight: 700;
  color: #2e2a24;
}

.goal-examples {
  display: flex;
  flex-direction: column;
  font-size: 12.5px;
  color: #908980;
}
</style>

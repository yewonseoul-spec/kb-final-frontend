<template>
  <div :class="['kb-card', { selected: selected, yellow: yellowBg }]">
    <div v-if="badges && badges.length > 0" class="kb-card-badges">
      <KbBadge
        v-for="(badge, index) in badges"
        :key="index"
        :variant="badge.variant"
      >
        {{ badge.text }}
      </KbBadge>
    </div>

    <!--뱃지 외에 다른 걸 상단에 넣고 싶으면 top에 넣으면 됨ㅇ -->
    <slot name="top" />

    <h3 v-if="title" class="kb-card-title">{{ title }}</h3>
    <p v-if="description" class="kb-card-desc">{{ description }}</p>

    <slot />
  </div>
</template>

<script setup>
import KbBadge from './KbBadge.vue';

defineProps({
  selected: { type: Boolean, default: false },
  yellowBg: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },

  badges: { type: Array, default: () => [] },
});
</script>

<style scoped>
.kb-card {
  box-sizing: border-box;
  background-color: #ffffff;
  border: 1px solid #efece4;
  border-radius: 14px;
  padding: 20px;
  font-family: 'Pretendard', sans-serif;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kb-card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kb-card.selected {
  border: 1.6px solid #ffbc00;
  padding: 19.4px;
}

.kb-card.yellow {
  background-color: #fffdf5;
  border: 1.6px solid #ffbc00;
  padding: 19.4px;
}

.kb-card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2e2a24;
}

.kb-card-desc {
  margin: 0;
  font-size: 13px;
  color: #908980;
}
</style>

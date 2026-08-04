<script setup>
defineProps({
  title: { type: String, required: true },
  step: { type: Number, required: true },
  steps: { type: Number, required: true },
  stepName: { type: String, required: true },
});
defineEmits(['skip']);
</script>

<template>
  <div class="onboarding-header">
    <header class="setup-header">
      <h1 class="setup-title">{{ title }}</h1>
      <button type="button" class="skip-button" @click="$emit('skip')">
        건너뛰기
      </button>
    </header>

    <div class="progress">
      <div class="progress-track">
        <span
          v-for="n in steps"
          :key="n"
          :class="['progress-step', { done: n <= step }]"
        ></span>
      </div>
      <span class="progress-label">{{ step }}/{{ steps }} {{ stepName }}</span>
    </div>
  </div>
</template>

<style scoped>
/* 부모 flex 의 gap 20px 안으로 들어가므로 내부 간격을 여기서 살린다 */
.onboarding-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setup-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #2e2a24;
}

.skip-button {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  color: #908980;
  cursor: pointer;
}

.progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-track {
  display: flex;
  flex: 1;
  gap: 8px;
}

.progress-step {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background-color: #efece4;
}

.progress-step.done {
  background-color: #ffbc00;
}

.progress-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #908980;
  white-space: nowrap;
}
</style>

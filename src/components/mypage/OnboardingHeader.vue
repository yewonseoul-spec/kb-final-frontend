<script setup>
defineProps({
  step: { type: Number, required: true },
  steps: { type: Number, required: true },
  stepName: { type: String, required: true },
});
defineEmits(['skip']);
</script>

<template>
  <!-- 제목은 헤더(DefaultLayout)가 meta.title 로 이미 띄운다.
       여기서 또 그리면 같은 문구가 화면에 두 번 보인다. -->
  <div class="onboarding-header">
    <div class="progress-track">
      <span
        v-for="n in steps"
        :key="n"
        :class="['progress-step', { done: n <= step }]"
      ></span>
    </div>
    <span class="progress-label">{{ step }}/{{ steps }} {{ stepName }}</span>
    <button type="button" class="skip-button" @click="$emit('skip')">
      건너뛰기
    </button>
  </div>
</template>

<style scoped>
/* 제목이 헤더로 올라가면서 두 줄이 한 줄로 합쳐졌다.
   부모 flex 의 gap 20px 안으로 들어간다 */
.onboarding-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skip-button {
  margin-left: 4px;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: #908980;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  white-space: nowrap;
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

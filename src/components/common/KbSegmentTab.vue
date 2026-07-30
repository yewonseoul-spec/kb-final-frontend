<template>
  <div class="kb-segment-container">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      :class="['segment-btn', { active: modelValue === tab.value }]"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: { type: Array, required: true },
  modelValue: { type: [String, Number], required: true },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.kb-segment-container {
  box-sizing: border-box;
  display: inline-flex;
  background-color: #f8f7f2;
  padding: 4px;
  border-radius: 14px;
  gap: 4px;
}

.segment-btn {
  box-sizing: border-box;
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px 24px;
  /* font-family: 'Pretendard', sans-serif; */
  font-size: 14px;
  font-weight: 600;
  color: #908980;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.segment-btn.active {
  background-color: #ffffff;
  color: #2e2a24;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
</style>

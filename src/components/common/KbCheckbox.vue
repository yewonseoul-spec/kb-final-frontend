<template>
  <label class="kb-checkbox-wrapper">
    <input
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
      class="hidden-checkbox"
    />
    <span :class="['custom-checkbox', { checked: modelValue }]">
      <svg
        v-if="modelValue"
        width="12"
        height="10"
        viewBox="0 0 12 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 5L4.5 8.5L11 1.5"
          stroke="#2E2A24"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span class="label-text"><slot /></span>
  </label>
</template>

<script setup>
defineProps({ modelValue: { type: Boolean, default: false } });
defineEmits(['update:modelValue']);
</script>

<style scoped>
.kb-checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  /* font-family: 'Pretendard', sans-serif; */
  font-size: 14px;
  color: #2e2a24;
}

.hidden-checkbox {
  display: none;
}

.custom-checkbox {
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid #efece4;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.custom-checkbox.checked {
  background-color: #ffbc00;
  border: 1.6px solid #ffbc00;
}

.label-text {
  font-weight: 500;
}
</style>

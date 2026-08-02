<script setup>
defineProps({
  modelValue: String,
  label: String,
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '선택' },
  errorMessage: String,
  isError: Boolean,
});
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="select-group">
    <label v-if="label" class="select-label">{{ label }}</label>
    <div class="select-box">
      <select
        :value="modelValue"
        :class="['select', { error: isError, empty: !modelValue }]"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <!-- 전 항목이 선택 입력이라 '선택 안 함'으로 되돌릴 수 있어야 한다 -->
        <option value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <svg
        class="arrow"
        width="12"
        height="7"
        viewBox="0 0 12 7"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 1L6 6L11 1"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.select-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.select-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #908980;
}

.select-box {
  position: relative;
}

.select {
  box-sizing: border-box;
  width: 100%;
  height: 48px;
  padding: 0 40px 0 16px;
  background-color: #ffffff;
  border: 1px solid #efece4;
  border-radius: 12px;
  font-size: 14px;
  color: #2e2a24;
  outline: none;
  appearance: none;
  transition: border 0.2s;
}

.select:focus {
  border: 1.6px solid #ffbc00;
  padding: 0 39.4px 0 15.4px;
}

.select.error {
  border: 1.6px solid #d64545;
  padding: 0 39.4px 0 15.4px;
}

/* 미선택 상태는 옅게 보이게 한다 */
.select.empty {
  color: #a1998d;
}

.arrow {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  color: #908980;
  pointer-events: none;
}

.error-text {
  margin: 0;
  font-size: 12px;
  color: #d64545;
}
</style>

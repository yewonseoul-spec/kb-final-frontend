<template>
  <div class="kb-input-group">
    <label v-if="label" class="kb-label">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :class="['kb-input', { error: isError, focus: isFocus }]"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="isFocus = true"
      @blur="isFocus = false"
    />
    <p v-if="errorMessage" class="kb-message error-text">{{ errorMessage }}</p>
    <p v-else-if="hintMessage" class="kb-message hint-text">
      {{ hintMessage }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  maxlength: [String, Number],
  errorMessage: String,
  hintMessage: String,
  isError: Boolean,
});
defineEmits(['update:modelValue']);
const isFocus = ref(false);
</script>

<style scoped>
.kb-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  font-family: 'Pretendard', sans-serif;
}

.kb-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #908980;
}

.kb-input {
  box-sizing: border-box;
  height: 48px;
  padding: 0 16px;
  background-color: #ffffff;
  border: 1px solid #efece4;
  border-radius: 12px;
  /* font-family: 'Pretendard', sans-serif; */
  font-size: 14px;
  color: #2e2a24;
  outline: none;
  transition: border 0.2s;
}

.kb-input:focus,
.kb-input.focus {
  border: 1.6px solid #ffbc00;
  padding: 0 15.4px;
}

.kb-input.error {
  border: 1.6px solid #d64545;
  padding: 0 15.4px;
}

.kb-message {
  font-size: 12px;
  margin: 0;
}
.error-text {
  color: #d64545;
}
.hint-text {
  color: #43a047;
}
</style>

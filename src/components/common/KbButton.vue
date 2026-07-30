<template>
  <button
    :class="['kb-btn', type, size]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'primary' },
  size: { type: String, default: 'medium' },
  disabled: { type: Boolean, default: false },
});
defineEmits(['click']);
</script>

<style scoped>
.kb-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* font-family: 'Pretendard', sans-serif; */
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  padding: 12px 20px;
  font-size: 14px;
}

.kb-btn.primary {
  background-color: #ffbc00;
  color: #2e2a24;
}
.kb-btn.primary:hover {
  filter: brightness(0.95);
}

.kb-btn.secondary {
  background-color: #ffffff;
  border: 1px solid #efece4;
  color: #2e2a24;
}

.kb-btn.danger {
  background-color: #ffffff;
  border: 1px solid #d64545;
  color: #d64545;
}

.kb-btn.small {
  padding: 8px 14px;
  font-size: 12px;
  border-radius: 8px;
}

.kb-btn:disabled {
  background-color: #f8f7f2;
  border: 1px solid #e4e0d6;
  color: #a1998d;
  cursor: not-allowed;
}
</style>

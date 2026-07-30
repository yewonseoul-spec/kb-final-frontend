<template>
  <span :class="['kb-badge', variant]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'default' },
});
</script>

<style scoped>
.kb-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  /* font-family: 'Pretendard', sans-serif; */
  font-size: 10px;
  font-weight: 700;
  border-radius: 6px;
  background-color: #fff4cc;
  color: #b6964d;
}

.kb-badge.danger {
  background-color: #ffe8e8;
  color: #d64545;
}
.kb-badge.info {
  background-color: #e8f0fe;
  color: #1a73e8;
}
.kb-badge.gray {
  background-color: #efece4;
  color: #908980;
}
</style>

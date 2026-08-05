<template>
  <section class="filter-section">
    <span class="filter-label">{{ label }}</span>

    <button
      type="button"
      class="filter-select"
      :disabled="disabled"
      @click="$emit('open')"
    >
      <strong>{{ value }}</strong>
      <span class="arrow" aria-hidden="true">⌄</span>
    </button>
  </section>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    default: "전체",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["open"]);
</script>

<style scoped>
.filter-section {
  margin-top: 32px;
}

.filter-label {
  display: block;
  margin-bottom: 10px;
  color: #908980;
  font-size: 13px;
}

.filter-select {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 0 12px;
  border: 0;
  border-bottom: 2px solid #b5a063;
  background: transparent;
  color: #2e2a24;
  text-align: left;
  cursor: pointer;
}

.filter-select strong {
  overflow: hidden;
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-select:disabled {
  border-bottom-color: #e6e2da;
  color: #b9b3aa;
  cursor: default;
}

.arrow {
  flex-shrink: 0;
  font-size: 18px;
}
</style>

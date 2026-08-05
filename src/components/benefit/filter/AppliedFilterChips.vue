<template>
  <section v-if="filters.length" class="chip-list" aria-label="적용된 필터">
    <div v-for="filter in filters" :key="filter.key" class="filter-chip">
      <span>{{ filter.label }}</span>
      <button
        type="button"
        :aria-label="`${filter.label} 필터 해제`"
        @click="$emit('remove', filter.key)"
      >
        ×
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  filters: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["remove"]);
</script>

<style scoped>
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 7px 10px 7px 12px;
  border: 1px solid #efe4bd;
  border-radius: 999px;
  background: #fffaf0;
  color: #675a37;
  font-size: 12px;
  font-weight: 600;
}

.filter-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-chip button {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #908980;
  font-size: 16px;
  cursor: pointer;
}
</style>

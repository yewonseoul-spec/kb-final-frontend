<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="option-overlay"
      @click.self="close"
    >
      <section class="option-sheet" role="dialog" :aria-label="title">
        <div class="sheet-handle" />

        <header class="option-header">
          <h3>{{ title }}</h3>
          <button type="button" class="close-button" @click="close">×</button>
        </header>

        <div class="option-list">
          <button
            v-if="showAll"
            type="button"
            class="option-item"
            :class="{ selected: selectedCode === '' }"
            @click="selectAll"
          >
            <span>{{ allLabel }}</span>
            <span v-if="selectedCode === ''">✓</span>
          </button>

          <button
            v-for="option in options"
            :key="option.code"
            type="button"
            class="option-item"
            :class="{ selected: selectedCode === option.code }"
            @click="select(option)"
          >
            <span>{{ option.name }}</span>
            <span v-if="selectedCode === option.code">✓</span>
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    default: () => [],
  },
  selectedCode: {
    type: String,
    default: "",
  },
  showAll: {
    type: Boolean,
    default: true,
  },
  allLabel: {
    type: String,
    default: "전체",
  },
});

const emit = defineEmits(["update:modelValue", "select"]);

const close = () => emit("update:modelValue", false);

const selectAll = () => {
  emit("select", { code: "", name: props.allLabel, raw: null });
  close();
};

const select = (option) => {
  emit("select", option);
  close();
};
</script>

<style scoped>
.option-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.34);
}

.option-sheet {
  width: min(100%, 440px);
  max-height: 72dvh;
  overflow-y: auto;
  padding: 12px 20px calc(24px + env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0;
  background: #fff;
}

.sheet-handle {
  width: 42px;
  height: 4px;
  margin: 0 auto 18px;
  border-radius: 999px;
  background: #c6bfb4;
}

.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.option-header h3 {
  margin: 0;
  font-size: 19px;
}

.close-button {
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  font-size: 25px;
  cursor: pointer;
}

.option-list {
  display: flex;
  flex-direction: column;
}

.option-item {
  display: flex;
  min-height: 50px;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  border: 0;
  border-bottom: 1px solid #f0ede7;
  background: transparent;
  color: #2e2a24;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}

.option-item.selected {
  color: #8d6e00;
  font-weight: 700;
}
</style>

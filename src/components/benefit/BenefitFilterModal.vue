<template>
  <div
    v-if="modelValue"
    class="filter-overlay"
    @click.self="closeModal"
  >
    <section class="filter-modal">
      <header class="filter-header">
        <h2>필터 설정</h2>

        <button
          type="button"
          class="close-button"
          @click="closeModal"
        >
          ×
        </button>
      </header>

      <p class="filter-description">
        선택한 조건에 맞는 청년혜택을 확인할 수 있어요.
      </p>

      <div class="filter-section">
        <span class="filter-label">카테고리</span>

        <button
          type="button"
          class="filter-select"
          @click="isCategorySheetOpen = true"
        >
          <strong>{{ selectedCategoryName }}</strong>
          <span>⌄</span>
        </button>
      </div>

      <div class="filter-actions">
        <button
          type="button"
          class="reset-button"
          @click="resetFilter"
        >
          초기화
        </button>

        <button
          type="button"
          class="apply-button"
          @click="applyFilter"
        >
          적용하기
        </button>
      </div>

      <div
        v-if="isCategorySheetOpen"
        class="category-sheet-overlay"
        @click.self="isCategorySheetOpen = false"
      >
        <section class="category-sheet">
          <header class="category-sheet-header">
            <h3>카테고리</h3>

            <button
              type="button"
              @click="isCategorySheetOpen = false"
            >
              ×
            </button>
          </header>

          <div class="category-list">
            <button
              type="button"
              :class="['category-item', { active: draftCategoryCode === '' }]"
              @click="selectCategory('', '전체')"
            >
              전체
            </button>

            <button
              v-for="category in categories"
              :key="category.categoryCode"
              type="button"
              :class="[
                'category-item',
                {
                  active: draftCategoryCode === category.categoryCode,
                },
              ]"
              @click="
                selectCategory(category.categoryCode, category.categoryName)
              "
            >
              {{ category.categoryName }}
            </button>
          </div>

          <button
            type="button"
            class="category-confirm-button"
            @click="isCategorySheetOpen = false"
          >
            확인
          </button>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { getBenefitCategories } from "@/api/benefitApi";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },

  categoryCode: {
    type: String,
    default: "",
  },

  categoryName: {
    type: String,
    default: "전체",
  },
});

const emit = defineEmits(["update:modelValue", "apply"]);

const categories = ref([]);
const isCategorySheetOpen = ref(false);

const draftCategoryCode = ref("");
const draftCategoryName = ref("전체");

const selectedCategoryName = computed(() => {
  return draftCategoryName.value || "전체";
});

const loadCategories = async () => {
  try {
    categories.value = await getBenefitCategories();
  } catch (error) {
    console.error("카테고리 조회 실패:", error);
    categories.value = [];
  }
};

const selectCategory = (categoryCode, categoryName) => {
  draftCategoryCode.value = categoryCode;
  draftCategoryName.value = categoryName;
};

const resetFilter = () => {
  draftCategoryCode.value = "";
  draftCategoryName.value = "전체";
};

const applyFilter = () => {
  emit("apply", {
    categoryCode: draftCategoryCode.value,
    categoryName: draftCategoryName.value,
  });

  closeModal();
};

const closeModal = () => {
  isCategorySheetOpen.value = false;
  emit("update:modelValue", false);
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    draftCategoryCode.value = props.categoryCode;
    draftCategoryName.value = props.categoryName;
  },
);

onMounted(loadCategories);
</script>

<style scoped>
.filter-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.filter-modal {
  width: min(100%, 430px);
  min-height: 70vh;
  padding: 24px 20px 28px;
  background: #fff;
  border-radius: 24px 24px 0 0;
}

.filter-header,
.category-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-header h2,
.category-sheet-header h3 {
  margin: 0;
}

.close-button,
.category-sheet-header button {
  border: 0;
  background: transparent;
  font-size: 32px;
  cursor: pointer;
}

.filter-description {
  margin: 8px 0 32px;
  font-size: 13px;
  color: #777;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #888;
}

.filter-select {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 12px 0;
  border: 0;
  border-bottom: 1px solid #9a8546;
  background: transparent;
  font-size: 18px;
  text-align: left;
}

.filter-actions {
  position: absolute;
  right: 20px;
  bottom: 28px;
  left: 20px;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 12px;
}

.reset-button,
.apply-button,
.category-confirm-button {
  min-height: 52px;
  border: 0;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
}

.reset-button {
  background: #f0eee9;
}

.apply-button,
.category-confirm-button {
  background: #ffbc00;
}

.category-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.category-sheet {
  width: min(100%, 430px);
  padding: 24px 0 0;
  background: #fff;
  border-radius: 24px 24px 0 0;
}

.category-sheet-header {
  padding: 0 20px 16px;
}

.category-list {
  max-height: 320px;
  overflow-y: auto;
}

.category-item {
  width: 100%;
  padding: 16px 20px;
  border: 0;
  background: #fff;
  font-size: 17px;
  cursor: pointer;
}

.category-item.active {
  background: #f7f5f0;
  font-weight: 700;
}

.category-confirm-button {
  width: 100%;
  border-radius: 0;
}
</style>

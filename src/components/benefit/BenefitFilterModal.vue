<template>
  <div
    v-if="modelValue"
    class="filter-overlay"
    @click.self="closeModal"
  >
    <section class="filter-modal">
      <div class="filter-handle"></div>

      <header class="filter-header">
        <div>
          <h2>필터 설정</h2>

          <p>선택한 조건에 맞는 청년혜택을 확인할 수 있어요.</p>
        </div>

        <button
          type="button"
          class="close-button"
          @click="closeModal"
        >
          ×
        </button>
      </header>

      <!-- 카테고리 -->

      <section class="filter-section">
        <span class="filter-label"> 카테고리 </span>

        <button
          type="button"
          class="filter-select full"
          @click="isCategoryOpen = true"
        >
          <strong>
            {{ selectedCategoryName }}
          </strong>

          <span class="arrow">⌄</span>
        </button>
      </section>

      <!-- 지역 -->

      <section class="filter-section">
        <span class="filter-label"> 지역 </span>

        <div class="region-filter-row">
          <button
            type="button"
            class="filter-select"
            @click="isProvinceOpen = true"
          >
            <strong>
              {{ selectedProvinceName }}
            </strong>

            <span class="arrow">⌄</span>
          </button>

          <button
            type="button"
            class="filter-select"
            :disabled="selectedProvinceCode === ''"
            @click="isCityOpen = true"
          >
            <strong>
              {{ selectedCityName }}
            </strong>

            <span class="arrow">⌄</span>
          </button>

          <button
            type="button"
            class="filter-select"
            :disabled="selectedCityCode === '' || districtList.length === 0"
            @click="isDistrictOpen = true"
          >
            <strong>
              {{ selectedDistrictName }}
            </strong>

            <span class="arrow">⌄</span>
          </button>
        </div>
      </section>

      <section class="filter-section">
        <p class="filter-label">전공</p>

        <button
          type="button"
          class="filter-select full"
          @click="isMajorOpen = true"
        >
          <strong>{{ selectedMajorName }}</strong>
          <span class="select-arrow">⌄</span>
        </button>
      </section>

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
    </section>

    <!-- 카테고리 선택 -->

    <div
      v-if="isCategoryOpen"
      class="option-overlay"
      @click.self="isCategoryOpen = false"
    >
      <section class="option-sheet">
        <header class="option-header">
          <h3>카테고리 선택</h3>

          <button
            type="button"
            @click="isCategoryOpen = false"
          >
            ×
          </button>
        </header>

        <button
          type="button"
          class="option-item"
          @click="selectAllCategory"
        >
          전체
        </button>

        <button
          v-for="category in categoryList"
          :key="category.categoryCode"
          type="button"
          class="option-item"
          @click="selectCategory(category)"
        >
          {{ category.categoryName }}
        </button>
      </section>
    </div>

    <!-- 시·도 선택 -->

    <div
      v-if="isProvinceOpen"
      class="option-overlay"
      @click.self="isProvinceOpen = false"
    >
      <section class="option-sheet">
        <header class="option-header">
          <h3>시·도 선택</h3>

          <button
            type="button"
            @click="isProvinceOpen = false"
          >
            ×
          </button>
        </header>

        <button
          type="button"
          class="option-item"
          @click="selectNationwide"
        >
          전국
        </button>

        <button
          v-for="region in provinceList"
          :key="region.zipCd"
          type="button"
          class="option-item"
          @click="selectProvince(region)"
        >
          {{ getSimpleRegionName(region.regionName) }}
        </button>
      </section>
    </div>

    <!-- 시·군 선택 -->

    <div
      v-if="isCityOpen"
      class="option-overlay"
      @click.self="isCityOpen = false"
    >
      <section class="option-sheet">
        <header class="option-header">
          <h3>중분류 선택</h3>

          <button
            type="button"
            @click="isCityOpen = false"
          >
            ×
          </button>
        </header>

        <button
          type="button"
          class="option-item"
          @click="selectCityAll"
        >
          전체
        </button>

        <button
          v-for="region in cityList"
          :key="region.zipCd"
          type="button"
          class="option-item"
          @click="selectCity(region)"
        >
          {{ getSimpleRegionName(region.regionName) }}
        </button>
      </section>
    </div>

    <!-- 구 선택 -->

    <div
      v-if="isDistrictOpen"
      class="option-overlay"
      @click.self="isDistrictOpen = false"
    >
      <section class="option-sheet">
        <header class="option-header">
          <h3>세부 지역 선택</h3>

          <button
            type="button"
            @click="isDistrictOpen = false"
          >
            ×
          </button>
        </header>

        <button
          type="button"
          class="option-item"
          @click="selectDistrictAll"
        >
          전체
        </button>

        <button
          v-for="region in districtList"
          :key="region.zipCd"
          type="button"
          class="option-item"
          @click="selectDistrict(region)"
        >
          {{ getSimpleRegionName(region.regionName) }}
        </button>
      </section>
    </div>
  </div>

  <div
    v-if="isMajorOpen"
    class="option-overlay"
    @click.self="isMajorOpen = false"
  >
    <section class="option-sheet">
      <div class="sheet-handle"></div>

      <header class="option-header">
        <h3>전공 선택</h3>

        <button
          type="button"
          class="option-close"
          @click="isMajorOpen = false"
        >
          ×
        </button>
      </header>

      <div class="option-list">
        <button
          type="button"
          class="option-item"
          :class="{
            selected: selectedPlcyMajorCd === '',
          }"
          @click="selectAllMajor"
        >
          <span>전체</span>

          <span v-if="selectedPlcyMajorCd === ''"> ✓ </span>
        </button>

        <button
          v-for="major in majorList"
          :key="major.plcyMajorCd"
          type="button"
          class="option-item"
          :class="{
            selected: selectedPlcyMajorCd === major.plcyMajorCd,
          }"
          @click="selectMajor(major)"
        >
          <span>{{ major.codeName }}</span>

          <span v-if="selectedPlcyMajorCd === major.plcyMajorCd"> ✓ </span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

import {
  getBenefitCategories,
  getBenefitRegions,
  getBenefitMajors,
} from "@/api/benefitApi";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },

  categoryCode: {
    type: String,
    default: "",
  },

  categoryName: {
    type: String,
    default: "전체",
  },

  provinceCode: {
    type: String,
    default: "",
  },

  provinceName: {
    type: String,
    default: "전국",
  },

  cityCode: {
    type: String,
    default: "",
  },

  cityName: {
    type: String,
    default: "중분류",
  },

  districtCode: {
    type: String,
    default: "",
  },

  districtName: {
    type: String,
    default: "분류",
  },

  plcyMajorCd: {
    type: String,
    default: "",
  },

  majorName: {
    type: String,
    default: "전체",
  },
});

const emit = defineEmits(["update:modelValue", "apply"]);

/* 카테고리 */

const categoryList = ref([]);

const selectedCategoryCode = ref("");
const selectedCategoryName = ref("전체");

const isCategoryOpen = ref(false);

/* 지역 목록 */

const provinceList = ref([]);
const cityList = ref([]);
const districtList = ref([]);

/* 선택된 지역 */

const selectedProvinceCode = ref("");
const selectedProvinceName = ref("전국");

const selectedCityCode = ref("");
const selectedCityName = ref("중분류");

const selectedDistrictCode = ref("");
const selectedDistrictName = ref("분류");

/* 지역 선택창 상태 */

const isProvinceOpen = ref(false);
const isCityOpen = ref(false);
const isDistrictOpen = ref(false);

//전공
const majorList = ref([]);

const selectedPlcyMajorCd = ref(props.plcyMajorCd);

const selectedMajorName = ref(props.majorName);

const isMajorOpen = ref(false);

/*
 * 최종적으로 서버에 전달할 지역코드
 * 구 → 시·군 → 시·도 순으로 우선 적용
 */
const selectedZipCd = computed(() => {
  return (
    selectedDistrictCode.value ||
    selectedCityCode.value ||
    selectedProvinceCode.value ||
    ""
  );
});

const getSimpleRegionName = (regionName) => {
  if (!regionName) {
    return "";
  }

  const names = regionName.trim().split(/\s+/);
  return names[names.length - 1];
};

/* 최초 데이터 조회 */

const loadCategory = async () => {
  try {
    categoryList.value = await getBenefitCategories();
  } catch (error) {
    console.error("카테고리 조회 실패:", error);
    categoryList.value = [];
  }
};

const loadProvince = async () => {
  try {
    provinceList.value = await getBenefitRegions();
  } catch (error) {
    console.error("시·도 조회 실패:", error);
    provinceList.value = [];
  }
};

const loadMajor = async () => {
  try {
    majorList.value = await getBenefitMajors();
  } catch (error) {
    console.error("전공 목록 조회 실패:", error);
    majorList.value = [];
  }
};

/* 카테고리 선택 */

const selectCategory = (category) => {
  selectedCategoryCode.value = category.categoryCode;

  selectedCategoryName.value = category.categoryName;

  isCategoryOpen.value = false;
};

const selectAllCategory = () => {
  selectedCategoryCode.value = "";
  selectedCategoryName.value = "전체";
  isCategoryOpen.value = false;
};

/* 전국 선택 */

const selectNationwide = () => {
  selectedProvinceCode.value = "";
  selectedProvinceName.value = "전국";

  selectedCityCode.value = "";
  selectedCityName.value = "중분류";

  selectedDistrictCode.value = "";
  selectedDistrictName.value = "분류";

  cityList.value = [];
  districtList.value = [];

  isProvinceOpen.value = false;
};

/* 시·도 선택 */

const selectProvince = async (region) => {
  selectedProvinceCode.value = region.zipCd;
  selectedProvinceName.value = getSimpleRegionName(region.regionName);

  selectedCityCode.value = "";
  selectedCityName.value = "전체";

  selectedDistrictCode.value = "";
  selectedDistrictName.value = "분류";

  districtList.value = [];

  try {
    cityList.value = await getBenefitRegions(region.zipCd);
  } catch (error) {
    console.error("중분류 조회 실패:", error);
    cityList.value = [];
  }

  isProvinceOpen.value = false;
};

/* 시·군 전체 */

const selectCityAll = () => {
  selectedCityCode.value = "";
  selectedCityName.value = "전체";

  selectedDistrictCode.value = "";
  selectedDistrictName.value = "분류";

  districtList.value = [];

  isCityOpen.value = false;
};

/* 시·군 선택 */

const selectCity = async (region) => {
  selectedCityCode.value = region.zipCd;
  selectedCityName.value = getSimpleRegionName(region.regionName);

  selectedDistrictCode.value = "";

  if (region.hasChildren) {
    try {
      districtList.value = await getBenefitRegions(region.zipCd);

      selectedDistrictName.value = "전체";
    } catch (error) {
      console.error("세부 지역 조회 실패:", error);

      districtList.value = [];
      selectedDistrictName.value = "분류";
    }
  } else {
    districtList.value = [];
    selectedDistrictName.value = "분류";
  }

  isCityOpen.value = false;
};

/* 구 전체 */

const selectDistrictAll = () => {
  selectedDistrictCode.value = "";
  selectedDistrictName.value = "전체";
  isDistrictOpen.value = false;
};

/* 구 선택 */

const selectDistrict = (region) => {
  selectedDistrictCode.value = region.zipCd;
  selectedDistrictName.value = getSimpleRegionName(region.regionName);

  isDistrictOpen.value = false;
};

//전공 선택
const selectAllMajor = () => {
  selectedPlcyMajorCd.value = "";
  selectedMajorName.value = "전체";
  isMajorOpen.value = false;
};

const selectMajor = (major) => {
  selectedPlcyMajorCd.value = major.plcyMajorCd;

  selectedMajorName.value = major.codeName;

  isMajorOpen.value = false;
};

/* 필터 초기화 */

const resetFilter = () => {
  selectedCategoryCode.value = "";
  selectedCategoryName.value = "전체";

  selectedZipCd.value = "";
  selectedProvinceCode.value = "";
  selectedProvinceName.value = "전국";
  selectedPlcyMajorCd.value = "";
  selectedMajorName.value = "전체";
};

/* 필터 적용 */

const applyFilter = () => {
  emit("apply", {
    categoryCode: selectedCategoryCode.value,

    categoryName: selectedCategoryName.value,

    zipCd: selectedZipCd.value,

    provinceCode: selectedProvinceCode.value,

    provinceName: selectedProvinceName.value,

    cityCode: selectedCityCode.value,

    cityName: selectedCityName.value,

    districtCode: selectedDistrictCode.value,

    districtName: selectedDistrictName.value,

    plcyMajorCd: selectedPlcyMajorCd.value,

    majorName: selectedMajorName.value,
  });

  emit("update:modelValue", false);
};

const closeModal = () => {
  emit("update:modelValue", false);
};

/*
 * 모달을 다시 열었을 때
 * 이전에 적용한 필터 상태 복원
 */
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      return;
    }

    selectedCategoryCode.value = props.categoryCode;

    selectedCategoryName.value = props.categoryName;

    selectedProvinceCode.value = props.provinceCode;

    selectedProvinceName.value = props.provinceName;

    selectedCityCode.value = props.cityCode;

    selectedCityName.value = props.cityName;

    selectedDistrictCode.value = props.districtCode;

    selectedDistrictName.value = props.districtName;

    selectedPlcyMajorCd.value = props.plcyMajorCd;

    selectedMajorName.value = props.majorName;

    if (props.provinceCode) {
      cityList.value = await getBenefitRegions(props.provinceCode);
    }

    if (props.cityCode) {
      districtList.value = await getBenefitRegions(props.cityCode);
    }
  },
);

onMounted(async () => {
  await Promise.all([loadCategory(), loadProvince(), loadMajor()]);
});
</script>

<style scoped>
.filter-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.28);
}

.filter-modal {
  position: relative;
  z-index: 3001;
  width: min(100%, 440px);
  max-height: 90dvh;
  overflow-y: auto;
  padding: 12px 28px calc(28px + env(safe-area-inset-bottom));
  border-radius: 28px 28px 0 0;
  background: #fff;
}

.filter-handle {
  width: 42px;
  height: 4px;
  margin: 0 auto 24px;
  border-radius: 999px;
  background: #c6bfb4;
}

.filter-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.filter-header h2 {
  margin: 0;
  font-size: 25px;
}

.filter-header p {
  margin: 10px 0 0;
  color: #666;
  font-size: 13px;
}

.close-button {
  border: 0;
  background: transparent;
  font-size: 38px;
  font-weight: 200;
  line-height: 1;
  cursor: pointer;
}

.filter-section {
  margin-top: 42px;
}

.filter-label {
  display: block;
  margin-bottom: 4px;
  color: #8a8a8a;
  font-size: 15px;
}

.region-filter-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 10px 0 14px;
  border: 0;
  border-bottom: 2px solid #aa985e;
  background: transparent;
  font-size: 18px;
  text-align: left;
  cursor: pointer;
}

.filter-select.full {
  width: 100%;
}

.filter-select strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-select:disabled {
  color: #aaa;
  border-bottom-color: #ddd;
  cursor: default;
}

.arrow {
  margin-left: 8px;
}

.filter-actions {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  margin-top: 32px;
  padding: 14px 0 calc(8px + env(safe-area-inset-bottom));
  background: #fff;
}

.reset-button,
.apply-button {
  height: 52px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
}

.reset-button {
  border: 1px solid #ddd;
  background: #fff;
}

.apply-button {
  border: 0;
  background: #ffbc00;
}

.option-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.option-sheet {
  position: relative;
  z-index: 4001;
  width: min(100%, 440px);
  max-height: 70dvh;
  overflow-y: auto;
  padding: 24px;
  border-radius: 24px 24px 0 0;
  background: #fff;
}

.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.option-header h3 {
  margin: 0;
  font-size: 20px;
}

.option-header button {
  border: 0;
  background: transparent;
  font-size: 28px;
}

.option-item {
  width: 100%;
  padding: 15px 4px;
  border: 0;
  border-bottom: 1px solid #eee;
  background: #fff;
  font-size: 16px;
  text-align: left;
}
</style>

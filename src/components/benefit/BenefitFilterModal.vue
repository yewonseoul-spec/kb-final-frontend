<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="filter-overlay"
      @click.self="closeModal"
    >
      <section
        class="filter-modal"
        role="dialog"
        aria-label="혜택 필터 설정"
      >
        <div class="filter-handle" />

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

        <FilterSelectField
          label="카테고리"
          :value="draft.categoryName"
          @open="openSheet('category')"
        />

        <RegionFilterField
          :province-code="draft.provinceCode"
          :province-name="draft.provinceName"
          :city-code="draft.cityCode"
          :city-name="draft.cityName"
          :district-code="draft.districtCode"
          :district-name="draft.districtName"
          @change="applyRegionDraft"
        />
        
        <br>
        <section class="age-filter-section">
          <p class="filter-label">연령</p>

          <div class="age-input-row">
            <strong> 만 </strong>

            <input
              :value="draft.age"
              type="text"
              inputmode="numeric"
              maxlength="3"
              class="age-input"
              placeholder="입력"
              aria-label="만 나이 입력"
              @input="handleAgeInput"
            />

            <strong> 세 </strong>
          </div>
        </section>

        <FilterSelectField
          label="전공"
          :value="draft.majorName"
          @open="openSheet('major')"
        />

        <FilterSelectField
          label="학력"
          :value="draft.schoolName"
          @open="openSheet('school')"
        />

        <FilterSelectField
          label="직업"
          :value="draft.jobName"
          @open="openSheet('job')"
        />

        <FilterSelectField
          label="혼인 여부"
          :value="draft.marriageName"
          @open="openSheet('marriage')"
        />

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
    </div>
  </Teleport>

  <FilterOptionSheet
    v-model="sheetOpen"
    :title="sheetTitle"
    :options="sheetOptions"
    :selected-code="sheetSelectedCode"
    @select="selectOption"
  />
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  getBenefitCategories,
  getBenefitMajors,
  getBenefitSchools,
  getBenefitJobs,
  getBenefitMarriage,
} from "@/api/benefitApi";
import FilterOptionSheet from "./filter/FilterOptionSheet.vue";
import FilterSelectField from "./filter/FilterSelectField.vue";
import RegionFilterField from "./filter/RegionFilterField.vue";


const props = defineProps({
  modelValue: { type: Boolean, default: false },
  categoryCode: { type: String, default: "" },
  categoryName: { type: String, default: "전체" },
  provinceCode: { type: String, default: "" },
  provinceName: { type: String, default: "전국" },
  cityCode: { type: String, default: "" },
  cityName: { type: String, default: "중분류" },
  districtCode: { type: String, default: "" },
  districtName: { type: String, default: "분류" },
  plcyMajorCd: { type: String, default: "" },
  majorName: { type: String, default: "전체" },
  schoolCd: { type: String, default: "" },
  schoolName: { type: String, default: "전체" },
  jobCd: { type: String, default: "" },
  jobName: { type: String, default: "전체" },
  mrgSttsCd: { type: String, default: "" },
  marriageName: { type: String, default: "전체" },
  age: { type: [Number, String], default: "" },
});

const emit = defineEmits(["update:modelValue", "apply"]);

const createDraft = () => ({
  categoryCode: props.categoryCode,
  categoryName: props.categoryName,
  zipCd: props.districtCode || props.cityCode || props.provinceCode || "",
  provinceCode: props.provinceCode,
  provinceName: props.provinceName,
  cityCode: props.cityCode,
  cityName: props.cityName,
  districtCode: props.districtCode,
  districtName: props.districtName,
  plcyMajorCd: props.plcyMajorCd,
  majorName: props.majorName,
  schoolCd: props.schoolCd,
  schoolName: props.schoolName,
  jobCd: props.jobCd,
  jobName: props.jobName,
  mrgSttsCd: props.mrgSttsCd,
  marriageName: props.marriageName,
  age: props.age ?? "",
});

const draft = reactive(createDraft());
const activeSheet = ref("");

const optionLists = reactive({
  category: [],
  major: [],
  school: [],
  job: [],
  marriage: [],
});

const filterConfigs = {
  category: {
    title: "카테고리 선택",
    codeField: "categoryCode",
    nameField: "categoryName",
    optionCodeField: "categoryCode",
    optionNameField: "categoryName",
  },
  major: {
    title: "전공 선택",
    codeField: "plcyMajorCd",
    nameField: "majorName",
    optionCodeField: "plcyMajorCd",
    optionNameField: "codeName",
  },
  school: {
    title: "학력 선택",
    codeField: "schoolCd",
    nameField: "schoolName",
    optionCodeField: "schoolCd",
    optionNameField: "codeName",
  },
  job: {
    title: "직업 선택",
    codeField: "jobCd",
    nameField: "jobName",
    optionCodeField: "jobCd",
    optionNameField: "codeName",
  },

  marriage: {
    title: "혼인 여부 선택",
    codeField: "mrgSttsCd",
    nameField: "marriageName",
    optionCodeField: "mrgSttsCd",
    optionNameField: "codeName",
  },
};

const currentConfig = computed(() => filterConfigs[activeSheet.value] ?? null);

const sheetOpen = computed({
  get: () => Boolean(activeSheet.value),
  set: (open) => {
    if (!open) {
      activeSheet.value = "";
    }
  },
});

const sheetTitle = computed(() => currentConfig.value?.title ?? "선택");

const sheetOptions = computed(() => {
  const config = currentConfig.value;

  if (!config) {
    return [];
  }

  return optionLists[activeSheet.value].map((item) => ({
    code: item[config.optionCodeField],
    name: item[config.optionNameField],
    raw: item,
  }));
});

const sheetSelectedCode = computed(() => {
  const config = currentConfig.value;

  if (!config) {
    return "";
  }

  return draft[config.codeField] ?? "";
});

const openSheet = (type) => {
  if (!filterConfigs[type]) {
    return;
  }

  activeSheet.value = type;
};

const selectOption = ({ code, name }) => {
  const config = currentConfig.value;

  if (!config) {
    return;
  }

  draft[config.codeField] = code;
  draft[config.nameField] = name;
};

const applyRegionDraft = (region) => Object.assign(draft, region);

const resetFilter = () => {
  Object.assign(draft, {
    categoryCode: "",
    categoryName: "전체",
    zipCd: "",
    provinceCode: "",
    provinceName: "전국",
    cityCode: "",
    cityName: "중분류",
    districtCode: "",
    districtName: "분류",
    plcyMajorCd: "",
    majorName: "전체",
    schoolCd: "",
    schoolName: "전체",
    jobCd: "",
    jobName: "전체",
    mrgSttsCd: "",
    marriageName: "전체",
    age: '',
  });
};

const applyFilter = () => {
  emit("apply", { ...draft });
  closeModal();
};

const closeModal = () => emit("update:modelValue", false);

const restore = () => Object.assign(draft, createDraft());

watch(
  () => props.modelValue,
  (open) => {
    if (open) restore();
  },
);

onMounted(async () => {
  const [categories, majors, schools, jobs, marriages] =
    await Promise.allSettled([
      getBenefitCategories(),
      getBenefitMajors(),
      getBenefitSchools(),
      getBenefitJobs(),
      getBenefitMarriage(),
    ]);

  optionLists.category =
    categories.status === "fulfilled" ? categories.value : [];
  optionLists.major = majors.status === "fulfilled" ? majors.value : [];
  optionLists.school = schools.status === "fulfilled" ? schools.value : [];
  optionLists.job = jobs.status === "fulfilled" ? jobs.value : [];
  optionLists.marriage =
    marriages.status === "fulfilled" ? marriages.value : [];

  if (categories.status === "rejected") {
    console.error("카테고리 조회 실패:", categories.reason);
  }
  if (majors.status === "rejected") {
    console.error("전공 목록 조회 실패:", majors.reason);
  }
  if (schools.status === "rejected") {
    console.error("학력 목록 조회 실패:", schools.reason);
  }
  if (jobs.status === "rejected") {
    console.error("직업 목록 조회 실패:", jobs.reason);
  }
  if (marriages.status === "rejected") {
    console.error("혼인 여부 목록 조회 실패:", marriages.reason);
  }
});

const handleAgeInput = (event) => {
  const onlyNumbers = event.target.value.replace(/\D/g, "");

  if (onlyNumbers === "") {
    draft.age = "";
    event.target.value = "";
    return;
  }

  const age = Math.min(100, Math.max(0, Number(onlyNumbers)));

  draft.age = age;
  event.target.value = String(age);
};
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
  gap: 16px;
}

.filter-header h2 {
  margin: 0;
  color: #2e2a24;
  font-size: 25px;
}
.filter-header p {
  margin: 10px 0 0;
  color: #666;
  font-size: 13px;
}
.close-button {
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  font-size: 29px;
  cursor: pointer;
}

.filter-actions {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  margin-top: 34px;
  padding: 14px 0 calc(8px + env(safe-area-inset-bottom));
  background: #fff;
}

.reset-button,
.apply-button {
  min-height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.reset-button {
  border: 1px solid #e5e0d8;
  background: #fff;
  color: #2e2a24;
}
.apply-button {
  border: 0;
  background: #ffbc00;
  color: #2e2a24;
}

.age-filter-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.age-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}


.age-input {
  width: 72px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #ded9cf;
  border-radius: 10px;
  background: #fff;
  color: #2e2a24;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  outline: none;
}

.age-input:focus {
  border-color: #b49b52;
  box-shadow: 0 0 0 2px rgba(180, 155, 82, 0.12);
}

.age-input::placeholder {
  color: #aaa39a;
  font-weight: 400;
}

.filter-label {
  display: block;
  margin-bottom: 10px;
  color: #908980;
  font-size: 13px;
}
</style>

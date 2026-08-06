<template>
  <section class="filter-section">
    <span class="filter-label">지역</span>

    <div class="region-row">
      <button type="button" class="region-select" @click="provinceOpen = true">
        <strong>{{ draft.provinceName }}</strong><span>⌄</span>
      </button>

      <button
        type="button"
        class="region-select"
        :disabled="!draft.provinceCode"
        @click="cityOpen = true"
      >
        <strong>{{ draft.cityName }}</strong><span>⌄</span>
      </button>

      <button
        type="button"
        class="region-select"
        :disabled="!draft.cityCode || districtOptions.length === 0"
        @click="districtOpen = true"
      >
        <strong>{{ draft.districtName }}</strong><span>⌄</span>
      </button>
    </div>

    <FilterOptionSheet
      v-model="provinceOpen"
      title="시·도 선택"
      all-label="전국"
      :options="provinceOptions"
      :selected-code="draft.provinceCode"
      @select="selectProvince"
    />

    <FilterOptionSheet
      v-model="cityOpen"
      title="중분류 선택"
      :options="cityOptions"
      :selected-code="draft.cityCode"
      @select="selectCity"
    />

    <FilterOptionSheet
      v-model="districtOpen"
      title="세부 지역 선택"
      :options="districtOptions"
      :selected-code="draft.districtCode"
      @select="selectDistrict"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getBenefitRegions } from "@/api/benefitApi";
import FilterOptionSheet from "./FilterOptionSheet.vue";

const props = defineProps({
  provinceCode: { type: String, default: "" },
  provinceName: { type: String, default: "전국" },
  cityCode: { type: String, default: "" },
  cityName: { type: String, default: "중분류" },
  districtCode: { type: String, default: "" },
  districtName: { type: String, default: "분류" },
});

const emit = defineEmits(["change"]);

const provinceOpen = ref(false);
const cityOpen = ref(false);
const districtOpen = ref(false);
const provinceList = ref([]);
const cityList = ref([]);
const districtList = ref([]);

const draft = reactive({
  provinceCode: "",
  provinceName: "전국",
  cityCode: "",
  cityName: "중분류",
  districtCode: "",
  districtName: "분류",
});

const simpleName = (name = "") => name.trim().split(/\s+/).at(-1) || "";
const toOption = (item) => ({ code: item.zipCd, name: simpleName(item.regionName), raw: item });
const provinceOptions = computed(() => provinceList.value.map(toOption));
const cityOptions = computed(() => cityList.value.map(toOption));
const districtOptions = computed(() => districtList.value.map(toOption));

const zipCd = computed(() => draft.districtCode || draft.cityCode || draft.provinceCode || "");

const notify = () => {
  emit("change", {
    zipCd: zipCd.value,
    provinceCode: draft.provinceCode,
    provinceName: draft.provinceName,
    cityCode: draft.cityCode,
    cityName: draft.cityName,
    districtCode: draft.districtCode,
    districtName: draft.districtName,
  });
};

const loadChildren = async (parentCode) => {
  if (!parentCode) return [];
  try {
    return await getBenefitRegions(parentCode);
  } catch (error) {
    console.error("지역 하위 목록 조회 실패:", error);
    return [];
  }
};

const selectProvince = async ({ code, name }) => {
  draft.provinceCode = code;
  draft.provinceName = code ? name : "전국";
  draft.cityCode = "";
  draft.cityName = code ? "전체" : "중분류";
  draft.districtCode = "";
  draft.districtName = "분류";
  cityList.value = code ? await loadChildren(code) : [];
  districtList.value = [];
  notify();
};

const selectCity = async ({ code, name, raw }) => {
  draft.cityCode = code;
  draft.cityName = code ? name : "전체";
  draft.districtCode = "";
  draft.districtName = code && raw?.hasChildren ? "전체" : "분류";
  districtList.value = code && raw?.hasChildren ? await loadChildren(code) : [];
  notify();
};

const selectDistrict = ({ code, name }) => {
  draft.districtCode = code;
  draft.districtName = code ? name : "전체";
  notify();
};

const restore = async () => {
  Object.assign(draft, {
    provinceCode: props.provinceCode,
    provinceName: props.provinceName,
    cityCode: props.cityCode,
    cityName: props.cityName,
    districtCode: props.districtCode,
    districtName: props.districtName,
  });

  cityList.value = props.provinceCode ? await loadChildren(props.provinceCode) : [];
  districtList.value = props.cityCode ? await loadChildren(props.cityCode) : [];
};

watch(
  () => [props.provinceCode, props.cityCode, props.districtCode],
  restore,
);

onMounted(async () => {
  try {
    provinceList.value = await getBenefitRegions();
  } catch (error) {
    console.error("시·도 조회 실패:", error);
    provinceList.value = [];
  }
  await restore();
});
</script>

<style scoped>
.filter-section { margin-top: 32px; }
.filter-label { display: block; margin-bottom: 10px; color: #908980; font-size: 13px; }
.region-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.region-select { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 6px; padding: 0 0 12px; border: 0; border-bottom: 2px solid #b5a063; background: transparent; color: #2e2a24; cursor: pointer; }
.region-select strong { overflow: hidden; font-size: 16px; text-overflow: ellipsis; white-space: nowrap; }
.region-select:disabled { border-bottom-color: #e6e2da; color: #b9b3aa; cursor: default; }
</style>

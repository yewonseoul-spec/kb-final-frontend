<template>
  <main class="benefit-main-page">
    <!-- 검색창 -->
    <button
      type="button"
      class="search-entry"
      @click="moveToSearch"
    >
      <span class="search-icon">⌕</span>

      <span> 혜택을 검색해보세요 </span>
    </button>

    <!-- 추천 방식 탭 -->
    <section class="recommendation-tabs">
      <button
        v-for="tab in recommendationTabs"
        :key="tab.value"
        type="button"
        class="recommendation-tab"
        :class="{
          active: activeRecommendation === tab.value,
        }"
        @click="changeRecommendation(tab.value)"
      >
        {{ tab.label }}
      </button>
    </section>

    <!-- 현재 프로필 필터 -->
    <section
      v-if="activeRecommendation === 'condition'"
      class="profile-filter-summary"
    >
      <div class="profile-summary-header">
        <div>
          <span class="profile-summary-label"> 나의 조건에 맞는 혜택 </span>

          <strong> {{ totalCount }}건 </strong>
        </div>

        <button
          type="button"
          class="filter-button"
          @click="isFilterOpen = true"
        >
          필터
        </button>
      </div>

      <div
        v-if="activeFilterChips.length"
        class="filter-chip-list"
      >
        <button
          v-for="chip in activeFilterChips"
          :key="chip.key"
          type="button"
          class="filter-chip"
        >
          {{ chip.label }}
        </button>
      </div>
    </section>

    <!-- 프로필 미완성 안내 배너 -->
    <button
      v-if="
        activeRecommendation === 'condition' &&
        auth.isLogin &&
        profileLoaded &&
        !isProfileComplete
      "
      type="button"
      class="profile-completion-banner"
      @click="moveToProfile"
    >
      <div class="profile-banner-header">
        <strong>프로필 입력</strong>

        <span> {{ completedProfileCount }} / 6 항목 </span>
      </div>

      <div class="profile-progress">
        <span
          v-for="index in 6"
          :key="index"
          class="profile-progress-bar"
          :class="{
            completed: index <= completedProfileCount,
          }"
        />
      </div>

      <div class="profile-banner-bottom">
        <p>
          {{ profileGuideText }}
        </p>

        <span class="profile-arrow"> › </span>
      </div>
    </button>

    <!-- 로딩 -->
    <section
      v-if="loading"
      class="state-box"
    >
      맞춤 혜택을 찾고 있어요.
    </section>

    <section
      v-if="!loading && activeRecommendation === 'consumption'"
      class="consumption-summary"
    >
      <span class="summary-eyebrow"> 소비 조건에 맞는 혜택 </span>

      <div class="summary-count">{{ totalCount }}건</div>

      <p class="consumption-message">
        {{ consumptionMessage }}
      </p>

    
    </section>

    <!-- 조건 기반 추천 -->
    <section
      v-if="
        !loading &&
        (activeRecommendation === 'condition' ||
          activeRecommendation === 'consumption')
      "
      class="benefit-list"
    >
      <BenefitCard
        v-for="item in benefitList"
        :key="item.benefitNo"
        :benefit="item"
        class="benefit-card-item"
        role="button"
        tabindex="0"
        @click="moveToDetail(item.benefitNo)"
        @keydown.enter="moveToDetail(item.benefitNo)"
      >
        <template #action>
          <button
            type="button"
            class="favorite-button"
            :class="{
              'is-on': favoriteNos.has(item.benefitNo),
            }"
            :aria-label="
              favoriteNos.has(item.benefitNo)
                ? '관심 혜택 해제'
                : '관심 혜택 등록'
            "
            :aria-pressed="favoriteNos.has(item.benefitNo)"
            @click.stop="toggleFavorite(item.benefitNo)"
          >
            {{ favoriteNos.has(item.benefitNo) ? "♥" : "♡" }}
          </button>
        </template>
      </BenefitCard>

      <div
        v-if="!benefitList.length && activeRecommendation === 'condition'"
        class="empty-box"
      >
        프로필 조건에 맞는 혜택이 없어요.
      </div>
    </section>

    <!-- 목표 기반 추천 임시 화면 -->
    <section
      v-if="!loading && activeRecommendation === 'goal'"
      class="state-box"
    >
      등록한 목표를 기반으로 혜택을 추천할 예정이에요.
    </section>

    <!-- 기존 필터 모달 재사용 -->
    <BenefitFilterModal
      v-model="isFilterOpen"
      :category-code="filter.categoryCode"
      :category-name="filter.categoryName"
      :province-code="filter.provinceCode"
      :province-name="filter.provinceName"
      :city-code="filter.cityCode"
      :city-name="filter.cityName"
      :district-code="filter.districtCode"
      :district-name="filter.districtName"
      :plcy-major-cd="filter.plcyMajorCd"
      :major-name="filter.majorName"
      :school-cd="filter.schoolCd"
      :school-name="filter.schoolName"
      :job-cd="filter.jobCd"
      :job-name="filter.jobName"
      :mrg-stts-cd="filter.mrgSttsCd"
      :marriage-name="filter.marriageName"
      :age="filter.age"
      @apply="handleApplyFilter"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";

import { useRoute, useRouter } from "vue-router";

import {
  getBenefit,
  getBenefitProfileFilter,
  getConsumptionRecommendedBenefits,
} from "@/api/benefitApi";

import BenefitCard from "@/components/benefit/BenefitCard.vue";

import BenefitFilterModal from "@/components/benefit/BenefitFilterModal.vue";
import mypageApi from "@/api/mypageApi";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const consumptionMessage = ref("");
const consumptionCategories = ref([]);

const recommendationTabs = [
  {
    label: "조건 기반 추천",
    value: "condition",
  },
  {
    label: "소비 기반 추천",
    value: "consumption",
  },
  {
    label: "목표 기반 추천",
    value: "goal",
  },
];

const validTabs = ["condition", "consumption", "goal"];

const getTabFromRoute = () => {
  const tab = route.query.tab;

  return validTabs.includes(tab) ? tab : "condition";
};

const activeRecommendation = ref(getTabFromRoute());

const isFilterOpen = ref(false);
const loading = ref(false);

const conditionBenefits = ref([]);
const conditionTotalCount = ref(0);

const consumptionBenefits = ref([]);
const consumptionTotalCount = ref(0);

const benefitList = computed(() => {
  if (activeRecommendation.value === "consumption") {
    return consumptionBenefits.value;
  }

  if (activeRecommendation.value === "condition") {
    return conditionBenefits.value;
  }

  return [];
});

const totalCount = computed(() => {
  if (activeRecommendation.value === "consumption") {
    return consumptionTotalCount.value;
  }

  if (activeRecommendation.value === "condition") {
    return conditionTotalCount.value;
  }

  return 0;
});
const favoriteNos = ref(new Set());
const pendingNos = ref(new Set());
const profileLoaded = ref(false);

const filter = reactive({
  // 카테고리는 기본 전체
  categoryCode: "",
  categoryName: "전체",

  provinceCode: "",
  provinceName: "전국",

  cityCode: "",
  cityName: "",

  districtCode: "",
  districtName: "",

  plcyMajorCd: "",
  majorName: "전체",

  schoolCd: "",
  schoolName: "전체",

  jobCd: "",
  jobName: "전체",

  mrgSttsCd: "",
  marriageName: "전체",

  age: null,
});

const apiParams = computed(() => {
  /*
   * 지역은 현재 프로필의 region_code를
   * provinceCode에 저장하는 구조다.
   */
  const zipCd =
    filter.districtCode || filter.cityCode || filter.provinceCode || undefined;

  return {
    categoryCode: filter.categoryCode || undefined,

    zipCd,

    plcyMajorCd: filter.plcyMajorCd || undefined,

    schoolCd: filter.schoolCd || undefined,

    jobCd: filter.jobCd || undefined,

    mrgSttsCd: filter.mrgSttsCd || undefined,

    age: filter.age ?? undefined,
  };
});

const selectedRegionLabel = computed(() => {
  const regionNames = [];

  if (
    filter.provinceCode &&
    filter.provinceName &&
    filter.provinceName !== "전국"
  ) {
    regionNames.push(filter.provinceName);
  }

  if (
    filter.cityCode &&
    filter.cityName
  ) {
    regionNames.push(filter.cityName);
  }

  if (
    filter.districtCode &&
    filter.districtName &&
    filter.districtName !== "분류"
  ) {
    regionNames.push(filter.districtName);
  }

  return regionNames.join(" ");
});

const activeFilterChips = computed(() => {
  const chips = [];

  // 지역
  if (selectedRegionLabel.value && selectedRegionLabel.value !== "전국") {
    chips.push({
      key: "region",
      label: selectedRegionLabel.value,
    });
  }

  if (filter.age !== null && filter.age !== undefined && filter.age !== "") {
    chips.push({
      key: "age",
      label: `만 ${filter.age}세`,
    });
  }

  if (filter.majorName && filter.majorName !== "전체") {
    chips.push({
      key: "major",
      label: filter.majorName,
    });
  }

  if (filter.schoolName && filter.schoolName !== "전체") {
    chips.push({
      key: "school",
      label: filter.schoolName,
    });
  }

  if (filter.jobName && filter.jobName !== "전체") {
    chips.push({
      key: "job",
      label: filter.jobName,
    });
  }

  if (filter.marriageName && filter.marriageName !== "전체") {
    chips.push({
      key: "marriage",
      label: filter.marriageName,
    });
  }

  return chips;
});

const profileItems = computed(() => [
  {
    label: "거주지역",
    completed: !!filter.provinceCode,
  },
  {
    label: "나이",
    completed: filter.age != null,
  },
  {
    label: "전공",
    completed: !!filter.plcyMajorCd,
  },
  {
    label: "학력",
    completed: !!filter.schoolCd,
  },
  {
    label: "취업상태",
    completed: !!filter.jobCd,
  },
  {
    label: "혼인 여부",
    completed: !!filter.mrgSttsCd,
  },
]);

const completedProfileCount = computed(
  () => profileItems.value.filter((item) => item.completed).length,
);

const isProfileComplete = computed(() => completedProfileCount.value === 6);

const missingProfileLabels = computed(() =>
  profileItems.value
    .filter((item) => !item.completed)
    .map((item) => item.label),
);

const profileGuideText = computed(() => {
  if (!missingProfileLabels.value.length) {
    return "프로필을 모두 입력했어요.";
  }

  return `${missingProfileLabels.value.join(
    ", ",
  )}을 입력하면 맞춤 혜택 추천이 더 정확해져요.`;
});

const moveToProfile = () => {
  router.push("/mypage/profile");
};

const applyProfileFilter = (profile) => {
  /*
   * 프로필 region_code가
   * 41000처럼 시도 단위이므로
   * provinceCode에 설정한다.
   */
  filter.provinceCode = profile.provinceCode || profile.zipCd || "";

  filter.provinceName = profile.provinceName || profile.regionName || "전국";

  filter.cityCode = profile.cityCode || "";

  filter.cityName = profile.cityName || "";

  filter.districtCode = profile.districtCode || "";

  filter.districtName = profile.districtName || "";

  filter.age = profile.age ?? null;

  filter.plcyMajorCd = profile.plcyMajorCd || "";

  filter.majorName = profile.majorName || "전체";

  filter.schoolCd = profile.schoolCd || "";

  filter.schoolName = profile.schoolName || "전체";

  filter.jobCd = profile.jobCd || "";

  filter.jobName = profile.jobName || "전체";

  filter.mrgSttsCd = profile.mrgSttsCd || "";

  filter.marriageName = profile.marriageName || "전체";

  filter.categoryCode = "";
  filter.categoryName = "전체";
};

const loadBenefits = async () => {
  loading.value = true;

  try {
    const response = await getBenefit(apiParams.value);

    const benefits = Array.isArray(response)
      ? response
      : response.content || response.list || response.benefits || [];

    const activeBenefits = benefits.filter(
      (item) => item.benefitStatus !== "CLOSED",
    );

    conditionBenefits.value = activeBenefits;

    conditionTotalCount.value = activeBenefits.length;
  } catch (error) {
    console.error("맞춤 혜택 조회 실패:", error);

    conditionBenefits.value = [];
    conditionTotalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

const loadProfileRecommendation = async () => {
  loading.value = true;
  profileLoaded.value = false;

  try {
    if (!auth.isLogin) {
      await loadBenefits();
      return;
    }

    const profile = await getBenefitProfileFilter();

    applyProfileFilter(profile);

    await loadBenefits();
  } catch (error) {
    console.error("프로필 기본 필터 조회 실패:", error);

    /*
     * 프로필이 없거나 비로그인 상태라면
     * 전체 혜택으로 대체
     */
    await loadBenefits();
  } finally {
    profileLoaded.value = true;
    loading.value = false;
  }
};

const loadFavorites = async () => {
  if (!auth.isLogin) return;

  try {
    const list = await mypageApi.getFavoriteBenefits();

    favoriteNos.value = new Set(list.map((item) => item.benefitNo));
  } catch (error) {
    favoriteNos.value = new Set();

    console.error("관심 혜택 조회 실패:", error);
  }
};

const ensureProfileFilter = async () => {
  if (!auth.isLogin) {
    return;
  }

  if (profileLoaded.value) {
    return;
  }

  try {
    const profile = await getBenefitProfileFilter();

    applyProfileFilter(profile);

    profileLoaded.value = true;
  } catch (error) {
    console.error("프로필 기본 필터 조회 실패:", error);

    profileLoaded.value = true;
  }
};

const handleApplyFilter = async (appliedFilter) => {
  Object.assign(filter, appliedFilter);

  if (filter.age === "") {
    filter.age = null;
  }

  isFilterOpen.value = false;

  await loadBenefits();
};

const changeRecommendation = async (type) => {
  await router.replace({
    query: {
      ...route.query,
      tab: type,
    },
  });
};

watch(
  () => route.query.tab,

  async (newTab) => {
    const tab = validTabs.includes(newTab) ? newTab : "condition";

    activeRecommendation.value = tab;

    if (tab === "condition") {
      await loadProfileRecommendation();
      return;
    }

    if (tab === "consumption") {
      await loadConsumptionRecommendation();
      return;
    }

    if (tab === "goal") {
      return;
    }
  },
);

const moveToSearch = () => {
  router.push({
    name: "BenefitSearch",
  });
};

const moveToDetail = (benefitNo) => {
  router.push({
    name: "benefit-detail",
    params: {
      benefitNo,
    },
  });
};

const toggleFavorite = async (benefitNo) => {
  if (pendingNos.value.has(benefitNo)) {
    return;
  }

  pendingNos.value.add(benefitNo);

  const wasFavorite = favoriteNos.value.has(benefitNo);

  // 화면의 하트를 먼저 변경
  if (wasFavorite) {
    favoriteNos.value.delete(benefitNo);
  } else {
    favoriteNos.value.add(benefitNo);
  }

  try {
    if (wasFavorite) {
      await mypageApi.deleteFavoriteBenefit(benefitNo);
    } else {
      await mypageApi.createFavoriteBenefit(benefitNo);
    }
  } catch (error) {
    // 삭제 요청의 404는 이미 삭제된 상태이므로 그대로 둠
    if (error.response?.status !== 404) {
      // API 실패 시 하트 원상복구
      if (wasFavorite) {
        favoriteNos.value.add(benefitNo);
      } else {
        favoriteNos.value.delete(benefitNo);
      }
    }

    console.error("관심 혜택 변경 실패:", error);
  } finally {
    pendingNos.value.delete(benefitNo);
  }
};

watch(
  () => route.query.tab,
  async (newTab, oldTab) => {
    const tab = validTabs.includes(newTab) ? newTab : "condition";

    if (newTab === oldTab && activeRecommendation.value === tab) {
      return;
    }

    activeRecommendation.value = tab;

    if (tab === "condition") {
      await loadProfileRecommendation();
      return;
    }

    if (tab === "consumption") {
      await loadConsumptionRecommendation();
      return;
    }

    benefitList.value = [];
    totalCount.value = 0;
    consumptionMessage.value = "";
    consumptionCategories.value = [];
  },
);

//소비기반 추천함수
const loadConsumptionRecommendation = async () => {
  loading.value = true;

  try {
    // 소비기반도 프로필 기본값 준비
    await ensureProfileFilter();

    const response = await getConsumptionRecommendedBenefits(apiParams.value);

    const benefits = Array.isArray(response?.benefits) ? response.benefits : [];

    consumptionBenefits.value = benefits.filter(
      (item) => item.benefitStatus !== "CLOSED",
    );

    consumptionTotalCount.value = consumptionBenefits.value.length;

    consumptionMessage.value = response?.message || "";

    consumptionCategories.value = Array.isArray(response?.spendingCategories)
      ? response.spendingCategories
      : [];
  } catch (error) {
    console.error("소비 기반 추천 조회 실패:", error);

    consumptionBenefits.value = [];
    consumptionTotalCount.value = 0;

    consumptionMessage.value = "소비 기반 추천을 불러오지 못했어요.";

    consumptionCategories.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadFavorites();

  const tab = getTabFromRoute();

  activeRecommendation.value = tab;

  if (tab === "condition") {
    await loadProfileRecommendation();
    return;
  }

  if (tab === "consumption") {
    await loadConsumptionRecommendation();
  }
});
</script>

<style scoped>
.benefit-main-page {
  min-height: 100%;
  padding: 20px 18px 110px;
  background: #ffffff;
  color: #2e2a24;
}

.search-entry {
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  padding: 0 16px;
  border: 0;
  border-radius: 16px;
  background: #f4f1eb;
  color: #9b958c;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.search-icon {
  margin-right: 10px;
  color: #4f4941;
}

.recommendation-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-top: 14px;
  padding: 5px;
  border-radius: 11px;
  background: #f0f1f3;
}

.recommendation-tab {
  min-height: 36px;
  padding: 0 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #99948b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.recommendation-tab.active {
  background: #ffffff;
  color: #312d27;
  box-shadow: 0 2px 8px rgba(55, 50, 43, 0.1);
}

.profile-filter-summary {
  margin-top: 14px;
}

.profile-summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.profile-summary-header > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.profile-summary-label {
  color: #8b847b;
  font-size: 12px;
}

.profile-summary-header strong {
  font-size: 17px;
}

.filter-button {
  min-width: 52px;
  height: 36px;
  padding: 0 15px;
  border: 0;
  border-radius: 18px;
  background: #ffbc00;
  color: #2e2a24;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.filter-chip-list {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-bottom: 3px;
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-chip-list::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  flex-shrink: 0;
  height: 32px;
  padding: 0 13px;
  border: 1px solid #e3ddd2;
  border-radius: 17px;
  background: #fffaf0;
  color: #675f55;
  font-size: 11px;
  cursor: pointer;
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 15px;
}

.benefit-card-item {
  cursor: pointer;
}

.favorite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #6f685f;
  font-size: 26px;
  cursor: pointer;
}
.favorite-button.is-on {
  color: #d64545;
}

.state-box,
.empty-box {
  padding: 80px 20px;
  color: #928b82;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

.profile-completion-banner {
  width: 100%;
  margin-top: 14px;
  padding: 16px;
  border: 1px solid #f3b400;
  border-radius: 16px;
  background: #fffdf7;
  color: #2e2a24;
  text-align: left;
  cursor: pointer;
}

.profile-banner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.profile-banner-header strong {
  font-size: 14px;
  font-weight: 700;
}

.profile-banner-header span {
  color: #756f67;
  font-size: 11px;
}

.profile-progress {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}

.profile-progress-bar {
  width: 24px;
  height: 5px;
  border-radius: 3px;
  background: #ebe8e1;
}

.profile-progress-bar.completed {
  background: #f5b400;
}

.profile-banner-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.profile-banner-bottom p {
  margin: 0;
  color: #827b72;
  font-size: 11px;
  line-height: 1.6;
}

.profile-arrow {
  flex-shrink: 0;
  color: #b0a89e;
  font-size: 20px;
}

.consumption-summary {
  margin-top: 15px;
  padding: 0 2px;
}

.summary-eyebrow {
  display: block;
  margin-bottom: 3px;
  color: #8c847a;
  font-size: 11px;
}

.summary-count {
  color: #2e2a24;
  font-size: 17px;
  font-weight: 750;
}

.consumption-message {
  margin: 11px 0 0;
  padding: 13px 14px;
  border-radius: 12px;
  background: #fff9e8;
  color: #625a50;
  font-size: 12px;
  line-height: 1.55;
  word-break: keep-all;
}

.consumption-chip-list {
  display: flex;
  gap: 7px;
  margin-top: 9px;
  overflow-x: auto;
  scrollbar-width: none;
}

.consumption-chip-list::-webkit-scrollbar {
  display: none;
}

.consumption-chip {
  flex-shrink: 0;
  padding: 7px 11px;
  border: 1px solid #eadfca;
  border-radius: 16px;
  background: #fff;
  color: #685f53;
  font-size: 11px;
  white-space: nowrap;
}
</style>

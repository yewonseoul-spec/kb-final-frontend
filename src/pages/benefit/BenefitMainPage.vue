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

    <!-- 로딩 -->
    <section
      v-if="loading"
      class="state-box"
    >
      맞춤 혜택을 찾고 있어요.
    </section>

    <!-- 조건 기반 추천 -->
    <section
      v-else-if="activeRecommendation === 'condition'"
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
        v-if="!benefitList.length"
        class="empty-box"
      >
        프로필 조건에 맞는 혜택이 없어요.
      </div>
    </section>

    <!-- 소비 기반 추천 임시 화면 -->
    <section
      v-else-if="activeRecommendation === 'consumption'"
      class="state-box"
    >
      소비 내역을 기반으로 받을 수 있는 혜택을 추천할 예정이에요.
    </section>

    <!-- 목표 기반 추천 임시 화면 -->
    <section
      v-else-if="activeRecommendation === 'goal'"
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

import { getBenefit, getBenefitProfileFilter } from "@/api/benefitApi";

import BenefitCard from "@/components/benefit/BenefitCard.vue";

import BenefitFilterModal from "@/components/benefit/BenefitFilterModal.vue";
import mypageApi from "@/api/mypageApi";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

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

const benefitList = ref([]);
const totalCount = ref(0);
const favoriteNos = ref(new Set());
const pendingNos = ref(new Set());

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

const activeFilterChips = computed(() => {
  const chips = [];

  if (filter.provinceName && filter.provinceName !== "전국") {
    chips.push({
      key: "region",
      label: filter.provinceName,
    });
  }

  if (filter.age != null) {
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

const applyProfileFilter = (profile) => {
  /*
   * 프로필 region_code가
   * 41000처럼 시도 단위이므로
   * provinceCode에 설정한다.
   */
  filter.provinceCode = profile.zipCd || "";

  filter.provinceName = profile.regionName || "전국";

  filter.cityCode = "";
  filter.cityName = "";

  filter.districtCode = "";
  filter.districtName = "";

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

    /*
     * 현재 목록 API 응답 구조에 맞춰
     * 한 가지를 사용하면 된다.
     */
    if (Array.isArray(response)) {
  const activeBenefits = response.filter(
    (item) => item.benefitStatus !== "CLOSED"
  );

  benefitList.value = activeBenefits;
  totalCount.value = activeBenefits.length;
  return;
}

const benefits =
  response.content
  || response.list
  || response.benefits
  || [];

const activeBenefits = benefits.filter(
  (item) => item.benefitStatus !== "CLOSED"
);

benefitList.value = activeBenefits;
totalCount.value = activeBenefits.length;
  } catch (error) {
    console.error("맞춤 혜택 조회 실패:", error);

    benefitList.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

const loadProfileRecommendation = async () => {
  loading.value = true;

  try {
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

const handleApplyFilter = async (appliedFilter) => {
  Object.assign(filter, appliedFilter);

  isFilterOpen.value = false;

  await loadBenefits();
};

const changeRecommendation = async (type) => {
  if (!validTabs.includes(type)) {
    return;
  }

  activeRecommendation.value = type;

  await router.replace({
    path: "/benefit",
    query: {
      tab: type,
    },
  });

  if (type === "condition") {
    await loadBenefits();
  }
};

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
  async (newTab) => {
    const tab = validTabs.includes(newTab) ? newTab : "condition";

    activeRecommendation.value = tab;

    if (tab === "condition") {
      await loadBenefits();
    }
  },
);

onMounted(async () => {
  const tab = getTabFromRoute();

  activeRecommendation.value = tab;

  await loadFavorites();

  if (tab === "condition") {
    await loadProfileRecommendation();
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
</style>

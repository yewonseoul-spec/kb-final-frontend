<template>
  <main class="result-page">
    <header class="result-header">
      <div>
        <p class="result-eyebrow">청년혜택</p>
        <h1>검색 결과</h1>
      </div>

      <KbButton
        type="secondary"
        size="small"
        @click="isFilterOpen = true"
      >
        필터
      </KbButton>
    </header>

    <section class="search-summary">
      <p class="summary-text">
        <template v-if="keyword"
          ><strong>“{{ keyword }}”</strong> 검색 결과</template
        >
        <template v-else>전체 검색 결과</template>
      </p>
      <strong class="result-count">{{ benefit.length }}건</strong>
    </section>

    <AppliedFilterChips
      :filters="activeFilters"
      @remove="removeFilter"
    />

    <section
      v-if="isLoading"
      class="state-card"
    >
      <div class="loading-spinner" />
      <p>혜택을 불러오고 있어요.</p>
    </section>

    <section
      v-else-if="benefit.length === 0"
      class="state-card"
    >
      <p class="empty-title">조건에 맞는 혜택이 없어요.</p>
      <p>검색어나 필터 조건을 변경해서 다시 확인해 보세요.</p>
    </section>

    <section
      v-else
      class="benefit-list"
      aria-label="혜택 검색 결과"
    >
      <BenefitCard
        v-for="item in benefit"
        :key="item.benefitNo"
        :benefit="item"
      />
    </section>

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
      @apply="handleApplyFilter"
    />
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getBenefit } from "@/api/benefitApi";
import KbButton from "@/components/common/KbButton.vue";
import BenefitCard from "@/components/benefit/BenefitCard.vue";
import BenefitFilterModal from "@/components/benefit/BenefitFilterModal.vue";
import AppliedFilterChips from "@/components/benefit/filter/AppliedFilterChips.vue";
import { useBenefitFilter } from "./useBenefitFilter";

const route = useRoute();
const router = useRouter();
const keyword = ref(route.query.keyword ?? "");
const isFilterOpen = ref(false);
const isLoading = ref(false);
const benefit = ref([]);

const { filter, activeFilters, apiParams, queryParams, apply, clear } =
  useBenefitFilter(route);

const loadBenefit = async () => {
  isLoading.value = true;
  try {
    benefit.value = await getBenefit({
      keyword: keyword.value || undefined,
      ...apiParams.value,
    });
  } catch (error) {
    console.error("혜택 조회 실패:", error);
    benefit.value = [];
  } finally {
    isLoading.value = false;
  }
};

const syncQueryAndReload = async () => {
  await router.replace({
    query: {
      ...route.query,
      keyword: keyword.value || undefined,
      ...queryParams.value,
    },
  });
  await loadBenefit();
};

const handleApplyFilter = async (nextFilter) => {
  apply(nextFilter);
  await syncQueryAndReload();
};

const removeFilter = async (key) => {
  clear(key);
  await syncQueryAndReload();
};

onMounted(loadBenefit);
</script>

<style scoped>
.result-page {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  padding: 28px 20px 112px;
  background: #fff;
  color: #2e2a24;
  font-family: "Pretendard", sans-serif;
}

.result-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.result-eyebrow {
  margin: 0 0 5px;
  color: #b6964d;
  font-size: 12px;
  font-weight: 700;
}
.result-header h1 {
  margin: 0;
  font-size: 27px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.04em;
}
.search-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: #f8f7f2;
}
.summary-text {
  margin: 0;
  color: #696158;
  font-size: 13px;
}
.summary-text strong {
  color: #2e2a24;
}
.result-count {
  flex-shrink: 0;
  font-size: 16px;
}
.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.state-card {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  border: 1px solid #efece4;
  border-radius: 14px;
  text-align: center;
}
.state-card p {
  margin: 12px 0 0;
  color: #908980;
  font-size: 13px;
}
.empty-title {
  color: #2e2a24 !important;
  font-size: 16px !important;
  font-weight: 700;
}
.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #efece4;
  border-top-color: #ffbc00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 360px) {
  .result-page {
    padding-right: 16px;
    padding-left: 16px;
  }
  .search-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

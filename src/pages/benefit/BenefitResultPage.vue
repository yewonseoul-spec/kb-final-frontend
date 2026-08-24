<template>
  <main class="result-page">
    <form class="result-search-form" @submit.prevent="submitKeyword">
      <span class="search-icon">⌕</span>

      <input
        v-model.trim="keyword"
        type="search"
        class="result-search-input"
        placeholder="혜택을 검색해보세요"
        aria-label="혜택 검색어"
      />

      <button
        v-if="keyword"
        type="button"
        class="search-clear-button"
        aria-label="검색어 지우기"
        @click="clearKeyword"
      >
        ×
      </button>
    </form>

    <header class="result-header">
      <div>
        <p class="result-eyebrow">청년혜택</p>
        <h1>검색 결과</h1>
      </div>

    <button
          type="button"
          class="filter-button"
          @click="isFilterOpen = true"
        >
          필터
        </button>
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

    <AppliedFilterChips :filters="activeFilters" @remove="removeFilter" />

    <section v-if="isLoading" class="state-card">
      <div class="loading-spinner" />
      <p>혜택을 불러오고 있어요.</p>
    </section>

    <section v-else-if="benefit.length === 0" class="state-card">
      <p class="empty-title">조건에 맞는 혜택이 없어요.</p>
      <p>검색어나 필터 조건을 변경해서 다시 확인해 보세요.</p>
    </section>

    <section v-else class="benefit-list" aria-label="혜택 검색 결과">
      <BenefitCard
        v-for="item in benefit"
        :key="item.benefitNo"
        :benefit="item"
        role="button"
        tabindex="0"
        @click="moveToDetail(item.benefitNo)"
        @keydown.enter="moveToDetail(item.benefitNo)"
      >
        <template #action>
          <button
            type="button"
            class="favorite-button"
            :class="{ 'is-on': favoriteNos.has(item.benefitNo) }"
            :aria-label="
              favoriteNos.has(item.benefitNo)
                ? '관심 혜택 해제'
                : '관심 혜택 등록'
            "
            :aria-pressed="favoriteNos.has(item.benefitNo)"
            @click="toggleFavorite(item.benefitNo)"
          >
            {{ favoriteNos.has(item.benefitNo) ? '♥' : '♡' }}
          </button>
        </template>
      </BenefitCard>
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
      :mrg-stts-cd="filter.mrgSttsCd"
      :marriage-name="filter.marriageName"
      :age="filter.age"
      @apply="handleApplyFilter"
    />
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getBenefit } from '@/api/benefitApi';
import BenefitCard from '@/components/benefit/BenefitCard.vue';
import BenefitFilterModal from '@/components/benefit/BenefitFilterModal.vue';
import AppliedFilterChips from '@/components/benefit/filter/AppliedFilterChips.vue';
import { useBenefitFilter } from './useBenefitFilter';
import mypageApi from '@/api/mypageApi';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const keyword = ref(route.query.keyword ?? '');
const isFilterOpen = ref(false);
const isLoading = ref(false);
const benefit = ref([]);
const auth = useAuthStore();

const { filter, activeFilters, apiParams, queryParams, apply, clear } =
  useBenefitFilter(route);

// 하트 상태는 검색 API 응답에 넣지 않는다(도메인이 섞인다).
// 대신 내 관심 목록을 한 번 받아 benefitNo 집합으로 대조한다.
const favoriteNos = ref(new Set());
const pendingNos = ref(new Set());

const loadFavorites = async () => {
  // 비로그인이면 호출 자체를 하지 않는다. 401 이 나면 인터셉터가 로그인 화면으로
  // 보내버려서, 공개 화면인 검색 결과를 로그인 없이 못 보게 된다.
  if (!auth.isLogin) return;
  try {
    const list = await mypageApi.getFavoriteBenefits();
    favoriteNos.value = new Set(list.map((item) => item.benefitNo));
  } catch (error) {
    // 목록을 못 받아도 검색 결과는 보여야 한다. 하트만 빈 상태로 둔다.
    favoriteNos.value = new Set();
  }
};

const toggleFavorite = async (benefitNo) => {
  // 연타로 요청이 겹치는 것을 막는다. 서버는 멱등이지만 화면 상태가 흔들린다.
  if (pendingNos.value.has(benefitNo)) return;
  pendingNos.value.add(benefitNo);

  const wasFavorite = favoriteNos.value.has(benefitNo);

  // 낙관적 갱신 — 하트는 즉각 반응해야 한다. 실패하면 아래에서 되돌린다.
  if (wasFavorite) favoriteNos.value.delete(benefitNo);
  else favoriteNos.value.add(benefitNo);

  try {
    if (wasFavorite) await mypageApi.deleteFavoriteBenefit(benefitNo);
    else await mypageApi.createFavoriteBenefit(benefitNo);
  } catch (error) {
    // 404 는 이미 해제돼 있었다는 뜻이라 원하던 결과와 같다. 되돌리지 않는다.
    if (error.response?.status !== 404) {
      if (wasFavorite) favoriteNos.value.add(benefitNo);
      else favoriteNos.value.delete(benefitNo);
    }
  } finally {
    pendingNos.value.delete(benefitNo);
  }
};

const loadBenefit = async () => {
  isLoading.value = true;
  try {
    benefit.value = await getBenefit({
      keyword: keyword.value || undefined,
      ...apiParams.value,
    });
  } catch (error) {
    console.error('혜택 조회 실패:', error);
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

const submitKeyword = async () => {
  await syncQueryAndReload();
};

const clearKeyword = async () => {
  keyword.value = '';
  await syncQueryAndReload();
};

// 혜택 상세 페이지
const moveToDetail = async (benefitNo) => {
  await router.push({
    name: 'benefit-detail',
    params: {
      benefitNo,
    },
  });
};

onMounted(() => {
  loadBenefit();
  loadFavorites();
});
</script>

<style scoped>
.result-page {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  padding: 28px 20px 112px;
  background: #fff;
  color: #2e2a24;
  font-family: 'Pretendard', sans-serif;
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
.favorite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #6f685f;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}
.favorite-button.is-on {
  color: #d64545;
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

.result-search-form {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  margin-bottom: 18px;
  padding: 0 42px;
  border-radius: 16px;
  background: #f7f5ef;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  color: #4f4b44;
  font-size: 18px;
  transform: translateY(-50%);
}

.result-search-input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #2d2923;
  font-size: 15px;
  font-weight: 600;
}

.result-search-input::placeholder {
  color: #9d978d;
  font-weight: 400;
}

.result-search-input::-webkit-search-cancel-button {
  display: none;
}

.search-clear-button {
  position: absolute;
  right: 14px;
  top: 50%;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #716b62;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transform: translateY(-50%);
}

.result-heading-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.result-summary-text {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  color: #2d2923;
  font-size: 15px;
  font-weight: 600;
}

.result-summary-text strong {
  font-size: 16px;
}

.filter-button {
  min-width: 54px;
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 20px;
  background: #ffbc00;
  color: #26221c;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

</style>

<template>
  <main class="benefit-search-page">
    <form
      class="search-form"
      @submit.prevent="submitSearch"
    >
      <span class="search-icon">
        ⌕
      </span>

      <input
        ref="searchInput"
        v-model="keyword"
        type="search"
        class="search-input"
        maxlength="50"
        autocomplete="off"
        placeholder="혜택을 검색해보세요"
        aria-label="혜택 검색어"
      />

      <button
        v-if="keyword"
        type="button"
        class="clear-input-button"
        aria-label="검색어 지우기"
        @click="clearInput"
      >
        ×
      </button>
    </form>

    <section class="search-section">
      <div class="section-header">
        <h2>추천 검색어</h2>

        <button
          type="button"
          class="filter-button"
          @click="isFilterOpen = true"
        >
          필터
        </button>
      </div>

      <div
        v-if="recommendedKeywords.length"
        class="recommended-list"
      >
        <button
          v-for="item in recommendedKeywords"
          :key="item.keywordCode"
          type="button"
          class="recommended-chip"
          @click="
            searchByKeyword(item.keywordName)
          "
        >
          {{ item.keywordName }}
        </button>
      </div>

      <p
        v-else-if="!loadingRecommended"
        class="empty-message"
      >
        등록된 추천 검색어가 없어요.
      </p>
    </section>

    <section class="search-section">
      <div class="section-header">
        <h2>최근 검색어</h2>

        <button
          v-if="recentKeywords.length"
          type="button"
          class="delete-all-button"
          @click="removeAllRecentKeywords"
        >
          전체 삭제
        </button>
      </div>

      <ul
        v-if="recentKeywords.length"
        class="recent-list"
      >
        <li
          v-for="recentKeyword in recentKeywords"
          :key="recentKeyword"
          class="recent-item"
        >
          <button
            type="button"
            class="recent-keyword-button"
            @click="
              searchByKeyword(recentKeyword)
            "
          >
            {{ recentKeyword }}
          </button>

          <button
            type="button"
            class="recent-delete-button"
            :aria-label="
              `${recentKeyword} 검색어 삭제`
            "
            @click.stop="
              removeRecentKeyword(recentKeyword)
            "
          >
            ×
          </button>
        </li>
      </ul>

      <p
        v-else-if="!loadingRecent"
        class="empty-message"
      >
        최근 검색어가 없어요.
      </p>
    </section>

    <!-- ResultPage에서 사용한 동일 필터 모달 -->
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
import {
  nextTick,
  onMounted,
  ref,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import BenefitFilterModal from
  "@/components/benefit/BenefitFilterModal.vue";

import {
  deleteAllRecentKeywords,
  deleteRecentKeyword,
  getRecentKeywords,
  getRecommendedKeywords,
  saveRecentKeyword,
} from "@/api/benefitApi";

import { useBenefitFilter } from
  "./useBenefitFilter";

const router = useRouter();
const route = useRoute();

const {
  filter,
  queryParams,
  apply,
} = useBenefitFilter(route);

const searchInput = ref(null);

const keyword = ref(
  String(route.query.keyword ?? ""),
);

const recommendedKeywords = ref([]);
const recentKeywords = ref([]);

const isFilterOpen = ref(false);

const loadingRecommended = ref(false);
const loadingRecent = ref(false);
const submitting = ref(false);

const normalizeKeyword = (value) => {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
};

const loadRecommendedKeywords = async () => {
  loadingRecommended.value = true;

  try {
    const data =
      await getRecommendedKeywords();

    recommendedKeywords.value =
      Array.isArray(data)
        ? data
        : [];
  } catch (error) {
    console.error(
      "추천 검색어 조회 실패:",
      error,
    );

    recommendedKeywords.value = [];
  } finally {
    loadingRecommended.value = false;
  }
};

const loadRecentKeywords = async () => {
  loadingRecent.value = true;

  try {
    const data = await getRecentKeywords();

    recentKeywords.value =
      Array.isArray(data)
        ? data
        : [];
  } catch (error) {
    console.error(
      "최근 검색어 조회 실패:",
      error,
    );

    recentKeywords.value = [];
  } finally {
    loadingRecent.value = false;
  }
};

const moveToResultPage = async (
  searchKeyword,
) => {
  await router.push({
    path: "/benefit/result",

    query: {
      ...queryParams.value,
      keyword: searchKeyword,
    },
  });
};

const submitSearch = async () => {
  const normalizedKeyword =
    normalizeKeyword(keyword.value);

  if (
    !normalizedKeyword ||
    submitting.value
  ) {
    return;
  }

  submitting.value = true;
  keyword.value = normalizedKeyword;

  try {
    /*
     * 로그인한 사용자라면 백엔드가
     * Principal에서 member_no를 조회하고
     * Redis에 사용자별로 저장한다.
     */
    await saveRecentKeyword(
      normalizedKeyword,
    );
  } catch (error) {
    /*
     * 최근 검색어 저장에 실패해도
     * 검색 결과 페이지 이동은 진행한다.
     */
    console.error(
      "최근 검색어 저장 실패:",
      error,
    );
  } finally {
    submitting.value = false;
  }

  await moveToResultPage(
    normalizedKeyword,
  );
};

const searchByKeyword = async (
  selectedKeyword,
) => {
  keyword.value =
    normalizeKeyword(selectedKeyword);

  await submitSearch();
};

const clearInput = async () => {
  keyword.value = "";

  await nextTick();

  searchInput.value?.focus();
};

const handleApplyFilter = (
  nextFilter,
) => {
  apply(nextFilter);
  isFilterOpen.value = false;
};

const removeRecentKeyword = async (
  recentKeyword,
) => {
  try {
    await deleteRecentKeyword(
      recentKeyword,
    );

    recentKeywords.value =
      recentKeywords.value.filter(
        (item) =>
          item !== recentKeyword,
      );
  } catch (error) {
    console.error(
      "최근 검색어 삭제 실패:",
      error,
    );
  }
};

const removeAllRecentKeywords =
  async () => {
    try {
      await deleteAllRecentKeywords();

      recentKeywords.value = [];
    } catch (error) {
      console.error(
        "최근 검색어 전체 삭제 실패:",
        error,
      );
    }
  };

const goBack = () => {
  router.back();
};

onMounted(async () => {
  await Promise.all([
    loadRecommendedKeywords(),
    loadRecentKeywords(),
  ]);

  await nextTick();

  searchInput.value?.focus();
});
</script>

<style scoped>
.benefit-search-page {
  min-height: 100%;
  padding: 22px 20px 100px;
  background: #faf9f5;
  color: #29251f;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.search-header h1 {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #514c44;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
}

.search-form {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  margin-bottom: 28px;
  padding: 0 44px;
  border-radius: 16px;
  background: #f1eee7;
}

.search-icon {
  position: absolute;
  left: 17px;
  top: 50%;
  color: #5f5a52;
  font-size: 18px;
  transform: translateY(-50%);
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #29251f;
  font-size: 15px;
  font-weight: 600;
}

.search-input::placeholder {
  color: #9c958b;
  font-weight: 400;
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.clear-input-button {
  position: absolute;
  right: 13px;
  top: 50%;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #625d55;
  font-size: 21px;
  cursor: pointer;
  transform: translateY(-50%);
}

.search-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
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

.recommended-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.recommended-chip {
  min-width: 66px;
  height: 40px;
  padding: 0 18px;
  border: 1px solid #e2ddd3;
  border-radius: 22px;
  background: #ffffff;
  color: #4d4840;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.recommended-chip:active {
  border-color: #756e63;
  background: #756e63;
  color: #ffffff;
}

.delete-all-button {
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #8e877d;
  font-size: 12px;
  cursor: pointer;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.recent-item {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 12px 0 16px;
  border: 1px solid #e1dcd2;
  border-radius: 12px;
  background: #ffffff;
}

.recent-keyword-button {
  flex: 1;
  padding: 14px 0;
  border: 0;
  background: transparent;
  color: #39342e;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.recent-delete-button {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #716b63;
  font-size: 20px;
  cursor: pointer;
}

.empty-message {
  margin: 8px 0 0;
  color: #a0998f;
  font-size: 13px;
}
</style>
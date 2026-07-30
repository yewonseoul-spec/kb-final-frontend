<template>
  <main class="result-page">
    <header class="result-header">
      <h1>검색 결과</h1>
    </header>

    <section class="search-summary">
      <p>
        “{{ keyword }}” 검색 결과
        <strong>{{ benefit.length }}건</strong>
      </p>

      <button
        type="button"
        class="filter-button"
        @click="isFilterOpen = true"
      >
        필터
      </button>
    </section>

    <div
      v-if="selectedCategoryName !== '전체'"
      class="active-filter"
    >
      {{ selectedCategoryName }}

      <button
        type="button"
        @click="clearCategory"
      >
        ×
      </button>
    </div>

    <section v-if="isLoading">
      불러오는 중...
    </section>

    <section v-else-if="benefit.length === 0">
      조건에 맞는 혜택이 없습니다.
    </section>

    <section v-else class="benefit-list">
      <article
        v-for="benefit in benefit"
        :key="benefit.benefitNo"
        class="benefit-card"
      >
        <div class="benefit-tags">
          <span>{{ benefit.categoryName }}</span>
        </div>

        <h2>{{ benefit.plcyNm }}</h2>

        <p>{{ benefit.sprvsnInstCdNm }}</p>
      </article>
    </section>

    <BenefitFilterModal
      v-model="isFilterOpen"
      :category-code="selectedCategoryCode"
      :category-name="selectedCategoryName"
      @apply="handleApplyFilter"
    />
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BenefitFilterModal from '@/components/benefit/BenefitFilterModal.vue'
import { getBenefit } from '@/api/benefitApi'

const route = useRoute()
const router = useRouter()

const keyword = ref(route.query.keyword ?? '')

const isFilterOpen = ref(false)
const isLoading = ref(false)

const benefit = ref([])

const selectedCategoryCode = ref(
  route.query.categoryCode ?? ''
)

const selectedCategoryName = ref(
  route.query.categoryName ?? '전체'
)

const loadBenefit = async () => {
  isLoading.value = true

  try {
    benefit.value = await getBenefit({
      keyword: keyword.value || undefined,
      categoryCode:
        selectedCategoryCode.value || undefined
    })
  } catch (error) {
    console.error('혜택 조회 실패:', error)
    benefit.value = []
  } finally {
    isLoading.value = false
  }
}

const handleApplyFilter = async ({
  categoryCode,
  categoryName
}) => {
  selectedCategoryCode.value = categoryCode
  selectedCategoryName.value = categoryName

  await router.replace({
    query: {
      ...route.query,
      keyword: keyword.value || undefined,
      categoryCode: categoryCode || undefined,
      categoryName:
        categoryCode === '' ? undefined : categoryName
    }
  })

  await loadBenefit()
}

const clearCategory = async () => {
  selectedCategoryCode.value = ''
  selectedCategoryName.value = '전체'

  await router.replace({
    query: {
      ...route.query,
      categoryCode: undefined,
      categoryName: undefined
    }
  })

  await loadBenefit()
}

onMounted(loadBenefit)
</script>
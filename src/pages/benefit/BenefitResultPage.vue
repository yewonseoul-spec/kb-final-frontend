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
  :category-code="
    selectedCategoryCode
  "
  :category-name="
    selectedCategoryName
  "
  :province-code="
    selectedProvinceCode
  "
  :province-name="
    selectedProvinceName
  "
  :city-code="
    selectedCityCode
  "
  :city-name="
    selectedCityName
  "
  :district-code="
    selectedDistrictCode
  "
  :district-name="
    selectedDistrictName
  "
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

//카테고리 
const selectedCategoryCode = ref(
  route.query.categoryCode ?? ''
)

const selectedCategoryName = ref(
  route.query.categoryName ?? '전체'
)

//지역 
const selectedZipCd = ref(
  route.query.zipCd ?? ''
)

const selectedProvinceCode = ref(
  route.query.provinceCode ?? ''
)

const selectedProvinceName = ref(
  route.query.provinceName ?? '전국'
)

const selectedCityCode = ref(
  route.query.cityCode ?? ''
)

const selectedCityName = ref(
  route.query.cityName ?? '중분류'
)

const selectedDistrictCode = ref(
  route.query.districtCode ?? ''
)

const selectedDistrictName = ref(
  route.query.districtName ?? '분류'
)

const loadBenefit = async () => {
  isLoading.value = true

  try {
    benefit.value = await getBenefit({
      keyword:
        keyword.value || undefined,

      categoryCode:
        selectedCategoryCode.value ||
        undefined,

      zipCd:
        selectedZipCd.value ||
        undefined,
    })
  } catch (error) {
    console.error(
      '혜택 조회 실패:',
      error
    )

    benefit.value = []
  } finally {
    isLoading.value = false
  }
}

const handleApplyFilter = async ({
  categoryCode,
  categoryName,
  zipCd,
  provinceCode,
  provinceName,
  cityCode,
  cityName,
  districtCode,
  districtName
}) => {
  selectedCategoryCode.value = categoryCode
  selectedCategoryName.value = categoryName

  selectedZipCd.value = zipCd

  selectedProvinceCode.value = provinceCode
  selectedProvinceName.value = provinceName

  selectedCityCode.value = cityCode
  selectedCityName.value = cityName

  selectedDistrictCode.value = districtCode
  selectedDistrictName.value = districtName

  await router.replace({
    query: {
      ...route.query,

      keyword:
        keyword.value || undefined,

      categoryCode:
        categoryCode || undefined,

      categoryName:
        categoryCode
          ? categoryName
          : undefined,

      zipCd:
        zipCd || undefined,

      provinceCode:
        provinceCode || undefined,

      provinceName:
        provinceCode
          ? provinceName
          : undefined,

      cityCode:
        cityCode || undefined,

      cityName:
        cityCode
          ? cityName
          : undefined,

      districtCode:
        districtCode || undefined,

      districtName:
        districtCode
          ? districtName
          : undefined
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

const clearRegion = async () => {
  selectedZipCd.value = ''

  selectedProvinceCode.value = ''
  selectedProvinceName.value = '전국'

  selectedCityCode.value = ''
  selectedCityName.value = '중분류'

  selectedDistrictCode.value = ''
  selectedDistrictName.value = '분류'

  await router.replace({
    query: {
      ...route.query,

      zipCd: undefined,

      provinceCode: undefined,
      provinceName: undefined,

      cityCode: undefined,
      cityName: undefined,

      districtCode: undefined,
      districtName: undefined
    }
  })

  await loadBenefit()
}

onMounted(loadBenefit)
</script>
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
        class="filter-button"
        @click="isFilterOpen = true"
      >
        필터
      </KbButton>
    </header>

    <section class="search-summary">
      <p class="summary-text">
        <template v-if="keyword">
          <strong>“{{ keyword }}”</strong> 검색 결과
        </template>
        <template v-else>
          전체 검색 결과
        </template>
      </p>

      <strong class="result-count">{{ benefit.length }}건</strong>
    </section>

    <section
      v-if="hasActiveFilter"
      class="active-filter-list"
      aria-label="적용된 필터"
    >
      <div
        v-if="selectedCategoryName !== '전체'"
        class="filter-chip"
      >
        <span>{{ selectedCategoryName }}</span>
        <button
          type="button"
          aria-label="카테고리 필터 해제"
          @click="clearCategory"
        >
          ×
        </button>
      </div>

      <div
        v-if="selectedZipCd"
        class="filter-chip"
      >
        <span>{{ selectedRegionLabel }}</span>
        <button
          type="button"
          aria-label="지역 필터 해제"
          @click="clearRegion"
        >
          ×
        </button>
      </div>
    </section>

    <section
      v-if="isLoading"
      class="state-card"
    >
      <div class="loading-spinner" />
      <p>혜택을 불러오고 있어요.</p>
    </section>

    <section
      v-else-if="benefit.length === 0"
      class="state-card empty-state"
    >
      <p class="empty-title">조건에 맞는 혜택이 없어요.</p>
      <p class="empty-description">
        검색어나 필터 조건을 변경해서 다시 확인해 보세요.
      </p>
    </section>

    <section
      v-else
      class="benefit-list"
      aria-label="혜택 검색 결과"
    >
      <KbCard
        v-for="item in benefit"
        :key="item.benefitNo"
        class="benefit-card"
        :class="{ 'is-closed': item.benefitStatus === 'CLOSED' }"
      >
        <template #top>
          <div class="card-top">
            <div class="card-badges">
             <KbBadge
  class="d-day-badge"
  :class="getDDayClass(item)"
>
  {{ getDDayText(item) }}
</KbBadge>
            </div>

          </div>
        </template>

        <h2 class="benefit-title">
          {{ item.plcyNm }}
        </h2>

        <p class="benefit-provider">
          {{ item.sprvsnInstCdNm || '제공 기관 미정' }}
        </p>

        <p
          v-if="item.benefitStatus === 'ALWAYS'"
          class="benefit-period"
        >
          상시 신청
        </p>
        <p
          v-else-if="item.applyStartDate || item.applyEndDate"
          class="benefit-period"
        >
          {{ formatDate(item.applyStartDate) || '시작일 미정' }}
          <span>~</span>
          {{ formatDate(item.applyEndDate) || '종료일 미정' }}
        </p>
      </KbCard>
    </section>

    <BenefitFilterModal
      v-model="isFilterOpen"
      :category-code="selectedCategoryCode"
      :category-name="selectedCategoryName"
      :province-code="selectedProvinceCode"
      :province-name="selectedProvinceName"
      :city-code="selectedCityCode"
      :city-name="selectedCityName"
      :district-code="selectedDistrictCode"
      :district-name="selectedDistrictName"
      @apply="handleApplyFilter"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BenefitFilterModal from '@/components/benefit/BenefitFilterModal.vue'
import KbBadge from '@/components/common/KbBadge.vue'
import KbButton from '@/components/common/KbButton.vue'
import KbCard from '@/components/common/KbCard.vue'
import { getBenefit } from '@/api/benefitApi'

const route = useRoute()
const router = useRouter()

const keyword = ref(route.query.keyword ?? '')
const isFilterOpen = ref(false)
const isLoading = ref(false)
const benefit = ref([])

// 카테고리
const selectedCategoryCode = ref(route.query.categoryCode ?? '')
const selectedCategoryName = ref(route.query.categoryName ?? '전체')

// 지역
const selectedZipCd = ref(route.query.zipCd ?? '')
const selectedProvinceCode = ref(route.query.provinceCode ?? '')
const selectedProvinceName = ref(route.query.provinceName ?? '전국')
const selectedCityCode = ref(route.query.cityCode ?? '')
const selectedCityName = ref(route.query.cityName ?? '중분류')
const selectedDistrictCode = ref(route.query.districtCode ?? '')
const selectedDistrictName = ref(route.query.districtName ?? '분류')

const hasActiveFilter = computed(() => {
  return selectedCategoryName.value !== '전체' || Boolean(selectedZipCd.value)
})

const selectedRegionLabel = computed(() => {
  const names = [
    selectedProvinceCode.value ? selectedProvinceName.value : '',
    selectedCityCode.value ? selectedCityName.value : '',
    selectedDistrictCode.value ? selectedDistrictName.value : ''
  ].filter(Boolean)

  return names.length > 0 ? names.join(' ') : '전국'
})

const getDDayClass = (item) => {
  const text = getDDayText(item)

  if (text === '마감') {
    return 'is-closed'
  }

  if (text === '상시') {
    return 'is-always'
  }

  if (text === 'D-Day') {
    return 'is-urgent'
  }

  const match = text.match(/^D-(\d+)$/)

  if (match) {
    const remainingDays = Number(match[1])

    if (remainingDays <= 7) {
      return 'is-urgent'
    }
  }

  return 'is-open'
}

const getStatusText = (status) => {
  switch (status) {
    case 'OPEN':
      return '진행 중'
    case 'ALWAYS':
      return '상시'
    case 'CLOSED':
      return '마감'
    default:
      return '상태 미정'
  }
}

const getDDayText = (item) => {
  if (item.benefitStatus === 'ALWAYS' || !item.applyEndDate) {
    return '상시'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endDate = new Date(`${item.applyEndDate}T00:00:00`)
  const difference =
    endDate.getTime() - today.getTime()

  const remainingDays = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  )

  if (remainingDays < 0) {
    return '마감'
  }

  if (remainingDays === 0) {
    return 'D-Day'
  }

  return `D-${remainingDays}`
}

const getStatusVariant = (status) => {
  switch (status) {
    case 'CLOSED':
      return 'gray'
    case 'OPEN':
      return 'info'
    default:
      return 'default'
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return String(date).replaceAll('-', '.')
}

const loadBenefit = async () => {
  isLoading.value = true

  try {
    benefit.value = await getBenefit({
      keyword: keyword.value || undefined,
      categoryCode: selectedCategoryCode.value || undefined,
      zipCd: selectedZipCd.value || undefined
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
      keyword: keyword.value || undefined,
      categoryCode: categoryCode || undefined,
      categoryName: categoryCode ? categoryName : undefined,
      zipCd: zipCd || undefined,
      provinceCode: provinceCode || undefined,
      provinceName: provinceCode ? provinceName : undefined,
      cityCode: cityCode || undefined,
      cityName: cityCode ? cityName : undefined,
      districtCode: districtCode || undefined,
      districtName: districtCode ? districtName : undefined
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

<style scoped>
.result-page {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  padding: 28px 20px 112px;
  background: #ffffff;
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

.filter-button {
  flex-shrink: 0;
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
  line-height: 1.5;
}

.summary-text strong {
  color: #2e2a24;
}

.result-count {
  flex-shrink: 0;
  color: #2e2a24;
  font-size: 16px;
}

.active-filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 7px 10px 7px 12px;
  border: 1px solid #efe4bd;
  border-radius: 999px;
  background: #fffaf0;
  color: #675a37;
  font-size: 12px;
  font-weight: 600;
}

.filter-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-chip button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #908980;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-card {
  cursor: pointer;
}

.benefit-card.is-closed {
  background: #fafafa;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.end-date {
  flex-shrink: 0;
  color: #908980;
  font-size: 11px;
  line-height: 1.4;
}

.benefit-title {
  margin: 2px 0 0;
  color: #2e2a24;
  font-size: 18px;
  font-weight: 750;
  line-height: 1.42;
  letter-spacing: -0.035em;
  word-break: keep-all;
}

.benefit-provider {
  margin: 0;
  color: #696158;
  font-size: 13px;
  line-height: 1.5;
}

.benefit-period {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 2px 0 0;
  color: #908980;
  font-size: 12px;
}

.is-closed .benefit-title,
.is-closed .benefit-provider {
  color: #908980;
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
  background: #ffffff;
  text-align: center;
}

.state-card p {
  margin: 12px 0 0;
  color: #908980;
  font-size: 13px;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #efece4;
  border-top-color: #ffbc00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-title {
  color: #2e2a24 !important;
  font-size: 16px !important;
  font-weight: 700;
}

.empty-description {
  max-width: 240px;
  line-height: 1.6;
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

  .card-top {
    flex-direction: column;
  }
}

.d-day-badge.is-open {
  background: #eaf3ff;
  color: #1769d2;
}

.d-day-badge.is-urgent {
  background: #fff0ee;
  color: #e34a3e;
}

.d-day-badge.is-always {
  background: #fff7df;
  color: #9a7100;
}

.d-day-badge.is-closed {
  background: #f2f2f2;
  color: #908980;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getCategoryAmounts } from '@/api/categoryApi';

const categoryData = ref([]); // [{ categoryName, amount }, ...] 금액 큰 순서로
const loading = ref(true);
const errorMessage = ref('');

async function loadCategoryAmounts() {
  loading.value = true;
  errorMessage.value = '';

  try {
    categoryData.value = await getCategoryAmounts();
  } catch (err) {
    console.error('카테고리별 소비 금액 조회 실패:', err);
    errorMessage.value = '불러오지 못했어요.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadCategoryAmounts);

// 처음에 보여줄 상위 카테고리 개수
const VISIBLE_COUNT = 5;

// 펼쳐보기 여부
const expanded = ref(false);

const visibleCategories = computed(() => {
  if (expanded.value) {
    return categoryData.value;
  }
  return categoryData.value.slice(0, VISIBLE_COUNT);
});

// 5개보다 많을 때만 더보기 버튼을 보여준다
const hasMore = computed(() => categoryData.value.length > VISIBLE_COUNT);

function toggleExpanded() {
  expanded.value = !expanded.value;
}

// 카테고리마다 붙일 아이콘
const CATEGORY_ICONS = {
  식비: '🍚',
  '카페·간식': '☕️',
  교통: '🚌',
  쇼핑: '🛍️',
  '문화·여가': '🎬',
  생활: '🏠',
  '마트·편의점': '🛒',
  '주거·공과금': '🏡',
  통신: '📱',
  '의료·건강': '🩺',
  유흥: '🍻',
  교육: '📚',
  여행: '✈️',
  경조사: '💵',
  기타: '📌'
};

// 카테고리마다 색 지정
const CATEGORY_COLORS = {
  식비: '#FF6B57',
  '카페·간식': '#C08552',
  교통: '#4A90D9',
  쇼핑: '#FF6FA4',
  '문화·여가': '#9B6BFF',
  생활: '#2EC4B6',
  '마트·편의점': '#6BCB77',
  '주거·공과금': '#5C7AEA',
  통신: '#17A2B8',
  '의료·건강': '#E85D75',
  유흥: '#A66DD4',
  교육: '#5B5EA6',
  여행: '#4FC3F7',
  경조사: '#E2739E',
  기타: '#9E9E9E'
};

function getIcon(name) {
  return CATEGORY_ICONS[name] || '📌';
}

function getColor(name) {
  return CATEGORY_COLORS[name] || '#9E9E9E';
}

// 막대 길이는 전체 카테고리 중 제일 많이 쓴 것을 기준(100%)으로 비율을 계산하여 정한다
const maxAmount = computed(() => {
  if (categoryData.value.length === 0) return 0;
  return Math.max(...categoryData.value.map(c => c.amount));
});

function barWidthPercent(amount) {
  if (maxAmount.value === 0) return 0;
  return Math.round((amount / maxAmount.value) * 100);
}

function formatWon(amount) {
  return `${amount.toLocaleString()}원`;
}
</script>

<template>
  <div class="category-card">
    <div v-if="loading" class="category-empty">불러오는 중...</div>
    <div v-else-if="errorMessage" class="category-empty">{{ errorMessage }}</div>
    <div v-else-if="categoryData.length === 0" class="category-empty">이번 달 소비내역이 없어요</div>

    <div v-else>
      <div v-for="c in visibleCategories" :key="c.categoryName" class="category-row">
        <div class="category-row-top">
          <span class="category-name">
            <span class="category-icon">{{ getIcon(c.categoryName) }}</span>
            {{ c.categoryName }}
          </span>
          <span class="category-amount">{{ formatWon(c.amount) }}</span>
        </div>

        <div class="category-bar-track">
          <div class="category-bar-fill"
            :style="{ width: barWidthPercent(c.amount) + '%', background: getColor(c.categoryName) }"></div>
        </div>
      </div>

      <!-- 카테고리가 5개보다 많을 때만 더보기 화살표가 보이도록 함 -->
      <button v-if="hasMore" class="toggle-arrow" @click="toggleExpanded">
        {{ expanded ? '⌃' : '⌄' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, .06);
  margin-top: 16px;
}

.category-empty {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 20px 0;
}

.category-row {
  margin-bottom: 16px;
}

.category-row:last-child {
  margin-bottom: 0;
}

.category-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.category-name {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.category-icon {
  margin-right: 4px;
}

.category-amount {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.category-bar-track {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 999px;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .3s ease;
}

.toggle-arrow {
  display: block;
  width: 100%;
  margin-top: 4px;
  margin: 4px auto 0;
  padding: 0px;
  border: 0;
  background: none;
  color: #bbb;
  font-size: 16px;
  text-align: center;
  cursor: pointer;
}
</style>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getAssetRatio } from '@/api/ratioApi';
import { Chart } from 'chart.js/auto';

const router = useRouter();

const totalAsset = ref(0);
const categories = ref([]); // [{ categoryName, amount }, ...]
const loading = ref(true);
const errorMessage = ref('');

async function loadAssetRatio() {
    loading.value = true;
    errorMessage.value = '';

    try {
        const res = await getAssetRatio();
        totalAsset.value = res.data.totalAsset;
        categories.value = res.data.categories;
    } catch (err) {
        console.error('자산 비율 조회 실패:', err);
        errorMessage.value = '불러오지 못했어요.';
    } finally {
        loading.value = false;
    }
}

function goBack() {
    router.back();
}

function formatWon(amount) {
    return `${(amount || 0).toLocaleString()}원`;
}

// 카테고리마다 색을 정한다
const CATEGORY_COLORS = {
    '입출금': '#FFCC00',
    '예ㆍ적금': '#545045',
    '청약': '#8C7853',
    '퇴직연금': '#8A8D8F',
    '보험ㆍ공제': '#FFBC00',
};
// const FALLBACK_COLORS = ['#9B6BFF', '#4A90D9', '#2EC4B6', '#FF6B57'];

function normalizeCategoryName(name) {
    if (!name) return name;
    return name.replace(/[·ㆍ‧]/g, 'ㆍ');
}

function getColor(categoryName, index) {
    const normalized = normalizeCategoryName(categoryName);
    return CATEGORY_COLORS[normalized] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// 글자로 보여줄 카테고리별 비율(%)을 계산, 소수점 첫째 자리까지 남긴다
function rawPercent(amount) {
    if (totalAsset.value === 0) return 0;
    return (amount / totalAsset.value) * 100;
}

// 전부 반올림한 다음, 100%랑 차이 나는 만큼을 제일 큰 카테고리에서 보정해서 합이 정확히 100%가 되게 만든다
const adjustedPercents = computed(() => {
    if (categories.value.length === 0) return {};

    const rounded = {};
    categories.value.forEach(c => {
        rounded[c.categoryName] = Math.round(rawPercent(c.amount) * 10) / 10;
    });

    const sum = Object.values(rounded).reduce((a, b) => a + b, 0);
    const diff = Math.round((100 - sum) * 10) / 10;

    const biggestCategory = categories.value[0].categoryName;
    rounded[biggestCategory] = Math.round((rounded[biggestCategory] + diff) * 10) / 10;

    return rounded;
});

function getPercent(categoryName) {
    return adjustedPercents.value[categoryName] ?? 0;
}

// ----- Chart.js로 도넛 모양 자산 비율 그래프 그리기 -----
const canvasEl = ref(null);

// 지금 그려진 차트를 기억해두고, 데이터가 새로 오면 예전 차트를 지우고(destroy) 새로 그린다
let chartInstance = null;

function drawChart() {
    if (!canvasEl.value || categories.value.length === 0) return;

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(canvasEl.value, {
        type: 'doughnut',
        data: {
            labels: categories.value.map(c => c.categoryName),
            datasets: [
                {
                    // 원본 금액을 그대로 넘기면 Chart.js가 비율만큼 나눠서 그래프를 그린다
                    data: categories.value.map(c => c.amount),
                    backgroundColor: categories.value.map((c, i) => getColor(c.categoryName, i)),
                    borderWidth: 0,
                }
            ]
        },
        options: {
            cutout: '50%', // 그래프 가운데 구멍 크기 (숫자가 작을수록 도넛이 두꺼워짐)
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const name = context.label;
                            const amount = context.parsed;
                            return `${name}: ${amount.toLocaleString()}원`;
                        }
                    }
                }
            }
        }
    });
}

onMounted(async () => {
    await loadAssetRatio();
    drawChart();
});

// categories가 바뀔 때마다(데이터를 새로 불러왔을 때) 차트도 다시 그린다
watch(categories, () => {
    drawChart();
});

onBeforeUnmount(() => {
    if (chartInstance) {
        chartInstance.destroy();
    }
});
</script>

<template>
    <div class="page">
        <div v-if="loading" class="empty-note">불러오는 중...</div>
        <div v-else-if="errorMessage" class="empty-note">{{ errorMessage }}</div>

        <template v-else>
            <!-- 카드 1: 자산 구성 비율(도넛 차트) -->
            <div class="card">
                <p class="card-title">자산 구성 비율</p>
                <p class="card-total">총 {{ formatWon(totalAsset) }}</p>

                <div class="ratio-body">
                    <div class="donut-wrap">
                        <canvas ref="canvasEl"></canvas>
                    </div>

                    <ul class="legend">
                        <li v-for="(c, i) in categories" :key="c.categoryName">
                            <div class="legend-top">
                                <span class="legend-dot" :style="{ background: getColor(c.categoryName, i) }"></span>
                                <span class="legend-name">{{ c.categoryName }}</span>
                                <span class="legend-percent">{{ getPercent(c.categoryName) }}%</span>
                            </div>
                            <div class="legend-bar-track">
                                <div class="legend-bar-fill"
                                    :style="{ width: getPercent(c.categoryName) + '%', background: getColor(c.categoryName, i) }">
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- 카드 2: 자산 세부 구성 리스트 -->
            <div class="card">
                <p class="card-title">자산 세부 구성</p>

                <div v-for="(c, i) in categories" :key="c.categoryName" class="detail-row">
                    <div class="detail-left">
                        <span class="legend-dot" :style="{ background: getColor(c.categoryName, i) }"></span>
                        <span class="detail-name">{{ c.categoryName }}</span>
                    </div>
                    <div class="detail-right">
                        <p class="detail-amount">{{ formatWon(c.amount) }}</p>
                        <p class="detail-percent">{{ getPercent(c.categoryName) }}%</p>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
* {
    box-sizing: border-box;
}

.page {
    --brown: #60584C;
    max-width: 480px;
    margin: 0 auto;
    padding: 16px;
    background: #FAF9F6;
    min-height: 100vh;
}

.header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.back-btn {
    border: 0;
    background: none;
    font-size: 22px;
    color: #333;
    cursor: pointer;
    padding: 0;
}

.header h2 {
    flex: 1;
    font-size: 18px;
    font-weight: 700;
    color: #222;
    margin: 0;
}

.menu-icon {
    font-size: 18px;
    color: #555;
}

.empty-note {
    text-align: center;
    color: #999;
    font-size: 14px;
    padding: 60px 0;
}

.card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, .05);
    margin-bottom: 16px;
}

.card-title {
    font-size: 15px;
    font-weight: 700;
    color: #222;
    margin: 0 0 4px;
}

.card-total {
    font-size: 12px;
    color: #999;
    margin: 0 0 16px;
}

.ratio-body {
    display: flex;
    align-items: center;
    gap: 20px;
}

.donut-wrap {
    position: relative;
    width: 110px;
    height: 110px;
    flex-shrink: 0;
}

.legend {
    list-style: none;
    margin: 0;
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.legend-top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
}

.legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.legend-name {
    flex: 1;
    font-size: 13px;
    color: #444;
}

.legend-percent {
    font-size: 13px;
    font-weight: 700;
    color: #222;
}

.legend-bar-track {
    width: 100%;
    height: 4px;
    background: #f0f0f0;
    border-radius: 999px;
    overflow: hidden;
}

.legend-bar-fill {
    height: 100%;
    border-radius: 999px;
}

/* 세부 구성 리스트 */
.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-top: 1px solid #f5f5f5;
}

.detail-row:first-of-type {
    border-top: none;
}

.detail-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.detail-name {
    font-size: 14px;
    font-weight: 700;
    color: #333;
}

.detail-right {
    text-align: right;
}

.detail-amount {
    font-size: 15px;
    font-weight: 700;
    color: #222;
    margin: 0;
}

.detail-percent {
    font-size: 12px;
    color: #999;
    margin: 2px 0 0;
}
</style>
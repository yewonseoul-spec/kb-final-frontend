<script setup>
import { ref, computed, onMounted } from 'vue';
import { getMonthlyTrend } from '@/api/monthlyApi';

// 월별 총 지출 목록 (예: [{ month: 2, total: 320000 }, ...])
const monthlyData = ref([]);
const loading = ref(true);
const errorMessage = ref('');

async function loadMonthlyTrend() {
    loading.value = true;
    errorMessage.value = '';

    try {
        monthlyData.value = await getMonthlyTrend();
    } catch (err) {
        console.error('월별 소비 추이 조회 실패:', err);
        errorMessage.value = '그래프를 불러오지 못했어요.';
    } finally {
        loading.value = false;
    }
}

onMounted(loadMonthlyTrend);

// 막대그래프는 제일 많이 쓴 달을 100% 높이로 잡고, 나머지는 해당 비율만큼 낮게 그린다.
const maxTotal = computed(() => {
    if (monthlyData.value.length === 0) return 0;
    return Math.max(...monthlyData.value.map(m => m.total));
});

// 각 막대의 높이를 퍼센트(%)로 계산한다.
function barHeightPercent(total) {
    if (maxTotal.value === 0) return 0;
    return Math.round((total / maxTotal.value) * 100);
}

// 목록의 마지막 항목인 이번 달 막대만 노란색으로 강조한다.
function isCurrentMonth(index) {
    return index === monthlyData.value.length - 1;
}
</script>

<template>
    <div class="trend-card">
        <p class="trend-title">월별 소비 추이</p>

        <div v-if="loading" class="trend-empty">불러오는 중...</div>
        <div v-else-if="errorMessage" class="trend-empty">{{ errorMessage }}</div>

        <!-- 막대그래프: 막대 n개를 가로로 나열한다. -->
        <div v-else class="bar-chart">
            <div v-for="(m, i) in monthlyData" :key="m.yearMonth" class="bar-column">
                <div class="bar-track">
                    <div class="bar-fill" :class="{ current: isCurrentMonth(i) }"
                        :style="{ height: barHeightPercent(m.total) + '%' }"></div>
                </div>
                <span class="bar-label">{{ m.month }}월</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.trend-card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, .06);
    margin-top: 16px;
}

.trend-title {
    font-weight: 700;
    font-size: 15px;
    margin: 0 0 20px;
}

.trend-empty {
    text-align: center;
    color: #999;
    font-size: 13px;
    padding: 30px 0;
}

.bar-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    height: 140px;
}

.bar-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
}

.bar-track {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.bar-fill {
    width: 60%;
    min-height: 4px;
    background: #eee;
    border-radius: 6px 6px 0 0;
    transition: height .3s ease;
}

/* 이번 달 막대만 노란색 */
.bar-fill.current {
    background: #FFCC00;
}

.bar-label {
    margin-top: 8px;
    font-size: 11px;
    color: #999;
}
</style>
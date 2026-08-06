<script setup>
import { ref } from 'vue';
import { getAiAnalysis } from '@/api/aiApi';

const report = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const expanded = ref(true);

const insightIcons = ['📉', '🛍️', '💡'];

async function loadAnalysis() {
    loading.value = true;
    errorMessage.value = '';
    expanded.value = true;

    try {
        report.value = await getAiAnalysis();
    } catch (err) {
        console.error('AI 분석 실패:', err);
        errorMessage.value = '분석을 불러오지 못했어요. 잠시 후 다시 시도해주세요.';
    } finally {
        loading.value = false;
    }
}

function toggleExpanded() {
    if (!report.value) return;
    expanded.value = !expanded.value;
}

function escapeHtml(text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

// summaryText 안에서 "897,100원"이나 "60%"처럼 숫자로 된 부분만 찾아서 볼드체 처리
function highlightNumbers(text) {
    const safeText = escapeHtml(text);
    return safeText.replace(/([\d,]+원|\d+%)/g, '<strong>$1</strong>');
}
</script>

<template>
    <div class="ai-card">
        <div class="ai-card-header" :class="{ clickable: !!report }" @click="toggleExpanded">
            <span class="ai-icon">🔍</span>
            <div class="ai-header-text">
                <p class="ai-title">AI 소비 패턴 분석</p>
                <p class="ai-subtitle">LLM 기반 맞춤 분석</p>
            </div>

            <!-- 분석 전에는 "분석 보기 >", 분석 후에는 접기/펼치기 화살표 표시 -->
            <button v-if="!report" class="ai-link-btn" :disabled="loading" @click.stop="loadAnalysis">
                {{ loading ? '분석 중...' : '분석 보기 ›' }}
            </button>
            <span v-else class="ai-chevron" :class="{ open: expanded }">⌄</span>
        </div>

        <!-- 분석 결과가 있고 펼쳐진 상태일 때에만 표시 -->
        <div v-if="report && expanded" class="ai-card-body">
            <p class="ai-summary" v-html="highlightNumbers(report.summaryText)"></p>

            <div v-for="(insight, i) in report.insights" :key="i" class="insight-item">
                <span class="insight-icon">{{ insightIcons[i % insightIcons.length] }}</span>
                <div>
                    <p class="insight-title">{{ insight.title }}</p>
                    <p class="insight-desc">{{ insight.description }}</p>
                </div>
            </div>
        </div>

        <p v-if="errorMessage" class="ai-error">{{ errorMessage }}</p>
    </div>
</template>

<style scoped>
.ai-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(0, 0, 0, .06);
}

.ai-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    background: #4A3B33;
}

.ai-card-header.clickable {
    cursor: pointer;
}

.ai-icon {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, .12);
    border-radius: 50%;
    font-size: 15px;
}

.ai-header-text {
    flex: 1;
    min-width: 0;
}

.ai-title {
    font-weight: 700;
    font-size: 15px;
    color: #fff;
    margin: 0;
}

.ai-subtitle {
    font-size: 12px;
    color: rgba(255, 255, 255, .6);
    margin: 2px 0 0;
}

.ai-link-btn {
    flex-shrink: 0;
    border: 0;
    background: none;
    color: #FFCC00;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
}

.ai-link-btn:disabled {
    color: rgba(255, 255, 255, .4);
    cursor: default;
}

.ai-chevron {
    flex-shrink: 0;
    color: rgba(255, 255, 255, .6);
    font-size: 16px;
    transition: transform .2s;
}

.ai-chevron.open {
    transform: rotate(180deg);
}

/* 본문: 흰 배경 */
.ai-card-body {
    padding: 16px 18px 18px;
}

.ai-summary {
    background: #fffbe6;
    border-radius: 10px;
    padding: 12px;
    font-size: 13px;
    line-height: 1.6;
    color: #5a4a2a;
    margin: 0 0 12px;
}

.ai-summary :deep(strong) {
    color: #2b2016;
    font-weight: 800;
}

.insight-item {
    display: flex;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid #f5f5f5;
}

.insight-icon {
    font-size: 18px;
}

.insight-title {
    font-weight: 700;
    font-size: 14px;
    color: #222;
    margin: 0 0 2px;
}

.insight-desc {
    font-size: 12px;
    color: #777;
    line-height: 1.5;
    margin: 0;
}

.ai-retry-btn {
    width: 100%;
    margin-top: 8px;
    padding: 12px;
    border: 0;
    border-radius: 999px;
    background: #f5f5f5;
    color: #555;
    font-weight: 700;
    cursor: pointer;
}

.ai-retry-btn:disabled {
    background: #eee;
    color: #bbb;
    cursor: default;
}

.ai-error {
    padding: 10px 18px 14px;
    font-size: 12px;
    color: #d33;
}
</style>
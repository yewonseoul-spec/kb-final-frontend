<script setup>
import { ref, computed } from 'vue';
import { useConsumptionStore } from '@/stores/consumptionStore';

// 부모(CalendarView)가 넘겨주는 값 - targetDate: 예상 소비를 추가할 날짜 ("2026-07-27" 형태)
const props = defineProps({
    targetDate: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['close', 'saved']);

const consumptionStore = useConsumptionStore();


function todayStr() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 두 날짜 문자열에서 "몇 년 몇 월 며칠"만 비교할 수 있게 Date로 변환
function toDateOnly(dateStr) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
}

// 예상 소비는 오늘 자 날짜부터 삽입 가능, 이전이면 false 반환
function canAddExpected(dateStr) {
    return toDateOnly(dateStr) >= toDateOnly(todayStr());
}

// "2026-07-27" 같은 문자열이 오늘 날짜인지 확인(미니 달력에서 오늘 표시용)
function isToday(dateStr) {
    return dateStr === todayStr();
}


const CATEGORY_LIST = [
    '식비', '카페·간식', '교통', '쇼핑', '문화·여가',
    '생활', '마트·편의점', '주거·공과금', '통신', '의료·건강',
    '유흥', '교육', '여행', '경조사', '기타'
];

const CATEGORY_MAP = {
    '식비': 1,
    '카페·간식': 2,
    '교통': 3,
    '쇼핑': 4,
    '문화·여가': 5,
    '생활': 6,
    '마트·편의점': 7,
    '주거·공과금': 8,
    '통신': 9,
    '의료·건강': 10,
    '유흥': 11,
    '교육': 12,
    '여행': 13,
    '경조사': 14,
    '기타': 15
};

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

function getIcon(name) {
    return CATEGORY_ICONS[name] || '📌';
}

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

function getCategoryColor(name) {
    return CATEGORY_COLORS[name] || '#9E9E9E';
}

const selectedDate = ref(props.targetDate);
const newCategory = ref('');
const newAmount = ref('');
const newMerchant = ref('');
const newMemo = ref('');

const formattedAmount = computed(() => {
    return newAmount.value ? Number(newAmount.value).toLocaleString() : '0';
});

function onAmountInput(event) {
    newAmount.value = event.target.value.replace(/[^0-9]/g, '');
}

const canSubmit = computed(() => {
    return (
        Number(newAmount.value) > 0 &&
        newCategory.value !== '' &&
        canAddExpected(selectedDate.value)
    );
});

async function submit() {
    if (!canSubmit.value) return;

    await consumptionStore.addExpectedSpending({
        expectedDate: selectedDate.value,
        categoryNo: CATEGORY_MAP[newCategory.value],
        expectedAmount: Number(newAmount.value),
        merchant: newMerchant.value,
        memo: newMemo.value
    });

    emit('saved');
}

function close() {
    emit('close');
}

// 예정일 미니 달력
const showDatePicker = ref(false);

// 미니 달력도 처음 열 때부터 targetDate가 속한 달로 맞춰서 시작한다.
const [startYear, startMonth] = props.targetDate.split('-').map(Number);
const pickerYear = ref(startYear);
const pickerMonth = ref(startMonth - 1);

function toggleDatePicker() {
    showDatePicker.value = !showDatePicker.value;
}

function pickerPrevMonth() {
    if (pickerMonth.value === 0) {
        pickerMonth.value = 11;
        pickerYear.value -= 1;
    } else {
        pickerMonth.value -= 1;
    }
}

function pickerNextMonth() {
    if (pickerMonth.value === 11) {
        pickerMonth.value = 0;
        pickerYear.value += 1;
    } else {
        pickerMonth.value += 1;
    }
}

// 미니 달력용 날짜 칸
const pickerDays = computed(() => {
    const year = pickerYear.value;
    const month = pickerMonth.value;
    const result = [];

    const startDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) {
        result.push(null);
    }

    for (let d = 1; d <= lastDate; d++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        result.push({ day: d, date });
    }

    return result;
});

// 미니 달력에서 날짜를 고르면 해당 날짜를 예정일로 저장
function pickDate(day) {
    if (!day) return;
    if (!canAddExpected(day.date)) return;

    selectedDate.value = day.date;
    showDatePicker.value = false;
}
</script>

<template>
    <transition name="sheet">
        <div class="sheet-overlay" @click.self="close">
            <div class="sheet">
                <div class="sheet-handle"></div>
                <div class="sheet-title-row">
                    <h3>예상 소비 추가</h3>
                    <button class="sheet-close" @click="close">✕</button>
                </div>

                <label>금액</label>
                <div class="amount-row">
                    <span class="amount-sign">-</span>
                    <input class="amount-input" type="text" inputmode="numeric" :value="formattedAmount"
                        @input="onAmountInput" placeholder="0" />
                    <span class="amount-unit">원</span>
                </div>

                <label>카테고리</label>
                <div class="category-grid">
                    <button v-for="name in CATEGORY_LIST" :key="name" type="button" class="category-tile"
                        :class="{ selected: newCategory === name }" :style="newCategory === name
                            ? { borderColor: getCategoryColor(name), background: `${getCategoryColor(name)}1a` }
                            : {}" @click="newCategory = name">
                        <span class="category-tile-icon" :style="{ background: getCategoryColor(name) }">
                            {{ getIcon(name) }}
                        </span>
                        <span class="category-tile-label">{{ name }}</span>
                    </button>
                </div>

                <label>소비처</label>
                <input v-model="newMerchant" placeholder="예: OO마트, 병원, ..." />

                <label>메모</label>
                <input v-model="newMemo" placeholder="예: 점심식사, 간식 구매, 월세, ..." />

                <label>예정일 ({{ Number(selectedDate.split('-')[1]) }}월)</label>
                <button type="button" class="date-field" @click="toggleDatePicker">
                    <span class="date-icon">📅</span>
                    <span class="date-value">{{ Number(selectedDate.split('-')[2]) }}일</span>
                </button>

                <div v-if="showDatePicker" class="mini-calendar">
                    <div class="mini-cal-header">
                        <button type="button" @click="pickerPrevMonth">‹</button>
                        <span>{{ pickerYear }}년 {{ pickerMonth + 1 }}월</span>
                        <button type="button" @click="pickerNextMonth">›</button>
                    </div>
                    <div class="mini-cal-week">
                        <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
                    </div>
                    <div class="mini-cal-grid">
                        <span v-for="(day, i) in pickerDays" :key="i" class="mini-cal-day" :class="{
                            empty: !day,
                            disabled: day && !canAddExpected(day.date),
                            selected: day && day.date === selectedDate,
                            today: day && isToday(day.date)
                        }" @click="pickDate(day)">{{ day?.day }}</span>
                    </div>
                </div>

                <div class="sheet-actions">
                    <button class="cancel" @click="close">취소</button>
                    <button class="save" :disabled="!canSubmit" @click="submit">추가하기</button>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.sheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .4);
    display: flex;
    align-items: flex-end;
    z-index: 100;
}

.sheet {
    width: 100%;
    background: #fff;
    border-radius: 20px 20px 0 0;
    padding: 20px;
    padding-bottom: max(90px, env(safe-area-inset-bottom));
    box-shadow: 0 -8px 30px rgba(0, 0, 0, .15);
    max-height: 90vh;
    overflow-y: auto;
}

.sheet::-webkit-scrollbar {
    display: none;
}

.sheet-handle {
    width: 40px;
    height: 4px;
    background: #ddd;
    border-radius: 999px;
    margin: 0 auto 16px;
}

.sheet-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.sheet-title-row h3 {
    margin: 0;
    font-size: 18px;
    color: var(--brown);
}

.sheet-close {
    border: 0;
    background: none;
    font-size: 16px;
    color: #333;
    cursor: pointer;
}

label {
    display: block;
    font-size: 13px;
    color: #777;
    margin: 12px 0 6px;
}

input {
    width: 100%;
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 12px;
    font-size: 14px;
}

.amount-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    border-bottom: 2px solid #FFCC00;
    padding-bottom: 8px;
}

.amount-sign {
    font-size: 22px;
    font-weight: 700;
    color: #ccc;
}

.amount-input {
    flex: 1;
    border: 0;
    outline: none;
    font-size: 28px;
    font-weight: 700;
    text-align: right;
    padding: 0;
    min-width: 0;
}

.amount-unit {
    font-size: 16px;
    color: #999;
}

/* 카테고리 선택 */
.category-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.category-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 2px;
    border: 1px solid #eee;
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
}

.category-tile-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: #fff;
}

.category-tile-label {
    font-size: 10px;
    color: #555;
    white-space: nowrap;
}

/* 예정일 입력칸 */
.date-field {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
}

.date-icon {
    margin-right: 6px;
}

/* 예정일을 고르는 달력 */
.mini-calendar {
    margin-top: 8px;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 12px;
}

.mini-cal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 700;
}

.mini-cal-header button {
    border: 0;
    background: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--brown);
}

.mini-cal-week {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    text-align: center;
    font-size: 11px;
    color: #999;
    margin-bottom: 4px;
}

.mini-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 2px;
}

.mini-cal-day {
    text-align: center;
    font-size: 12px;
    padding: 6px 0;
    border-radius: 8px;
    cursor: pointer;
}

.mini-cal-day.empty {
    visibility: hidden;
}

.mini-cal-day.disabled {
    color: #ccc;
    cursor: default;
}

.mini-cal-day.today {
    font-weight: 700;
    color: var(--brown);
}

.mini-cal-day.selected {
    background: #FFCC00;
    color: var(--brown);
    font-weight: 700;
}

.sheet-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.sheet-actions button {
    flex: 1;
    padding: 14px;
    border: 0;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
}

.sheet-actions .cancel {
    background: #f0f0f0;
    color: #555;
}

.sheet-actions .save {
    background: #FFCC00;
    color: var(--brown);
}

.sheet-actions .save:disabled {
    background: #eee;
    color: #bbb;
    cursor: default;
}

.sheet-enter-active,
.sheet-leave-active {
    transition: opacity .2s;
}

.sheet-enter-from,
.sheet-leave-to {
    opacity: 0;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
    transition: transform .25s ease;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
    transform: translateY(100%);
}
</style>
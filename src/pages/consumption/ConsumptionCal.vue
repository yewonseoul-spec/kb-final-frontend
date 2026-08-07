<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useConsumptionStore } from '@/stores/consumptionStore';
import ExpectedCreate from '@/pages/consumption/ExpectedCreate.vue';
import ExpectedEdit from '@/pages/consumption/ExpectedEdit.vue';
import AiAnalysis from '@/pages/consumption/AiAnalysis.vue';

const consumptionStore = useConsumptionStore();

// 상단 탭: '소비 캘린더' / '패턴 분석' 중 지금 보고 있는 화면
const activeTab = ref('calendar');

const currentDate = ref(new Date());
const selectedDay = ref(null);
const selectedCategories = ref(['전체']);

const calendarData = computed(() => consumptionStore.calendarData || {
  days: [],
  totalSpend: 0,
  expectedTotal: 0,
  category: []
});

const totalSpend = computed(() => calendarData.value.totalSpend || 0);
const expectedTotal = computed(() => calendarData.value.expectedTotal || 0);

// 날짜 관련 함수
// 오늘 날짜를 "2026-07-27" 같은 문자열로 리턴
function todayStr() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 두 날짜 문자열("2026-07-27")에서 날짜 비교
function toDateOnly(dateStr) {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
}

// 오늘보다 이전 날짜인지 판단
function isPastDay(dateStr) {
  return toDateOnly(dateStr) < toDateOnly(todayStr());
}

// "2026-07-27" 같은 문자열이 오늘 날짜인지 확인한다 (달력 칸에 "오늘" 표시할 때 사용).
function isToday(dateStr) {
  return dateStr === todayStr();
}

// 내일 날짜를 "2026-07-28" 같은 문자열로 리턴
function tomorrowStr() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 예상 소비는 오늘부터 추가 가능, 그 이전이면 false 리턴
function canAddExpected(dateStr) {
  return toDateOnly(dateStr) >= toDateOnly(todayStr());
}

// 앱 전체 카테고리 고정 순서
const CATEGORY_LIST = [
  '식비', '카페·간식', '교통', '쇼핑', '문화·여가',
  '생활', '마트·편의점', '주거·공과금', '통신', '의료·건강',
  '유흥', '교육', '여행', '경조사', '기타'
];

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

function getCategoryColor(name) {
  return CATEGORY_COLORS[name] || '#9E9E9E';
}

// 달력에서 소비 내역 색 (배경은 연하게 + 글자는 카테고리 색 그대로 진하게)
function itemStyle(categoryName) {
  const color = getCategoryColor(categoryName);
  return {
    background: `${color}1f`,
    color
  };
}

// 예상 소비는 같은 카테고리 색을 쓰되 흐리게 함
function expectedItemStyle(categoryName) {
  const color = getCategoryColor(categoryName);
  return {
    background: `${color}14`,
    color: `${color}99`,
    border: `1px dashed ${color}66`
  };
}

// 카테고리 칩 색상은 연한 색, 선택되면 진하게 함
function chipStyle(c) {
  const active = selectedCategories.value.includes(c.name);
  const color = c.name === '전체' ? 'var(--brown)' : getCategoryColor(c.name);

  if (active) {
    return { background: color, borderColor: color, color: '#fff' };
  }
  if (c.name === '전체') {
    return {};
  }
  return {
    background: `${color}1a`,
    borderColor: `${color}66`,
    color
  };
}

// 카테고리 이름별로 집계
const categoryCounts = computed(() => {
  const counts = {};
  (calendarData.value.category || []).forEach(c => {
    counts[c.categoryName] = (counts[c.categoryName] || 0) + 1;
  });
  return counts;
});

const categories = computed(() => {
  const counts = categoryCounts.value;

  // 카테고리별 개수를 다 합해서 "전체" 칩에 표시할 총 개수 계산
  let total = 0;
  for (const name in counts) {
    total += counts[name];
  }

  return [
    { name: '전체', icon: '📊', count: total },
    ...CATEGORY_LIST.map(name => ({
      name,
      icon: getIcon(name),
      count: counts[name] || 0
    }))
  ];
});

function toggleCategory(name) {
  if (name === '전체') {
    selectedCategories.value = ['전체'];
    return;
  }

  selectedCategories.value =
    selectedCategories.value.filter(c => c !== '전체');

  if (selectedCategories.value.includes(name)) {
    selectedCategories.value =
      selectedCategories.value.filter(c => c !== name);
  } else {
    selectedCategories.value.push(name);
  }

  if (selectedCategories.value.length === 0) {
    selectedCategories.value = ['전체'];
  }
}

function getYearMonth() {
  return `${currentDate.value.getFullYear()}-${String(currentDate.value.getMonth() + 1).padStart(2, '0')}`;
}

async function loadCalendar() {
  await consumptionStore.getCalendar(
    getYearMonth()
  );
}

onMounted(() => {
  loadCalendar();
});

watch(currentDate, () => {
  loadCalendar();
});

const daysMap = computed(() => {
  const map = {};

  calendarData.value.days?.forEach(day => {
    map[day.date] = day;
  });

  return map;
});

// 카테고리별 소비 내역('전체'면 그대로 리턴)
function filterItems(items) {
  if (selectedCategories.value.includes('전체')) return items;
  return items.filter(item => selectedCategories.value.includes(item.categoryName));
}

// 달력 칸 하나에는 카테고리 종류 최대 2개까지만 미리보기로 보여준다.
const MAX_MINI_ITEMS = 2;

// 하루의 실제 소비 + 예상 소비를 합쳐서 하나의 목록으로 만든다.
function allItemsOf(day) {
  const actual = day.spendings.map(s => ({ ...s, type: 'actual', key: `s-${s.spendingNo}` }));
  const expected = day.expectedSpendings.map(s => ({ ...s, type: 'expected', key: `e-${s.expectedNo}` }));
  return [...actual, ...expected];
}

// 하루의 내역을 "카테고리별 건수"로 묶어준다.
function categorySummaryOfDay(day) {
  const items = allItemsOf(day);
  const counts = {}; // { 카테고리명: 건수 }

  for (const item of items) {
    counts[item.categoryName] = (counts[item.categoryName] || 0) + 1;
  }

  // { 식비: 3, 교통: 1 } 같은 객체를 [{ name: '식비', count: 3 }, ...] 배열로 바꿔준다.
  return Object.keys(counts).map(name => ({
    name,
    count: counts[name]
  }));
}

// 달력 칸 미리보기에는 카테고리 종류 최대 MAX_MINI_ITEMS개까지만 보여준다.
function previewCategoriesOf(day) {
  return categorySummaryOfDay(day).slice(0, MAX_MINI_ITEMS);
}

function hasMoreCategories(day) {
  return categorySummaryOfDay(day).length > MAX_MINI_ITEMS;
}

// 칸 안에 표시된 두 카테고리의 내역을 제외한 건수를 다 더한 값
function hiddenCount(day) {
  const hiddenCategories = categorySummaryOfDay(day).slice(MAX_MINI_ITEMS);
  return hiddenCategories.reduce((sum, cat) => sum + cat.count, 0);
}

// "2026-07-27" 같은 날짜를 "7월 27일" 형태로 바꿔서 보여준다.
function formatMonthDay(dateStr) {
  const [, month, day] = dateStr.split('-');
  return `${Number(month)}월 ${Number(day)}일`;
}

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const result = [];

  const start = new Date(year, month, 1).getDay();
  const last = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < start; i++) {
    result.push(null);
  }

  for (let d = 1; d <= last; d++) {
    const date =
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const data = daysMap.value[date] || {
      spendings: [],
      expectedSpendings: []
    };

    result.push({
      day: d,
      date,
      spendings: filterItems(data.spendings),
      expectedSpendings: filterItems(data.expectedSpendings)
    });
  }

  // 달력을 그 달에 실제로 필요한 주 수(7의 배수)만큼 채운다.
  const remainder = result.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      result.push(null);
    }
  }

  return result;
});

function prevMonth() {
  currentDate.value =
    new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() - 1
    );
  selectedDay.value = null;
}

function nextMonth() {
  currentDate.value =
    new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() + 1
    );
  selectedDay.value = null;
}

function selectDay(day) {
  if (!day) return;

  const hasContent = day.spendings.length > 0 || day.expectedSpendings.length > 0;
  if (!hasContent) return;

  selectedDay.value =
    selectedDay.value?.date === day.date
      ? null
      : day;
}

function payMethodText(method) {
  const map = {
    CASH: '현금',
    CHECK_CARD: '체크카드',
    CREDIT_CARD: '신용카드',
    EASY_PAY: '간편결제',
    TRANSFER: '계좌이체'
  };

  return map[method] || method;
}

function displayAmount(amount) {
  const n = amount || 0;
  const sign = n < 0 ? '-' : '';
  return `${sign}${Math.abs(n).toLocaleString()}원`;
}

// 예상 소비 추가 (ExpectedCreate.vue)
// showAddSheet: 추가 화면이 열려있는지 여부
// addSheetDate: 어떤 날짜에 추가할지
const showAddSheet = ref(false);
const addSheetDate = ref(null);

function openAddSheet() {
  const date = selectedDay.value?.date || todayStr();
  if (!canAddExpected(date)) return;

  addSheetDate.value = date;
  showAddSheet.value = true;
}

function closeAddSheet() {
  showAddSheet.value = false;
}

async function onAddSaved() {
  showAddSheet.value = false;
  await loadCalendar();
}

// 예상 소비 수정 (ExpectedEdit.vue)
const editingItem = ref(null);

function editExpected(item) {
  editingItem.value = item;
}

function closeEditSheet() {
  editingItem.value = null;
}

async function onEditSaved() {
  editingItem.value = null;
  await loadCalendar();
}

</script>
<template>
  <div class="container">

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'calendar' }" @click="activeTab = 'calendar'">
        소비 캘린더
      </button>
      <button class="tab" :class="{ active: activeTab === 'pattern' }" @click="activeTab = 'pattern'">
        패턴 분석
      </button>
    </div>

    <template v-if="activeTab === 'calendar'">
      <div class="header">
        <button @click="prevMonth">◀</button>
        <h2>{{ currentDate.getFullYear() }}년 {{ currentDate.getMonth() + 1 }}월</h2>
        <button @click="nextMonth">▶</button>
      </div>

      <div class="summary-bar">
        <div class="summary-item">
          <span>총 지출</span>
          <strong class="spend">{{ displayAmount(-totalSpend) }}</strong>
        </div>
        <div class="divider"></div>
        <div class="summary-item">
          <span>예상 소비</span>
          <strong class="expected">{{ displayAmount(expectedTotal) }}</strong>
        </div>
      </div>

      <div class="chips">
        <button v-for="c in categories" :key="c.name" @click="toggleCategory(c.name)"
          :class="{ active: selectedCategories.includes(c.name) }" :style="chipStyle(c)">
          {{ c.icon }} {{ c.name }} {{ c.count }}
        </button>
      </div>

      <div class="week">
        <div v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">
          {{ d }}
        </div>
      </div>

      <div class="calendar-wrap">
        <div class="grid">
          <div v-for="(day, i) in calendarDays" :key="i" class="cell" :class="{
            empty: !day,
            past: day && isPastDay(day.date),
            today: day && isToday(day.date),
            sunday: i % 7 === 0,
            selected: day && selectedDay?.date === day.date,
            'no-data': day && !day.spendings.length && !day.expectedSpendings.length
          }" @click="selectDay(day)">
            <template v-if="day">
              <!-- <span v-if="hasMoreCategories(day)" class="more-badge">+</span> -->
              <div class="date">
                <span class="date-num">{{ day.day }}</span>
              </div>

              <div class="mini">
                <div v-for="cat in previewCategoriesOf(day)" :key="cat.name" class="cat-row">
                  <span class="cat-dot" :style="{ background: getCategoryColor(cat.name) }"></span>
                  <span class="cat-count" :style="{ color: getCategoryColor(cat.name) }">{{ cat.count }}</span>
                </div>

                <div v-if="hasMoreCategories(day)" class="more-link">+{{ hiddenCount(day) }}</div>
              </div>
            </template>
          </div>
        </div>

        <!-- 선택된 날짜와 무관하게 항상 달력(마지막 주) 바로 아래에 이어져서 표시됨 -->
        <div v-if="selectedDay" class="detail-inline">
          <div class="detail-title">
            {{ formatMonthDay(selectedDay.date) }}
            <button @click="selectedDay = null">✕</button>
          </div>

          <!-- 소비 내역 -->
          <template v-if="isPastDay(selectedDay.date) || isToday(selectedDay.date)">
            <div v-if="!selectedDay.spendings.length" class="empty-note">내역이 없어요</div>
            <div v-for="s in selectedDay.spendings" :key="s.spendingNo" class="detail-item"
              :style="itemStyle(s.categoryName)">

              <div class="detail-item-left">
                <span class="cat-badge" :style="{ background: getCategoryColor(s.categoryName) }">
                  {{ getIcon(s.categoryName) }} {{ s.categoryName }}
                </span>
                <div v-if="s.memo" class="item-title">{{ s.memo }}</div>
                <div v-if="s.merchant" class="item-merchant">{{ s.merchant }}</div>
              </div>
              <div class="detail-item-right">
                <span v-if="s.payMethod" class="pay-method">💳 {{ payMethodText(s.payMethod) }}</span>
                <strong class="item-amount-big">-{{ displayAmount(s.amount) }}</strong>
              </div>
            </div>
          </template>

          <!-- 예상 소비 -->
          <template v-if="!isPastDay(selectedDay.date)">
            <div v-if="!selectedDay.expectedSpendings.length" class="empty-note">내역이 없어요</div>
            <div v-for="s in selectedDay.expectedSpendings" :key="s.expectedNo" class="detail-item"
              :style="expectedItemStyle(s.categoryName)">
              <!-- 자동 등록된 항목이면 칸 상단에 안내 문구 -->
              <div v-if="s.autoGenerated" class="auto-notice">
                📢 정기적 예상 소비로 자동 등록된 내역입니다.
              </div>

              <div class="detail-item-content">
                <div class="detail-item-left">
                  <span class="cat-badge" :style="{ background: getCategoryColor(s.categoryName) }">
                    {{ getIcon(s.categoryName) }} {{ s.categoryName }}
                  </span>
                  <div v-if="s.memo" class="item-title">{{ s.memo }}</div>
                  <div v-if="s.merchant" class="item-merchant">{{ s.merchant }}</div>
                </div>
                <div class="detail-item-right">
                  <span v-if="s.payMethod" class="pay-method">💳 {{ payMethodText(s.payMethod) }}</span>
                  <button class="edit-expected-btn" @click="editExpected(s)">수정</button>
                  <strong class="item-amount-big">{{ displayAmount(s.amount) }}</strong>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <button class="fab" @click="openAddSheet">+</button>

      <!-- 예상 소비 "추가" 화면 (ExpectedCreate.vue) -->
      <ExpectedCreate v-if="showAddSheet" :target-date="addSheetDate" @close="closeAddSheet" @saved="onAddSaved" />

      <!-- 예상 소비 "수정" 화면 (ExpectedEdit.vue).
         targetDate는 selectedDay(지금 펼쳐서 보고 있는 날짜)에서 그대로 가져온다. -->
      <ExpectedEdit v-if="editingItem" :target-date="selectedDay?.date" :editing-item="editingItem"
        @close="closeEditSheet" @saved="onEditSaved" />
    </template>

    <template v-else>
      <div class="pattern-tab">
        <AiAnalysis />
      </div>
    </template>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.container {
  --brown: #6E4B3A;
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 8px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  border: 0;
  background: none;
  padding: 10px 2px;
  font-size: 15px;
  color: #999;
  cursor: pointer;
  text-align: center;
}

.tab.active {
  color: var(--brown);
  font-weight: 700;
  border-bottom: 2px solid #FFCC00;
}

.pattern-placeholder {
  text-align: center;
  color: #999;
  padding: 80px 0;
  font-size: 14px;
}

.pattern-placeholder p:first-child {
  font-size: 32px;
  margin-bottom: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--brown);
}

.header button {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: #FFCC00;
  cursor: pointer;
  font-size: 18px;
}


.summary-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  padding: 14px 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, .08);
  margin-bottom: 20px;
}

.summary-item {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  min-width: 0;
}

.summary-item span {
  color: #777;
  font-size: 13px;
  white-space: nowrap;
}

.summary-item strong {
  font-size: 17px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider {
  width: 1px;
  height: 22px;
  background: #eee;
  margin: 0 8px;
}

.spend {
  color: #E85B5B;
}

.expected {
  color: #7B61FF;
}


.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 20px;
  padding-bottom: 2px;
}

.chips button {
  border: 1px solid #eee;
  background: #f5f5f5;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}

.chips button.active {
  font-weight: 700;
}


.week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: #FFCC00;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}

.week div {
  text-align: center;
  padding: 12px;
  font-weight: 700;
  color: var(--brown);
}

.calendar-wrap {
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.cell {
  aspect-ratio: 3 / 4;
  min-width: 0;
  background: #fff;
  border: 1px solid #eee;
  padding: 7px;
  cursor: pointer;
  transition: .2s;
  overflow: hidden;
  position: relative;
}

.cell:hover {
  background: #fffbea;
}

.cell.empty {
  cursor: default;
}

.cell.no-data {
  cursor: default;
}

.cell.no-data:hover {
  background: #fff;
}

.cell.selected {
  outline: 2px solid var(--brown);
  outline-offset: -2px;
}

.cell.past .date {
  color: #bbb;
}

/* 일요일 칸의 날짜는 빨간색으로 표시 */
.cell.sunday .date {
  color: #E85B5B;
}

.date {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
}

.date-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 오늘 칸 */
.cell.today .date-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFCC00;
  color: var(--brown);
}

.mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cat-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-count {
  font-size: 11px;
  font-weight: 700;
}

.more-link {
  align-self: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: var(--brown);
  padding: 1px 6px;
  border-radius: 999px;
}

/* .more-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--brown);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  border: 1.5px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .25);
} */

.detail-inline {
  background: #fff;
  border: 1px solid #eee;
  border-top: none;
  padding: 16px;
  margin-top: -1px;
}

.detail-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--brown);
  margin-bottom: 14px;
}

.detail-title button {
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #333;
}

.empty-note {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

/* 상세 내역 카드: 왼쪽엔 카테고리 배지 + 메모(크게) + 소비처(작게),
   오른쪽엔 결제 수단(위) + 금액(항상 카드 맨 아래) */
.detail-item {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: stretch;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 8px;
}

.detail-item-left {
  min-width: 0;
}

.detail-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.detail-item-content {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 10px;
  width: 100%;
}

.auto-notice {
  flex-basis: 100%;
  font-size: 11px;
  color: rgb(60, 9, 198);
  font-weight: 700;
}

.cat-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.item-title {
  font-size: 17px;
  font-weight: 700;
  color: #222;
}

.item-merchant {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.item-amount-big {
  font-size: 16px;
  margin-top: auto;
}

.pay-method {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.edit-expected-btn {
  margin-top: 6px;
  border: 1px solid #ccc;
  background: #fff;
  color: #666;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.fab {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 0;
  background: #FFCC00;
  font-size: 34px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, .25);
}

@media(max-width:768px) {

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0px;
    padding-bottom: 90px;
  }

  .cell {
    aspect-ratio: auto;
    height: 92px;
    padding: 5px;
  }

  .fab {
    right: 20px;
    bottom: 90px;
  }

  .summary-item strong {
    font-size: 15px;
  }
}
</style>

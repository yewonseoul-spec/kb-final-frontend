<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import KbCard from '@/components/common/KbCard.vue';
import KbButton from '@/components/common/KbButton.vue';
import { ref, computed, onMounted } from 'vue';
import homeApi from '@/api/homeApi';
import { getAssetDashboard } from '@/api/assetApi';
import { useConsumptionStore } from '@/stores/consumptionStore';

const auth = useAuthStore();
const router = useRouter();

const cardTitle = computed(() =>
  auth.isLogin
    ? '맞춤 청년혜택을 찾아드려요'
    : '로그인하고 맞춤 혜택을 받아보세요',
);

const ctaLabel = computed(() =>
  auth.isLogin ? '맞춤 혜택 보기' : '로그인하기',
);

const onCta = () => {
  if (!auth.isLogin) {
    router.push({ name: 'Login' });
    return;
  }
  // 이름 대신 경로 문자열: benefit-main 만 kebab-case 라 담당자가 정리하면 깨진다
  router.push('/benefit');
};

// Enigne,Stress 배너 클릭시 해당 페이지로 이동연결
const banners = [
  {
    key: 'engine',
    title: '맞춤 정책 조합 최적화',
    desc: '수혜액이 가장 큰 정책 3개를 찾아드려요',
    to: '/engine',
  },
  {
    key: 'stress',
    title: '금융 스트레스 테스트',
    desc: '위기가 와도 몇 달 버틸 수 있는지 확인해요',
    to: '/stress',
  },
];

const track = ref(null);
const active = ref(0);

// 배너 하나가 트랙 폭을 꽉 채우므로 스크롤 위치를 폭으로 나누면 현재 번호가 나온다
const onScroll = () => {
  const el = track.value;
  active.value = Math.round(el.scrollLeft / el.clientWidth);
};

const goTo = (i) => {
  const el = track.value;
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
};

const popular = ref([]);
const loading = ref(true);

const consumption = useConsumptionStore();

// 자산 화면이 실패 시 0원을 보여주므로 초기값도 같게 맞춘다
const totalAsset = ref(0);

const goProducts = () => router.push('/asset/products');
const goRatio = () => router.push('/asset/ratio');

// AssetDashboard.vue 의 formatWon 과 같은 표기
const formatWon = (value) => `${Number(value ?? 0).toLocaleString('ko-KR')}원`;

// ConsumptionCal.vue 의 displayAmount 와 같은 규칙.
// 총 지출은 음수로 넘겨서 '-' 가 붙는다
const displayAmount = (amount) => {
  const n = amount || 0;
  const sign = n < 0 ? '-' : '';
  return `${sign}${Math.abs(n).toLocaleString()}원`;
};

const totalSpend = computed(() => consumption.calendarData?.totalSpend || 0);
const expectedTotal = computed(
  () => consumption.calendarData?.expectedTotal || 0,
);

const thisMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// 인기 혜택 실패 시에도 멈추지 않게 처리.
// 빈 배열이면 섹션을 통째로 숨긴다.
onMounted(async () => {
  try {
    const data = await homeApi.getSummary();
    popular.value = data.popularBenefits ?? [];
  } catch (e) {
    console.error('홈 요약을 불러오지 못했어요', e);
  } finally {
    loading.value = false;
  }

  // 두 컨트롤러 다 user 가 null 이면 바로 터진다(permitAll 이라 401 도 아닌 500). 가드 필수
  if (!auth.isLogin) return;

  try {
    const { data } = await getAssetDashboard();
    totalAsset.value = data.totalAsset;
  } catch (e) {
    console.error('자산 요약을 불러오지 못했어요', e);
  }

  // 스토어가 실패를 calendarError 로 삼키므로 try 로 감쌀 필요가 없다
  consumption.getCalendar(thisMonth());
});
</script>

<template>
  <div class="home">
    <section class="section">
      <KbCard yellow-bg>
        <p v-if="auth.isLogin" class="card-lead">
          {{ auth.realName }} 님 조건에 맞는
        </p>
        <p class="card-title">{{ cardTitle }}</p>
        <div class="cta-row">
          <KbButton type="primary" @click="onCta">{{ ctaLabel }}</KbButton>
        </div>
      </KbCard>
    </section>

    <section v-if="loading || popular.length" class="section popular">
      <div class="section-head">
        <h2 class="section-title">요즘 많이 보는 혜택</h2>
      </div>

      <KbCard>
        <ol v-if="popular.length" class="popular-list">
          <li v-for="(b, i) in popular" :key="b.benefitNo">
            <RouterLink
              :to="`/benefit/detail/${b.benefitNo}`"
              class="popular-item popular-link"
            >
              <span class="popular-rank">{{ i + 1 }}</span>
              <div class="popular-body">
                <p class="popular-name">{{ b.plcyNm }}</p>
              </div>
            </RouterLink>
          </li>
        </ol>

        <!-- 응답 전 자리를 잡아 두어 섹션이 튀어나오지 않게 한다 -->
        <ol v-else class="popular-list" aria-hidden="true">
          <li v-for="n in 3" :key="n" class="popular-item">
            <span class="popular-rank">{{ n }}</span>
            <div class="popular-body">
              <div class="skeleton-name">
                <span class="skeleton skeleton-line"></span>
                <span class="skeleton skeleton-line short"></span>
              </div>
            </div>
          </li>
        </ol>
      </KbCard>
    </section>

    <!-- 자산·소비는 로그인 회원 본인 데이터라 v-if 로 묶는다.
           /consumption 은 requiresAuth 가 없어 비로그인도 들어갈 수 있고,
           두 API 다 비로그인이면 서버에서 터지므로 호출 자체를 막아야 한다 -->
    <template v-if="auth.isLogin">
      <section class="section box">
        <div class="section-head">
          <h2 class="section-title">내 자산</h2>
        </div>

        <!-- AssetDashboard.vue 의 총 자산 카드와 같은 모양.
               전체보기 링크 대신 카드 자체를 눌러 자산 화면으로 간다 -->
        <div
          class="total-card"
          role="button"
          tabindex="0"
          @click="router.push('/asset')"
          @keydown.enter="router.push('/asset')"
        >
          <p class="total-label">총 자산</p>
          <p class="total-amount">{{ formatWon(totalAsset) }}</p>
          <div class="btn-row">
            <!-- 카드 전체가 눌리므로 버튼은 .stop 으로 이동을 막는다 -->
            <button
              type="button"
              class="asset-btn primary"
              @click.stop="goProducts"
            >
              금융 상품 조회
            </button>
            <button
              type="button"
              class="asset-btn secondary"
              @click.stop="goRatio"
            >
              자산 비율 분석
            </button>
          </div>
        </div>
      </section>

      <section class="section box">
        <div class="section-head">
          <h2 class="section-title">내 소비</h2>
        </div>

        <!-- ConsumptionCal.vue 의 summary-bar. 원본은 그 자체가 흰 카드라
               그대로 쓰면 카드 안에 카드가 된다. 껍데기는 KbCard 에 맡긴다 -->
        <KbCard
          class="clickable"
          role="button"
          tabindex="0"
          @click="router.push('/consumption')"
          @keydown.enter="router.push('/consumption')"
        >
          <div class="summary-bar">
            <div class="summary-item">
              <span>총 지출</span>
              <strong class="spend">{{ displayAmount(-totalSpend) }}</strong>
            </div>
            <div class="divider"></div>
            <div class="summary-item">
              <span>예상 소비</span>
              <strong class="expected">{{
                displayAmount(expectedTotal)
              }}</strong>
            </div>
          </div>
        </KbCard>
      </section>
    </template>

    <section class="banners">
      <div ref="track" class="banner-track" @scroll="onScroll">
        <!-- article 이 아니라 button 이어야 키보드 접근과 스크린 리더가 동작한다 -->
        <button
          v-for="b in banners"
          :key="b.key"
          type="button"
          class="banner"
          @click="router.push(b.to)"
        >
          <!-- 드로어 메뉴(KbMenuDrawer)와 같은 아이콘. 배너마다 달라 key 로 가른다 -->
          <svg
            v-if="b.key === 'engine'"
            class="banner-icon"
            width="22"
            height="22"
            viewBox="0 -3 20 20"
            fill="none"
          >
            <rect
              x="2.9"
              y="6.1"
              width="14.2"
              height="7.1"
              rx="2"
              stroke="#ffbc00"
              stroke-width="1.9"
            />
            <path
              d="M4.9 3.7H15.1"
              stroke="#ffbc00"
              stroke-width="1.9"
              stroke-linecap="round"
            />
            <path
              d="M6.7 1.3H13.3"
              stroke="#ffbc00"
              stroke-width="1.9"
              stroke-linecap="round"
            />
          </svg>
          <svg
            v-else
            class="banner-icon"
            width="22"
            height="22"
            viewBox="0 -3 20 20"
            fill="none"
          >
            <path
              d="M3.5 12.45A6.5 6.5 0 0 1 16.5 12.45"
              stroke="#ffbc00"
              stroke-width="1.9"
              stroke-linecap="round"
            />
            <path
              d="M10 12.45L13 8.2"
              stroke="#ffbc00"
              stroke-width="1.9"
              stroke-linecap="round"
            />
          </svg>
          <div class="banner-text">
            <h3 class="banner-title">{{ b.title }}</h3>
            <p class="banner-desc">{{ b.desc }}</p>
          </div>
          <span class="banner-arrow">›</span>
        </button>
      </div>

      <div class="banner-dots">
        <button
          v-for="(b, i) in banners"
          :key="b.key"
          type="button"
          class="dot"
          :class="{ on: i === active }"
          :aria-label="b.title + ' 보기'"
          @click="goTo(i)"
        ></button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 바깥 DefaultLayout 이 my-3 px-3 을 이미 주므로 여기서는 정렬과 폭만 맡는다 */
.home {
  max-width: 500px;
  margin: 0 auto;
  /* 탭바가 position:fixed 라 마지막 요소를 덮는다. 탭바 80px + 여백 16px */
  padding-bottom: 96px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #2e2a24;
}

.section-more {
  flex-shrink: 0;
  font-size: 13px;
  color: #908980;
  text-decoration: none;
}

.card-lead {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #908980;
}

.card-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.45;
  font-weight: 700;
  color: #2e2a24;
  word-break: keep-all;
}

/* KbButton 이 inline-flex 라서 grid 아이템으로 두어 폭을 꽉 채운다 */
.cta-row {
  display: grid;
  margin-top: 4px;
}

.popular {
  margin-top: 20px;
}

.popular-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.popular-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
}

/* a 안에 div·p 를 넣는 건 허용된다(a 는 투명 콘텐츠 모델).
     링크를 이름 글자에만 걸면 표적이 너무 작아서 행 전체를 링크로 만든다 */
.popular-link {
  color: inherit;
  text-decoration: none;
}

.popular-rank {
  flex-shrink: 0;
  width: 18px;
  font-size: 14px;
  font-weight: 700;
  color: #ffbc00;
  text-align: center;
}

/* 스켈레톤 막대는 내용이 없어 폭을 못 잡으므로 부모가 폭을 정해준다 */
.popular-body {
  flex: 1;
  min-width: 0;
}

.skeleton {
  display: block;
  border-radius: 6px;
  background-color: #efece4;
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

/* 실제 텍스트 한 줄(15px × 1.4 = 21px)과 같은 자리를 차지하게 막대 15px + 위아래 3px */
.skeleton-name {
  display: flex;
  flex-direction: column;
  min-height: 2.8em;
  font-size: 14px;
}

.skeleton-line {
  height: 15px;
  margin: 3px 0;
}

.skeleton-line.short {
  width: 62%;
}

@keyframes skeleton-pulse {
  50% {
    opacity: 0.45;
  }
}

/* plcy_nm 이 TEXT 컬럼이라 정책명이 매우 길다. 2줄까지만 보여주고 나머지는 자른다 */
.popular-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 600;
  color: #2e2a24;
  word-break: keep-all;
}

.box {
  margin-top: 20px;
}

/* AssetDashboard.vue 의 .total-card 와 같은 값.
     홈 배너(#2e2a24)와 같은 계열이라 톤이 어긋나지 않는다 */
.total-card {
  box-sizing: border-box;
  padding: 15px 17px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4a4340 0%, #2b2725 100%);
  color: #ffffff;
  cursor: pointer;
}

.total-label {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.45;
  opacity: 0.8;
}

.total-amount {
  font-size: 20px;
  line-height: 1.3;
  margin: 0 0 10px;
  font-weight: 700;
}

.btn-row {
  display: flex;
  gap: 8px;
}

/* font: inherit 는 원본에 없다. 없으면 버튼만 브라우저 기본 글꼴로 빠져
     Pretendard 를 쓰는 나머지 홈 요소와 어긋난다 */
.asset-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 10px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.asset-btn.primary {
  background: #f4c15c;
  color: #2b2725;
}

.asset-btn.secondary {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* ConsumptionCal.vue 의 summary-bar 에서 카드 껍데기만 뺀 것 */
.summary-bar {
  display: flex;
  align-items: center;
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
  font-size: 12px;
  color: #777;
  white-space: nowrap;
}

.summary-item strong {
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider {
  width: 1px;
  height: 22px;
  margin: 0 8px;
  background: #eee;
}

.spend {
  color: #e85b5b;
}

.expected {
  color: #7b61ff;
}

/* 원본(ConsumptionCal.vue:957,975)에 있는 규칙. 좁은 화면에서 금액이 잘리지 않게 */
@media (max-width: 768px) {
  .summary-item strong {
    font-size: 15px;
  }
}

.banners {
  margin-top: 20px;
}

/* scroll-snap 으로 한 칸씩 넘긴다. 라이브러리 없이 브라우저 기능만 쓴다 */
.banner-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.banner-track::-webkit-scrollbar {
  display: none;
}

/* button 기본 스타일(테두리·글꼴·가운데정렬)을 지워 기존 배너 모양을 유지한다 */
.banner {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 100%;
  align-items: center;
  gap: 10px;
  scroll-snap-align: start;
  padding: 16px 18px;
  border: 0;
  border-radius: 14px;
  background-color: #2e2a24;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.banner-icon {
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  word-break: keep-all;
}

.banner-desc {
  margin: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
  word-break: keep-all;
}

.banner-arrow {
  flex-shrink: 0;
  font-size: 22px;
  color: rgba(255, 255, 255, 0.72);
}

.banner-dots {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: 6px;
}

/* 점은 7px 이지만 버튼은 20px — 손가락으로 누를 수 있어야 한다 */
.dot {
  display: flex;
  width: 20px;
  height: 14px;
  padding: 0;
  align-items: center;
  justify-content: center;
  background: none;
  border: 0;
  cursor: pointer;
}

.dot::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #d9d4cb;
  transition: background-color 0.2s;
}

.dot.on::before {
  background-color: #ffbc00;
}

/* KbCard 의 padding 은 공통 컴포넌트 값(20px)이라 홈 안에서만 줄인다 */
.home :deep(.kb-card) {
  padding: 14px 16px;
  gap: 5px;
}

.home :deep(.kb-btn) {
  padding: 10px 16px;
  font-size: 13px;
}

/* KbCard 루트에 붙는다. 자식 컴포넌트 루트는 부모 스코프도 함께 받는다 */
.clickable {
  cursor: pointer;
}
</style>

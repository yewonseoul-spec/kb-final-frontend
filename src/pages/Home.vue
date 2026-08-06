<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import KbCard from '@/components/common/KbCard.vue';
import KbButton from '@/components/common/KbButton.vue';
import { ref, computed, onMounted } from 'vue';
import homeApi from '@/api/homeApi';

const auth = useAuthStore();
const router = useRouter();

const greeting = computed(() =>
  auth.isLogin
    ? `${auth.realName} 님, 오늘의 혜택 챙겨봐요 👋`
    : '청년타파에 오신 걸 환영해요 👋',
);

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
  // TODO 추천 혜택 페이지가 생기면 목적지를 그쪽으로 바꾼다
  router.push({ name: 'BenefitSearch' });
};

// Enigne,Stress 배너 클릭시 해당 페이지로 이동연결
const banners = [
  {
    key: 'engine',
    title: 'AI 정책 조합 최적화',
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
});
</script>

<template>
  <div class="home">
    <p class="greeting">{{ greeting }}</p>
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">지금 받을 수 있는 혜택</h2>
      </div>

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

    <!-- 혜택 상세 페이지가 없어 지금은 클릭 불가로 둔다 -->
    <section v-if="loading || popular.length" class="section popular">
      <div class="section-head">
        <h2 class="section-title">요즘 많이 보는 혜택</h2>
      </div>

      <KbCard>
        <ol v-if="popular.length" class="popular-list">
          <li v-for="(b, i) in popular" :key="b.benefitNo" class="popular-item">
            <span class="popular-rank">{{ i + 1 }}</span>
            <div class="popular-body">
              <p class="popular-name">{{ b.plcyNm }}</p>
              <p class="popular-meta">
                {{ b.categoryName }}
                <template v-if="b.sprvsnInstCdNm">
                  · {{ b.sprvsnInstCdNm }}</template
                >
              </p>
            </div>
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
              <span class="skeleton skeleton-meta"></span>
            </div>
          </li>
        </ol>
      </KbCard>
    </section>

    <!-- 자산 백엔드가 없고 소비는 memberNo 가 하드코딩이라 금액은 띄우지 않는다.
         비로그인에게는 '내 자산'이 어색하고, /consumption 은 requiresAuth 가 없어
         비로그인이 들어가면 2번 회원 소비가 그대로 보이므로 로그인 시에만 노출한다 -->
    <template v-if="auth.isLogin">
      <section class="section box">
        <div class="section-head">
          <h2 class="section-title">내 자산</h2>
          <RouterLink to="/asset" class="section-more">전체보기 ›</RouterLink>
        </div>

        <KbCard>
          <p class="box-text">계좌 연동을 준비하고 있어요</p>
        </KbCard>
      </section>

      <section class="section box">
        <div class="section-head">
          <h2 class="section-title">내 소비</h2>
          <RouterLink to="/consumption" class="section-more"
            >전체보기 ›</RouterLink
          >
        </div>

        <KbCard>
          <p class="box-text">달력에서 이번 달 소비를 확인해 보세요</p>
        </KbCard>
      </section>
    </template>

    <section class="banners">
      <div ref="track" class="banner-track" @scroll="onScroll">
        <button v-for="b in banners" :key="b.key" class="banner">
          <svg class="banner-icon" width="22" height="22" viewBox="0 0 24 24">
            <path
              d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"
              fill="#ffbc00"
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
/* 바깥 DefaultLayout 이 my-5 px-3 을 이미 주므로 여기서는 정렬과 폭만 맡는다 */
.home {
  max-width: 500px;
  margin: 0 auto;
  /* 탭바가 position:fixed 라 마지막 요소를 덮는다 */
  padding-bottom: 96px;
}

.greeting {
  margin: 0 0 28px;
  font-size: 20px;
  font-weight: 700;
  color: #2e2a24;
  word-break: keep-all;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 17px;
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
  font-size: 14px;
  color: #908980;
}

.card-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #2e2a24;
  word-break: keep-all;
}

/* KbButton 이 inline-flex 라서 grid 아이템으로 두어 폭을 꽉 채운다 */
.cta-row {
  display: grid;
  margin-top: 8px;
}

.popular {
  margin-top: 28px;
}

.popular-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.popular-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 66px;
}

.popular-rank {
  flex-shrink: 0;
  width: 22px;
  font-size: 16px;
  font-weight: 700;
  color: #ffbc00;
  text-align: center;
}

/* 스켈레톤 막대는 내용이 없어 폭을 못 잡으므로 부모가 폭을 정해준다 */
.popular-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  font-size: 15px;
}

.skeleton-line {
  height: 15px;
  margin: 3px 0;
}

.skeleton-line.short {
  width: 62%;
}

/* 13px × 1.4 = 18.2px */
.skeleton-meta {
  width: 45%;
  height: 13px;
  margin: 2.6px 0;
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
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 600;
  color: #2e2a24;
  word-break: keep-all;
}

.popular-meta {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: #908980;
}

.box {
  margin-top: 28px;
}

.box-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  color: #908980;
  word-break: keep-all;
}

.banners {
  margin-top: 28px;
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

.banner {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 100%;
  align-items: center;
  gap: 14px;
  scroll-snap-align: start;
  padding: 20px;
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
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  word-break: keep-all;
}

.banner-desc {
  margin: 0;
  font-size: 13px;
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
  margin-top: 12px;
}

/* 점은 7px 이지만 버튼은 20px — 손가락으로 누를 수 있어야 한다 */
.dot {
  display: flex;
  width: 20px;
  height: 20px;
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
</style>

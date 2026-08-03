<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import KbCard from '@/components/common/KbCard.vue';
import KbButton from '@/components/common/KbButton.vue';
import { ref } from 'vue';

const auth = useAuthStore();
const router = useRouter();

// TODO 추천 혜택 페이지가 생기면 목적지를 그쪽으로 바꾼다
// 지금은 엔진 프론트 화면·라우트가 없어 혜택 검색으로 보낸다
const goRecommend = () => router.push({ name: 'BenefitSearch' });

// TODO ENGINE·STRESS 화면이 생기면 각 배너에 이동을 붙인다
const banners = [
  {
    key: 'engine',
    title: 'AI 정책 조합 최적화',
    desc: '수혜액이 가장 큰 정책 3개를 찾아드려요',
  },
  {
    key: 'stress',
    title: '금융 스트레스 테스트',
    desc: '위기가 와도 몇 달 버틸 수 있는지 확인해요',
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
</script>

<template>
  <div class="home">
    <p v-if="auth.isLogin" class="greeting">
      {{ auth.realName }} 님, 오늘의 혜택 챙겨봐요 👋
    </p>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">지금 받을 수 있는 혜택</h2>
        <RouterLink class="section-more" :to="{ name: 'BenefitSearch' }">
          전체보기 ›
        </RouterLink>
      </div>

      <KbCard yellow-bg>
        <p v-if="auth.isLogin" class="card-lead">
          {{ auth.realName }} 님 조건에 맞는
        </p>
        <p class="card-title">맞춤 청년혜택을 찾아드려요</p>
        <div class="cta-row">
          <KbButton type="primary" @click="goRecommend"
            >맞춤 혜택 보기</KbButton
          >
        </div>
      </KbCard>
    </section>

    <section class="banners">
      <div ref="track" class="banner-track" @scroll="onScroll">
        <article v-for="b in banners" :key="b.key" class="banner">
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
        </article>
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

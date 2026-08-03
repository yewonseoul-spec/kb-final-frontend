<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import KbCard from '@/components/common/KbCard.vue';
import KbButton from '@/components/common/KbButton.vue';

const auth = useAuthStore();
const router = useRouter();

// TODO 추천 혜택 페이지가 생기면 목적지를 그쪽으로 바꾼다
// 지금은 엔진 프론트 화면·라우트가 없어 혜택 검색으로 보낸다
const goRecommend = () => router.push({ name: 'BenefitSearch' });
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
</style>

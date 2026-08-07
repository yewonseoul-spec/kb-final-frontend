<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import KbMenuDrawer from '@/components/common/KbMenuDrawer.vue';

const router = useRouter();
const route = useRoute();

const isMenuOpen = ref(false);

/*
 * 뒤로가기가 기본이다. 나갈 길이 따로 있는 화면(홈·로그인·관리자 대시보드·404)만
 * meta.headerType: 'root' 로 예외 처리한다.
 * 기본값이 '뒤로가기 있음'이라 새 화면이 meta 를 빠뜨려도 갇히지 않는다.
 */
const isBackHeader = computed(() => route.meta.headerType !== 'root');

const pageTitle = computed(
  () => route.meta.headerTitle || route.meta.title || '청년타파',
);

// 히스토리가 없으면(주소창 직접 진입·새로고침 직후) back() 이 앱 밖으로 나간다.
// 마이페이지 화면들의 '취소' 와 같은 방식으로 막는다.
const goBack = () => {
  if (window.history.state?.back) {
    router.back();
    return;
  }
  router.push({ name: 'Home' });
};
</script>

<template>
  <div class="container">
    <header class="common-header">
      <div class="header-left">
        <button
          v-if="isBackHeader"
          type="button"
          class="back-button"
          aria-label="뒤로 가기"
          @click="goBack"
        >
          ‹
        </button>

        <h1 class="header-title">
          {{ pageTitle }}
        </h1>
      </div>

      <div class="header-right">
        <button
          type="button"
          class="hamburger-btn"
          aria-label="메뉴 열기"
          @click="isMenuOpen = true"
        >
          ☰
        </button>
      </div>
    </header>

    <div class="content my-3 px-3">
      <slot></slot>
    </div>

    <KbMenuDrawer :isOpen="isMenuOpen" @close="isMenuOpen = false" />
  </div>
</template>

<style scoped>
.common-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 12px;
  border-bottom: 1px solid #e8e4dc;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 40px;
  margin-right: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2e2a24;
  font-size: 27px;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  /* ‹ 문자가 아래로 처져 보이는 현상 보정 */
  transform: translateY(-1px);
}

/* 마이페이지 페이지들의 .page-title 과 이름이 겹쳐 헷갈리므로 header- 로 구분한다 */
.header-title {
  margin: 0;
  min-width: 0;
  color: #2e2a24;
  font-size: 18px;
  font-weight: 700;
  /* 제목이 모든 화면에 뜨게 됐으므로 긴 제목이 헤더를 밀지 않게 자른다 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 40px;
  padding: 0;
  border: none;
  background: none;
  color: #2e2a24;
  font-size: 22px;
  cursor: pointer;
}
</style>

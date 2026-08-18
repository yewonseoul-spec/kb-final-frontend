<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import KbMenuDrawer from '@/components/common/KbMenuDrawer.vue';
import { useAuthStore } from '@/stores/auth';
import { getUnreadCount } from '@/api/notificationApi';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const isMenuOpen = ref(false);
const unread = ref(0);

/*
 * 뒤로가기가 기본이다. 나갈 길이 따로 있는 화면(홈·로그인·관리자 대시보드·404)만
 * meta.headerType: 'root' 로 예외 처리한다.
 * 기본값이 '뒤로가기 있음'이라 새 화면이 meta 를 빠뜨려도 갇히지 않는다.
 */
const isBackHeader = computed(() => route.meta.headerType !== 'root');

const pageTitle = computed(() => route.meta.title || '청년타파');

// 히스토리가 없으면(주소창 직접 진입·새로고침 직후) back() 이 앱 밖으로 나간다.
// 마이페이지 화면들의 '취소' 와 같은 방식으로 막는다.
const goBack = () => {
  if (window.history.state?.back) {
    router.back();
    return;
  }
  router.push({ name: 'Home' });
};

// 배지는 부가 정보다. 실패해도 화면을 막지 않는다.
const loadUnread = async () => {
  if (!auth.isLogin) {
    unread.value = 0;
    return;
  }
  try {
    unread.value = await getUnreadCount();
  } catch (e) {
    unread.value = 0;
  }
};

// 화면을 옮길 때마다 다시 센다.
watch(() => route.fullPath, loadUnread, { immediate: true });
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
          v-if="auth.isLogin"
          type="button"
          class="noti-btn"
          aria-label="알림"
          @click="router.push({ name: 'Notification' })"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>

          <span v-if="unread > 0" class="noti-dot">
            {{ unread > 99 ? '99+' : unread }}
          </span>
        </button>

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
  /* 스크롤해도 뒤로가기·햄버거가 항상 닿는 자리에 있게 한다 */
  position: sticky;
  top: 0;
  /* 탭바(1000) 아래, 페이지 콘텐츠 최댓값(100) 위.
     드로어(2000)·모달(3000)은 그대로 헤더를 덮는다 */
  z-index: 900;
  /* 배경이 없으면 스크롤되는 본문이 제목 뒤로 비친다. body 와 같은 색 */
  background: var(--color-background);

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

.noti-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 40px;
  padding: 0;
  border: none;
  background: none;
  color: #2e2a24;
  cursor: pointer;
}

.noti-dot {
  position: absolute;
  top: 4px;
  right: 1px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: #d64545;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}
</style>

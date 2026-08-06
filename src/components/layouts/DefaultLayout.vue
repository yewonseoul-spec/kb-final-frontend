<script setup>
import { ref, computed } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import authApi from "@/api/authApi";
import KbMenuDrawer from "@/components/common/KbMenuDrawer.vue";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const isMenuOpen = ref(false);

/*
 * headerType이 back이면:
 * 뒤로가기 버튼 + 페이지 제목 표시
 *
 * 그 외에는:
 * 청년타파 로고 표시
 */
const isBackHeader = computed(() => {
  return route.meta.headerType === "back";
});

const pageTitle = computed(() => {
  return route.meta.headerTitle || route.meta.title || "청년타파";
});

const goBack = () => {
  router.back();
};

const onLogout = async () => {
  try {
    await authApi.logout();
  } catch (e) {
    /*
     * 토큰이 이미 만료된 경우에도
     * 로컬 로그인 정보는 정리한다.
     */
  }

  auth.logout();

  router.push({
    name: "Login",
  });
};
</script>

<template>
  <div class="container">
    <header class="common-header">
      <!-- 왼쪽 영역 -->
      <div class="header-left">
        <!-- 검색 페이지 등 뒤로가기 헤더 -->
        <template v-if="isBackHeader">
          <button
            type="button"
            class="back-button"
            aria-label="뒤로 가기"
            @click="goBack"
          >
            ‹
          </button>

          <h1 class="page-title">
            {{ pageTitle }}
          </h1>
        </template>

        <!-- 일반 페이지 헤더 -->
        <RouterLink
          v-else
          :to="{ name: 'Home' }"
          class="header-logo"
        >
          청년타파
        </RouterLink>
      </div>

      <!-- 오른쪽 영역 -->
      <div class="header-right">
        <template v-if="auth.isLogin">
          <span class="member-name">
            {{ auth.realName || auth.loginId }} 님
          </span>

          <button
            type="button"
            class="logout-button"
            @click="onLogout"
          >
            로그아웃
          </button>
        </template>

        <RouterLink
          v-else
          :to="{ name: 'Login' }"
          class="login-button"
        >
          로그인
        </RouterLink>

        <!-- 햄버거 기능은 그대로 유지 -->
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

    <KbMenuDrawer
      :isOpen="isMenuOpen"
      @close="isMenuOpen = false"
    />
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

.header-logo {
  color: #2e2a24;
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
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

.page-title {
  margin: 0;
  color: #2e2a24;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.member-name {
  color: #7f786e;
  font-size: 13px;
}

.login-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  border-radius: 5px;
  background: #ffbc00;
  color: #2e2a24;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.logout-button {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #dc3545;
  border-radius: 5px;
  background: #ffffff;
  color: #dc3545;
  font-size: 12px;
  cursor: pointer;
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

<script setup>
import { ref, computed } from 'vue';
import { RouterLink, useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import authApi from '@/api/authApi';
import KbMenuDrawer from '@/components/common/KbMenuDrawer.vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const isMenuOpen = ref(false);

const pageTitle = computed(() => route.meta.title || '청년타파');

const onLogout = async () => {
  try {
    await authApi.logout();
  } catch (e) {
    // 토큰이 이미 만료된 경우 등 — 로컬 정리는 그대로 진행한다
  }
  auth.logout();
  router.push({ name: 'Login' });
};
</script>

<template>
  <div class="container">
    <header
      class="d-flex justify-content-between align-items-center py-3 border-bottom"
    >
      <RouterLink
        :to="{ name: 'Home' }"
        class="fw-bold fs-5 text-decoration-none text-dark"
      >
        {{ pageTitle }}
      </RouterLink>

      <div v-if="auth.isLogin" class="d-flex align-items-center gap-3">
        <span class="text-secondary"
          >{{ auth.realName || auth.loginId }} 님</span
        >
        <button
          type="button"
          class="btn btn-sm btn-outline-danger"
          @click="onLogout"
        >
          로그아웃
        </button>
      </div>

      <RouterLink v-else :to="{ name: 'Login' }" class="btn btn-sm btn-warning"
        >로그인</RouterLink
      >

      <!-- TO-DO 로그인 완료 이후에 위치 변경 해야됨 -->
      <button type="button" class="hamburger-btn" @click="isMenuOpen = true">
        ☰
      </button>

      <!--------------------------------------------------------->
    </header>

    <div class="content my-5 px-3">
      <slot></slot>
    </div>

    <KbMenuDrawer :isOpen="isMenuOpen" @close="isMenuOpen = false" />
  </div>
</template>

<style scoped>
.hamburger-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 0 4px;
  color: #2e2a24;
}
</style>

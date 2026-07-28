<script setup>
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import authApi from '@/api/authApi';

const router = useRouter();
const auth = useAuthStore();

const onLogout = async () => {
  try {
    await authApi.logout();
  } catch (e) {
    // 토큰이 이미 만료된 경우 등 — 로컬 정리는 그대로 진행한다
  }
  auth.logout();
  router.push('/login');
};
</script>

<template>
  <div class="container">
    <header
      class="d-flex justify-content-between align-items-center py-3 border-bottom"
    >
      <RouterLink to="/" class="fw-bold fs-5 text-decoration-none text-dark">
        청년타파
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
      <RouterLink v-else to="/login" class="btn btn-sm btn-warning"
        >로그인</RouterLink
      >
    </header>

    <div class="content my-5 px-3">
      <slot></slot>
    </div>
  </div>
</template>

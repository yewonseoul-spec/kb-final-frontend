import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import admin from './admin.js';
import asset from './asset.js';
import benefits from './benefits.js';
import mypage from './mypage.js';
import consumption from './consumption.js';
import auth from './auth.js';
import { useAuthStore } from '@/stores/auth.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    ...admin,
    ...asset,
    ...benefits,
    ...mypage,
    ...consumption,
    ...auth,
  ],
});

// 로그인 상태 시 로그인, 회원가입 페이지 진입 차단
router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.meta.guestOnly && authStore.isLogin) {
    return '/';
  }
});

export default router;

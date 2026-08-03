import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import admin from './admin.js';
import asset from './asset.js';
import benefit from './benefit.js';
import mypage from './mypage.js';
import consumption from './consumption.js';
import auth from './auth.js';
import guide from './guide.js';
import engine from './engine.js';
import { useAuthStore } from '@/stores/auth.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Home', component: Home, meta: { title: '청년타파' } },
    ...admin,
    ...asset,
    ...benefit,
    ...mypage,
    ...consumption,
    ...auth,
    ...guide,
    ...engine,
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  // 로그인 상태 시 로그인, 회원가입 페이지 진입 차단
  if (to.meta.guestOnly && authStore.isLogin) {
    return '/';
  }

  // 인증이 필요한 페이지는 비로그인 시 로그인 페이지로 보낸다.
  // api/index.js 의 401 응답 인터셉터와 같은 쿼리를 써서 Login.vue 가 같은 안내를 띄우게 한다
  if (to.meta.requiresAuth && !authStore.isLogin) {
    return '/login?error=login_required';
  }
});

export default router;

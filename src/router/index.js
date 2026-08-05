import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import admin from './admin.js';
import asset from './asset.js';
import benefit from './benefit.js';
import mypage from './mypage.js';
import consumption from './consumption.js';
import auth from './auth.js';
import guide from './guide.js';
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
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  // 로그인 응답의 roles 는 ["ROLE_ADMIN"] 형태다 (UserInfoDTO 가 "ROLE_" + role 로 만든다)
  const roles = authStore.state?.user?.roles ?? [];
  const isAdmin = roles.includes('ROLE_ADMIN');

  // 로그인 상태 시 로그인, 회원가입 페이지 진입 차단
  // 관리자는 사용자용 홈이 의미 없으므로 대시보드로 보낸다
  if (to.meta.guestOnly && authStore.isLogin) {
    return isAdmin ? { name: 'adminDashboard' } : { name: 'Home' };
  }

  // 인증이 필요한 페이지는 비로그인 시 로그인 페이지로 보낸다.
  // api/index.js 의 401 응답 인터셉터와 같은 쿼리를 써서 Login.vue 가 같은 안내를 띄우게 한다
  if (to.meta.requiresAuth && !authStore.isLogin) {
    return { name: 'Login', query: { error: 'login_required' } };
  }

  // 관리자 전용 화면. 백엔드 SecurityConfig 가 hasRole("ADMIN") 으로 이미 막고 있지만,
  // 화면까지 열리면 빈 표에 403 만 뜨므로 진입 자체를 막는다
  if (to.meta.requiresAdmin && !isAdmin) {
    return { name: 'Home' };
  }

  // 관리자는 홈 대신 대시보드를 기본 화면으로 쓴다
  if (to.name === 'Home' && isAdmin) {
    return { name: 'adminDashboard' };
  }
});

export default router;

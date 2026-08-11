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
import stress from './stress.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      // 탭바로 언제든 돌아오는 최상위 화면이라 뒤로가기를 달지 않는다
      meta: { title: '청년타파', headerType: 'root' },
    },
    ...admin,
    ...asset,
    ...benefit,
    ...mypage,
    ...consumption,
    ...auth,
    ...guide,
    ...engine,
    ...stress,
    // 매칭 실패한 모든 주소. name 이 있어야 App.vue 의 탭바 조건을 통과한다
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../pages/NotFound.vue'),
      meta: { title: '청년타파', headerType: 'root' },
    },
  ],
});

// '처음 접속' 은 이 탭에서 앱을 처음 여는 것을 말한다.
// 새로고침마다 로그인으로 튕기면 비로그인 사용자가 홈에 머무를 수 없다.
const FIRST_VISIT_KEY = 'firstVisitDone';

router.beforeEach((to) => {
  const authStore = useAuthStore();

  // 로그인 응답의 roles 는 ["ROLE_ADMIN"] 형태다 (UserInfoDTO 가 "ROLE_" + role 로 만든다)
  const roles = authStore.state?.user?.roles ?? [];
  const isAdmin = roles.includes('ROLE_ADMIN');

  // 앱을 처음 열 때 한 번만 로그인 화면을 거친다. 여기서 걸린 뒤 홈으로 들어가면
  // 비로그인으로 계속 둘러볼 수 있다.
  // 표시는 어디로 들어왔든 최초 진입에서 남긴다. 공유 링크로 들어온 사람이
  // 나중에 홈으로 이동할 때 뒤늦게 로그인으로 튕기면 안 되기 때문이다.
  if (!sessionStorage.getItem(FIRST_VISIT_KEY)) {
    sessionStorage.setItem(FIRST_VISIT_KEY, '1');
    if (to.name === 'Home' && !authStore.isLogin) {
      return { name: 'Login' };
    }
  }

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

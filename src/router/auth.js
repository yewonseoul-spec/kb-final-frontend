export default [
  {
    path: '/login',
    name: 'Login',
    meta: {
      guestOnly: true,
      hideTabBar: true,
      title: '로그인',
      headerType: 'root',
    },
    component: () => import('../pages/auth/Login.vue'),
  },
  {
    path: '/signup',
    name: 'SignUp',
    meta: {
      guestOnly: true,
      hideTabBar: true,
      title: '회원가입',
    },
    component: () => import('../pages/auth/SignUp.vue'),
  },
  {
    path: '/findaccount/id',
    name: 'FindId',
    meta: {
      guestOnly: true,
      hideTabBar: true,
      title: '아이디 찾기',
    },
    component: () => import('../pages/auth/FindId.vue'),
  },
  {
    path: '/findaccount/password',
    name: 'ResetPassword',
    meta: {
      guestOnly: true,
      hideTabBar: true,
      title: '비밀번호 재설정',
    },
    component: () => import('../pages/auth/ResetPassword.vue'),
  },
];

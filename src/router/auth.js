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
];

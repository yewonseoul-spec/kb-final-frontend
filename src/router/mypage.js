export default [
  {
    path: '/mypage',
    name: '/mypage',
    meta: { requiresAuth: true },
    component: () => import('../pages/mypage/MyPage.vue'),
  },

  {
    path: '/mypage/infosetup',
    name: 'ProfileSetup',
    meta: { requiresAuth: true },
    component: () => import('../pages/mypage/ProfileSetup.vue'),
  },
];

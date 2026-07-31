export default [
  {
    // 탭바의 '마이' 가 /mypage 를 가리키는데 요약 화면(MYP-03)이 아직 없어
    // 임시로 프로필 화면으로 넘긴다. 요약 화면이 생기면 이 항목을 그 화면으로 교체할 것.
    path: '/mypage',
    redirect: '/mypage/profile',
  },
  {
    path: '/mypage/profile',
    name: 'ProfileEdit',
    meta: { requiresAuth: true, title: '마이페이지' },
    component: () => import('../pages/mypage/ProfileEdit.vue'),
  },
  {
    path: '/mypage/infosetup',
    name: 'ProfileSetup',
    meta: { requiresAuth: true, title: '프로필 입력', hideTabBar: true },
    component: () => import('../pages/mypage/ProfileSetup.vue'),
  },
];

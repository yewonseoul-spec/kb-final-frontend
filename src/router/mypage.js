export default [
  {
    // 탭바의 '마이' 가 /mypage 를 가리키는데 요약 화면이 아직 없어 프로필로 넘긴다.
    // 자식으로 묶는 이유: RouterLink 의 active 판정이 매칭된 레코드 비교라
    // 형제로 두면 /mypage/profile 에서 탭에 불이 안 들어온다.
    // 요약 화면이 생기면 redirect 를 component 로 바꾼다.
    path: '/mypage',
    name: 'MyPage',
    redirect: { name: 'ProfileEdit' },
    children: [
      {
        path: 'profile',
        name: 'ProfileEdit',
        meta: { requiresAuth: true, title: '마이페이지' },
        component: () => import('../pages/mypage/ProfileEdit.vue'),
      },
      {
        path: 'infosetup',
        name: 'ProfileSetup',
        meta: { requiresAuth: true, title: '프로필 입력', hideTabBar: true },
        component: () => import('../pages/mypage/ProfileSetup.vue'),
      },
      {
        path: 'goal',
        name: 'GoalEdit',
        meta: { requiresAuth: true, title: '마이페이지' },
        component: () => import('../pages/mypage/GoalEdit.vue'),
      },
      {
        path: 'goalsetup',
        name: 'GoalSetup',
        meta: { requiresAuth: true, title: '목표 설정', hideTabBar: true },
        component: () => import('../pages/mypage/GoalSetup.vue'),
      },

      {
        path: 'password',
        name: 'ChangePassword',
        meta: { requiresAuth: true, title: '비밀번호 변경' },
        component: () => import('../pages/mypage/ChangePassword.vue'),
      },

      {
        path: 'applied',
        name: 'AppliedBenefits',
        meta: { requiresAuth: true, title: '마이페이지' },
        component: () => import('../pages/mypage/AppliedBenefits.vue'),
      },
    ],
  },
];

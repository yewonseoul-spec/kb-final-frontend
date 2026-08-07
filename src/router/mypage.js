export default [
  {
    // 자식으로 묶는 이유: RouterLink 의 active 판정이 매칭된 레코드 비교라
    // 형제로 두면 /mypage/profile 에서 탭에 불이 안 들어온다.
    path: '/mypage',
    children: [
      {
        path: '',
        name: 'MyPage',
        meta: { requiresAuth: true, title: '마이페이지',
           headerType: 'back',
      headerTitle: '마이페이지',
         },
        component: () => import('../pages/mypage/MyPage.vue'),
      },
      {
        path: 'profile',
        name: 'ProfileEdit',
        meta: { requiresAuth: true, title: '프로필 수정',
           headerType: 'back',
      headerTitle: '프로필 수정',
         },
        component: () => import('../pages/mypage/ProfileEdit.vue'),
      },
      {
        path: 'infosetup',
        name: 'ProfileSetup',
        meta: { requiresAuth: true, title: '프로필 입력', hideTabBar: true,
              headerType: 'back',
      headerTitle: '프로필 입력',
        },
        component: () => import('../pages/mypage/ProfileSetup.vue'),
      },
      {
        path: 'goal',
        name: 'GoalEdit',
        meta: { requiresAuth: true, title: '목표 수정',
              headerType: 'back',
      headerTitle: '목표 수정',
         },
        component: () => import('../pages/mypage/GoalEdit.vue'),
      },
      {
        path: 'goalsetup',
        name: 'GoalSetup',
        meta: { requiresAuth: true, title: '목표 설정', hideTabBar: true,
              headerType: 'back',
      headerTitle: '목표 설정',
        },
        component: () => import('../pages/mypage/GoalSetup.vue'),
      },

      {
        path: 'password',
        name: 'ChangePassword',
        meta: { requiresAuth: true, title: '비밀번호 변경',    headerType: 'back',
      headerTitle: '비밀번호 변경',
   },
        component: () => import('../pages/mypage/ChangePassword.vue'),
      },

      {
        path: 'applied',
        name: 'AppliedBenefits',
        meta: { requiresAuth: true, title: '신청 혜택',
              headerType: 'back',
      headerTitle: '신청혜택',},
        component: () => import('../pages/mypage/AppliedBenefits.vue'),
      },

      {
        path: 'favorite',
        name: 'FavoriteBenefits',
        meta: { requiresAuth: true, title: '관심 혜택',    headerType: 'back',
      headerTitle: '관심혜택', },
        component: () => import('../pages/mypage/FavoriteBenefits.vue'),
      },
    ],
  },
];

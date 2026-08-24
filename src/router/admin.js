// src/router/admin.js
//
// 관리자 화면은 사용자 화면과 껍데기가 다르다.
// 사용자 쪽 헤더(뒤로가기·알림·햄버거)와 하단 탭바는
// 관리자 작업에 필요 없고, 사이드바와 자리를 다툰다.
// hideAppShell 로 App.vue 가 DefaultLayout 을 건너뛰게 한다.
export default [
  {
    path: '/admin',
    component: () => import('../pages/admin/AdminLayout.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: '관리자',
      hideTabBar: true,
      hideAppShell: true,
    },
    children: [
      {
        path: '',
        name: 'adminDashboard',
        meta: { headerType: 'root' },
        component: () => import('../pages/admin/AdminDashboard.vue'),
      },
      {
        path: 'benefits',
        name: 'adminBenefits',
        meta: { title: '혜택 관리' },
        component: () => import('../pages/admin/BenefitList.vue'),
      },
      {
        path: 'synclog',
        name: 'adminSyncLog',
        meta: { title: '동기화 로그' },
        component: () => import('../pages/admin/SyncLog.vue'),
      },
      {
        // 자식인데 절대 경로를 쓰고 있었다. 동작은 하지만
        // 다른 항목과 형태가 달라 나중에 읽는 사람이 헷갈린다.
        // 상대 경로로 맞춘다. 주소는 그대로 /admin/recommendKeyword 다.
        path: 'recommendKeyword',
        name: 'RecommendKeyword',
        meta: { title: '추천검색어 설정' },
        component: () => import('@/pages/admin/RecommendKeywordPage.vue'),
      },
      {
        path: 'conflict',
        name: 'AdminConflictReview',
        meta: { title: '중복수혜 검수' },
        component: () => import('@/pages/admin/ConflictReview.vue'),
      },
      {
        path: 'prompt',
        name: 'AdminPromptCenter',
        meta: { title: 'AI 프롬프트 관리' },
        component: () => import('@/pages/admin/PromptCenter.vue'),
      },
    ],
  },
];
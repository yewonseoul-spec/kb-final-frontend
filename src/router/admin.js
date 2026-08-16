// src/router/admin.js
export default [
  {
    path: '/admin',
    component: () => import('../pages/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: '관리자', hideTabBar: true },
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
        component: () => import('../pages/admin/BenefitList.vue'),
      },
      {
        path: 'synclog',
        name: 'adminSyncLog',
        component: () => import('../pages/admin/SyncLog.vue'),
      },

      {
  path: "/admin/recommendKeyword",
  name: "RecommendKeyword",
  component: () =>
    import("@/pages/admin/RecommendKeywordPage.vue"),
  meta: {
    requiresAuth: true,
    requiresAdmin: true,
  },
},
    ],
  },
];

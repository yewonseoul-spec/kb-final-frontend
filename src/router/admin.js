// src/router/admin.js
export default [
  {
    path: '/admin',
    component: () => import('../pages/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'adminDashboard',
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
    ],
  },
];
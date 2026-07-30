export default [
  {
    path: '/admin',
    component: () => import('../pages/admin/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'adminDashboard',
        component: () => import('../pages/admin/AdminDashboard.vue'),
      },
      {
        path: 'synclog',
        name: 'adminSyncLog',
        component: () => import('../pages/admin/SyncLog.vue'),
      },
    ],
  },
];
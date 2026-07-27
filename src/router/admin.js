export default [
  {
    path: '/admin',
    name: '/admin',
    component: () => import('../pages/admin/AdminDashboard.vue'),
  },
  {
    path: '/admin/sync',
    name: '/admin/sync',
    component: () => import('../pages/admin/AdminSync.vue'),
  },
];
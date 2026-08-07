export default [
  {
    path: '/asset',
    name: 'AssetDashboard',
    component: () => import('@/pages/asset/AssetDashboard.vue'),
    meta: { title: '자산 관리',
        headerType: 'back',
      headerTitle: '자산 관리',
     },
  },
];

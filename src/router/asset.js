export default [
  {
    path: '/asset',
    name: 'AssetDashboard',
    component: () => import('@/pages/asset/AssetDashboard.vue'),
    meta: { requiresAuth: true, title: '자산 관리' },
  },
  {
    path: '/asset/balance',
    name: 'AssetBalance',
    component: () => import('@/pages/asset/AssetBalance.vue'),
    meta: { requiresAuth: true, title: '계좌별 잔액' },
  },
  {
    path: '/asset/ratio',
    name: 'AssetRatio',
    component: () => import('@/pages/asset/AssetRatio.vue'),
    meta: { requiresAuth: true, title: '자산 비율 분석' },
  },
  {
    path: '/asset/products',
    name: 'FinanceProducts',
    component: () => import('@/pages/asset/FinanceProducts.vue'),
    meta: { requiresAuth: true, title: '금융 상품 조회' },
  },
];

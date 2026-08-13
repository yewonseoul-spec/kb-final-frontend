export default [
  {
    path: '/asset',
    name: 'AssetDashboard',
    component: () => import('@/pages/asset/AssetDashboard.vue'),
    meta: { title: '자산 관리' },
  },
  {
  path: '/asset/balance',
  name: 'AssetBalance',
  component: () => import('@/pages/asset/AssetBalance.vue'),
  meta: { title: '계좌별 잔액' },
}
];

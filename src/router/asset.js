import AssetView from '@/pages/asset/AssetDashboard.vue';

export default [
{
  path: '/asset',
  name: 'AssetDashboard',
  component: () => import('@/pages/asset/AssetDashboard.vue'),
  meta: { requiresAuth: true, title: '자산 관리' }
}
];

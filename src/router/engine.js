export default [
  {
    path: '/engine',
    name: 'engine',
    component: () => import('../pages/engine/EngineResult.vue'),
    meta: { title: '맞춤 혜택 조합', requiresAuth: true },
  },
];

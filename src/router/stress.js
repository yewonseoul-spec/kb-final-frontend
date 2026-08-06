export default [
  {
    path: '/stress',
    name: 'stressTest',
    component: () => import('../pages/stress/StressTest.vue'),
    meta: { title: '금융 스트레스 테스트' },
  },
];
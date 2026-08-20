import ConsumptionCalView from '@/pages/consumption/ConsumptionCal.vue';

export default [
  {
    path: '/consumption',
    name: '/consumption',
    meta: { requiresAuth: true, title: '소비' },
    component: ConsumptionCalView,
  },
];

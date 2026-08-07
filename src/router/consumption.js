import ConsumptionCalView from '@/pages/consumption/ConsumptionCal.vue';

export default [
  {
    path: '/consumption',
    name: '/consumption',
    meta: { title: '소비',
          headerType: 'back',
      headerTitle: '소비',
      
     },
    component: ConsumptionCalView,
  },
];

export default [
  {
    path: '/notification',
    name: 'Notification',
    component: () => import('@/pages/notification/Notification.vue'),
    meta: { title: '알림', requiresAuth: true },
  },
];

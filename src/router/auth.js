export default [
  {
    path: '/login',
    name: 'Login',
    meta: { guestOnly: true },
    component: () => import('../pages/auth/Login.vue'),
  },
  {
    path: '/signup',
    name: 'SignUp',
    meta: { guestOnly: true },
    component: () => import('../pages/auth/SignUp.vue'),
  },
];
